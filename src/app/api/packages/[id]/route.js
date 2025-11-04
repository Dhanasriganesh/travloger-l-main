import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET - Fetch a specific itinerary by ID (from either custom or fixed tables)
export async function GET(request, { params }) {
  try {
    const { id } = params

    const [customRes, fixedRes] = await Promise.all([
      supabaseServer.from('itineraries_for_custom').select('*').eq('id', id).limit(1),
      supabaseServer.from('itineraries_for_fixed').select('*').eq('id', id).limit(1)
    ])

    if (customRes.error && !(customRes.error.message || '').includes('does not exist')) {
      return NextResponse.json({ error: customRes.error.message }, { status: 500 })
    }
    if (fixedRes.error && !(fixedRes.error.message || '').includes('does not exist')) {
      return NextResponse.json({ error: fixedRes.error.message }, { status: 500 })
    }

    const row = (customRes.data && customRes.data[0]) || (fixedRes.data && fixedRes.data[0])
    if (!row) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 })
    }
    return NextResponse.json({ package: row })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// PUT - Update an itinerary (updates the table where the id exists)
export async function PUT(request, { params }) {
  try {
    const { id } = params
    const body = await request.json()

    // Determine table by probing
    const [customCheck, fixedCheck] = await Promise.all([
      supabaseServer.from('itineraries_for_custom').select('id').eq('id', id).limit(1),
      supabaseServer.from('itineraries_for_fixed').select('id').eq('id', id).limit(1)
    ])

    if ((customCheck.error && !(customCheck.error.message || '').includes('does not exist')) ||
        (fixedCheck.error && !(fixedCheck.error.message || '').includes('does not exist'))) {
      const err = customCheck.error || fixedCheck.error
      return NextResponse.json({ error: err.message }, { status: 500 })
    }

    let table = ''
    if (customCheck.data && customCheck.data.length) table = 'itineraries_for_custom'
    else if (fixedCheck.data && fixedCheck.data.length) table = 'itineraries_for_fixed'
    else return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Common updates
    const updates = {
      name: body.name,
      destination: body.destination,
      route: body.route,
      city_slug: body.city_slug,
      duration: body.duration,
      price: body.price,
      original_price: body.original_price ?? body.originalPrice,
      description: body.description,
      highlights: body.highlights,
      includes: body.includes,
      category: body.category,
      status: body.status,
      featured: body.featured,
      image: body.image,
      nights: body.nights,
      days: body.days,
      trip_type: body.trip_type ?? body.tripType,
      plan_type: body.plan_type,
      updated_at: new Date().toISOString()
    }

    if (table === 'itineraries_for_custom') {
      Object.assign(updates, {
        service_type: body.service_type ?? body.serviceType,
        hotel_location_id: body.hotel_location_id ?? body.hotelLocation,
        vehicle_location_id: body.vehicle_location_id ?? body.vehicleLocation,
        selected_hotel_id: body.selected_hotel_id ?? body.selectedHotel,
        selected_vehicle_id: body.selected_vehicle_id ?? body.selectedVehicle
      })
    } else {
      Object.assign(updates, {
        fixed_days_id: body.fixed_days_id ?? body.fixedDaysId,
        fixed_location_id: body.fixed_location_id ?? body.fixedLocationId,
        fixed_plan_id: body.fixed_plan_id ?? body.fixedPlanId,
        fixed_adults: body.fixed_adults ?? body.fixedAdults,
        fixed_price_per_person: body.fixed_price_per_person ?? body.fixedPricePerPerson,
        fixed_rooms_vehicle: body.fixed_rooms_vehicle ?? body.fixedRoomsVehicle,
        fixed_variant_id: body.fixed_variant_id ?? body.fixedVariantId
      })
    }

    const { data, error } = await supabaseServer
      .from(table)
      .update(updates)
      .eq('id', id)
      .select()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ package: data[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Delete an itinerary by ID (tries both tables)
export async function DELETE(request, { params }) {
  try {
    const { id } = params

    const [delCustom, delFixed] = await Promise.all([
      supabase.from('itineraries_for_custom').delete().eq('id', id),
      supabase.from('itineraries_for_fixed').delete().eq('id', id)
    ])

    if ((delCustom.error && !(delCustom.error.message || '').includes('does not exist')) ||
        (delFixed.error && !(delFixed.error.message || '').includes('does not exist'))) {
      const err = delCustom.error || delFixed.error
      return NextResponse.json({ error: err.message }, { status: 500 })
    }

    const affected = (delCustom.count || 0) + (delFixed.count || 0)
    if (!affected) {
      // Some PostgREST clients don't return count unless requested; fallback by probing
      const [chkC, chkF] = await Promise.all([
        supabase.from('itineraries_for_custom').select('id').eq('id', id).limit(1),
        supabase.from('itineraries_for_fixed').select('id').eq('id', id).limit(1)
      ])
      const stillExists = (chkC.data && chkC.data.length) || (chkF.data && chkF.data.length)
      if (!stillExists) {
        return NextResponse.json({ message: 'Deleted or not found' })
      }
    }

    return NextResponse.json({ message: 'Deleted successfully' })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

