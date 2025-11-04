import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer.js'

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // Get user from employees table
    const { data: employee, error: fetchError } = await supabaseServer
      .from('employees')
      .select('is_first_login')
      .eq('email', email)
      .single()

    if (fetchError || !employee) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ 
      isFirstLogin: employee.is_first_login !== false
    })

  } catch (error) {
    console.error('Check first login error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
