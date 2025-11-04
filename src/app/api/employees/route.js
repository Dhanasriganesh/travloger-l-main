import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// GET /api/employees?destination=Kashmir
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination')

    let query = supabaseServer
      .from('employees')
      .select('id, name, email, phone, destination, role, status')
      .order('name', { ascending: true })

    if (destination && destination !== 'all') {
      // Use case-insensitive comparison for destination matching
      query = query.ilike('destination', destination)
    }

    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    return NextResponse.json({ employees: data || [] })
  } catch (error) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



