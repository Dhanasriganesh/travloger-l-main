import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const destination = searchParams.get('destination')
    const assignedTo = searchParams.get('assignedTo')

    let query = supabaseServer
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by destination if provided
    if (destination && destination !== 'all') {
      query = query.eq('destination', destination)
    }
    if (assignedTo) {
      query = query.eq('assigned_employee_id', assignedTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabaseServer
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (destination && destination !== 'all') {
      countQuery = countQuery.eq('destination', destination)
    }
    if (assignedTo) {
      countQuery = countQuery.eq('assigned_employee_id', assignedTo)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting leads:', countError)
    }

    return NextResponse.json({
      leads: data || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const {
      name,
      email,
      phone,
      number_of_travelers,
      travel_dates,
      source,
      destination,
      custom_notes
    } = body || {}

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('leads')
      .insert([
        {
          name,
          email,
          phone,
          number_of_travelers: number_of_travelers ?? null,
          travel_dates: travel_dates ?? null,
          source: source ?? null,
          destination: destination ?? null,
          custom_notes: custom_notes ?? null,
        },
      ])
      .select('*')
      .single()

    if (error) {
      console.error('Error creating lead:', error)
      return NextResponse.json(
        { error: 'Failed to create lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lead: data }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const {
      status,
      assigned_employee_id,
      assigned_employee_name,
      custom_notes,
      last_updated
    } = body || {}

    const updateData: any = {
      updated_at: new Date().toISOString()
    }

    if (status) updateData.status = status
    if (assigned_employee_id) updateData.assigned_employee_id = assigned_employee_id
    if (assigned_employee_name) updateData.assigned_employee_name = assigned_employee_name
    if (custom_notes) updateData.custom_notes = custom_notes
    if (last_updated) updateData.last_updated = last_updated

    const { data, error } = await supabaseServer
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    return NextResponse.json({ lead: data })
  } catch (error) {
    console.error('Error in PATCH /api/leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
