import { NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * POST /api/lead-type-setup
 * Sets up Lead Type Master and adds lead_type_id to leads table
 */
export async function POST() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    console.log('🚀 Setting up Lead Type Master...')

    // Step 1: Create lead_type_master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_type_master (
        id SERIAL PRIMARY KEY,
        lead_type_name TEXT NOT NULL UNIQUE,
        code TEXT DEFAULT '',
        description TEXT DEFAULT '',
        default_destination_handling TEXT DEFAULT 'Flexible',
        default_sales_team TEXT DEFAULT '',
        default_owner TEXT DEFAULT '',
        default_workflow_name TEXT DEFAULT '',
        default_whatsapp_template_id TEXT DEFAULT '',
        default_email_template_id TEXT DEFAULT '',
        followup_rule_days INTEGER DEFAULT 3,
        status TEXT DEFAULT 'Active',
        notes TEXT DEFAULT '',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log('✅ Lead Type Master table created')

    // Step 2: Create indexes
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_lead_type_master_name ON lead_type_master(lead_type_name);
      CREATE INDEX IF NOT EXISTS idx_lead_type_master_code ON lead_type_master(code);
      CREATE INDEX IF NOT EXISTS idx_lead_type_master_status ON lead_type_master(status);
    `)
    console.log('✅ Created indexes')

    // Step 3: Insert default lead types if table is empty
    const count = await client.query(`SELECT COUNT(*) as count FROM lead_type_master`)
    if (parseInt(count.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO lead_type_master (
          lead_type_name, code, description, default_destination_handling,
          default_workflow_name, followup_rule_days, status
        ) VALUES
        (
          'Group Trip',
          'GROUP',
          'Fixed departure group tours with set itinerary and dates',
          'Fixed',
          'Group Tour Workflow',
          2,
          'Active'
        ),
        (
          'FIT (Custom Trip)',
          'FIT',
          'Fully Independent Traveler - Customized itinerary per customer requirement',
          'Flexible',
          'Custom Tour Workflow',
          3,
          'Active'
        ),
        (
          'Corporate',
          'CORP',
          'Corporate bookings, MICE, team outings, and business travel',
          'Flexible',
          'Corporate Workflow',
          1,
          'Active'
        )
      `)
      console.log('✅ Inserted default lead types')
    }

    // Step 4: Add lead_type_id to leads table
    await client.query(`
      ALTER TABLE leads 
      ADD COLUMN IF NOT EXISTS lead_type_id INTEGER REFERENCES lead_type_master(id);
    `)
    console.log('✅ Added lead_type_id to leads table')

    // Step 5: Create index on lead_type_id
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_lead_type_id ON leads(lead_type_id);
    `)
    console.log('✅ Created index on lead_type_id')

    // Step 6: Get table structure to verify
    const structure = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'leads' 
      AND column_name = 'lead_type_id'
    `)

    return NextResponse.json({
      success: true,
      message: 'Lead Type Master setup completed successfully',
      column_added: structure.rows[0] || null,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ Error setting up Lead Type Master:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to setup Lead Type Master', 
      details: message 
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/lead-type-setup
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

    // Check if lead_type_id column exists in leads table
    const leadsColumn = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'leads' 
      AND column_name = 'lead_type_id'
    `)

    // Check if lead_type_master table exists and has data
    const tableCheck = await client.query(`
      SELECT COUNT(*) as count
      FROM lead_type_master
    `)

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'lead_type_master'
    `)

    return NextResponse.json({
      success: true,
      lead_type_id_in_leads: leadsColumn.rows[0] || null,
      lead_type_master_count: parseInt(tableCheck.rows[0].count) || 0,
      indexes: indexes.rows,
      setup_complete: leadsColumn.rows.length > 0 && parseInt(tableCheck.rows[0].count) > 0
    })

  } catch (error: unknown) {
    console.error('❌ Error checking setup:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to check setup', 
      details: message 
    }, { status: 500 })
  } finally {
    await client.end()
  }
}



