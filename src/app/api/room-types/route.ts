import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { getErrorMessage } from '@/app/api/utils/error'

// GET all room types
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create room_types table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS room_types (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL UNIQUE,
        max_occupancy INTEGER DEFAULT 2,
        bed_type TEXT DEFAULT '',
        description TEXT DEFAULT '',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_room_types_name ON room_types(name);
      CREATE INDEX IF NOT EXISTS idx_room_types_status ON room_types(status);
    `)
    // Add missing columns to existing table
    await client.query(`
      ALTER TABLE room_types ADD COLUMN IF NOT EXISTS max_occupancy INTEGER DEFAULT 2;
      ALTER TABLE room_types ADD COLUMN IF NOT EXISTS bed_type TEXT DEFAULT '';
      ALTER TABLE room_types ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
      ALTER TABLE room_types ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    `)
    
    const result = await client.query(`
      SELECT id, name, max_occupancy, bed_type, description, notes, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM room_types 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ roomTypes: result.rows })
  } catch (error: unknown) {
    console.error('Room Types GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new room type
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, maxOccupancy, bedType, description, notes, status } = body
    
    if (!name) {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO room_types (name, max_occupancy, bed_type, description, notes, status)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING id, name, max_occupancy, bed_type, description, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, maxOccupancy || 2, bedType || '', description || '', notes || '', status || 'Active'])
    
    return NextResponse.json({ 
      roomType: result.rows[0],
      message: 'Room type created successfully'
    })
  } catch (error: unknown) {
    console.error('Room Types POST error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update room type
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, maxOccupancy, bedType, description, notes, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Room type ID is required' }, { status: 400 })
    }
    
    if (!name) {
      return NextResponse.json({ error: 'Room type name is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE room_types 
      SET name = $1, max_occupancy = COALESCE($2, max_occupancy), bed_type = COALESCE($3, bed_type), description = COALESCE($4, description), notes = COALESCE($5, notes), status = $6, updated_at = NOW()
      WHERE id = $7
      RETURNING id, name, max_occupancy, bed_type, description, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [name, maxOccupancy || null, bedType || null, description || null, notes || null, status || 'Active', id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      roomType: result.rows[0],
      message: 'Room type updated successfully'
    })
  } catch (error: unknown) {
    console.error('Room Types PUT error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE room type
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Room type ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM room_types WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Room type not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Room type deleted successfully' })
  } catch (error: unknown) {
    console.error('Room Types DELETE error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}


