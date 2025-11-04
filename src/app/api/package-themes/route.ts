import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS package_themes (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      description TEXT DEFAULT '',
      icon_url TEXT DEFAULT '',
      day_itinerary_ids INTEGER[] DEFAULT '{}',
      lead_type_ids INTEGER[] DEFAULT '{}',
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE package_themes ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    ALTER TABLE package_themes ADD COLUMN IF NOT EXISTS icon_url TEXT DEFAULT '';
    ALTER TABLE package_themes ADD COLUMN IF NOT EXISTS day_itinerary_ids INTEGER[] DEFAULT '{}';
    ALTER TABLE package_themes ADD COLUMN IF NOT EXISTS lead_type_ids INTEGER[] DEFAULT '{}';
    ALTER TABLE package_themes ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_package_themes_name ON package_themes(name);
    CREATE INDEX IF NOT EXISTS idx_package_themes_status ON package_themes(status);
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
      SELECT id, name, description, icon_url, day_itinerary_ids, lead_type_ids, status,
             created_by, TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM package_themes
      ORDER BY created_at DESC
    `)
    return NextResponse.json({ packageThemes: result.rows })
  } catch (error: any) {
    console.error('PackageThemes GET error:', error)
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
      body.description ?? '',
      body.iconUrl ?? body.icon_url ?? '',
      (body.dayItineraryIds ?? body.day_itinerary_ids ?? []) as number[],
      (body.leadTypeIds ?? body.lead_type_ids ?? []) as number[],
      body.status ?? 'Active'
    ]
    const insert = await client.query(
      `INSERT INTO package_themes (name, description, icon_url, day_itinerary_ids, lead_type_ids, status)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Package theme created' })
  } catch (error: any) {
    console.error('PackageThemes POST error:', error)
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
      body.description ?? '',
      body.iconUrl ?? body.icon_url ?? '',
      (body.dayItineraryIds ?? body.day_itinerary_ids ?? []) as number[],
      (body.leadTypeIds ?? body.lead_type_ids ?? []) as number[],
      body.status ?? 'Active',
      id
    ]
    await client.query(
      `UPDATE package_themes SET 
         name = $1, description = $2, icon_url = $3, day_itinerary_ids = $4, lead_type_ids = $5, status = $6,
         updated_at = NOW()
       WHERE id = $7`,
      values
    )
    return NextResponse.json({ message: 'Package theme updated' })
  } catch (error: any) {
    console.error('PackageThemes PUT error:', error)
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
    await client.query('DELETE FROM package_themes WHERE id = $1', [id])
    return NextResponse.json({ message: 'Package theme deleted' })
  } catch (error: any) {
    console.error('PackageThemes DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

