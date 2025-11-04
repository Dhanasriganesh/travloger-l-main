import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if missing
  await client.query(`
    CREATE TABLE IF NOT EXISTS query_statuses (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT DEFAULT '#3B82F6',
      display_order INTEGER DEFAULT 0,
      stage_type TEXT DEFAULT '',
      category TEXT DEFAULT '',
      default_automation TEXT[] DEFAULT '{}',
      stage_behaviour TEXT DEFAULT 'Manual',
      visibility_level TEXT[] DEFAULT '{}',
      take_note BOOLEAN DEFAULT false,
      lock_status BOOLEAN DEFAULT false,
      dashboard BOOLEAN DEFAULT false,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Ensure columns exist first (for legacy tables), then create indexes
  await client.query(`
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#3B82F6';
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS display_order INTEGER DEFAULT 0;
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS stage_type TEXT DEFAULT '';
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS category TEXT DEFAULT '';
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS default_automation TEXT[] DEFAULT '{}';
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS stage_behaviour TEXT DEFAULT 'Manual';
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS visibility_level TEXT[] DEFAULT '{}';
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS take_note BOOLEAN DEFAULT false;
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS lock_status BOOLEAN DEFAULT false;
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS dashboard BOOLEAN DEFAULT false;
    ALTER TABLE query_statuses ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
  `)
  // Create indexes after columns are guaranteed present
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_query_statuses_display_order ON query_statuses(display_order);
    CREATE INDEX IF NOT EXISTS idx_query_statuses_status ON query_statuses(status);
  `)
}

export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    let result
    try {
      result = await client.query(`
        SELECT id, name, color, display_order, stage_type, category, default_automation,
               stage_behaviour, visibility_level, take_note, lock_status, dashboard, notes, status,
               created_by, TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
        FROM query_statuses
        ORDER BY display_order ASC, created_at ASC
      `)
    } catch (e) {
      // Fallback for legacy tables missing new columns: return sensible defaults
      await ensureTable(client)
      result = await client.query(`
        SELECT id,
               name,
               COALESCE(color, '#3B82F6') AS color,
               0 AS display_order,
               '' AS stage_type,
               '' AS category,
               ARRAY[]::text[] AS default_automation,
               'Manual' AS stage_behaviour,
               ARRAY[]::text[] AS visibility_level,
               COALESCE(take_note, false) AS take_note,
               COALESCE(lock_status, false) AS lock_status,
               COALESCE(dashboard, false) AS dashboard,
               '' AS notes,
               COALESCE(status, 'Active') AS status,
               created_by,
               TO_CHAR(created_at, 'DD-MM-YYYY') AS date,
               created_at,
               updated_at
        FROM query_statuses
        ORDER BY created_at ASC
      `)
    }
    return NextResponse.json({ queryStatuses: result.rows })
  } catch (error: any) {
    console.error('QueryStatuses GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  const body = await request.json()

  const name: string = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    const values = [
      name,
      body.color ?? '#3B82F6',
      Number(body.displayOrder ?? body.display_order ?? 0),
      body.stageType ?? body.stage_type ?? '',
      body.category ?? '',
      (body.defaultAutomation ?? body.default_automation ?? []) as string[],
      body.stageBehaviour ?? body.stage_behaviour ?? 'Manual',
      (body.visibilityLevel ?? body.visibility_level ?? []) as string[],
      Boolean(body.takeNote ?? body.take_note ?? false),
      Boolean(body.lockStatus ?? body.lock_status ?? false),
      Boolean(body.dashboard ?? false),
      body.notes ?? '',
      body.status ?? 'Active'
    ]
    const insert = await client.query(
      `INSERT INTO query_statuses 
        (name, color, display_order, stage_type, category, default_automation, stage_behaviour, visibility_level,
         take_note, lock_status, dashboard, notes, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13)
       RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Query status created' })
  } catch (error: any) {
    console.error('QueryStatuses POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  const body = await request.json()
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    const values = [
      body.name?.trim(),
      body.color ?? '#3B82F6',
      Number(body.displayOrder ?? body.display_order ?? 0),
      body.stageType ?? body.stage_type ?? '',
      body.category ?? '',
      (body.defaultAutomation ?? body.default_automation ?? []) as string[],
      body.stageBehaviour ?? body.stage_behaviour ?? 'Manual',
      (body.visibilityLevel ?? body.visibility_level ?? []) as string[],
      Boolean(body.takeNote ?? body.take_note ?? false),
      Boolean(body.lockStatus ?? body.lock_status ?? false),
      Boolean(body.dashboard ?? false),
      body.notes ?? '',
      body.status ?? 'Active',
      id
    ]
    await client.query(
      `UPDATE query_statuses SET 
         name = $1, color = $2, display_order = $3, stage_type = $4, category = $5,
         default_automation = $6, stage_behaviour = $7, visibility_level = $8,
         take_note = $9, lock_status = $10, dashboard = $11, notes = $12, status = $13,
         updated_at = NOW()
       WHERE id = $14`,
      values
    )
    return NextResponse.json({ message: 'Query status updated' })
  } catch (error: any) {
    console.error('QueryStatuses PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    await client.query('DELETE FROM query_statuses WHERE id = $1', [id])
    return NextResponse.json({ message: 'Query status deleted' })
  } catch (error: any) {
    console.error('QueryStatuses DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
