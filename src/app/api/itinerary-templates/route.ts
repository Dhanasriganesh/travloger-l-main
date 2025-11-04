import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS itinerary_templates (
      id SERIAL PRIMARY KEY,
      package_name TEXT NOT NULL UNIQUE,
      destinations TEXT[] DEFAULT '{}',
      linked_theme_id INTEGER,
      day_itinerary_ids INTEGER[] DEFAULT '{}',
      base_price DECIMAL(10,2) DEFAULT 0,
      validity_start_date DATE,
      validity_end_date DATE,
      notes TEXT DEFAULT '',
      highlights TEXT[] DEFAULT '{}',
      images TEXT[] DEFAULT '{}',
      template_status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS destinations TEXT[] DEFAULT '{}';
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS linked_theme_id INTEGER;
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS day_itinerary_ids INTEGER[] DEFAULT '{}';
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS base_price DECIMAL(10,2) DEFAULT 0;
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS validity_start_date DATE;
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS validity_end_date DATE;
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS highlights TEXT[] DEFAULT '{}';
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS images TEXT[] DEFAULT '{}';
    ALTER TABLE itinerary_templates ADD COLUMN IF NOT EXISTS template_status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_itinerary_templates_package_name ON itinerary_templates(package_name);
    CREATE INDEX IF NOT EXISTS idx_itinerary_templates_theme ON itinerary_templates(linked_theme_id);
    CREATE INDEX IF NOT EXISTS idx_itinerary_templates_status ON itinerary_templates(template_status);
  `)
}

export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    // Fetch templates with theme names
    const result = await client.query(`
      SELECT 
        it.id, it.package_name, it.destinations, it.linked_theme_id, it.day_itinerary_ids,
        it.base_price, it.validity_start_date, it.validity_end_date, it.notes, it.highlights,
        it.images, it.template_status, it.created_by,
        TO_CHAR(it.created_at, 'DD-MM-YYYY') AS date, it.created_at, it.updated_at,
        pt.name AS linked_theme_name
      FROM itinerary_templates it
      LEFT JOIN package_themes pt ON it.linked_theme_id = pt.id
      ORDER BY it.created_at DESC
    `)
    
    // Map DB columns to expected API shape
    const templates = result.rows.map(r => ({
      id: r.id,
      package_name: r.package_name,
      destinations: r.destinations || [],
      linked_theme_id: r.linked_theme_id || null,
      linked_theme_name: r.linked_theme_name || null,
      day_itinerary_ids: r.day_itinerary_ids || [],
      base_price: parseFloat(r.base_price) || 0,
      validity_start_date: r.validity_start_date ? r.validity_start_date.toISOString().split('T')[0] : null,
      validity_end_date: r.validity_end_date ? r.validity_end_date.toISOString().split('T')[0] : null,
      notes: r.notes || '',
      highlights: r.highlights || [],
      images: r.images || [],
      template_status: r.template_status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ templates })
  } catch (error: any) {
    console.error('ItineraryTemplates GET error:', error)
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
    console.error('ItineraryTemplates POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const packageName: string = body.packageName?.trim() || body.package_name?.trim()
  if (!packageName) return NextResponse.json({ error: 'Package name is required' }, { status: 400 })
  if (!body.destinations || !Array.isArray(body.destinations) || body.destinations.length === 0) {
    return NextResponse.json({ error: 'At least one destination is required' }, { status: 400 })
  }
  if (!body.dayItineraryIds || !Array.isArray(body.dayItineraryIds) || body.dayItineraryIds.length === 0) {
    return NextResponse.json({ error: 'At least one day itinerary is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      packageName,
      body.destinations || [],
      body.linkedThemeId || body.linked_theme_id || null,
      body.dayItineraryIds || body.day_itinerary_ids || [],
      Number(body.basePrice ?? body.base_price ?? 0),
      body.validityStartDate || body.validity_start_date || null,
      body.validityEndDate || body.validity_end_date || null,
      body.notes || '',
      body.highlights || [],
      body.images || [],
      body.templateStatus || body.template_status || 'Active'
    ]
    
    const insert = await client.query(
      `INSERT INTO itinerary_templates (
        package_name, destinations, linked_theme_id, day_itinerary_ids, base_price,
        validity_start_date, validity_end_date, notes, highlights, images, template_status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Itinerary template created' })
  } catch (error: any) {
    console.error('ItineraryTemplates POST error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to create itinerary template' }, { status: 500 })
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
    console.error('ItineraryTemplates PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.packageName?.trim() || body.package_name?.trim() || '',
      body.destinations || [],
      body.linkedThemeId || body.linked_theme_id || null,
      body.dayItineraryIds || body.day_itinerary_ids || [],
      Number(body.basePrice ?? body.base_price ?? 0),
      body.validityStartDate || body.validity_start_date || null,
      body.validityEndDate || body.validity_end_date || null,
      body.notes || '',
      body.highlights || [],
      body.images || [],
      body.templateStatus || body.template_status || 'Active',
      id
    ]
    
    await client.query(
      `UPDATE itinerary_templates SET 
         package_name = $1, destinations = $2, linked_theme_id = $3, day_itinerary_ids = $4,
         base_price = $5, validity_start_date = $6, validity_end_date = $7, notes = $8,
         highlights = $9, images = $10, template_status = $11,
         updated_at = NOW()
       WHERE id = $12`,
      values
    )
    return NextResponse.json({ message: 'Itinerary template updated' })
  } catch (error: any) {
    console.error('ItineraryTemplates PUT error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to update itinerary template' }, { status: 500 })
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
    await client.query('DELETE FROM itinerary_templates WHERE id = $1', [id])
    return NextResponse.json({ message: 'Itinerary template deleted' })
  } catch (error: any) {
    console.error('ItineraryTemplates DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

