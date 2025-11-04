import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS pricing_tax_rules (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      rate_type TEXT NOT NULL,
      linked_module TEXT NOT NULL,
      markup_type TEXT NOT NULL,
      markup_value DECIMAL(10,2) DEFAULT 0,
      tax_type TEXT NOT NULL,
      tax_percentage DECIMAL(5,2) DEFAULT 0,
      calculation_formula TEXT DEFAULT '',
      season_start_date DATE,
      season_end_date DATE,
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS rate_type TEXT DEFAULT '';
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS linked_module TEXT DEFAULT '';
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS markup_type TEXT DEFAULT '';
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS markup_value DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS tax_type TEXT DEFAULT '';
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS tax_percentage DECIMAL(5,2) DEFAULT 0;
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS calculation_formula TEXT DEFAULT '';
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS season_start_date DATE;
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS season_end_date DATE;
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    ALTER TABLE pricing_tax_rules ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_pricing_tax_rules_name ON pricing_tax_rules(name);
    CREATE INDEX IF NOT EXISTS idx_pricing_tax_rules_linked_module ON pricing_tax_rules(linked_module);
    CREATE INDEX IF NOT EXISTS idx_pricing_tax_rules_status ON pricing_tax_rules(status);
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
      SELECT id, name, rate_type, linked_module, markup_type, markup_value, tax_type, tax_percentage,
             calculation_formula, season_start_date, season_end_date, notes, status,
             created_by, TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM pricing_tax_rules
      ORDER BY created_at DESC
    `)
    
    // Map DB columns to expected API shape
    const pricingRules = result.rows.map(r => ({
      id: r.id,
      name: r.name,
      rate_type: r.rate_type,
      linked_module: r.linked_module,
      markup_type: r.markup_type,
      markup_value: parseFloat(r.markup_value) || 0,
      tax_type: r.tax_type,
      tax_percentage: parseFloat(r.tax_percentage) || 0,
      calculation_formula: r.calculation_formula || '',
      season_start_date: r.season_start_date ? r.season_start_date.toISOString().split('T')[0] : null,
      season_end_date: r.season_end_date ? r.season_end_date.toISOString().split('T')[0] : null,
      notes: r.notes || '',
      status: r.status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ pricingRules })
  } catch (error: any) {
    console.error('PricingTaxRules GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
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
  } catch (error: any) {
    console.error('PricingTaxRules POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const name: string = body.name?.trim()
  if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 })
  if (!body.rateType && !body.rate_type) return NextResponse.json({ error: 'Rate type is required' }, { status: 400 })
  if (!body.linkedModule && !body.linked_module) return NextResponse.json({ error: 'Linked module is required' }, { status: 400 })
  if (!body.markupType && !body.markup_type) return NextResponse.json({ error: 'Markup type is required' }, { status: 400 })
  if (!body.taxType && !body.tax_type) return NextResponse.json({ error: 'Tax type is required' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      name,
      body.rateType || body.rate_type || '',
      body.linkedModule || body.linked_module || '',
      body.markupType || body.markup_type || '',
      Number(body.markupValue ?? body.markup_value ?? 0),
      body.taxType || body.tax_type || '',
      Number(body.taxPercentage ?? body.tax_percentage ?? 0),
      body.calculationFormula || body.calculation_formula || '',
      body.seasonStartDate || body.season_start_date || null,
      body.seasonEndDate || body.season_end_date || null,
      body.notes || '',
      body.status || 'Active'
    ]
    
    const insert = await client.query(
      `INSERT INTO pricing_tax_rules (
        name, rate_type, linked_module, markup_type, markup_value, tax_type, tax_percentage,
        calculation_formula, season_start_date, season_end_date, notes, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Pricing rule created' })
  } catch (error: any) {
    console.error('PricingTaxRules POST error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to create pricing rule' }, { status: 500 })
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
  } catch (error: any) {
    console.error('PricingTaxRules PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.name?.trim() || '',
      body.rateType || body.rate_type || '',
      body.linkedModule || body.linked_module || '',
      body.markupType || body.markup_type || '',
      Number(body.markupValue ?? body.markup_value ?? 0),
      body.taxType || body.tax_type || '',
      Number(body.taxPercentage ?? body.tax_percentage ?? 0),
      body.calculationFormula || body.calculation_formula || '',
      body.seasonStartDate || body.season_start_date || null,
      body.seasonEndDate || body.season_end_date || null,
      body.notes || '',
      body.status || 'Active',
      id
    ]
    
    await client.query(
      `UPDATE pricing_tax_rules SET 
         name = $1, rate_type = $2, linked_module = $3, markup_type = $4, markup_value = $5,
         tax_type = $6, tax_percentage = $7, calculation_formula = $8,
         season_start_date = $9, season_end_date = $10, notes = $11, status = $12,
         updated_at = NOW()
       WHERE id = $13`,
      values
    )
    return NextResponse.json({ message: 'Pricing rule updated' })
  } catch (error: any) {
    console.error('PricingTaxRules PUT error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to update pricing rule' }, { status: 500 })
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
    await client.query('DELETE FROM pricing_tax_rules WHERE id = $1', [id])
    return NextResponse.json({ message: 'Pricing rule deleted' })
  } catch (error: any) {
    console.error('PricingTaxRules DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

