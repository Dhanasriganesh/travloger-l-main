import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS policies (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      policy_type TEXT NOT NULL,
      description TEXT NOT NULL,
      linked_module TEXT NOT NULL,
      editable_by TEXT NOT NULL,
      version TEXT DEFAULT '1.0',
      effective_date DATE,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS policy_type TEXT DEFAULT '';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS linked_module TEXT DEFAULT '';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS editable_by TEXT DEFAULT '';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS effective_date DATE;
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    ALTER TABLE policies ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_policies_name ON policies(name);
    CREATE INDEX IF NOT EXISTS idx_policies_policy_type ON policies(policy_type);
    CREATE INDEX IF NOT EXISTS idx_policies_linked_module ON policies(linked_module);
    CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
  `)
}

export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    const result = await client.query(`
      SELECT id, name, policy_type, description, linked_module, editable_by, version,
             effective_date, notes, status,
             created_by, TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM policies
      ORDER BY created_at DESC
    `)
    
    // Map DB columns to expected API shape
    const policies = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      policy_type: r.policy_type,
      description: r.description || '',
      linked_module: r.linked_module,
      editable_by: r.editable_by,
      version: r.version || '1.0',
      effective_date: r.effective_date ? r.effective_date.toISOString().split('T')[0] : null,
      notes: r.notes || '',
      status: r.status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ policies })
  } catch (error: any) {
    console.error('Policies GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  
  let body
  try {
    body = await request.json()
  } catch (error: any) {
    console.error('Policies POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const name: string = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!body.policyType && !body.policy_type) return NextResponse.json({ error: 'Policy type is required' }, { status: 400 })
  if (!body.description?.trim()) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (!body.linkedModule && !body.linked_module) return NextResponse.json({ error: 'Linked module is required' }, { status: 400 })
  if (!body.editableBy && !body.editable_by) return NextResponse.json({ error: 'Editable by is required' }, { status: 400 })
  if (!body.version?.trim()) return NextResponse.json({ error: 'Version is required' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      name,
      body.policyType || body.policy_type || '',
      body.description?.trim() || '',
      body.linkedModule || body.linked_module || '',
      body.editableBy || body.editable_by || '',
      body.version?.trim() || '1.0',
      body.effectiveDate || body.effective_date || null,
      body.notes || '',
      body.status || 'Active'
    ]
    
    const insert = await client.query(
      `INSERT INTO policies (
        name, policy_type, description, linked_module, editable_by, version,
        effective_date, notes, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Policy created' })
  } catch (error: any) {
    console.error('Policies POST error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to create policy' }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  
  let body
  try {
    body = await request.json()
  } catch (error: any) {
    console.error('Policies PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.name?.trim() || '',
      body.policyType || body.policy_type || '',
      body.description?.trim() || '',
      body.linkedModule || body.linked_module || '',
      body.editableBy || body.editable_by || '',
      body.version?.trim() || '1.0',
      body.effectiveDate || body.effective_date || null,
      body.notes || '',
      body.status || 'Active',
      id
    ]
    
    await client.query(
      `UPDATE policies SET 
         name = $1, policy_type = $2, description = $3, linked_module = $4,
         editable_by = $5, version = $6, effective_date = $7, notes = $8, status = $9,
         updated_at = NOW()
       WHERE id = $10`,
      values
    )
    return NextResponse.json({ message: 'Policy updated' })
  } catch (error: any) {
    console.error('Policies PUT error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to update policy' }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function DELETE(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    await client.query('DELETE FROM policies WHERE id = $1', [id])
    return NextResponse.json({ message: 'Policy deleted' })
  } catch (error: any) {
    console.error('Policies DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

