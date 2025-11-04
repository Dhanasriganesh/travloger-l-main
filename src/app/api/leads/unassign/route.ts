import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer.js'

// POST /api/leads/unassign
// Body: { leadId: string }
export async function POST(request: NextRequest) {
  try {
    const { leadId } = await request.json()

    if (!leadId) {
      return NextResponse.json({ error: 'leadId is required' }, { status: 400 })
    }

    // Update the lead to remove assignment
    const { data, error } = await supabaseServer
      .from('leads')
      .update({
        assigned_employee_id: null,
        assigned_employee_name: null,
        assigned_employee_email: null,
        assigned_at: null
      })
      .eq('id', leadId)
      .select('*')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
