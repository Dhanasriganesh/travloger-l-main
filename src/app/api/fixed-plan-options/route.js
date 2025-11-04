import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const planId = searchParams.get('planId')
    const locationId = searchParams.get('locationId')

    let query = supabase
      .from('fixed_plan_options')
      .select('*')
      .order('created_at', { ascending: false })

    if (city && city !== 'all') query = query.eq('city', city)
    if (planId) query = query.eq('fixed_plan_id', planId)
    if (locationId) query = query.eq('fixed_location_id', locationId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ options: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { city, locationId, planId, adults, pricePerPerson, roomsVehicle } = await request.json()
    if (!city || !locationId || !planId || !adults || !pricePerPerson) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('fixed_plan_options')
      .insert([{
        city: city.trim(),
        fixed_location_id: locationId,
        fixed_plan_id: planId,
        adults: Number(adults),
        price_per_person: Number(pricePerPerson),
        rooms_vehicle: (roomsVehicle || '').trim()
      }])
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ option: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



