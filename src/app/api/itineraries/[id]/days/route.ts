import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET days for itinerary
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    await client.connect()
    
    const result = await client.query(`
      SELECT * FROM itinerary_days 
      WHERE itinerary_id = $1 
      ORDER BY day_number ASC
    `, [id])
    
    return NextResponse.json({ days: result.rows || [] })
  } catch (e: any) {
    console.error('Days GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create day
export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    const itineraryId = Number(id)
    const body = await request.json()
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO itinerary_days (itinerary_id, day_number, title, location, notes, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `, [
      itineraryId,
      Number(body.dayNumber),
      body.title || null,
      body.location || null,
      body.notes || null,
      body.date || null
    ])
    
    return NextResponse.json({ day: result.rows[0] }, { status: 201 })
  } catch (e: any) {
    console.error('Days POST error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT bulk update/rename day meta
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { dayId, ...updates } = body
    
    await client.connect()
    
    // Build dynamic update query
    const updateFields = Object.keys(updates).map((key, index) => `${key} = $${index + 2}`).join(', ')
    const values = [dayId, ...Object.values(updates)]
    
    const result = await client.query(`
      UPDATE itinerary_days 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *
    `, values)
    
    return NextResponse.json({ day: result.rows[0] })
  } catch (e: any) {
    console.error('Days PUT error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE a day
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const dayId = url.searchParams.get('dayId')
    if (!dayId) return NextResponse.json({ error: 'dayId required' }, { status: 400 })
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM itinerary_days WHERE id = $1
    `, [dayId])
    
    return NextResponse.json({ message: 'Deleted' })
  } catch (e: any) {
    console.error('Days DELETE error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}


