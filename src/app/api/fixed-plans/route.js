import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    const locationId = searchParams.get('locationId')

    let query = supabase
      .from('fixed_plans')
      .select('*')
      .order('created_at', { ascending: false })

    if (city && city !== 'all') query = query.eq('city', city)
    if (locationId) query = query.eq('fixed_location_id', locationId)

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ plans: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { city, locationId, name } = await request.json()
    if (!city || !locationId || !name) {
      return NextResponse.json({ error: 'city, locationId, and name are required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('fixed_plans')
      .insert([{ city: city.trim(), fixed_location_id: locationId, name: name.trim() }])
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ plan: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



