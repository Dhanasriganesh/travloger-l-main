import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all vehicle types
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()

    await client.query(`
      CREATE TABLE IF NOT EXISTS vehicle_types (
        id SERIAL PRIMARY KEY,
        vehicle_type TEXT NOT NULL UNIQUE,
        capacity INTEGER DEFAULT 4,
        description TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_vehicle_types_name ON vehicle_types(vehicle_type);
      CREATE INDEX IF NOT EXISTS idx_vehicle_types_status ON vehicle_types(status);
    `)

    await client.query(`
      ALTER TABLE vehicle_types ADD COLUMN IF NOT EXISTS capacity INTEGER DEFAULT 4;
      ALTER TABLE vehicle_types ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      ALTER TABLE vehicle_types ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    `)

    const result = await client.query(`
      SELECT id, vehicle_type, capacity, description, notes, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM vehicle_types
      ORDER BY vehicle_type ASC
    `)

    return NextResponse.json({ vehicleTypes: result.rows })
  } catch (error: any) {
    console.error('VehicleTypes GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    const body = await request.json()
    const { vehicleType, capacity, description, notes, status } = body
    if (!vehicleType) return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 })

    await client.connect()
    const result = await client.query(`
      INSERT INTO vehicle_types (vehicle_type, capacity, description, notes, status)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id, vehicle_type, capacity, description, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
    `, [vehicleType, capacity || 4, description || '', notes || '', status || 'Active'])

    return NextResponse.json({ vehicleType: result.rows[0], message: 'Vehicle type created successfully' })
  } catch (error: any) {
    console.error('VehicleTypes POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    const body = await request.json()
    const { id, vehicleType, capacity, description, notes, status } = body
    if (!id) return NextResponse.json({ error: 'Vehicle type ID is required' }, { status: 400 })
    if (!vehicleType) return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 })

    await client.connect()
    const result = await client.query(`
      UPDATE vehicle_types
      SET vehicle_type = $1, capacity = COALESCE($2, capacity), description = COALESCE($3, description),
          notes = COALESCE($4, notes), status = $5, updated_at = NOW()
      WHERE id = $6
      RETURNING id, vehicle_type, capacity, description, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
    `, [vehicleType, capacity || null, description || null, notes || null, status || 'Active', id])

    if (result.rows.length === 0) return NextResponse.json({ error: 'Vehicle type not found' }, { status: 404 })

    return NextResponse.json({ vehicleType: result.rows[0], message: 'Vehicle type updated successfully' })
  } catch (error: any) {
    console.error('VehicleTypes PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Vehicle type ID is required' }, { status: 400 })

    await client.connect()
    const result = await client.query(`DELETE FROM vehicle_types WHERE id = $1`, [id])
    if (result.rowCount === 0) return NextResponse.json({ error: 'Vehicle type not found' }, { status: 404 })

    return NextResponse.json({ message: 'Vehicle type deleted successfully' })
  } catch (error: any) {
    console.error('VehicleTypes DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}




