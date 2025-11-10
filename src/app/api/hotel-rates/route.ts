import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { headers } from 'next/headers'
import { getErrorMessage } from '@/app/api/utils/error'

// GET hotel rates
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

  const url = new URL(request.url)
  const hotelId = url.searchParams.get('hotelId')

  if (!hotelId) {
    return new NextResponse(
      JSON.stringify({ error: 'Hotel ID is required' }),
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
    
    // Auto-create hotel_rates table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS hotel_rates (
        id SERIAL PRIMARY KEY,
        hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        room_type TEXT NOT NULL,
        meal_plan TEXT NOT NULL DEFAULT 'APAI',
        single DECIMAL(10,2) DEFAULT 0,
        double DECIMAL(10,2) DEFAULT 0,
        triple DECIMAL(10,2) DEFAULT 0,
        quad DECIMAL(10,2) DEFAULT 0,
        cwb DECIMAL(10,2) DEFAULT 0,
        cnb DECIMAL(10,2) DEFAULT 0,
        season_name TEXT DEFAULT '',
        cost_price DECIMAL(10,2) DEFAULT 0,
        selling_price DECIMAL(10,2) DEFAULT 0,
        currency TEXT DEFAULT 'INR',
        extra_adult DECIMAL(10,2) DEFAULT 0,
        extra_child DECIMAL(10,2) DEFAULT 0,
        weekend_rate_diff DECIMAL(10,2) DEFAULT 0,
        weekday_rate_diff DECIMAL(10,2) DEFAULT 0,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_hotel_rates_hotel_id ON hotel_rates(hotel_id);
      CREATE INDEX IF NOT EXISTS idx_hotel_rates_dates ON hotel_rates(from_date, to_date);
    `)
    // Add missing columns for existing tables
    await client.query(`
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS season_name TEXT DEFAULT '';
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS cost_price DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS selling_price DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS currency TEXT DEFAULT 'INR';
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS extra_adult DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS extra_child DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS weekend_rate_diff DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS weekday_rate_diff DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
      ALTER TABLE hotel_rates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
    `)
    
    const result = await client.query(`
      SELECT 
        id, hotel_id, 
        from_date,
        to_date,
        TO_CHAR(from_date, 'DD-MM-YYYY') as from_date_formatted,
        TO_CHAR(to_date, 'DD-MM-YYYY') as to_date_formatted,
        room_type,
        meal_plan,
        single,
        double,
        triple,
        quad,
        cwb,
        cnb,
        season_name,
        cost_price,
        selling_price,
        currency,
        extra_adult,
        extra_child,
        weekend_rate_diff,
        weekday_rate_diff,
        notes,
        status,
        created_at,
        updated_at
      FROM hotel_rates 
      WHERE hotel_id = $1
      ORDER BY from_date DESC, room_type
    `, [hotelId])
    
    return new NextResponse(
      JSON.stringify({ rates: result.rows }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error: unknown) {
    console.error('Hotel rates GET error:', error)
    return new NextResponse(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// POST create new rate
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
    const { 
      hotelId, fromDate, toDate, roomType, mealPlan,
      single, double, triple, quad, cwb, cnb,
      seasonName, costPrice, sellingPrice, currency, extraAdult, extraChild, weekendRateDiff, weekdayRateDiff, notes, status
    } = body
    
    if (!hotelId || !fromDate || !toDate || !roomType) {
      return new NextResponse(
        JSON.stringify({ error: 'Hotel ID, dates, and room type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO hotel_rates (
        hotel_id, from_date, to_date, room_type, meal_plan,
        single, double, triple, quad, cwb, cnb,
        season_name, cost_price, selling_price, currency, extra_adult, extra_child, weekend_rate_diff, weekday_rate_diff, notes, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11,
              $12, $13, $14, $15, $16, $17, $18, $19, $20, $21)
      RETURNING 
        id, hotel_id, 
        from_date,
        to_date,
        TO_CHAR(from_date, 'DD-MM-YYYY') as from_date_formatted,
        TO_CHAR(to_date, 'DD-MM-YYYY') as to_date_formatted,
        room_type,
        meal_plan,
        single,
        double,
        triple,
        quad,
        cwb,
        cnb,
        season_name,
        cost_price,
        selling_price,
        currency,
        extra_adult,
        extra_child,
        weekend_rate_diff,
        weekday_rate_diff,
        notes,
        status,
        created_at,
        updated_at
    `, [
      hotelId, fromDate, toDate, roomType, mealPlan || 'APAI',
      single || 0, double || 0, triple || 0, quad || 0, cwb || 0, cnb || 0,
      seasonName || '', costPrice || 0, sellingPrice || 0, currency || 'INR', extraAdult || 0, extraChild || 0, weekendRateDiff || 0, weekdayRateDiff || 0, notes || '', status || 'Active'
    ])
    
    return new NextResponse(
      JSON.stringify({
        rate: result.rows[0],
        message: 'Rate created successfully'
      }),
      {
        status: 201,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error: unknown) {
    console.error('Hotel rates POST error:', error)
    return new NextResponse(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// PUT update rate
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
    const { 
      id, hotelId, fromDate, toDate, roomType, mealPlan,
      single, double, triple, quad, cwb, cnb,
      seasonName, costPrice, sellingPrice, currency, extraAdult, extraChild, weekendRateDiff, weekdayRateDiff, notes, status
    } = body
    
    if (!id || !hotelId || !fromDate || !toDate || !roomType) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate ID, hotel ID, dates, and room type are required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE hotel_rates 
      SET 
        from_date = $1,
        to_date = $2,
        room_type = $3,
        meal_plan = $4,
        single = $5,
        double = $6,
        triple = $7,
        quad = $8,
        cwb = $9,
        cnb = $10,
        season_name = COALESCE($11, season_name),
        cost_price = COALESCE($12, cost_price),
        selling_price = COALESCE($13, selling_price),
        currency = COALESCE($14, currency),
        extra_adult = COALESCE($15, extra_adult),
        extra_child = COALESCE($16, extra_child),
        weekend_rate_diff = COALESCE($17, weekend_rate_diff),
        weekday_rate_diff = COALESCE($18, weekday_rate_diff),
        notes = COALESCE($19, notes),
        status = COALESCE($20, status),
        updated_at = NOW()
      WHERE id = $21 AND hotel_id = $22
      RETURNING 
        id, hotel_id, 
        from_date,
        to_date,
        TO_CHAR(from_date, 'DD-MM-YYYY') as from_date_formatted,
        TO_CHAR(to_date, 'DD-MM-YYYY') as to_date_formatted,
        room_type,
        meal_plan,
        single,
        double,
        triple,
        quad,
        cwb,
        cnb,
        season_name,
        cost_price,
        selling_price,
        currency,
        extra_adult,
        extra_child,
        weekend_rate_diff,
        weekday_rate_diff,
        notes,
        status,
        created_at,
        updated_at
    `, [
      fromDate, toDate, roomType, mealPlan || 'APAI',
      single || 0, double || 0, triple || 0, quad || 0, cwb || 0, cnb || 0,
      seasonName || null, costPrice || null, sellingPrice || null, currency || null, extraAdult || null, extraChild || null, weekendRateDiff || null, weekdayRateDiff || null, notes || null, status || null,
      id, hotelId
    ])
    
    if (result.rows.length === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({
        rate: result.rows[0],
        message: 'Rate updated successfully'
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error: unknown) {
    console.error('Hotel rates PUT error:', error)
    return new NextResponse(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

// DELETE rate
export async function DELETE(request: Request) {
  const headersList = await headers()
  const contentType = headersList.get('content-type') || ''
  
  // Ensure we're receiving JSON
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
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate ID is required' }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM hotel_rates WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return new NextResponse(
        JSON.stringify({ error: 'Rate not found' }),
        {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return new NextResponse(
      JSON.stringify({ message: 'Rate deleted successfully' }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } catch (error: unknown) {
    console.error('Hotel rates DELETE error:', error)
    return new NextResponse(
      JSON.stringify({ error: getErrorMessage(error) }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  } finally {
    await client.end()
  }
}

