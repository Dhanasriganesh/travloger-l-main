import { NextRequest, NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * Auto-score lead after creation or update
 */
async function autoScoreLead(leadId: number, triggerType: string) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return null

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Fetch the lead
    const leadResult = await client.query('SELECT * FROM leads WHERE id = $1', [leadId])
    if (leadResult.rows.length === 0) return null
    
    const lead = leadResult.rows[0]
    
    // Determine lead type
    const leadType = lead.lead_type || 'FIT'
    
    // Fetch applicable scoring rules
    const rulesResult = await client.query(`
      SELECT * FROM lead_scoring_master
      WHERE status = 'Active'
      AND (lead_type = $1 OR lead_type IS NULL OR lead_type = '')
      AND (automation_trigger = $2 OR automation_trigger = 'Both')
      ORDER BY score_value DESC
    `, [leadType, triggerType])
    
    const rules = rulesResult.rows
    let totalScore = 0
    
    // Evaluate each rule
    for (const rule of rules) {
      const fieldValue = lead[rule.field_checked]
      const matches = evaluateCondition(fieldValue, rule.condition_type, rule.condition_value || '')
      
      if (matches) {
        totalScore += parseInt(rule.score_value) || 0
      }
    }
    
    // Determine priority
    let priority = 'Cold'
    const hotThreshold = rules[0]?.priority_range_hot || 40
    const warmMin = rules[0]?.priority_range_warm_min || 25
    
    if (totalScore >= hotThreshold) {
      priority = 'Hot'
    } else if (totalScore >= warmMin) {
      priority = 'Warm'
    }
    
    // Update lead with score and priority
    await client.query(`
      UPDATE leads 
      SET lead_score = $1, lead_priority = $2, last_score_calculated = NOW()
      WHERE id = $3
    `, [totalScore, priority, leadId])
    
    return { score: totalScore, priority }
    
  } catch (error) {
    console.error('Auto-scoring error:', error)
    return null
  } finally {
    await client.end()
  }
}

/**
 * Evaluate a condition against a field value
 */
function evaluateCondition(fieldValue: any, conditionType: string, conditionValue: string): boolean {
  if (fieldValue === null || fieldValue === undefined) return false
  
  const fieldStr = String(fieldValue).toLowerCase()
  const condVal = conditionValue.toLowerCase()
  
  switch (conditionType) {
    case 'equals': return fieldStr === condVal
    case 'not_equals': return fieldStr !== condVal
    case 'greater_than': return parseFloat(fieldValue) > parseFloat(conditionValue)
    case 'greater_than_or_equal': return parseFloat(fieldValue) >= parseFloat(conditionValue)
    case 'less_than': return parseFloat(fieldValue) < parseFloat(conditionValue)
    case 'less_than_or_equal': return parseFloat(fieldValue) <= parseFloat(conditionValue)
    case 'between': {
      const [min, max] = conditionValue.split(',').map(v => parseFloat(v.trim()))
      const numValue = parseFloat(fieldValue)
      return numValue >= min && numValue <= max
    }
    case 'contains': return fieldStr.includes(condVal)
    case 'not_contains': return !fieldStr.includes(condVal)
    case 'not_empty': return fieldStr.trim().length > 0
    case 'is_empty': return fieldStr.trim().length === 0
    case 'contains_comma': return fieldStr.includes(',')
    case 'within_days': {
      const targetDays = parseInt(conditionValue)
      const travelDate = new Date(fieldValue)
      const now = new Date()
      const diffTime = travelDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= targetDays
    }
    case 'matches_campaign': {
      // Check if destination matches active group campaign
      // For now, popular group destinations
      const groupCampaigns = ['kashmir', 'ladakh', 'kerala', 'rajasthan', 'himachal', 'goa']
      return groupCampaigns.some(dest => fieldStr.includes(dest))
    }
    case 'high_inquiry_fit': {
      // Check if destination is part of high-inquiry FIT list
      const fitDestinations = ['dubai', 'bali', 'maldives', 'thailand', 'singapore', 'europe', 'paris', 'switzerland']
      return fitDestinations.some(dest => fieldStr.includes(dest))
    }
    default: return false
  }
}

/**
 * Helper function to find matching lead source based on UTM parameters
 * Returns lead_source_id or null
 */
async function findMatchingLeadSource(
  utmSource: string, 
  utmCampaign: string
): Promise<number | null> {
  const dbUrl = getDbUrl()
  if (!dbUrl || !utmSource) return null

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Try to find exact match: utm_source AND utm_campaign
    if (utmCampaign) {
      const exactMatch = await client.query(`
        SELECT id FROM lead_source_detailed 
        WHERE LOWER(TRIM(utm_source)) = LOWER(TRIM($1))
        AND LOWER(TRIM(utm_campaign)) = LOWER(TRIM($2))
        AND status = 'Active'
        LIMIT 1
      `, [utmSource, utmCampaign])
      
      if (exactMatch.rows.length > 0) {
        return exactMatch.rows[0].id
      }
    }
    
    // Try partial match: just utm_source
    const sourceMatch = await client.query(`
      SELECT id FROM lead_source_detailed 
      WHERE LOWER(TRIM(utm_source)) = LOWER(TRIM($1))
      AND (utm_campaign = '' OR utm_campaign IS NULL)
      AND status = 'Active'
      LIMIT 1
    `, [utmSource])
    
    if (sourceMatch.rows.length > 0) {
      return sourceMatch.rows[0].id
    }
    
    // No match found, return Uncategorized Source
    const uncategorized = await client.query(`
      SELECT id FROM lead_source_detailed 
      WHERE source_name = 'Uncategorized Source'
      LIMIT 1
    `)
    
    return uncategorized.rows.length > 0 ? uncategorized.rows[0].id : null
    
  } catch (error) {
    console.error('Error finding matching lead source:', error)
    return null
  } finally {
    await client.end()
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    const destination = searchParams.get('destination')
    const assignedTo = searchParams.get('assignedTo')

    let query = supabaseServer
      .from('leads')
      .select('*')
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    // Filter by destination if provided
    if (destination && destination !== 'all') {
      query = query.eq('destination', destination)
    }
    if (assignedTo) {
      query = query.eq('assigned_employee_id', assignedTo)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching leads:', error)
      return NextResponse.json(
        { error: 'Failed to fetch leads' },
        { status: 500 }
      )
    }

    // Get total count for pagination
    let countQuery = supabaseServer
      .from('leads')
      .select('*', { count: 'exact', head: true })

    if (destination && destination !== 'all') {
      countQuery = countQuery.eq('destination', destination)
    }
    if (assignedTo) {
      countQuery = countQuery.eq('assigned_employee_id', assignedTo)
    }

    const { count, error: countError } = await countQuery

    if (countError) {
      console.error('Error counting leads:', countError)
    }

    return NextResponse.json({
      leads: data || [],
      total: count || 0,
      limit,
      offset
    })

  } catch (error) {
    console.error('Error in leads API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))

    const {
      name,
      email,
      phone,
      number_of_travelers,
      travel_dates,
      travel_date,
      source,
      destination,
      custom_notes,
      utm_source,
      utm_medium,
      utm_campaign,
      lead_type,
      budget,
      budget_per_person
    } = body || {}

    if (!name || !email || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: name, email, phone' },
        { status: 400 }
      )
    }

    // Find matching lead source based on UTM parameters
    let leadSourceId = null
    if (utm_source) {
      leadSourceId = await findMatchingLeadSource(
        utm_source || '',
        utm_campaign || ''
      )
      console.log(`🔗 UTM Tracking: source=${utm_source}, campaign=${utm_campaign}, matched_id=${leadSourceId}`)
    }

    const dbUrl = getDbUrl()
    if (!dbUrl) {
      // Fallback to supabase if no direct DB connection
      const { data, error } = await supabaseServer
        .from('leads')
        .insert([
          {
            name,
            email,
            phone,
            number_of_travelers: number_of_travelers ?? null,
            travel_dates: travel_dates ?? null,
            source: source ?? null,
            destination: destination ?? null,
            custom_notes: custom_notes ?? null,
          },
        ])
        .select('*')
        .single()

      if (error) {
        console.error('Error creating lead:', error)
        return NextResponse.json(
          { error: 'Failed to create lead' },
          { status: 500 }
        )
      }

      return NextResponse.json({ lead: data }, { status: 201 })
    }

    // Use direct DB connection to insert with UTM fields
    const client = new Client({ connectionString: dbUrl })
    try {
      await client.connect()
      
      const insertResult = await client.query(`
        INSERT INTO leads (
          name, email, phone, number_of_travelers, travel_dates, travel_date,
          source, destination, custom_notes,
          utm_source, utm_medium, utm_campaign, lead_source_id,
          lead_type, budget, budget_per_person
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16
        ) RETURNING *
      `, [
        name,
        email,
        phone,
        number_of_travelers ?? null,
        travel_dates ?? null,
        travel_date ?? null,
        source ?? null,
        destination ?? null,
        custom_notes ?? null,
        utm_source ?? '',
        utm_medium ?? '',
        utm_campaign ?? '',
        leadSourceId,
        lead_type ?? null,
        budget ?? null,
        budget_per_person ?? null
      ])

      const lead = insertResult.rows[0]
      
      // Auto-score the newly created lead
      const scoringResult = await autoScoreLead(lead.id, 'On Lead Create')
      
      // Trigger automation actions for Hot leads
      let automationTriggered = false
      if (scoringResult && scoringResult.priority === 'Hot') {
        try {
          const automationResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/lead-scoring/automation-actions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              lead_id: lead.id,
              priority: scoringResult.priority,
              score: scoringResult.score
            })
          })
          if (automationResponse.ok) {
            automationTriggered = true
            console.log(`🔥 HOT LEAD: Automation actions triggered for lead ${lead.id}`)
          }
        } catch (err) {
          console.error('Failed to trigger automation:', err)
        }
      }
      
      return NextResponse.json({ 
        lead: {
          ...lead,
          lead_score: scoringResult?.score || 0,
          lead_priority: scoringResult?.priority || 'Cold'
        },
        utm_tracking: {
          captured: !!(utm_source || utm_medium || utm_campaign),
          matched_source_id: leadSourceId
        },
        scoring: scoringResult ? {
          score: scoringResult.score,
          priority: scoringResult.priority,
          auto_calculated: true,
          automation_triggered: automationTriggered
        } : null
      }, { status: 201 })
      
    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('Error in POST /api/leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { searchParams } = new URL(request.url)
    const leadId = searchParams.get('id')

    if (!leadId) {
      return NextResponse.json(
        { error: 'Lead ID is required' },
        { status: 400 }
      )
    }

    const {
      status,
      assigned_employee_id,
      assigned_employee_name,
      custom_notes,
      last_updated,
      utm_source,
      utm_medium,
      utm_campaign
    } = body || {}

    const updateData: any = {}

    if (status) updateData.status = status
    if (assigned_employee_id) updateData.assigned_employee_id = assigned_employee_id
    if (assigned_employee_name) updateData.assigned_employee_name = assigned_employee_name
    if (custom_notes) updateData.custom_notes = custom_notes
    if (last_updated) updateData.last_updated = last_updated
    
    // UTM fields update
    if (utm_source !== undefined) updateData.utm_source = utm_source
    if (utm_medium !== undefined) updateData.utm_medium = utm_medium
    if (utm_campaign !== undefined) updateData.utm_campaign = utm_campaign

    // If UTM fields are being updated, re-match lead source
    if (utm_source !== undefined || utm_campaign !== undefined) {
      const newUtmSource = utm_source !== undefined ? utm_source : body.current_utm_source || ''
      const newUtmCampaign = utm_campaign !== undefined ? utm_campaign : body.current_utm_campaign || ''
      
      if (newUtmSource) {
        const leadSourceId = await findMatchingLeadSource(newUtmSource, newUtmCampaign)
        updateData.lead_source_id = leadSourceId
        console.log(`🔗 UTM Update: Re-matched lead source ID: ${leadSourceId}`)
      }
    }

    const { data, error } = await supabaseServer
      .from('leads')
      .update(updateData)
      .eq('id', leadId)
      .select('*')
      .single()

    if (error) {
      console.error('Error updating lead:', error)
      return NextResponse.json(
        { error: 'Failed to update lead' },
        { status: 500 }
      )
    }

    // Auto-score the updated lead
    const scoringResult = await autoScoreLead(parseInt(leadId), 'On Lead Update')
    
    return NextResponse.json({ 
      lead: {
        ...data,
        lead_score: scoringResult?.score || data.lead_score || 0,
        lead_priority: scoringResult?.priority || data.lead_priority || 'Cold'
      },
      scoring: scoringResult ? {
        score: scoringResult.score,
        priority: scoringResult.priority,
        auto_recalculated: true
      } : null
    })
  } catch (error) {
    console.error('Error in PATCH /api/leads:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
