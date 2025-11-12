import { NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * POST /api/lead-scoring-setup
 * Creates lead_scoring_master table and adds scoring fields to leads table
 */
export async function POST() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    // 1. Create lead_scoring_master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_scoring_master (
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

    // 2. Add scoring fields to leads table (if not exists)
    const columnsToAdd = [
      { name: 'lead_score', type: 'INTEGER DEFAULT 0' },
      { name: 'lead_priority', type: 'VARCHAR(20) DEFAULT \'Cold\'' },
      { name: 'last_score_calculated', type: 'TIMESTAMP' },
      { name: 'response_time_hours', type: 'INTEGER' },
      { name: 'itinerary_created_hours', type: 'INTEGER' },
      { name: 'budget_per_person', type: 'NUMERIC(10,2)' },
      { name: 'travel_date', type: 'DATE' },
      { name: 'lead_type', type: 'VARCHAR(50)' },
      { name: 'budget', type: 'NUMERIC(10,2)' }
    ]

    const addedColumns = []
    for (const col of columnsToAdd) {
      try {
        await client.query(`
          ALTER TABLE leads 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `)
        addedColumns.push(col.name)
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.error(`Error adding column ${col.name}:`, err)
        }
      }
    }

    // 3. Create automation_log table for tracking actions
    await client.query(`
      CREATE TABLE IF NOT EXISTS automation_log (
        id SERIAL PRIMARY KEY,
        lead_id INTEGER,
        action_type VARCHAR(100),
        status VARCHAR(50),
        message TEXT,
        priority VARCHAR(20),
        metadata JSONB,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 4. Create indexes for performance
    try {
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_leads_score_priority 
        ON leads(lead_score DESC, lead_priority)
      `)
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_scoring_rules_active 
        ON lead_scoring_master(status, lead_type)
      `)
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_automation_log_lead 
        ON automation_log(lead_id, created_at DESC)
      `)
    } catch (err) {
      console.error('Error creating indexes:', err)
    }

    // 4. Insert default scoring rules for Group Leads (matching exact requirements)
    await client.query(`
      INSERT INTO lead_scoring_master 
        (scoring_criteria_name, field_checked, condition_type, condition_value, score_value, lead_type, automation_trigger, status, notes)
      VALUES
        ('Group - Travel Within 30 Days', 'travel_date', 'within_days', '30', 20, 'Group', 'On Lead Create', 'Active', 'Travel Date within 30 days'),
        ('Group - Group Size 4-8 Travelers', 'number_of_travelers', 'between', '4,8', 10, 'Group', 'On Lead Create', 'Active', 'Medium group size'),
        ('Group - Group Size More Than 8 Travelers', 'number_of_travelers', 'greater_than', '8', 15, 'Group', 'On Lead Create', 'Active', 'Large group size'),
        ('Group - Budget Above ₹10,000 Per Person', 'budget_per_person', 'greater_than_or_equal', '10000', 10, 'Group', 'On Lead Create', 'Active', 'High budget per person'),
        ('Group - Destination Matches Active Campaign', 'destination', 'matches_campaign', '', 5, 'Group', 'On Lead Create', 'Active', 'Matches active group campaign'),
        ('Group - Response Time Within 12 Hours', 'response_time_hours', 'less_than_or_equal', '12', 10, 'Group', 'On Lead Update', 'Active', 'Quick response from lead')
      ON CONFLICT DO NOTHING
    `)

    // 5. Insert default scoring rules for FIT Leads (matching exact requirements)
    await client.query(`
      INSERT INTO lead_scoring_master 
        (scoring_criteria_name, field_checked, condition_type, condition_value, score_value, lead_type, automation_trigger, status, notes)
      VALUES
        ('FIT - Travel Month Within 45 Days', 'travel_date', 'within_days', '45', 20, 'FIT', 'On Lead Create', 'Active', 'Travel within 45 days'),
        ('FIT - Budget Above ₹40,000 Total', 'budget', 'greater_than_or_equal', '40000', 10, 'FIT', 'On Lead Create', 'Active', 'Budget above ₹40,000'),
        ('FIT - Pax 2-4 Travelers', 'number_of_travelers', 'between', '2,4', 5, 'FIT', 'On Lead Create', 'Active', '2-4 travelers'),
        ('FIT - Destination Part of High-Inquiry List', 'destination', 'high_inquiry_fit', '', 5, 'FIT', 'On Lead Create', 'Active', 'Part of high-inquiry FIT list'),
        ('FIT - Response Time Within 6 Hours', 'response_time_hours', 'less_than_or_equal', '6', 10, 'FIT', 'On Lead Update', 'Active', 'Replied within 6 hours'),
        ('FIT - Itinerary Created Within 24 Hours', 'itinerary_created_hours', 'less_than_or_equal', '24', 10, 'FIT', 'On Lead Update', 'Active', 'Itinerary requested within 24 hours of enquiry')
      ON CONFLICT DO NOTHING
    `)

    // 6. Insert default scoring rules for Corporate Leads
    await client.query(`
      INSERT INTO lead_scoring_master 
        (scoring_criteria_name, field_checked, condition_type, condition_value, score_value, lead_type, automation_trigger, status, notes)
      VALUES
        ('Corporate - Budget Over 10 Lakhs', 'budget', 'greater_than_or_equal', '1000000', 20, 'Corporate', 'On Lead Create', 'Active', 'Large corporate booking'),
        ('Corporate - 15+ Travelers', 'number_of_travelers', 'greater_than_or_equal', '15', 15, 'Corporate', 'On Lead Create', 'Active', 'Big corporate group'),
        ('Corporate - Company Email Domain', 'email', 'not_contains', 'gmail|yahoo|hotmail|outlook', 10, 'Corporate', 'On Lead Create', 'Active', 'Business email verification'),
        ('Corporate - Travel Within 45 Days', 'travel_date', 'within_days', '45', 10, 'Corporate', 'On Lead Create', 'Active', 'Corporate planning timeline')
      ON CONFLICT DO NOTHING
    `)

    return NextResponse.json({
      success: true,
      message: 'Lead Scoring Master setup completed successfully',
      columns_added: addedColumns,
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Lead Scoring Setup Error:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/lead-scoring-setup
 * Check current setup status
 */
export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'lead_scoring_master'
      )
    `)

    // Check scoring fields in leads table
    const columnsCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'leads' 
      AND column_name IN ('lead_score', 'lead_priority', 'last_score_calculated')
    `)

    // Count scoring rules
    let rulesCount = { total: 0, group: 0, fit: 0, corporate: 0 }
    if (tableCheck.rows[0].exists) {
      const countResult = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE lead_type = 'Group') as group_count,
          COUNT(*) FILTER (WHERE lead_type = 'FIT') as fit_count,
          COUNT(*) FILTER (WHERE lead_type = 'Corporate') as corporate_count
        FROM lead_scoring_master
        WHERE status = 'Active'
      `)
      rulesCount = {
        total: parseInt(countResult.rows[0].total),
        group: parseInt(countResult.rows[0].group_count),
        fit: parseInt(countResult.rows[0].fit_count),
        corporate: parseInt(countResult.rows[0].corporate_count)
      }
    }

    return NextResponse.json({
      table_exists: tableCheck.rows[0].exists,
      scoring_fields_in_leads: columnsCheck.rows.map(r => r.column_name),
      rules_count: rulesCount,
      setup_complete: tableCheck.rows[0].exists && columnsCheck.rows.length === 3
    })

  } catch (error: any) {
    console.error('Setup check error:', error)
    return NextResponse.json({
      error: 'Check failed',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

