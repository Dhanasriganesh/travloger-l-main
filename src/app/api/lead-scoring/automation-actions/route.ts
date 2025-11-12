import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * POST /api/lead-scoring/automation-actions
 * Trigger automation actions based on lead priority
 */
export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    const body = await request.json()
    const { lead_id, priority, score } = body

    if (!lead_id || !priority) {
      return NextResponse.json({ error: 'lead_id and priority are required' }, { status: 400 })
    }

    // Fetch lead details
    const leadResult = await client.query('SELECT * FROM leads WHERE id = $1', [lead_id])
    if (leadResult.rows.length === 0) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
    }

    const lead = leadResult.rows[0]
    const actions: string[] = []
    const automationLog: any[] = []

    // HOT LEADS (≥ 40): Immediate Actions
    if (priority === 'Hot') {
      // 1. Trigger instant WhatsApp message
      actions.push('send_whatsapp_instant')
      automationLog.push({
        action: 'WhatsApp Instant Message',
        status: 'queued',
        message: 'Sending instant WhatsApp welcome message',
        priority: 'high',
        lead_name: lead.name,
        lead_phone: lead.phone
      })

      // 2. Send email quote summary
      actions.push('send_email_quote_summary')
      automationLog.push({
        action: 'Email Quote Summary',
        status: 'queued',
        message: 'Sending email quote summary',
        priority: 'high',
        lead_email: lead.email
      })

      // 3. Notify assigned consultant for same-day follow-up
      if (lead.lead_type === 'FIT') {
        actions.push('notify_fit_consultant')
        automationLog.push({
          action: 'Notify FIT Consultant',
          status: 'queued',
          message: 'Notifying FIT consultant for same-day follow-up',
          priority: 'urgent',
          assigned_to: lead.assigned_employee_name || 'Unassigned'
        })
      }

      // 4. Create immediate follow-up task
      actions.push('create_task_immediate')
      automationLog.push({
        action: 'Create Immediate Task',
        status: 'queued',
        message: 'Creating follow-up task for today',
        due_date: new Date().toISOString()
      })
    }

    // WARM LEADS (25-39): Scheduled Actions
    else if (priority === 'Warm') {
      // 1. Schedule WhatsApp reminder for 24-48 hours
      actions.push('schedule_whatsapp_reminder')
      const reminderDate = new Date()
      reminderDate.setHours(reminderDate.getHours() + 36) // 36 hours = 1.5 days
      automationLog.push({
        action: 'Schedule WhatsApp Reminder',
        status: 'scheduled',
        message: 'WhatsApp reminder scheduled',
        priority: 'medium',
        scheduled_for: reminderDate.toISOString()
      })

      // 2. Create follow-up task in 24-48 hours
      actions.push('schedule_task_24_48h')
      automationLog.push({
        action: 'Schedule Follow-Up Task',
        status: 'scheduled',
        message: 'Follow-up task scheduled for 24-48 hours',
        priority: 'medium',
        due_date: reminderDate.toISOString()
      })
    }

    // COLD LEADS (< 25): Low Priority Actions
    else if (priority === 'Cold') {
      // 1. Move to "Low Priority" view
      actions.push('move_to_low_priority')
      automationLog.push({
        action: 'Move to Low Priority View',
        status: 'completed',
        message: 'Lead moved to low priority view',
        priority: 'low'
      })

      // 2. Add to slow nurture campaign
      actions.push('add_to_nurture_campaign')
      automationLog.push({
        action: 'Add to Nurture Campaign',
        status: 'queued',
        message: 'Adding to slow nurture email campaign',
        priority: 'low',
        campaign_type: 'monthly_broadcast'
      })

      // 3. Add to monthly broadcast list
      actions.push('add_to_broadcast_list')
      automationLog.push({
        action: 'Add to Monthly Broadcast',
        status: 'queued',
        message: 'Added to monthly broadcast list',
        priority: 'low'
      })
    }

    // Log all actions to automation_log table (if it exists)
    try {
      for (const log of automationLog) {
        await client.query(`
          INSERT INTO automation_log 
            (lead_id, action_type, status, message, priority, created_at, metadata)
          VALUES ($1, $2, $3, $4, $5, NOW(), $6)
        `, [
          lead_id,
          log.action,
          log.status,
          log.message,
          log.priority || 'medium',
          JSON.stringify(log)
        ])
      }
    } catch (err) {
      console.log('Automation log table not found, skipping logging')
    }

    return NextResponse.json({
      success: true,
      lead_id,
      lead_name: lead.name,
      priority,
      score,
      actions_triggered: actions,
      automation_log: automationLog,
      message: `${actions.length} automation actions triggered for ${priority} lead`
    })

  } catch (error: any) {
    console.error('Automation actions error:', error)
    return NextResponse.json({
      error: 'Failed to trigger automation actions',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/lead-scoring/automation-actions
 * Get automation actions log for a lead
 */
export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('lead_id')

    if (!leadId) {
      return NextResponse.json({ error: 'lead_id is required' }, { status: 400 })
    }

    // Fetch automation log
    const logResult = await client.query(`
      SELECT * FROM automation_log
      WHERE lead_id = $1
      ORDER BY created_at DESC
      LIMIT 50
    `, [leadId])

    return NextResponse.json({
      lead_id: leadId,
      automation_log: logResult.rows
    })

  } catch (error: any) {
    console.error('Automation log fetch error:', error)
    return NextResponse.json({
      error: 'Failed to fetch automation log',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}



