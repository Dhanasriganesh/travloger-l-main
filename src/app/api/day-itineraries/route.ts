import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  await client.query(`
    CREATE TABLE IF NOT EXISTS day_itineraries (
      id SERIAL PRIMARY KEY,
      name TEXT,
      destinations TEXT[] DEFAULT '{}',
      num_days INTEGER DEFAULT 1,
      days JSONB DEFAULT '[]'::jsonb,
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  await client.query(`
    ALTER TABLE day_itineraries ADD COLUMN IF NOT EXISTS name TEXT;
    ALTER TABLE day_itineraries ADD COLUMN IF NOT EXISTS destinations TEXT[] DEFAULT '{}';
    ALTER TABLE day_itineraries ADD COLUMN IF NOT EXISTS num_days INTEGER DEFAULT 1;
    ALTER TABLE day_itineraries ADD COLUMN IF NOT EXISTS days JSONB DEFAULT '[]'::jsonb;
    ALTER TABLE day_itineraries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  // Migrate from title to name if title column exists
  const titleCheck = await client.query(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'day_itineraries' AND column_name = 'title'
  `)
  
  if (titleCheck.rows.length > 0) {
    // Migrate data from title to name
    await client.query(`
      UPDATE day_itineraries SET name = COALESCE(name, title) WHERE name IS NULL
    `)
    
    // Make title column nullable first (drop NOT NULL constraint)
    try {
      await client.query(`
        ALTER TABLE day_itineraries ALTER COLUMN title DROP NOT NULL
      `)
    } catch (err: any) {
      // If dropping NOT NULL fails, try setting default
      try {
        await client.query(`
          ALTER TABLE day_itineraries ALTER COLUMN title SET DEFAULT NULL
        `)
        await client.query(`
          ALTER TABLE day_itineraries ALTER COLUMN title DROP NOT NULL
        `)
      } catch (err2: any) {
        console.warn('Could not make title nullable:', err2.message)
      }
    }
    
    // Now drop the title column completely
    try {
      await client.query(`
        ALTER TABLE day_itineraries DROP COLUMN title
      `)
    } catch (err: any) {
      console.warn('Could not drop title column (will be nullable):', err.message)
      // Column remains but should be nullable now, which is acceptable
    }
  }
  // Create indexes (only if columns exist)
  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_day_itineraries_name ON day_itineraries(name) WHERE name IS NOT NULL;
    `)
  } catch (err: any) {
    // Ignore if name column doesn't exist yet
    if (!err.message?.includes('column "name" does not exist')) {
      console.error('Error creating name index:', err)
    }
  }
  try {
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_day_itineraries_status ON day_itineraries(status);
    `)
  } catch (err: any) {
    console.error('Error creating status index:', err)
  }
}

export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    // Try to select with name first, fallback to title if name column doesn't exist yet
    let result
    try {
      result = await client.query(`
        SELECT id, name, destinations, num_days, days, status, created_by,
               TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
        FROM day_itineraries
        ORDER BY created_at DESC
      `)
    } catch (err: any) {
      // If name column doesn't exist, try with title (backward compatibility)
      if (err.message?.includes('column "name" does not exist')) {
        result = await client.query(`
          SELECT id, title AS name, destinations, num_days, days, status, created_by,
                 TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
          FROM day_itineraries
          ORDER BY created_at DESC
        `)
      } else {
        throw err
      }
    }
    // Map DB columns to expected API shape
    const dayItineraries = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      destinations: r.destinations || [],
      numDays: r.num_days || 1,
      days: r.days || [],
      status: r.status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ dayItineraries })
  } catch (error: any) {
    console.error('DayItineraries GET error:', error)
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
    console.error('DayItineraries POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const name: string = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    // Ensure destinations is always an array
    const destinations = Array.isArray(body.destinations) ? body.destinations : []
    const days = Array.isArray(body.days) ? body.days : []
    
    console.log('DayItineraries POST - Inserting:', {
      name,
      destinations,
      numDays: Number(body.numDays ?? body.num_days ?? 1),
      daysCount: days.length,
      status: body.status ?? 'Active'
    })
    
    const values = [
      name,
      destinations,
      Number(body.numDays ?? body.num_days ?? 1),
      JSON.stringify(days), // Stringify for JSONB consistency with other routes
      body.status ?? 'Active'
    ]
    const insert = await client.query(
      `INSERT INTO day_itineraries (name, destinations, num_days, days, status)
       VALUES ($1,$2,$3,$4,$5) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Day itinerary created' })
  } catch (error: any) {
    console.error('DayItineraries POST error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to create day itinerary' }, { status: 500 })
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
    console.error('DayItineraries PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    // Ensure destinations is always an array
    const destinations = Array.isArray(body.destinations) ? body.destinations : []
    const days = Array.isArray(body.days) ? body.days : []
    
    const values = [
      body.name?.trim() || '',
      destinations,
      Number(body.numDays ?? body.num_days ?? 1),
      JSON.stringify(days), // Stringify for JSONB consistency with other routes
      body.status ?? 'Active',
      id
    ]
    await client.query(
      `UPDATE day_itineraries SET 
         name = $1, destinations = $2, num_days = $3, days = $4, status = $5,
         updated_at = NOW()
       WHERE id = $6`,
      values
    )
    return NextResponse.json({ message: 'Day itinerary updated' })
  } catch (error: any) {
    console.error('DayItineraries PUT error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to update day itinerary' }, { status: 500 })
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
    await client.query('DELETE FROM day_itineraries WHERE id = $1', [id])
    return NextResponse.json({ message: 'Day itinerary deleted' })
  } catch (error: any) {
    console.error('DayItineraries DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}
