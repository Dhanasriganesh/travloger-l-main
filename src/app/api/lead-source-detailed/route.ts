import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { getErrorMessage } from '@/app/api/utils/error'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
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
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS source_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS source_type TEXT NOT NULL DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS platform_channel TEXT NOT NULL DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS default_campaign_tag TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS default_lead_type TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS default_sales_team TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS default_owner TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS round_robin_active BOOLEAN DEFAULT FALSE;
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS auto_whatsapp_template_id TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS auto_email_template_id TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS utm_source TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS utm_medium TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS utm_campaign TEXT DEFAULT '';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS avg_response_time_mins DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS success_rate_percent DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS avg_cpa DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
    ALTER TABLE lead_source_detailed ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_lead_source_detailed_source_name ON lead_source_detailed(source_name);
    CREATE INDEX IF NOT EXISTS idx_lead_source_detailed_source_type ON lead_source_detailed(source_type);
    CREATE INDEX IF NOT EXISTS idx_lead_source_detailed_status ON lead_source_detailed(status);
  `)
}

export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const result = await client.query(`
      SELECT 
        id, source_name, source_type, platform_channel, default_campaign_tag,
        default_lead_type, default_sales_team, default_owner, round_robin_active,
        auto_whatsapp_template_id, auto_email_template_id, utm_source, utm_medium,
        utm_campaign, avg_response_time_mins, success_rate_percent, avg_cpa,
        status, notes, created_by,
        TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM lead_source_detailed
      ORDER BY created_at DESC
    `)
    
    const leadSources = result.rows.map(r => ({
      id: r.id,
      source_name: r.source_name,
      source_type: r.source_type,
      platform_channel: r.platform_channel,
      default_campaign_tag: r.default_campaign_tag || '',
      default_lead_type: r.default_lead_type || '',
      default_sales_team: r.default_sales_team || '',
      default_owner: r.default_owner || '',
      round_robin_active: r.round_robin_active || false,
      auto_whatsapp_template_id: r.auto_whatsapp_template_id || '',
      auto_email_template_id: r.auto_email_template_id || '',
      utm_source: r.utm_source || '',
      utm_medium: r.utm_medium || '',
      utm_campaign: r.utm_campaign || '',
      avg_response_time_mins: parseFloat(r.avg_response_time_mins) || 0,
      success_rate_percent: parseFloat(r.success_rate_percent) || 0,
      avg_cpa: parseFloat(r.avg_cpa) || 0,
      status: r.status || 'Active',
      notes: r.notes || '',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ leadSources })
  } catch (error: unknown) {
    console.error('LeadSourceDetailed GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  
  let body
  try {
    body = await request.json()
  } catch (error: unknown) {
    console.error('LeadSourceDetailed POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const sourceName: string = body.sourceName?.trim() || body.source_name?.trim() || ''
  if (!sourceName) return NextResponse.json({ error: 'Source name is required' }, { status: 400 })
  if (!body.sourceType && !body.source_type) {
    return NextResponse.json({ error: 'Source type is required' }, { status: 400 })
  }
  if (!body.platformChannel && !body.platform_channel) {
    return NextResponse.json({ error: 'Platform/channel is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      sourceName,
      body.sourceType || body.source_type || '',
      body.platformChannel || body.platform_channel || '',
      body.defaultCampaignTag?.trim() || body.default_campaign_tag?.trim() || '',
      body.defaultLeadType || body.default_lead_type || '',
      body.defaultSalesTeam?.trim() || body.default_sales_team?.trim() || '',
      body.defaultOwner?.trim() || body.default_owner?.trim() || '',
      body.roundRobinActive !== undefined ? body.roundRobinActive : (body.round_robin_active || false),
      body.autoWhatsappTemplateId?.trim() || body.auto_whatsapp_template_id?.trim() || '',
      body.autoEmailTemplateId?.trim() || body.auto_email_template_id?.trim() || '',
      body.utmSource?.trim() || body.utm_source?.trim() || '',
      body.utmMedium?.trim() || body.utm_medium?.trim() || '',
      body.utmCampaign?.trim() || body.utm_campaign?.trim() || '',
      Number(body.avgResponseTimeMins ?? body.avg_response_time_mins ?? 0),
      Number(body.successRatePercent ?? body.success_rate_percent ?? 0),
      Number(body.avgCpa ?? body.avg_cpa ?? 0),
      body.status || 'Active',
      body.notes?.trim() || ''
    ]
    
    const insert = await client.query(
      `INSERT INTO lead_source_detailed (
        source_name, source_type, platform_channel, default_campaign_tag,
        default_lead_type, default_sales_team, default_owner, round_robin_active,
        auto_whatsapp_template_id, auto_email_template_id, utm_source, utm_medium,
        utm_campaign, avg_response_time_mins, success_rate_percent, avg_cpa,
        status, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Lead source created' })
  } catch (error: unknown) {
    console.error('LeadSourceDetailed POST error:', error)
    const message = getErrorMessage(error)
    const errorObject = (typeof error === 'object' && error !== null) ? error as Record<string, unknown> : {}
    console.error('Error details:', {
      message,
      code: errorObject.code,
      detail: errorObject.detail,
      hint: errorObject.hint
    })
    if ((errorObject.code as string | undefined) === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Source name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: message || 'Failed to create lead source' }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  
  let body
  try {
    body = await request.json()
  } catch (error: unknown) {
    console.error('LeadSourceDetailed PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.sourceName?.trim() || body.source_name?.trim() || '',
      body.sourceType || body.source_type || '',
      body.platformChannel?.trim() || body.platform_channel?.trim() || '',
      body.defaultCampaignTag?.trim() || body.default_campaign_tag?.trim() || '',
      body.defaultLeadType || body.default_lead_type || '',
      body.defaultSalesTeam?.trim() || body.default_sales_team?.trim() || '',
      body.defaultOwner?.trim() || body.default_owner?.trim() || '',
      body.roundRobinActive !== undefined ? body.roundRobinActive : (body.round_robin_active || false),
      body.autoWhatsappTemplateId?.trim() || body.auto_whatsapp_template_id?.trim() || '',
      body.autoEmailTemplateId?.trim() || body.auto_email_template_id?.trim() || '',
      body.utmSource?.trim() || body.utm_source?.trim() || '',
      body.utmMedium?.trim() || body.utm_medium?.trim() || '',
      body.utmCampaign?.trim() || body.utm_campaign?.trim() || '',
      Number(body.avgResponseTimeMins ?? body.avg_response_time_mins ?? 0),
      Number(body.successRatePercent ?? body.success_rate_percent ?? 0),
      Number(body.avgCpa ?? body.avg_cpa ?? 0),
      body.status || 'Active',
      body.notes?.trim() || '',
      id
    ]
    
    await client.query(
      `UPDATE lead_source_detailed SET 
         source_name = $1, source_type = $2, platform_channel = $3, default_campaign_tag = $4,
         default_lead_type = $5, default_sales_team = $6, default_owner = $7, round_robin_active = $8,
         auto_whatsapp_template_id = $9, auto_email_template_id = $10, utm_source = $11, utm_medium = $12,
         utm_campaign = $13, avg_response_time_mins = $14, success_rate_percent = $15, avg_cpa = $16,
         status = $17, notes = $18,
         updated_at = NOW()
       WHERE id = $19`,
      values
    )
    return NextResponse.json({ message: 'Lead source updated' })
  } catch (error: unknown) {
    console.error('LeadSourceDetailed PUT error:', error)
    const message = getErrorMessage(error)
    const errorObject = (typeof error === 'object' && error !== null) ? error as Record<string, unknown> : {}
    console.error('Error details:', {
      message,
      code: errorObject.code,
      detail: errorObject.detail,
      hint: errorObject.hint
    })
    if ((errorObject.code as string | undefined) === '23505') { // Unique constraint violation
      return NextResponse.json({ error: 'Source name already exists' }, { status: 400 })
    }
    return NextResponse.json({ error: message || 'Failed to update lead source' }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function DELETE(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  const { searchParams } = new URL(request.url)
  const id = Number(searchParams.get('id'))
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    await client.query('DELETE FROM lead_source_detailed WHERE id = $1', [id])
    return NextResponse.json({ message: 'Lead source deleted' })
  } catch (error: unknown) {
    console.error('LeadSourceDetailed DELETE error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

