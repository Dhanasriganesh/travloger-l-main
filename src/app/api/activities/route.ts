import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all activities
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create activities table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS activities (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        supplier_id INTEGER,
        type TEXT DEFAULT '',
        duration TEXT DEFAULT '',
        inclusions TEXT DEFAULT '',
        exclusions TEXT DEFAULT '',
        price DECIMAL(10,2) DEFAULT 0,
        cost_type TEXT DEFAULT 'per_person',
        operating_days TEXT DEFAULT '',
        time_slots TEXT DEFAULT '',
        gallery TEXT[] DEFAULT '{}',
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_activities_name ON activities(name);
      CREATE INDEX IF NOT EXISTS idx_activities_destination ON activities(destination);
      CREATE INDEX IF NOT EXISTS idx_activities_status ON activities(status);
    `)
    // Add missing columns for existing tables
    await client.query(`
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS supplier_id INTEGER;
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS type TEXT DEFAULT '';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS duration TEXT DEFAULT '';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS inclusions TEXT DEFAULT '';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS exclusions TEXT DEFAULT '';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS cost_type TEXT DEFAULT 'per_person';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS operating_days TEXT DEFAULT '';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS time_slots TEXT DEFAULT '';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
      ALTER TABLE activities ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    `)
    // Create supplier_id index only if column exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='activities' AND column_name='supplier_id'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_activities_supplier_id ON activities(supplier_id);
        END IF;
      END $$;
    `)
    
    const result = await client.query(`
      SELECT id, name, destination, supplier_id, type, duration, inclusions, exclusions,
             price, cost_type, operating_days, time_slots, gallery, notes, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM activities 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ activities: result.rows })
  } catch (error) {
    console.error('Activities GET error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new activity
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, destination, supplierId, type, duration, inclusions, exclusions, price, costType, operatingDays, timeSlots, gallery, notes, status } = body
    
    if (!name || !destination) {
      return NextResponse.json({ error: 'Activity name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO activities (
        name, destination, supplier_id, type, duration, inclusions, exclusions,
        price, cost_type, operating_days, time_slots, gallery, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING id, name, destination, supplier_id, type, duration, inclusions, exclusions,
                price, cost_type, operating_days, time_slots, gallery, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      name, destination, supplierId || null, type || '', duration || '', inclusions || '', exclusions || '',
      price || 0, costType || 'per_person', operatingDays || '', Array.isArray(timeSlots) ? timeSlots : [], Array.isArray(gallery) ? gallery : [], notes || '', status || 'Active'
    ])
    
    return NextResponse.json({ 
      activity: result.rows[0],
      message: 'Activity created successfully'
    })
  } catch (error) {
    console.error('Activities POST error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update activity
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, destination, supplierId, type, duration, inclusions, exclusions, price, costType, operatingDays, timeSlots, gallery, notes, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }
    
    if (!name || !destination) {
      return NextResponse.json({ error: 'Activity name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE activities 
      SET name = $1, destination = $2, supplier_id = COALESCE($3, supplier_id), type = COALESCE($4, type),
          duration = COALESCE($5, duration), inclusions = COALESCE($6, inclusions), exclusions = COALESCE($7, exclusions),
          price = $8, cost_type = COALESCE($9, cost_type), operating_days = COALESCE($10, operating_days),
          time_slots = COALESCE($11, time_slots), gallery = COALESCE($12, gallery), notes = COALESCE($13, notes), status = $14,
          updated_at = NOW()
      WHERE id = $15
      RETURNING id, name, destination, supplier_id, type, duration, inclusions, exclusions,
                price, cost_type, operating_days, time_slots, gallery, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      name, destination, supplierId || null, type || null, duration || null, inclusions || null, exclusions || null,
      price || 0, costType || null, operatingDays || null, Array.isArray(timeSlots) ? timeSlots : null, Array.isArray(gallery) ? gallery : null, notes || null, status || 'Active', id
    ])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      activity: result.rows[0],
      message: 'Activity updated successfully'
    })
  } catch (error) {
    console.error('Activities PUT error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE activity
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
      return NextResponse.json({ error: 'Activity ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM activities WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Activity deleted successfully' })
  } catch (error) {
    console.error('Activities DELETE error:', error)
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 })
  } finally {
    await client.end()
  }
}


