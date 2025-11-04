import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer'

export async function POST() {
  try {
    // Remove all sessions older than 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString()
    
    const { error } = await supabaseServer
      .from('employee_sessions')
      .delete()
      .lt('last_activity', fiveMinutesAgo)

    if (error) {
      console.error('Error cleaning up sessions:', error)
      return NextResponse.json({ error: 'Failed to cleanup sessions' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Expired sessions cleaned up successfully' 
    })
  } catch (error) {
    console.error('Error in session cleanup API:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



