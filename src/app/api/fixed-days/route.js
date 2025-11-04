import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const city = searchParams.get('city')

    let query = supabase
      .from('fixed_days')
      .select('*')
      .order('days', { ascending: true })

    if (city && city !== 'all') {
      query = query.eq('city', city)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ options: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { city, days, label } = await request.json()
    if (!city || !days) {
      return NextResponse.json({ error: 'city and days are required' }, { status: 400 })
    }
    const { data, error } = await supabase
      .from('fixed_days')
      .insert([{ city: city.trim(), days: Number(days), label: (label || '').trim() }])
      .select('*')
      .single()
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ option: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



