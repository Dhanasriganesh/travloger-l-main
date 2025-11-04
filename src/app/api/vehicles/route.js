import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const locationId = searchParams.get('locationId')

    let query = supabaseServer
      .from('vehicles')
      .select('*')
      .order('created_at', { ascending: false })

    if (locationId) {
      query = query.eq('location_id', locationId)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ vehicles: data })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const { vehicleType, rate, acExtra, locationId } = await request.json()

    if (!vehicleType || !locationId) {
      return NextResponse.json({ error: 'vehicleType and locationId are required' }, { status: 400 })
    }

    const { data, error } = await supabaseServer
      .from('vehicles')
      .insert([
        {
          vehicle_type: vehicleType.trim(),
          rate: Number(rate) || 0,
          ac_extra: Number(acExtra) || 0,
          location_id: locationId
        }
      ])
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ vehicle: data }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



