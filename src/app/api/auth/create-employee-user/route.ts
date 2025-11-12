import { NextRequest, NextResponse } from 'next/server'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

const getSupabaseClient = (): SupabaseClient => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !supabaseServiceKey) {
    const missing = [
      !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
      !supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
    ].filter(Boolean)
    throw new Error(
      `[Supabase] Missing required environment variable(s): ${missing.join(
        ', '
      )}. Update your .env(.local) file and restart the dev server.`
    )
  }
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const { email, password, name, employeeId } = await request.json()

    if (!email || !password || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('Creating Supabase Auth user:', { email, name, employeeId })

    // Create user using admin API
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
        role: 'employee',
        employee_id: employeeId
      }
    })

    if (error) {
      console.error('Auth user creation error:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'No user data returned' },
        { status: 400 }
      )
    }

    console.log('Auth user created successfully:', data.user.id)

    return NextResponse.json({
      success: true,
      userId: data.user.id,
      user: data.user
    })

  } catch (error) {
    console.error('Error creating auth user:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
