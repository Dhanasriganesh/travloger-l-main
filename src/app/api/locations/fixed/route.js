import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')
    let query = supabase.from('fixed_locations').select('*').order('created_at', { ascending: false })
    if (city && city !== 'all') query = query.eq('city', city)
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ locations: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { name, city } = await request.json()
    if (!name || !city) return NextResponse.json({ error: 'Name and city are required' }, { status: 400 })
    const { data, error } = await supabase
      .from('fixed_locations')
      .insert([{ name: name.trim(), city: city.trim() }])
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ location: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



