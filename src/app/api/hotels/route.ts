import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { headers } from 'next/headers'

// GET all hotels
export async function GET(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're expecting JSON
  if (contentType && !contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create hotels table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS hotels (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        destination TEXT NOT NULL,
        category INTEGER DEFAULT 3,
        hotel_type TEXT DEFAULT 'Hotel',
        supplier_id INTEGER,
        price DECIMAL(10,2) DEFAULT 0,
        address TEXT,
        location TEXT DEFAULT '',
        phone TEXT,
        contact_person TEXT DEFAULT '',
        email TEXT,
        website TEXT DEFAULT '',
        map_link TEXT DEFAULT '',
        amenities TEXT[] DEFAULT '{}',
        meal_plan_options TEXT[] DEFAULT '{}',
        checkin_time TEXT DEFAULT '',
        checkout_time TEXT DEFAULT '',
        gallery TEXT[] DEFAULT '{}',
        notes TEXT DEFAULT '',
        icon_url TEXT,
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hotels_name ON hotels(name);
      CREATE INDEX IF NOT EXISTS idx_hotels_destination ON hotels(destination);
      CREATE INDEX IF NOT EXISTS idx_hotels_status ON hotels(status);
      CREATE INDEX IF NOT EXISTS idx_hotels_category ON hotels(category);
    `)
    // Add missing columns for existing tables (explicit IF NOT EXISTS statements)
    await client.query(`
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS hotel_type TEXT DEFAULT 'Hotel';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS supplier_id INTEGER;
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS location TEXT DEFAULT '';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS contact_person TEXT DEFAULT '';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS website TEXT DEFAULT '';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS map_link TEXT DEFAULT '';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS amenities TEXT[] DEFAULT '{}';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS meal_plan_options TEXT[] DEFAULT '{}';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkin_time TEXT DEFAULT '';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS checkout_time TEXT DEFAULT '';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS gallery TEXT[] DEFAULT '{}';
      ALTER TABLE hotels ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    `)
    // Create supplier_id index only if column exists
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name='hotels' AND column_name='supplier_id'
        ) THEN
          CREATE INDEX IF NOT EXISTS idx_hotels_supplier_id ON hotels(supplier_id);
        END IF;
      END $$;
    `)
    
    const result = await client.query(`
      SELECT id, name, destination, category, hotel_type, supplier_id, price, address, location, phone, contact_person, email,
             website, map_link, amenities, meal_plan_options, checkin_time, checkout_time, gallery, notes,
             icon_url, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM hotels
      ORDER BY created_at DESC
    `)
    
    return new NextResponse(
      JSON.stringify({ hotels: result.rows }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotels GET error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// POST create new hotel
export async function POST(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're receiving JSON
  if (!contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { name, destination, category, hotelType, supplierId, price, address, location, phone, contactPerson, email, website, mapLink, amenities, mealPlanOptions, checkinTime, checkoutTime, gallery, notes, iconUrl, status } = body
    
    if (!name || !destination) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel name and destination are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO hotels (
        name, destination, category, hotel_type, supplier_id, price, address, location, phone, contact_person, email,
        website, map_link, amenities, meal_plan_options, checkin_time, checkout_time, gallery, notes,
        icon_url, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
        $12, $13, $14, $15, $16, $17, $18, $19,
        $20, $21
      )
      RETURNING id, name, destination, category, hotel_type, supplier_id, price, address, location, phone, contact_person, email,
                website, map_link, amenities, meal_plan_options, checkin_time, checkout_time, gallery, notes,
                icon_url, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      name, destination, category || 3, hotelType || 'Hotel', supplierId || null, price || 0, address || '', location || '', phone || '', contactPerson || '', email || '',
      website || '', mapLink || '', Array.isArray(amenities) ? amenities : [], Array.isArray(mealPlanOptions) ? mealPlanOptions : [], checkinTime || '', checkoutTime || '', Array.isArray(gallery) ? gallery : [], notes || '',
      iconUrl || '', status || 'Active'
    ])
    
    return new NextResponse(
      JSON.stringify({
        hotel: result.rows[0],
        message: 'Hotel created successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotels POST error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// PUT update hotel
export async function PUT(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're receiving JSON
  if (!contentType.includes('application/json')) {
    return new NextResponse(
      JSON.stringify({ error: 'Invalid content type. Expected application/json' }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, name, destination, category, hotelType, supplierId, price, address, location, phone, contactPerson, email, website, mapLink, amenities, mealPlanOptions, checkinTime, checkoutTime, gallery, notes, iconUrl, status } = body
    
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    if (!name || !destination) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel name and destination are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE hotels 
      SET name = $1, destination = $2, category = $3, hotel_type = COALESCE($4, hotel_type), supplier_id = COALESCE($5, supplier_id), price = $6, 
          address = $7, location = COALESCE($8, location), phone = $9, contact_person = COALESCE($10, contact_person), email = $11, website = COALESCE($12, website), map_link = COALESCE($13, map_link),
          amenities = COALESCE($14, amenities), meal_plan_options = COALESCE($15, meal_plan_options), checkin_time = COALESCE($16, checkin_time), checkout_time = COALESCE($17, checkout_time),
          gallery = COALESCE($18, gallery), notes = COALESCE($19, notes), icon_url = $20, status = $21,
          updated_at = NOW()
      WHERE id = $22
      RETURNING id, name, destination, category, hotel_type, supplier_id, price, address, location, phone, contact_person, email,
                website, map_link, amenities, meal_plan_options, checkin_time, checkout_time, gallery, notes,
                icon_url, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      name, destination, category || 3, hotelType || null, supplierId || null, price || 0, 
      address || '', location || null, phone || '', contactPerson || null, email || '', website || null, mapLink || null,
      Array.isArray(amenities) ? amenities : null, Array.isArray(mealPlanOptions) ? mealPlanOptions : null, checkinTime || null, checkoutTime || null,
      Array.isArray(gallery) ? gallery : null, notes || null, iconUrl || '', status || 'Active', id
    ])
    
    if (result.rows.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({
        hotel: result.rows[0],
        message: 'Hotel updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotels PUT error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// DELETE hotel
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return new NextResponse(
      JSON.stringify({ error: 'Database not configured' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM hotels WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({ message: 'Hotel deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error) {
    console.error('Hotels DELETE error:', error)
    return new NextResponse(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error occurred' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

