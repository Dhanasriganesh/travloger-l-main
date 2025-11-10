import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { getErrorMessage } from '@/app/api/utils/error'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS user_role_access (
      id SERIAL PRIMARY KEY,
      role_name TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      permissions TEXT[] DEFAULT '{}',
      notes TEXT DEFAULT '',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE user_role_access ADD COLUMN IF NOT EXISTS role_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE user_role_access ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
    ALTER TABLE user_role_access ADD COLUMN IF NOT EXISTS permissions TEXT[] DEFAULT '{}';
    ALTER TABLE user_role_access ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_user_role_access_role_name ON user_role_access(role_name);
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
      SELECT 
        id, role_name, description, permissions, notes, created_by,
        TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM user_role_access
      ORDER BY created_at DESC
    `)
    
    const roles = result.rows.map(r => ({
      id: r.id,
      role_name: r.role_name,
      description: r.description,
      permissions: r.permissions || [],
      notes: r.notes || '',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ roles })
  } catch (error: unknown) {
    console.error('UserRoleAccess GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
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
  } catch (error: unknown) {
    console.error('UserRoleAccess POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const roleName: string = body.roleName?.trim() || body.role_name?.trim() || ''
  if (!roleName) return NextResponse.json({ error: 'Role name is required' }, { status: 400 })
  const description: string = body.description?.trim() || ''
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  if (!body.permissions || !Array.isArray(body.permissions) || body.permissions.length === 0) {
    return NextResponse.json({ error: 'At least one permission is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      roleName,
      description,
      body.permissions || [],
      body.notes?.trim() || ''
    ]
    
    const insert = await client.query(
      `INSERT INTO user_role_access (
        role_name, description, permissions, notes
      )
      VALUES ($1,$2,$3,$4) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'User role created' })
  } catch (error: unknown) {
    console.error('UserRoleAccess POST error:', error)
    const message = getErrorMessage(error)
    const errorObject = (typeof error === 'object' && error !== null) ? error as Record<string, unknown> : {}
    console.error('Error details:', {
      message,
      code: errorObject.code,
      detail: errorObject.detail,
      hint: errorObject.hint
    })
    if ((errorObject.code as string | undefined) === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: message || 'Failed to create user role' }, { status: 500 })
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
  } catch (error: unknown) {
    console.error('UserRoleAccess PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.roleName?.trim() || body.role_name?.trim() || '',
      body.description?.trim() || '',
      body.permissions || [],
      body.notes?.trim() || '',
      id
    ]
    
    await client.query(
      `UPDATE user_role_access SET 
         role_name = $1, description = $2, permissions = $3, notes = $4,
         updated_at = NOW()
       WHERE id = $5`,
      values
    )
    return NextResponse.json({ message: 'User role updated' })
  } catch (error: unknown) {
    console.error('UserRoleAccess PUT error:', error)
    const message = getErrorMessage(error)
    const errorObject = (typeof error === 'object' && error !== null) ? error as Record<string, unknown> : {}
    console.error('Error details:', {
      message,
      code: errorObject.code,
      detail: errorObject.detail,
      hint: errorObject.hint
    })
    if ((errorObject.code as string | undefined) === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Role name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: message || 'Failed to update user role' }, { status: 500 })
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
    await client.query('DELETE FROM user_role_access WHERE id = $1', [id])
    return NextResponse.json({ message: 'User role deleted' })
  } catch (error: unknown) {
    console.error('UserRoleAccess DELETE error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

