import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create lead_type_master table
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
  
  // Add columns for legacy tables
  await client.query(`
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS lead_type_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS code TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS default_destination_handling TEXT DEFAULT 'Flexible';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS default_sales_team TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS default_owner TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS default_workflow_name TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS default_whatsapp_template_id TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS default_email_template_id TEXT DEFAULT '';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS followup_rule_days INTEGER DEFAULT 3;
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
    ALTER TABLE lead_type_master ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
  `)
  
  // Create indexes
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_lead_type_master_name ON lead_type_master(lead_type_name);
    CREATE INDEX IF NOT EXISTS idx_lead_type_master_code ON lead_type_master(code);
    CREATE INDEX IF NOT EXISTS idx_lead_type_master_status ON lead_type_master(status);
  `)
  
  // Insert default lead types if table is empty
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
  }
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
        id, lead_type_name, code, description, default_destination_handling,
        default_sales_team, default_owner, default_workflow_name,
        default_whatsapp_template_id, default_email_template_id,
        followup_rule_days, status, notes, created_by,
        TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM lead_type_master
      WHERE status = 'Active'
      ORDER BY 
        CASE lead_type_name
          WHEN 'Group Trip' THEN 1
          WHEN 'FIT (Custom Trip)' THEN 2
          WHEN 'Corporate' THEN 3
          ELSE 4
        END,
        lead_type_name ASC
    `)
    
    const leadTypes = result.rows.map(r => ({
      id: r.id,
      lead_type_name: r.lead_type_name,
      code: r.code || '',
      description: r.description || '',
      default_destination_handling: r.default_destination_handling || 'Flexible',
      default_sales_team: r.default_sales_team || '',
      default_owner: r.default_owner || '',
      default_workflow_name: r.default_workflow_name || '',
      default_whatsapp_template_id: r.default_whatsapp_template_id || '',
      default_email_template_id: r.default_email_template_id || '',
      followup_rule_days: parseInt(r.followup_rule_days) || 3,
      status: r.status || 'Active',
      notes: r.notes || '',
      created_by: r.created_by,
      date: r.date
    }))
    
    return NextResponse.json({ leadTypes })
  } catch (error: unknown) {
    console.error('LeadTypes GET error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
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
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const leadTypeName = body.leadTypeName?.trim() || body.lead_type_name?.trim()
  if (!leadTypeName) {
    return NextResponse.json({ error: 'Lead type name is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      leadTypeName,
      body.code?.trim() || '',
      body.description?.trim() || '',
      body.defaultDestinationHandling || body.default_destination_handling || 'Flexible',
      body.defaultSalesTeam?.trim() || body.default_sales_team?.trim() || '',
      body.defaultOwner?.trim() || body.default_owner?.trim() || '',
      body.defaultWorkflowName?.trim() || body.default_workflow_name?.trim() || '',
      body.defaultWhatsappTemplateId?.trim() || body.default_whatsapp_template_id?.trim() || '',
      body.defaultEmailTemplateId?.trim() || body.default_email_template_id?.trim() || '',
      parseInt(body.followupRuleDays || body.followup_rule_days || 3),
      body.status || 'Active',
      body.notes?.trim() || ''
    ]
    
    const insert = await client.query(
      `INSERT INTO lead_type_master (
        lead_type_name, code, description, default_destination_handling,
        default_sales_team, default_owner, default_workflow_name,
        default_whatsapp_template_id, default_email_template_id,
        followup_rule_days, status, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      values
    )
    
    return NextResponse.json({ id: insert.rows[0].id, message: 'Lead type created' })
  } catch (error: unknown) {
    console.error('LeadTypes POST error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    
    const updates: string[] = []
    const values: any[] = []
    let paramIndex = 1

    if (body.leadTypeName || body.lead_type_name) {
      updates.push(`lead_type_name = $${paramIndex}`)
      values.push(body.leadTypeName?.trim() || body.lead_type_name?.trim())
      paramIndex++
    }
    if (body.code !== undefined) {
      updates.push(`code = $${paramIndex}`)
      values.push(body.code?.trim() || '')
      paramIndex++
    }
    if (body.description !== undefined) {
      updates.push(`description = $${paramIndex}`)
      values.push(body.description?.trim() || '')
      paramIndex++
    }
    if (body.defaultDestinationHandling || body.default_destination_handling) {
      updates.push(`default_destination_handling = $${paramIndex}`)
      values.push(body.defaultDestinationHandling || body.default_destination_handling)
      paramIndex++
    }
    if (body.defaultSalesTeam !== undefined || body.default_sales_team !== undefined) {
      updates.push(`default_sales_team = $${paramIndex}`)
      values.push(body.defaultSalesTeam?.trim() || body.default_sales_team?.trim() || '')
      paramIndex++
    }
    if (body.defaultOwner !== undefined || body.default_owner !== undefined) {
      updates.push(`default_owner = $${paramIndex}`)
      values.push(body.defaultOwner?.trim() || body.default_owner?.trim() || '')
      paramIndex++
    }
    if (body.defaultWorkflowName !== undefined || body.default_workflow_name !== undefined) {
      updates.push(`default_workflow_name = $${paramIndex}`)
      values.push(body.defaultWorkflowName?.trim() || body.default_workflow_name?.trim() || '')
      paramIndex++
    }
    if (body.defaultWhatsappTemplateId !== undefined || body.default_whatsapp_template_id !== undefined) {
      updates.push(`default_whatsapp_template_id = $${paramIndex}`)
      values.push(body.defaultWhatsappTemplateId?.trim() || body.default_whatsapp_template_id?.trim() || '')
      paramIndex++
    }
    if (body.defaultEmailTemplateId !== undefined || body.default_email_template_id !== undefined) {
      updates.push(`default_email_template_id = $${paramIndex}`)
      values.push(body.defaultEmailTemplateId?.trim() || body.default_email_template_id?.trim() || '')
      paramIndex++
    }
    if (body.followupRuleDays !== undefined || body.followup_rule_days !== undefined) {
      updates.push(`followup_rule_days = $${paramIndex}`)
      values.push(parseInt(body.followupRuleDays || body.followup_rule_days || 3))
      paramIndex++
    }
    if (body.status !== undefined) {
      updates.push(`status = $${paramIndex}`)
      values.push(body.status)
      paramIndex++
    }
    if (body.notes !== undefined) {
      updates.push(`notes = $${paramIndex}`)
      values.push(body.notes?.trim() || '')
      paramIndex++
    }

    if (updates.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 })
    }

    updates.push(`updated_at = NOW()`)
    values.push(id)

    await client.query(
      `UPDATE lead_type_master SET ${updates.join(', ')} WHERE id = $${paramIndex}`,
      values
    )
    
    return NextResponse.json({ message: 'Lead type updated' })
  } catch (error: unknown) {
    console.error('LeadTypes PUT error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function DELETE(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const id = searchParams.get('id')
  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    
    // Soft delete by setting status to Inactive
    await client.query(
      `UPDATE lead_type_master SET status = 'Inactive', updated_at = NOW() WHERE id = $1`,
      [id]
    )
    
    return NextResponse.json({ message: 'Lead type deleted (set to Inactive)' })
  } catch (error: unknown) {
    console.error('LeadTypes DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: message }, { status: 500 })
  } finally {
    await client.end()
  }
}



