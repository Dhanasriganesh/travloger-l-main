import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../lib/supabaseServer.js'

// GET - Fetch packages filtered by city location. Prefer exact match on `route` (stored location),
// then fallback to destination ILIKE for backwards compatibility.
export async function GET(request, { params }) {
  try {
    const { city } = await params
    if (!city) {
      return NextResponse.json({ error: 'city is required' }, { status: 400 })
    }

    const pattern = `%${city}%`
    
    // Query both itineraries tables and combine results
    const [customRes, fixedRes] = await Promise.all([
      supabaseServer.from('itineraries_for_custom').select('*'),
      supabaseServer.from('itineraries_for_fixed').select('*')
    ])

    if (customRes.error && !customRes.error.message?.includes('does not exist')) {
      return NextResponse.json({ error: customRes.error.message }, { status: 500 })
    }
    if (fixedRes.error && !fixedRes.error.message?.includes('does not exist')) {
      return NextResponse.json({ error: fixedRes.error.message }, { status: 500 })
    }

    // Combine and filter by city
    const combined = [...(customRes.data || []), ...(fixedRes.data || [])]
    const filtered = combined.filter(pkg => {
      // First try strict match by route
      if (pkg.route === city) return true
      // Fallback to destination ILIKE pattern
      if (pkg.destination && pkg.destination.toLowerCase().includes(city.toLowerCase())) return true
      return false
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())

    const data = filtered

    return NextResponse.json({ packages: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



