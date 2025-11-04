import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET - Fetch all itineraries from both custom and fixed tables
export async function GET() {
  try {
    const [customRes, fixedRes] = await Promise.all([
      supabaseServer.from('itineraries_for_custom').select('*'),
      supabaseServer.from('itineraries_for_fixed').select('*')
    ])

    if (customRes.error) {
      // If the table doesn't exist yet, treat as empty
      if (customRes.error.message && customRes.error.message.includes('does not exist')) {
        customRes.data = []
      } else {
        return NextResponse.json({ error: customRes.error.message }, { status: 500 })
      }
    }
    if (fixedRes.error) {
      if (fixedRes.error.message && fixedRes.error.message.includes('does not exist')) {
        fixedRes.data = []
      } else {
        return NextResponse.json({ error: fixedRes.error.message }, { status: 500 })
      }
    }

    const combined = [...(customRes.data || []), ...(fixedRes.data || [])]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    return NextResponse.json({ packages: combined })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Create a new itinerary (stores into itineraries_for_custom or itineraries_for_fixed)
export async function POST(request) {
  try {
    const body = await request.json()
    
    // Basic normalization and safe defaults so inserts don't fail
    const destination = (body.destination || '').toString().trim()
    const plan = (body.plan || body.plan_type || '').toString().trim() // 'Custom Plan' | 'Fixed Plan' | 'Both'
    const tripType = body.tripType || (plan === 'Fixed Plan' ? 'group' : 'custom')
    const name = (body.name && body.name.toString().trim()) || (destination ? `${destination.charAt(0).toUpperCase() + destination.slice(1)} Itinerary` : '')
    const duration = body.duration || (body.days && body.nights ? `${body.days} days / ${body.nights} nights` : '')
    const price = body.price ?? body.fixed_price_per_person ?? body.fixedPricePerPerson ?? 0

    if (!destination) {
      return NextResponse.json({ error: 'destination is required' }, { status: 400 })
    }
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 })
    }

    // Common fields across both tables
    const common = {
      name,
      destination,
      route: body.route || null,
      city_slug: body.city_slug || null,
      duration,
      price,
      original_price: body.original_price || body.originalPrice || 0,
      description: body.description || `${plan === 'Fixed Plan' ? 'Custom Fixed Plan' : 'Custom Plan'} for ${destination}`,
      highlights: body.highlights || ['Customized experience', 'Professional service'],
      includes: body.includes || ['Accommodation', 'Transportation'],
      category: body.category || 'Adventure',
      status: body.status || 'Active',
      featured: body.featured || false,
      image: body.image || '',
      nights: body.nights || 0,
      days: body.days || 0,
      trip_type: body.trip_type || tripType,
      bookings: 0,
      plan_type: body.plan_type || plan
    }

    let table = ''
    let insertData = {}

    if (plan === 'Fixed Plan') {
      table = 'itineraries_for_fixed'
      insertData = {
        ...common,
        fixed_days_id: body.fixed_days_id || body.fixedDaysId || null,
        fixed_location_id: body.fixed_location_id || body.fixedLocationId || null,
        fixed_plan_id: body.fixed_plan_id || body.fixedPlanId || null,
        fixed_adults: body.fixed_adults ?? body.fixedAdults ?? null,
        fixed_price_per_person: body.fixed_price_per_person ?? body.fixedPricePerPerson ?? null,
        fixed_rooms_vehicle: body.fixed_rooms_vehicle ?? body.fixedRoomsVehicle ?? null,
        fixed_variant_id: body.fixed_variant_id || body.fixedVariantId || null
      }
    } else {
      table = 'itineraries_for_custom'
      insertData = {
        ...common,
        service_type: body.service_type || body.serviceType || null,
        hotel_location_id: body.hotel_location_id || body.hotelLocation || null,
        vehicle_location_id: body.vehicle_location_id || body.vehicleLocation || null,
        selected_hotel_id: body.selected_hotel_id || body.selectedHotel || null,
        selected_vehicle_id: body.selected_vehicle_id || body.selectedVehicle || null
      }
    }

    const { data, error } = await supabaseServer
      .from(table)
      .insert([insertData])
      .select()

    if (error) {
      console.error('Supabase insert error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    return NextResponse.json({ package: data[0] }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({ error: 'Internal server error', details: error.message }, { status: 500 })
  }
}
