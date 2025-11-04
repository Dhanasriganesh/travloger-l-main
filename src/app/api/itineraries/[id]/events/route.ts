import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET /api/itineraries/[id]/events - Fetch all events for an itinerary
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    
    await client.connect()
    
    // Single query to fetch all events for all days of an itinerary
    const result = await client.query(`
      SELECT 
        e.id,
        e.title,
        e.event_data,
        e.day_id,
        d.day_number,
        d.location,
        d.date
      FROM itinerary_events e
      JOIN itinerary_days d ON e.day_id = d.id
      WHERE d.itinerary_id = $1
      ORDER BY d.day_number ASC, e.created_at ASC
    `, [id])
    
    console.log(`✅ Fetched ${result.rows.length} events for itinerary ${id}`)
    
    return NextResponse.json({ 
      events: result.rows,
      count: result.rows.length 
    })
  } catch (error) {
    console.error('Events GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

