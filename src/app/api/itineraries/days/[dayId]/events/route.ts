import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET events for a day
export async function GET(request: Request, context: { params: Promise<{ dayId: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { dayId } = await context.params
    await client.connect()
    
    const result = await client.query(`
      SELECT * FROM itinerary_events 
      WHERE day_id = $1 
      ORDER BY sort_order ASC
    `, [dayId])
    
    return NextResponse.json({ events: result.rows || [] })
  } catch (e: any) {
    console.error('Events GET error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create event
export async function POST(request: Request, context: { params: Promise<{ dayId: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { dayId } = await context.params
    const dayIdNum = Number(dayId)
    const body = await request.json()
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO itinerary_events (day_id, title, subtitle, description, start_time, end_time, sort_order, event_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *
    `, [
      dayIdNum,
      body.title || 'New Event',
      body.subtitle || '',
      body.description || '',
      body.startTime || null,
      body.endTime || null,
      Number(body.sortOrder ?? 0),
      JSON.stringify(body.eventData || {})
    ])
    
    return NextResponse.json({ event: result.rows[0] }, { status: 201 })
  } catch (e: any) {
    console.error('Events POST error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update event
export async function PUT(request: Request, context: { params: Promise<{ dayId: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { eventId, ...updates } = body
    
    await client.connect()
    
    // Build dynamic update query
    const updateFields = Object.keys(updates).map((key, index) => {
      if (key === 'accommodationData' || key === 'activityData' || key === 'transportationData' || key === 'mealData' || key === 'flightData' || key === 'leisureData') {
        return `event_data = $${index + 2}`
      }
      return `${key} = $${index + 2}`
    }).join(', ')
    
    const values = [eventId, ...Object.values(updates).map(value => 
      typeof value === 'object' ? JSON.stringify(value) : value
    )]
    
    const result = await client.query(`
      UPDATE itinerary_events 
      SET ${updateFields}
      WHERE id = $1
      RETURNING *
    `, values)
    
    return NextResponse.json({ event: result.rows[0] })
  } catch (e: any) {
    console.error('Events PUT error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE event
export async function DELETE(request: Request, context: { params: Promise<{ dayId: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const eventId = url.searchParams.get('eventId')
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 })
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM itinerary_events WHERE id = $1
    `, [eventId])
    
    return NextResponse.json({ message: 'Deleted' })
  } catch (e: any) {
    console.error('Events DELETE error:', e)
    return NextResponse.json({ error: e.message || 'Internal error' }, { status: 500 })
  } finally {
    await client.end()
  }
}


