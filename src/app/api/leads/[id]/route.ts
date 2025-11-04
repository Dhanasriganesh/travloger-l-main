import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../../lib/supabaseServer.js'
import { canAccessLead } from '../../../../lib/auth-helpers'
import { headers } from 'next/headers'

export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Get employee ID from headers
    const headersList = await headers()
    const employeeId = headersList.get('x-employee-id')

    // If employee ID is provided, check access
    if (employeeId) {
      const hasAccess = await canAccessLead(id, employeeId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const { data, error } = await supabaseServer
      .from('leads')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (e: any) {
    console.error('Error in GET /api/leads/[id]:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const resolvedParams = await params
    const id = resolvedParams?.id
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    // Get employee ID from headers
    const headersList = await headers()
    const employeeId = headersList.get('x-employee-id')

    // If employee ID is provided, check access
    if (employeeId) {
      const hasAccess = await canAccessLead(id, employeeId)
      if (!hasAccess) {
        return NextResponse.json({ error: 'Access denied' }, { status: 403 })
      }
    }

    const body = await request.json()
    const { status, last_updated, ...otherFields } = body

    // Prepare update data
    const updateData: any = {}
    if (status !== undefined) updateData.status = status
    if (last_updated !== undefined) updateData.last_updated = last_updated
    if (Object.keys(otherFields).length > 0) {
      Object.assign(updateData, otherFields)
    }

    const { data, error } = await supabaseServer
      .from('leads')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ lead: data })
  } catch (e: any) {
    console.error('PATCH error:', e)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}







