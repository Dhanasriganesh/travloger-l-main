import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { getErrorMessage } from '@/lib/error'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS itinerary_notes_inclusions (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT NOT NULL,
      category TEXT NOT NULL,
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE itinerary_notes_inclusions ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
    ALTER TABLE itinerary_notes_inclusions ADD COLUMN IF NOT EXISTS description TEXT NOT NULL DEFAULT '';
    ALTER TABLE itinerary_notes_inclusions ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT '';
    ALTER TABLE itinerary_notes_inclusions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_itinerary_notes_inclusions_title ON itinerary_notes_inclusions(title);
    CREATE INDEX IF NOT EXISTS idx_itinerary_notes_inclusions_category ON itinerary_notes_inclusions(category);
    CREATE INDEX IF NOT EXISTS idx_itinerary_notes_inclusions_status ON itinerary_notes_inclusions(status);
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
        id, title, description, category, status, created_by,
        TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM itinerary_notes_inclusions
      ORDER BY created_at DESC
    `)
    
    const notesInclusions = result.rows.map(r => ({
      id: r.id,
      title: r.title,
      description: r.description,
      category: r.category,
      status: r.status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ notesInclusions })
  } catch (error: unknown) {
    console.error('ItineraryNotesInclusions GET error:', error)
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
    console.error('ItineraryNotesInclusions POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const title: string = body.title?.trim() || ''
  if (!title) return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  const description: string = body.description?.trim() || ''
  if (!description) return NextResponse.json({ error: 'Description is required' }, { status: 400 })
  const category: string = body.category || ''
  if (!category) return NextResponse.json({ error: 'Category is required' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      title,
      description,
      category,
      body.status || 'Active'
    ]
    
    const insert = await client.query(
      `INSERT INTO itinerary_notes_inclusions (
        title, description, category, status
      )
      VALUES ($1,$2,$3,$4) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Note/Inclusion created' })
  } catch (error: unknown) {
    console.error('ItineraryNotesInclusions POST error:', error)
    const message = getErrorMessage(error)
    const errorObject = (typeof error === 'object' && error !== null) ? error as Record<string, unknown> : {}
    console.error('Error details:', {
      message,
      code: errorObject.code,
      detail: errorObject.detail,
      hint: errorObject.hint
    })
    return NextResponse.json({ error: message || 'Failed to create note/inclusion' }, { status: 500 })
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
    console.error('ItineraryNotesInclusions PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.title?.trim() || '',
      body.description?.trim() || '',
      body.category || '',
      body.status || 'Active',
      id
    ]
    
    await client.query(
      `UPDATE itinerary_notes_inclusions SET 
         title = $1, description = $2, category = $3, status = $4,
         updated_at = NOW()
       WHERE id = $5`,
      values
    )
    return NextResponse.json({ message: 'Note/Inclusion updated' })
  } catch (error: unknown) {
    console.error('ItineraryNotesInclusions PUT error:', error)
    const message = getErrorMessage(error)
    const errorObject = (typeof error === 'object' && error !== null) ? error as Record<string, unknown> : {}
    console.error('Error details:', {
      message,
      code: errorObject.code,
      detail: errorObject.detail,
      hint: errorObject.hint
    })
    return NextResponse.json({ error: message || 'Failed to update note/inclusion' }, { status: 500 })
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
    await client.query('DELETE FROM itinerary_notes_inclusions WHERE id = $1', [id])
    return NextResponse.json({ message: 'Note/Inclusion deleted' })
  } catch (error: unknown) {
    console.error('ItineraryNotesInclusions DELETE error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

