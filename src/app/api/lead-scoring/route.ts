import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * Ensure the lead_scoring_master table exists
 */
async function ensureTable(client: Client) {
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'lead_scoring_master'
    )
  `)
  
  if (!tableCheck.rows[0].exists) {
    await client.query(`
      CREATE TABLE lead_scoring_master (
        id SERIAL PRIMARY KEY,
        scoring_criteria_name VARCHAR(255) NOT NULL,
        field_checked VARCHAR(100) NOT NULL,
        condition_type VARCHAR(50) NOT NULL,
        condition_value VARCHAR(255),
        score_value INTEGER NOT NULL DEFAULT 0,
        lead_type VARCHAR(50),
        automation_trigger VARCHAR(50) DEFAULT 'On Lead Create',
        priority_range_hot INTEGER DEFAULT 40,
        priority_range_warm_min INTEGER DEFAULT 25,
        priority_range_warm_max INTEGER DEFAULT 39,
        priority_range_cold_max INTEGER DEFAULT 24,
        status VARCHAR(20) DEFAULT 'Active',
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
  }
}

/**
 * GET /api/lead-scoring
 * Fetch all scoring rules
 */
export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const leadType = searchParams.get('lead_type')
    const status = searchParams.get('status') || 'Active'

    let query = `
      SELECT 
        id, scoring_criteria_name, field_checked, condition_type, condition_value,
        score_value, lead_type, automation_trigger, priority_range_hot,
        priority_range_warm_min, priority_range_warm_max, priority_range_cold_max,
        status, notes, created_by,
        TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM lead_scoring_master
      WHERE status = $1
    `
    const params: any[] = [status]

    if (leadType) {
      query += ` AND lead_type = $2`
      params.push(leadType)
    }

    query += ` ORDER BY lead_type, score_value DESC, scoring_criteria_name ASC`

    const result = await client.query(query, params)

    const scoringRules = result.rows.map(r => ({
      id: r.id,
      scoring_criteria_name: r.scoring_criteria_name,
      field_checked: r.field_checked,
      condition_type: r.condition_type,
      condition_value: r.condition_value || '',
      score_value: parseInt(r.score_value) || 0,
      lead_type: r.lead_type || '',
      automation_trigger: r.automation_trigger || 'On Lead Create',
      priority_range_hot: parseInt(r.priority_range_hot) || 40,
      priority_range_warm_min: parseInt(r.priority_range_warm_min) || 25,
      priority_range_warm_max: parseInt(r.priority_range_warm_max) || 39,
      priority_range_cold_max: parseInt(r.priority_range_cold_max) || 24,
      status: r.status || 'Active',
      notes: r.notes || '',
      created_by: r.created_by,
      date: r.date
    }))

    return NextResponse.json({ scoringRules })

  } catch (error: unknown) {
    console.error('LeadScoring GET error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch scoring rules', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * POST /api/lead-scoring
 * Create a new scoring rule
 */
export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const {
      scoring_criteria_name,
      field_checked,
      condition_type,
      condition_value,
      score_value,
      lead_type,
      automation_trigger,
      priority_range_hot,
      priority_range_warm_min,
      priority_range_warm_max,
      priority_range_cold_max,
      status,
      notes,
      created_by
    } = body

    if (!scoring_criteria_name || !field_checked || !condition_type || score_value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const result = await client.query(`
      INSERT INTO lead_scoring_master 
        (scoring_criteria_name, field_checked, condition_type, condition_value, score_value,
         lead_type, automation_trigger, priority_range_hot, priority_range_warm_min,
         priority_range_warm_max, priority_range_cold_max, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *
    `, [
      scoring_criteria_name,
      field_checked,
      condition_type,
      condition_value || '',
      score_value,
      lead_type || '',
      automation_trigger || 'On Lead Create',
      priority_range_hot || 40,
      priority_range_warm_min || 25,
      priority_range_warm_max || 39,
      priority_range_cold_max || 24,
      status || 'Active',
      notes || '',
      created_by || 'System'
    ])

    return NextResponse.json({
      success: true,
      scoringRule: result.rows[0],
      message: 'Scoring rule created successfully'
    })

  } catch (error: unknown) {
    console.error('LeadScoring POST error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create scoring rule', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * PUT /api/lead-scoring
 * Update an existing scoring rule
 */
export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Scoring rule ID is required' }, { status: 400 })
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    const allowedFields = [
      'scoring_criteria_name', 'field_checked', 'condition_type', 'condition_value',
      'score_value', 'lead_type', 'automation_trigger', 'priority_range_hot',
      'priority_range_warm_min', 'priority_range_warm_max', 'priority_range_cold_max',
      'status', 'notes'
    ]

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        updateFields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    // Add updated_at
    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const query = `
      UPDATE lead_scoring_master 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await client.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Scoring rule not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      scoringRule: result.rows[0],
      message: 'Scoring rule updated successfully'
    })

  } catch (error: unknown) {
    console.error('LeadScoring PUT error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update scoring rule', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * DELETE /api/lead-scoring
 * Delete a scoring rule (soft delete by setting status to 'Inactive')
 */
export async function DELETE(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Scoring rule ID is required' }, { status: 400 })
    }

    // Soft delete by setting status to Inactive
    const result = await client.query(`
      UPDATE lead_scoring_master 
      SET status = 'Inactive', updated_at = NOW()
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Scoring rule not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Scoring rule deleted successfully'
    })

  } catch (error: unknown) {
    console.error('LeadScoring DELETE error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete scoring rule', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}



