import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../lib/supabaseServer.js'

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    
    if (!id) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Get employee details
    const { data: employee, error: employeeError } = await supabaseServer
      .from('employees')
      .select('*')
      .eq('id', id)
      .single()

    if (employeeError || !employee) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    // Get leads assigned to this employee
    const { data: assignedLeads, error: leadsError } = await supabaseServer
      .from('leads')
      .select('*')
      .eq('assigned_employee_id', id)
      .order('created_at', { ascending: false })

    if (leadsError) {
      console.error('Error fetching leads:', leadsError)
    }

    // Get bookings where this employee is the assigned agent
    const { data: bookings, error: bookingsError } = await supabaseServer
      .from('bookings')
      .select('*')
      .eq('assigned_agent', employee.name)
      .order('created_at', { ascending: false })

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError)
    }

    // Calculate statistics
    const totalLeadsAssigned = assignedLeads?.length || 0
    const totalBookings = bookings?.length || 0
    
    // Count leads by status
    const leadsByStatus = {
      new: assignedLeads?.filter(lead => !lead.assigned_at).length || 0,
      contacted: assignedLeads?.filter(lead => lead.assigned_at && !bookings?.some(b => b.lead_id === lead.id)).length || 0,
      converted: bookings?.length || 0
    }

    // Count bookings by status
    const bookingsByStatus = {
      pending: bookings?.filter(booking => booking.status === 'Pending').length || 0,
      confirmed: bookings?.filter(booking => booking.status === 'Confirmed').length || 0,
      cancelled: bookings?.filter(booking => booking.status === 'Cancelled').length || 0
    }

    // Count payments by status
    const paymentsByStatus = {
      pending: bookings?.filter(booking => booking.payment_status === 'Pending').length || 0,
      paid: bookings?.filter(booking => booking.payment_status === 'Paid').length || 0,
      failed: bookings?.filter(booking => booking.payment_status === 'Failed').length || 0
    }

    // Calculate total revenue
    const totalRevenue = bookings
      ?.filter(booking => booking.payment_status === 'Paid')
      .reduce((sum, booking) => sum + (booking.amount || 0), 0) || 0

    // Calculate conversion rate
    const conversionRate = totalLeadsAssigned > 0 
      ? Math.round((totalBookings / totalLeadsAssigned) * 100) 
      : 0

    // Get recent activity (last 10 leads and bookings)
    const recentLeads = assignedLeads?.slice(0, 10) || []
    const recentBookings = bookings?.slice(0, 10) || []

    // Get performance by destination
    const destinationStats: { [key: string]: { leads: number; bookings: number; revenue: number } } = {}
    assignedLeads?.forEach(lead => {
      const dest = lead.destination || 'Unknown'
      if (!destinationStats[dest]) {
        destinationStats[dest] = { leads: 0, bookings: 0, revenue: 0 }
      }
      destinationStats[dest].leads++
    })

    bookings?.forEach(booking => {
      const dest = booking.destination || 'Unknown'
      if (!destinationStats[dest]) {
        destinationStats[dest] = { leads: 0, bookings: 0, revenue: 0 }
      }
      destinationStats[dest].bookings++
      if (booking.payment_status === 'Paid') {
        destinationStats[dest].revenue += booking.amount || 0
      }
    })

    const stats = {
      employee: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        phone: employee.phone,
        destination: employee.destination,
        role: employee.role,
        status: employee.status,
        joinedAt: employee.inserted_at
      },
      overview: {
        totalLeadsAssigned,
        totalBookings,
        totalRevenue,
        conversionRate
      },
      leads: {
        byStatus: leadsByStatus,
        recent: recentLeads
      },
      bookings: {
        byStatus: bookingsByStatus,
        recent: recentBookings
      },
      payments: {
        byStatus: paymentsByStatus
      },
      destinations: destinationStats
    }

    return NextResponse.json({ stats })

  } catch (error: any) {
    console.error('Error fetching employee stats:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
