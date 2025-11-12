import { NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * POST /api/utm-setup
 * Sets up UTM tracking fields in leads table and creates Uncategorized Source
 */
export async function POST() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    console.log('🚀 Setting up UTM tracking...')

    // Step 1: Add UTM fields to leads table
    await client.query(`
      ALTER TABLE leads 
        ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS utm_medium TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS utm_campaign TEXT DEFAULT '',
        ADD COLUMN IF NOT EXISTS lead_source_id INTEGER REFERENCES lead_source_detailed(id);
    `)
    console.log('✅ Added UTM fields to leads table')

    // Step 2: Create indexes for better query performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_leads_utm_source ON leads(utm_source);
      CREATE INDEX IF NOT EXISTS idx_leads_utm_campaign ON leads(utm_campaign);
      CREATE INDEX IF NOT EXISTS idx_leads_lead_source_id ON leads(lead_source_id);
    `)
    console.log('✅ Created UTM indexes')

    // Step 3: Ensure lead_source_detailed table exists
    await client.query(`
      CREATE TABLE IF NOT EXISTS lead_source_detailed (
        id SERIAL PRIMARY KEY,
        source_name TEXT NOT NULL UNIQUE,
        source_type TEXT NOT NULL,
        platform_channel TEXT NOT NULL,
        default_campaign_tag TEXT DEFAULT '',
        default_lead_type TEXT DEFAULT '',
        default_sales_team TEXT DEFAULT '',
        default_owner TEXT DEFAULT '',
        round_robin_active BOOLEAN DEFAULT FALSE,
        auto_whatsapp_template_id TEXT DEFAULT '',
        auto_email_template_id TEXT DEFAULT '',
        utm_source TEXT DEFAULT '',
        utm_medium TEXT DEFAULT '',
        utm_campaign TEXT DEFAULT '',
        avg_response_time_mins DECIMAL(10,2) DEFAULT 0,
        success_rate_percent DECIMAL(5,2) DEFAULT 0,
        avg_cpa DECIMAL(10,2) DEFAULT 0,
        status TEXT DEFAULT 'Active',
        notes TEXT DEFAULT '',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `)
    console.log('✅ Ensured lead_source_detailed table exists')

    // Step 4: Create "Uncategorized Source" if it doesn't exist
    const uncategorizedCheck = await client.query(`
      SELECT id FROM lead_source_detailed WHERE source_name = 'Uncategorized Source'
    `)

    if (uncategorizedCheck.rows.length === 0) {
      await client.query(`
        INSERT INTO lead_source_detailed (
          source_name, 
          source_type, 
          platform_channel, 
          utm_source,
          utm_medium,
          utm_campaign,
          notes,
          status
        ) VALUES (
          'Uncategorized Source',
          'Other',
          'Multiple',
          '',
          '',
          '',
          'Default source for leads with UTM parameters that do not match any configured source',
          'Active'
        )
      `)
      console.log('✅ Created Uncategorized Source')
    } else {
      console.log('ℹ️  Uncategorized Source already exists')
    }

    // Step 5: Get table structure to verify
    const structure = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'leads' 
      AND column_name IN ('utm_source', 'utm_medium', 'utm_campaign', 'lead_source_id')
      ORDER BY ordinal_position
    `)

    return NextResponse.json({
      success: true,
      message: 'UTM tracking setup completed successfully',
      columns_added: structure.rows,
      timestamp: new Date().toISOString()
    })

  } catch (error: unknown) {
    console.error('❌ Error setting up UTM tracking:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to setup UTM tracking', 
      details: message 
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/utm-setup
 * Check current UTM tracking setup status
 */
export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()

    // Check if UTM columns exist in leads table
    const leadsColumns = await client.query(`
      SELECT column_name, data_type, column_default
      FROM information_schema.columns
      WHERE table_name = 'leads' 
      AND column_name IN ('utm_source', 'utm_medium', 'utm_campaign', 'lead_source_id')
    `)

    // Check if Uncategorized Source exists
    const uncategorized = await client.query(`
      SELECT id, source_name, status
      FROM lead_source_detailed 
      WHERE source_name = 'Uncategorized Source'
    `)

    // Check indexes
    const indexes = await client.query(`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'leads'
      AND indexname LIKE '%utm%'
    `)

    return NextResponse.json({
      success: true,
      utm_fields_in_leads: leadsColumns.rows,
      uncategorized_source: uncategorized.rows[0] || null,
      utm_indexes: indexes.rows,
      setup_complete: leadsColumns.rows.length >= 4 && uncategorized.rows.length > 0
    })

  } catch (error: unknown) {
    console.error('❌ Error checking UTM setup:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to check UTM setup', 
      details: message 
    }, { status: 500 })
  } finally {
    await client.end()
  }
}





