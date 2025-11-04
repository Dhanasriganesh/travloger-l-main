import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../../../lib/supabaseServer.js'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ email: string }> }
) {
  try {
    const { email: emailParam } = await params
    const email = decodeURIComponent(emailParam)

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      )
    }

    const { data, error } = await supabaseServer
      .from('employees')
      .select('id, name, email, destination, role, status')
      .eq('email', email)
      .single()

    if (error) {
      console.error('Error fetching employee:', error)
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Employee not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(data)

  } catch (error) {
    console.error('Error in employee API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
