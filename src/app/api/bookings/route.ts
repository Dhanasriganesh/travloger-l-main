import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// GET - Fetch all bookings or filter by status
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const leadId = searchParams.get('leadId')
    
    let query = supabase
      .from('bookings')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (status) {
      query = query.eq('status', status)
    }
    
    if (leadId) {
      query = query.eq('lead_id', leadId)
    }
    
    const { data, error } = await query
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Get all unique assigned agent names
    const assignedAgents = [...new Set((data || []).map(booking => booking.assigned_agent).filter(Boolean))]
    console.log('Assigned agents found:', assignedAgents)
    
    // Fetch employee data for assigned agents
    let employeeData: any[] = []
    if (assignedAgents.length > 0) {
      const { data: employees, error: empError } = await supabase
        .from('employees')
        .select('name, phone')
        .in('name', assignedAgents)
      
      if (!empError && employees) {
        employeeData = employees
        console.log('Employee data fetched:', employees)
      } else {
        console.log('Error fetching employees:', empError)
      }
    }

    // Merge employee data with booking data
    const enrichedBookings = (data || []).map(booking => {
      const employee = employeeData.find(emp => emp.name === booking.assigned_agent)
      return {
        ...booking,
        assigned_employee_name: employee?.name || booking.assigned_agent || 'N/A',
        assigned_employee_mobile: employee?.phone || 'N/A'
      }
    })
    
    return NextResponse.json({ bookings: enrichedBookings })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST - Create a new booking
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      lead_id,
      customer,
      email,
      phone,
      package_id,
      package_name,
      destination,
      travelers,
      amount,
      travel_date,
      assigned_agent,
      itinerary_details,
      razorpay_order_id,
      razorpay_payment_link
    } = body
    
    if (!customer || !email || !package_name || !destination || !amount) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }
    
    const { data, error } = await supabase
      .from('bookings')
      .insert({
        lead_id,
        customer,
        email,
        phone,
        package_id,
        package_name,
        destination,
        travelers: travelers || 1,
        amount,
        status: 'Pending',
        travel_date,
        payment_status: 'Pending',
        assigned_agent,
        itinerary_details,
        razorpay_order_id,
        razorpay_payment_link,
        booking_date: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) {
      console.error('Error creating booking:', error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ booking: data })
  } catch (error: any) {
    console.error('Error in POST /api/bookings:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// PATCH - Update booking status
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, status, payment_status, razorpay_payment_id } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }
    
    const updateData: any = {}
    if (status) updateData.status = status
    if (payment_status) updateData.payment_status = payment_status
    if (razorpay_payment_id) updateData.razorpay_payment_id = razorpay_payment_id
    updateData.updated_at = new Date().toISOString()
    
    const { data, error } = await supabase
      .from('bookings')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ booking: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE - Delete a booking/payment record
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json()
    const { id } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Booking ID required' }, { status: 400 })
    }
    
    const { error } = await supabase
      .from('bookings')
      .delete()
      .eq('id', id)
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    
    return NextResponse.json({ message: 'Booking deleted successfully' })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




