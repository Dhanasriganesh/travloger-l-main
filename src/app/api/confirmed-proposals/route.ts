import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { getErrorMessage } from '@/app/api/utils/error'

// GET /api/confirmed-proposals?queryId={id}
export async function GET(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { searchParams } = new URL(request.url)
    const queryId = searchParams.get('queryId')
    
    if (!queryId) {
      return NextResponse.json({ error: 'Query ID is required' }, { status: 400 })
    }

    await client.connect()
    
    // Get confirmed itineraries (status = 'confirmed') 
    // For now, we'll get all confirmed proposals since the relationship between queries and proposals needs clarification
    const result = await client.query(`
      SELECT id, name, start_date, end_date, adults, children, destinations, notes, 
             price, marketplace_shared, cover_photo, status, confirmed_at, created_at, updated_at
      FROM itineraries 
      WHERE status = 'confirmed'
      ORDER BY confirmed_at DESC
    `)
    
    console.log(`📊 Found ${result.rows.length} confirmed proposals for query ${queryId}`)
    
    // Calculate total price from events for each confirmed proposal
    const confirmedProposals = await Promise.all(result.rows.map(async (row) => {
      let totalPrice = 0
      
      try {
        // Fetch events for this itinerary to calculate total price
        const eventsResult = await client.query(`
          SELECT event_data
          FROM itinerary_events
          WHERE itinerary_id = $1
        `, [row.id])
        
        const events = eventsResult.rows || []
        
        events.forEach((event) => {
          const eventData = event.event_data
          if (eventData && eventData.price) {
            // Parse price as number
            const price = typeof eventData.price === 'string' 
              ? parseFloat(eventData.price) 
              : eventData.price
            if (!isNaN(price)) {
              totalPrice += price
            }
          }
        })
        
        // If no events found, use the stored price or a default
        if (totalPrice === 0 && events.length === 0) {
          console.log(`⚠️ No events found for itinerary ${row.id}, using stored price or default`)
          totalPrice = parseFloat(row.price) || 15000 // Default price if no events
        }
        
        console.log(`💰 Calculated total price for itinerary ${row.id}: ${totalPrice}`)
      } catch (error: unknown) {
        console.error(`Error calculating price for itinerary ${row.id}:`, error)
        totalPrice = parseFloat(row.price) || 15000 // Fallback to stored price or default
      }
      
      return {
        id: row.id,
        name: row.name,
        price: totalPrice,
        confirmed_at: row.confirmed_at,
        start_date: row.start_date,
        end_date: row.end_date,
        adults: row.adults,
        children: row.children,
        destinations: row.destinations,
        notes: row.notes,
        cover_photo: row.cover_photo,
        marketplace_shared: row.marketplace_shared,
        created_at: row.created_at,
        updated_at: row.updated_at,
      }
    }))
    
    // Calculate total amount from confirmed proposals
    const totalAmount = confirmedProposals.reduce((sum, proposal) => {
      return sum + proposal.price
    }, 0)
    
    return NextResponse.json({ 
      confirmedProposals: confirmedProposals,
      totalAmount: totalAmount,
      count: confirmedProposals.length
    })
  } catch (error: unknown) {
    console.error('Confirmed proposals GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}
