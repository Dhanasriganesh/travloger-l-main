import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all itineraries
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Create table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS itineraries (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        start_date DATE,
        end_date DATE,
        adults INTEGER DEFAULT 1,
        children INTEGER DEFAULT 0,
        destinations TEXT NOT NULL,
        notes TEXT,
        price DECIMAL(10,2) DEFAULT 0,
        marketplace_shared BOOLEAN DEFAULT FALSE,
        cover_photo TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_itineraries_name ON itineraries(name);
      CREATE INDEX IF NOT EXISTS idx_itineraries_destinations ON itineraries(destinations);
    `)
    
    // Add cover_photo column if it doesn't exist (for existing tables)
    await client.query(`
      ALTER TABLE itineraries 
      ADD COLUMN IF NOT EXISTS cover_photo TEXT;
    `)
    
    // Add status and confirmed_at columns if they don't exist
    await client.query(`
      ALTER TABLE itineraries 
      ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
    `)
    await client.query(`
      ALTER TABLE itineraries 
      ADD COLUMN IF NOT EXISTS confirmed_at TIMESTAMPTZ;
    `)
    
    // Get all itineraries
    const result = await client.query(`
      SELECT id, name, start_date, end_date, adults, children, destinations, notes, 
             price, marketplace_shared, cover_photo, status, confirmed_at, created_at, updated_at
      FROM itineraries 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ 
      itineraries: result.rows 
    })
  } catch (error) {
    console.error('Itineraries GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST - Create new itinerary
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, startDate, endDate, adults, children, destinations, notes, coverPhoto } = body
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Itinerary name is required' }, { status: 400 })
    }
    
    if (!destinations || !destinations.trim()) {
      return NextResponse.json({ error: 'Destinations are required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Insert new itinerary
    const result = await client.query(`
      INSERT INTO itineraries (name, start_date, end_date, adults, children, destinations, notes, cover_photo)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, name, start_date, end_date, adults, children, destinations, notes, 
                price, marketplace_shared, cover_photo, created_at, updated_at
    `, [
      name.trim(), 
      startDate || null, 
      endDate || null, 
      adults || 1, 
      children || 0, 
      destinations.trim(), 
      notes || null,
      coverPhoto || null
    ])
    
    return NextResponse.json({ 
      itinerary: result.rows[0],
      message: 'Itinerary created successfully'
    })
  } catch (error) {
    console.error('Itineraries POST error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT - Update itinerary
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, startDate, endDate, adults, children, destinations, notes, coverPhoto } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 })
    }
    
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Itinerary name is required' }, { status: 400 })
    }
    
    if (!destinations || !destinations.trim()) {
      return NextResponse.json({ error: 'Destinations are required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Update itinerary
    const result = await client.query(`
      UPDATE itineraries 
      SET name = $1, 
          start_date = $2,
          end_date = $3,
          adults = $4,
          children = $5,
          destinations = $6,
          notes = $7,
          cover_photo = $8,
          updated_at = NOW()
      WHERE id = $9
      RETURNING id, name, start_date, end_date, adults, children, destinations, notes, 
                price, marketplace_shared, cover_photo, created_at, updated_at
    `, [
      name.trim(), 
      startDate || null, 
      endDate || null, 
      adults || 1, 
      children || 0, 
      destinations.trim(), 
      notes || null,
      coverPhoto || null,
      id
    ])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      itinerary: result.rows[0],
      message: 'Itinerary updated successfully'
    })
  } catch (error) {
    console.error('Itineraries PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE - Delete itinerary
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Itinerary ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Delete itinerary
    const result = await client.query(`
      DELETE FROM itineraries 
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      message: 'Itinerary deleted successfully'
    })
  } catch (error) {
    console.error('Itineraries DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

