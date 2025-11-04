import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'

export async function GET() {
  try {
    // Get all active employee sessions from the last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { data: sessions, error } = await supabaseServer
      .from('employee_sessions')
      .select('employee_id, last_activity')
      .gte('last_activity', fiveMinutesAgo)
      .order('last_activity', { ascending: false })

    if (error) {
      console.error('Error fetching active sessions:', error)
      return NextResponse.json({ error: 'Failed to fetch active sessions' }, { status: 500 })
    }

    // Extract unique employee IDs
    const activeEmployeeIds = [...new Set(sessions?.map(session => session.employee_id) || [])]

    return NextResponse.json({ 
      activeEmployeeIds,
      activeSessions: sessions || []
    })
  } catch (error) {
    console.error('Error in active sessions API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Handle empty or malformed request body
    let employeeId
    try {
      const body = await request.text()
      if (body) {
        const parsed = JSON.parse(body)
        employeeId = parsed.employeeId
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Upsert the session (update if exists, insert if not)
    const { error } = await supabaseServer
      .from('employee_sessions')
      .upsert({
        employee_id: employeeId,
        last_activity: new Date().toISOString()
      }, {
        onConflict: 'employee_id'
      })

    if (error) {
      console.error('Error updating session:', error)
      return NextResponse.json({ error: 'Failed to update session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in session update API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Handle empty or malformed request body
    let employeeId
    try {
      const body = await request.text()
      if (body) {
        const parsed = JSON.parse(body)
        employeeId = parsed.employeeId
      }
    } catch (parseError) {
      console.error('Error parsing request body:', parseError)
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
    }

    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID is required' }, { status: 400 })
    }

    // Remove the session
    const { error } = await supabaseServer
      .from('employee_sessions')
      .delete()
      .eq('employee_id', employeeId)

    if (error) {
      console.error('Error deleting session:', error)
      return NextResponse.json({ error: 'Failed to delete session' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in session delete API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}