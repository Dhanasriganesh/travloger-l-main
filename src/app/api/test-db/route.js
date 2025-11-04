import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function GET() {
  try {
    // Simple test to check if we can connect to the database
    const { data, error } = await supabaseServer
      .from('leads')
      .select('count')
      .limit(1)
    
    if (error) {
      console.error('Database error:', error)
      return NextResponse.json({
        success: false,
        error: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      })
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      data: data
    })
    
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json({
      success: false,
      error: error.message
    })
  }
}






