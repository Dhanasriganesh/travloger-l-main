import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * Evaluate a condition against a lead field value
 */
function evaluateCondition(
  fieldValue: any,
  conditionType: string,
  conditionValue: string
): boolean {
  if (fieldValue === null || fieldValue === undefined) {
    return false
  }

  const fieldStr = String(fieldValue).toLowerCase()
  const condVal = conditionValue.toLowerCase()

  switch (conditionType) {
    case 'equals':
      return fieldStr === condVal

    case 'not_equals':
      return fieldStr !== condVal

    case 'greater_than':
      return parseFloat(fieldValue) > parseFloat(conditionValue)

    case 'greater_than_or_equal':
      return parseFloat(fieldValue) >= parseFloat(conditionValue)

    case 'less_than':
      return parseFloat(fieldValue) < parseFloat(conditionValue)

    case 'less_than_or_equal':
      return parseFloat(fieldValue) <= parseFloat(conditionValue)

    case 'between': {
      const [min, max] = conditionValue.split(',').map(v => parseFloat(v.trim()))
      const numValue = parseFloat(fieldValue)
      return numValue >= min && numValue <= max
    }

    case 'contains':
      return fieldStr.includes(condVal)

    case 'not_contains':
      return !fieldStr.includes(condVal)

    case 'starts_with':
      return fieldStr.startsWith(condVal)

    case 'ends_with':
      return fieldStr.endsWith(condVal)

    case 'not_empty':
      return fieldStr.trim().length > 0

    case 'is_empty':
      return fieldStr.trim().length === 0

    case 'contains_comma':
      return fieldStr.includes(',')

    case 'within_days': {
      // Check if travel_date is within X days from now
      const targetDays = parseInt(conditionValue)
      const travelDate = new Date(fieldValue)
      const now = new Date()
      const diffTime = travelDate.getTime() - now.getTime()
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      return diffDays >= 0 && diffDays <= targetDays
    }

    case 'regex_match': {
      try {
        const regex = new RegExp(conditionValue, 'i')
        return regex.test(fieldStr)
      } catch {
        return false
      }
    }

    default:
      return false
  }
}

/**
 * Calculate lead score based on scoring rules
 */
async function calculateLeadScore(client: Client, lead: any, triggerType: string) {
  // Determine lead type
  const leadType = lead.lead_type || 'FIT' // Default to FIT if not specified

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
  const matchedRules: any[] = []

  // Evaluate each rule
  for (const rule of rules) {
    const fieldValue = lead[rule.field_checked]
    const matches = evaluateCondition(fieldValue, rule.condition_type, rule.condition_value || '')

    if (matches) {
      totalScore += parseInt(rule.score_value) || 0
      matchedRules.push({
        rule_name: rule.scoring_criteria_name,
        score_added: rule.score_value,
        field_checked: rule.field_checked,
        field_value: fieldValue
      })
    }
  }

  // Determine priority based on score
  let priority = 'Cold'
  const hotThreshold = rules[0]?.priority_range_hot || 40
  const warmMin = rules[0]?.priority_range_warm_min || 25

  if (totalScore >= hotThreshold) {
    priority = 'Hot'
  } else if (totalScore >= warmMin) {
    priority = 'Warm'
  }

  return {
    total_score: totalScore,
    priority,
    matched_rules: matchedRules,
    rules_evaluated: rules.length
  }
}

/**
 * POST /api/leads/calculate-score
 * Calculate score for a specific lead or lead data
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
    const { lead_id, lead_data, trigger_type } = body

    let leadToScore: any

    if (lead_id) {
      // Fetch lead from database
      const leadResult = await client.query('SELECT * FROM leads WHERE id = $1', [lead_id])
      if (leadResult.rows.length === 0) {
        return NextResponse.json({ error: 'Lead not found' }, { status: 404 })
      }
      leadToScore = leadResult.rows[0]
    } else if (lead_data) {
      // Use provided lead data
      leadToScore = lead_data
    } else {
      return NextResponse.json({ error: 'Either lead_id or lead_data is required' }, { status: 400 })
    }

    // Calculate score
    const triggerType = trigger_type || 'On Lead Create'
    const scoreResult = await calculateLeadScore(client, leadToScore, triggerType)

    // If lead_id provided, update the lead record
    if (lead_id) {
      await client.query(`
        UPDATE leads 
        SET lead_score = $1, lead_priority = $2, last_score_calculated = NOW()
        WHERE id = $3
      `, [scoreResult.total_score, scoreResult.priority, lead_id])
    }

    return NextResponse.json({
      success: true,
      lead_id: lead_id || null,
      ...scoreResult,
      calculated_at: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Score calculation error:', error)
    return NextResponse.json({
      error: 'Failed to calculate score',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/leads/calculate-score
 * Get scoring summary for leads
 */
export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    // Get score distribution
    const distributionResult = await client.query(`
      SELECT 
        lead_priority,
        COUNT(*) as count,
        AVG(lead_score) as avg_score,
        MAX(lead_score) as max_score,
        MIN(lead_score) as min_score
      FROM leads
      WHERE lead_score IS NOT NULL
      GROUP BY lead_priority
      ORDER BY 
        CASE lead_priority
          WHEN 'Hot' THEN 1
          WHEN 'Warm' THEN 2
          WHEN 'Cold' THEN 3
          ELSE 4
        END
    `)

    // Get lead type breakdown
    const typeBreakdown = await client.query(`
      SELECT 
        lead_type,
        lead_priority,
        COUNT(*) as count
      FROM leads
      WHERE lead_score IS NOT NULL
      GROUP BY lead_type, lead_priority
      ORDER BY lead_type, lead_priority
    `)

    // Get recent high-scoring leads
    const topLeads = await client.query(`
      SELECT id, name, email, phone, lead_score, lead_priority, lead_type
      FROM leads
      WHERE lead_score IS NOT NULL
      ORDER BY lead_score DESC
      LIMIT 10
    `)

    return NextResponse.json({
      score_distribution: distributionResult.rows.map(r => ({
        priority: r.lead_priority,
        count: parseInt(r.count),
        avg_score: parseFloat(r.avg_score).toFixed(2),
        max_score: parseInt(r.max_score),
        min_score: parseInt(r.min_score)
      })),
      type_breakdown: typeBreakdown.rows.map(r => ({
        lead_type: r.lead_type,
        priority: r.lead_priority,
        count: parseInt(r.count)
      })),
      top_leads: topLeads.rows
    })

  } catch (error: any) {
    console.error('Score summary error:', error)
    return NextResponse.json({
      error: 'Failed to get score summary',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

// Export the calculation function for reuse
export { calculateLeadScore, evaluateCondition }



