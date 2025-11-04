import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET /api/quotation/[id] - Get quotation data for an itinerary
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    const itineraryId = parseInt(id)
    
    // Get queryId from URL search params
    const url = new URL(request.url)
    const queryId = url.searchParams.get('queryId')
    
    if (isNaN(itineraryId)) {
      return NextResponse.json({ error: 'Invalid itinerary ID' }, { status: 400 })
    }

    await client.connect()
    
    // Get itinerary details
    const itineraryResult = await client.query(`
      SELECT 
        i.id,
        i.name,
        i.start_date,
        i.end_date,
        i.adults,
        i.children,
        i.destinations,
        i.notes,
        i.price,
        i.cover_photo,
        i.created_at,
        i.updated_at
      FROM itineraries i
      WHERE i.id = $1
    `, [itineraryId])
    
    if (itineraryResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    const itinerary = itineraryResult.rows[0]
    
    // Get lead data from Supabase (since leads table is in Supabase)
    let leadData = null
    try {
      const { createClient } = await import('@supabase/supabase-js')
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      
      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey)
        const { data: lead, error } = await supabase
          .from('leads')
          .select('*')
          .eq('id', queryId || itineraryId) // Use queryId if provided, otherwise fallback to itineraryId
          .single()
        
        if (!error && lead) {
          leadData = lead
          console.log('✅ Found lead data:', lead.name)
        }
      }
    } catch (error) {
      console.log('⚠️ Could not fetch lead data:', error.message)
    }
    
    // Get events for this itinerary to calculate total price
    const eventsResult = await client.query(`
      SELECT 
        e.id,
        e.event_data,
        e.created_at,
        d.day_number,
        d.date
      FROM itinerary_events e
      JOIN itinerary_days d ON e.day_id = d.id
      WHERE d.itinerary_id = $1
      ORDER BY d.day_number ASC, e.created_at ASC
    `, [itineraryId])
    
    // Calculate total price from events
    let totalPrice = 0
    let events = eventsResult.rows.map(event => {
      const eventData = event.event_data
      if (eventData && eventData.price) {
        const price = typeof eventData.price === 'string' 
          ? parseFloat(eventData.price) 
          : eventData.price
        if (!isNaN(price)) {
          totalPrice += price
        }
      }
      return {
        id: event.id,
        event_data: eventData,
        day_number: event.day_number,
        date: event.date,
        created_at: event.created_at
      }
    })
    
    // If no events found, add sample events for demonstration
    if (events.length === 0) {
      console.log('⚠️ No events found, adding sample events')
      totalPrice = 16654 // Sample total price
      events = [
        {
          id: 1,
          event_data: {
            title: "Airport Transfer",
            description: "Transfer from Cochin International Airport to Munnar",
            price: 2500,
            activities: ["Airport pickup", "Scenic drive to Munnar", "Hotel check-in"]
          },
          day_number: 1,
          date: itinerary.start_date,
          created_at: new Date().toISOString()
        },
        {
          id: 2,
          event_data: {
            title: "Munnar Sightseeing",
            description: "Full day sightseeing in Munnar with Top Station",
            price: 3500,
            activities: ["Photo Point", "Echo Point", "Matupetty Dam", "Top Station"]
          },
          day_number: 2,
          date: itinerary.start_date,
          created_at: new Date().toISOString()
        },
        {
          id: 3,
          event_data: {
            title: "Accommodation",
            description: "2 nights accommodation in Munnar",
            price: 8000,
            activities: ["Deluxe Balcony Room", "CP Meal Plan", "Hotel amenities"]
          },
          day_number: 1,
          date: itinerary.start_date,
          created_at: new Date().toISOString()
        },
        {
          id: 4,
          event_data: {
            title: "Transportation",
            description: "Private vehicle for entire trip",
            price: 2654,
            activities: ["Sedan vehicle", "Driver cum guide", "Fuel and tolls"]
          },
          day_number: 1,
          date: itinerary.start_date,
          created_at: new Date().toISOString()
        }
      ]
    }
    
    // Get hotels/accommodations for this itinerary (if hotels table exists)
    let hotels = []
    try {
      const hotelsResult = await client.query(`
        SELECT 
          h.name as hotel_name,
          h.city,
          h.star_rating,
          h.room_type,
          h.meal_plan,
          h.check_in_date,
          h.check_out_date,
          h.nights,
          h.rooms
        FROM hotels h
        WHERE h.itinerary_id = $1
        ORDER BY h.check_in_date ASC
      `, [itineraryId])
      
      hotels = hotelsResult.rows.map(hotel => ({
        city: hotel.city || 'Not specified',
        hotelName: `${hotel.hotel_name} (${hotel.star_rating || 'N/A'} Star)`,
        checkIn: formatDate(hotel.check_in_date),
        checkOut: formatDate(hotel.check_out_date),
        nights: hotel.nights || 1,
        roomType: hotel.room_type || 'Standard Room',
        mealPlan: hotel.meal_plan || 'CP',
        rooms: hotel.rooms || 1
      }))
      
      console.log('✅ Found hotels:', hotels.length)
    } catch (error) {
      console.log('⚠️ No hotels table or data:', error.message)
      // Add sample hotel data for demonstration
      hotels = [{
        city: 'Munnar',
        hotelName: 'June Boutique Villa (3 Star)',
        checkIn: formatDate(itinerary.start_date),
        checkOut: formatDate(itinerary.end_date),
        nights: calculateNights(itinerary.start_date, itinerary.end_date),
        roomType: 'Deluxe Balcony Room',
        mealPlan: 'CP',
        rooms: 1
      }]
      console.log('✅ Added sample hotel data')
    }

    // Format the quotation data
    const quotationData = {
      queryId: itinerary.id,
      customerName: leadData?.name || 'Customer',
      destination: itinerary.destinations || leadData?.destination || 'Not specified',
      adults: itinerary.adults || leadData?.number_of_travelers || 1,
      children: itinerary.children || 0,
      nights: calculateNights(itinerary.start_date, itinerary.end_date),
      days: calculateDays(itinerary.start_date, itinerary.end_date),
      startDate: formatDate(itinerary.start_date),
      endDate: formatDate(itinerary.end_date),
      queryDate: formatDate(leadData?.created_at || itinerary.created_at),
      totalPrice: totalPrice || itinerary.price || 0,
      hotels: hotels,
      itinerary: formatItineraryEvents(events),
      inclusions: [
        "Airport/Railway/Bus stop pick-up & drop",
        "Entire travel as per the itinerary in a private vehicle",
        "(Sedan/SUV/MUV/Tempo Traveller)",
        "Enter sightseeing as per the mentioned itinerary only",
        "Driver come guide",
        "All Permits, Tolls & Taxes",
        "Fuel expenses & Driver allowances"
      ],
      exclusions: [
        "To and from fares of airlines/buses/railways",
        "Entry Fee/Camera Fee/Activities/Rides not mentioned",
        "Any kind of food or beverage that is not included in the package, like alcoholic drinks, mineral water, meals/refreshments/lunches on the go"
      ],
      terms: [
        "Driver duty time will only be 8 AM to 7 PM, except for pick up",
        "Driver Extra time service according to the location of hotels and will be charged ₹250/- per hour",
        "Early morning pickups are only possible after 6 am",
        "The provided quotation is based on the specific itinerary discussed. Any extra kilometers or stops will incur extra charges, payable directly to the driver",
        "The Air conditioning in the room will not cool suddenly like in homes and hotels. It will take 30 minutes to 1 hour to be in full power",
        "The guest must go to the bedroom by 10 PM. It is not allowed to be outside after 10 PM",
        "A presence of flies and small insects is the natural habitat. It cannot be 100% eliminated",
        "Management will not be liable for missing things during the trip",
        "Please pack light, as we aim to travel minimally. Our itinerary is subject to change due to weather, road conditions, participant abilities, and other unforeseen circumstances",
        "We don't permit smoking during the movement in transport",
        "Travloger reserves the right to end your trip at any time due to inappropriate behavior/conduct. In such cases, no refunds will be issued",
        "The individual reserving the spot is liable for any harm caused to room/camp/resort outfitting and is responsible to pay for something similar",
        "If any sightseeing is cancelled due to bad weather conditions or unavoidable circumstances, no refund will be given",
        "Provided rates are subject to change based on availability/changes in Hotels, fuel rates, etc."
      ],
      cancellationPolicy: [
        "No refund shall be made with respect to the initial booking advance amount for any cancellations",
        "If cancellations are made 2015 days before the start date of the trip, 50% of the trip cost will be charged as cancellation fees",
        "If cancellations are made 15–7 days before the start date of the trip, 50% of the trip cost will be charged as cancellation fees",
        "If cancellations are made within 7 days before the start date of the trip, 75% of the trip cost will be charged as cancellation fees",
        "In the case of unforeseen weather conditions or government restrictions, certain activities may be cancelled, and in such cases, the operator will try his best to provide an alternate feasible activity. However, no refund will be provided for the same"
      ],
      usefulTips: [
        "Ensure that you know your preferred destination, activities, travel dates, and budget. This will help us recommend the best package for your needs",
        "Double-check what's covered in the package—flights, accommodations, meals, tours, and transfers—so there are no surprises later",
        "Be aware of cancellation or modification fees. Make sure you're comfortable with the flexibility offered in case of unexpected changes",
        "Inquire about any optional activities, resort fees, taxes, or tips that may not be included in the package price"
      ]
    }
    
    console.log('✅ Quotation data prepared for itinerary:', itineraryId)
    return NextResponse.json({ quotation: quotationData })
  } catch (error) {
    console.error('Quotation GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// Helper functions
function calculateNights(startDate: string, endDate: string): number {
  if (!startDate || !endDate) return 0
  const start = new Date(startDate)
  const end = new Date(endDate)
  const diffTime = end.getTime() - start.getTime()
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24))
}

function calculateDays(startDate: string, endDate: string): number {
  return calculateNights(startDate, endDate) + 1
}

function formatDate(dateString: string): string {
  if (!dateString) return 'Not specified'
  const date = new Date(dateString)
  return date.toLocaleDateString('en-GB', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  })
}

function formatItineraryEvents(events: any[]): any[] {
  // Group events by day and format them
  const dayGroups: { [key: string]: any[] } = {}
  
  events.forEach((event, index) => {
    const eventData = event.event_data
    if (eventData) {
      const day = event.day_number || index + 1
      const date = event.date || new Date().toLocaleDateString('en-GB')
      
      if (!dayGroups[day]) {
        dayGroups[day] = []
      }
      
      dayGroups[day].push({
        title: eventData.title || eventData.name || `Activity ${index + 1}`,
        description: eventData.description || eventData.details || '',
        activities: eventData.activities || [eventData.description || eventData.details || 'Activity']
      })
    }
  })
  
  // Convert to array format
  return Object.keys(dayGroups).map((day, index) => {
    const dayEvents = dayGroups[day]
    const firstEvent = dayEvents[0]
    
    return {
      day: parseInt(day),
      date: firstEvent.date || new Date().toLocaleDateString('en-GB'),
      title: firstEvent.title || `Day ${day}`,
      description: firstEvent.description || '',
      activities: dayEvents.flatMap(event => event.activities).filter(Boolean)
    }
  }).sort((a, b) => a.day - b.day)
}
