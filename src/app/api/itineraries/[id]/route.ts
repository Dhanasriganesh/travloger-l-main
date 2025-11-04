import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET /api/itineraries/[id]
export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    
    await client.connect()
    
    // Ensure cover_photo, package_terms, pricing_data, status, and confirmed_at columns exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='cover_photo') THEN
          ALTER TABLE itineraries ADD COLUMN cover_photo TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='package_terms') THEN
          ALTER TABLE itineraries ADD COLUMN package_terms JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='pricing_data') THEN
          ALTER TABLE itineraries ADD COLUMN pricing_data JSONB;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='status') THEN
          ALTER TABLE itineraries ADD COLUMN status TEXT DEFAULT 'pending';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='confirmed_at') THEN
          ALTER TABLE itineraries ADD COLUMN confirmed_at TIMESTAMPTZ;
        END IF;
      END $$;
    `)
    
    const result = await client.query(`
      SELECT id, name, start_date, end_date, adults, children, destinations, notes, 
             price, marketplace_shared, cover_photo, package_terms, pricing_data, status, confirmed_at, created_at, updated_at
      FROM itineraries 
      WHERE id = $1
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ itinerary: result.rows[0] })
  } catch (error) {
    console.error('Itinerary GET error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT /api/itineraries/[id]
export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    const body = await request.json()
    console.log('🔧 API PUT request for itinerary:', id, 'Body:', Object.keys(body))
    
    const { name, startDate, endDate, adults, children, destinations, notes, marketplace_shared, coverPhoto, packageTerms, pricingData, status, confirmed_at } = body
    
    // Only validate required fields if they are being updated
    if (name !== undefined && (!name || !name.trim())) {
      return NextResponse.json({ error: 'Itinerary name is required' }, { status: 400 })
    }
    
    if (destinations !== undefined && (!destinations || !destinations.trim())) {
      return NextResponse.json({ error: 'Destinations are required' }, { status: 400 })
    }
    
    await client.connect()
    
    // Ensure cover_photo and package_terms columns exist
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='cover_photo') THEN
          ALTER TABLE itineraries ADD COLUMN cover_photo TEXT;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                      WHERE table_name='itineraries' AND column_name='package_terms') THEN
          ALTER TABLE itineraries ADD COLUMN package_terms JSONB;
        END IF;
      END $$;
    `)
    
    // Check if itinerary exists
    const checkResult = await client.query('SELECT id FROM itineraries WHERE id = $1', [id])
    if (checkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    // Build dynamic UPDATE query based on provided fields
    const updateFields = []
    const values = []
    let paramIndex = 1
    
    if (name !== undefined) {
      updateFields.push(`name = $${paramIndex}`)
      values.push(name.trim())
      paramIndex++
    }
    if (startDate !== undefined) {
      updateFields.push(`start_date = $${paramIndex}`)
      values.push(startDate)
      paramIndex++
    }
    if (endDate !== undefined) {
      updateFields.push(`end_date = $${paramIndex}`)
      values.push(endDate)
      paramIndex++
    }
    if (adults !== undefined) {
      updateFields.push(`adults = $${paramIndex}`)
      values.push(adults)
      paramIndex++
    }
    if (children !== undefined) {
      updateFields.push(`children = $${paramIndex}`)
      values.push(children)
      paramIndex++
    }
    if (destinations !== undefined) {
      updateFields.push(`destinations = $${paramIndex}`)
      values.push(destinations.trim())
      paramIndex++
    }
    if (notes !== undefined) {
      updateFields.push(`notes = $${paramIndex}`)
      values.push(notes)
      paramIndex++
    }
    if (marketplace_shared !== undefined) {
      updateFields.push(`marketplace_shared = $${paramIndex}`)
      values.push(marketplace_shared)
      paramIndex++
    }
    if (coverPhoto !== undefined) {
      updateFields.push(`cover_photo = $${paramIndex}`)
      values.push(coverPhoto)
      paramIndex++
    }
    if (packageTerms !== undefined) {
      updateFields.push(`package_terms = $${paramIndex}`)
      values.push(JSON.stringify(packageTerms))
      paramIndex++
    }
    if (pricingData !== undefined) {
      updateFields.push(`pricing_data = $${paramIndex}`)
      values.push(JSON.stringify(pricingData))
      paramIndex++
    }
    if (status !== undefined) {
      updateFields.push(`status = $${paramIndex}`)
      values.push(status)
      paramIndex++
    }
    if (confirmed_at !== undefined) {
      updateFields.push(`confirmed_at = $${paramIndex}`)
      values.push(confirmed_at)
      paramIndex++
    }
    
    // Always update the updated_at timestamp
    updateFields.push(`updated_at = NOW()`)
    
    // Add the WHERE clause parameter
    values.push(id)
    
    console.log('🔧 Building UPDATE query with fields:', updateFields)
    console.log('🔧 Values:', values.length, 'parameters')
    
    const result = await client.query(`
      UPDATE itineraries 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING id, name, start_date, end_date, adults, children, destinations, notes, 
                price, marketplace_shared, cover_photo, package_terms, pricing_data, status, confirmed_at, created_at, updated_at
    `, values)
    
    console.log('✅ Database update successful, rows affected:', result.rowCount)
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ itinerary: result.rows[0] })
  } catch (error) {
    console.error('Itinerary PUT error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE /api/itineraries/[id]
export async function DELETE(request: Request, context: { params: Promise<{ id: string }> }) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { id } = await context.params
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM itineraries 
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Itinerary not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Itinerary deleted successfully' })
  } catch (error) {
    console.error('Itinerary DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}



