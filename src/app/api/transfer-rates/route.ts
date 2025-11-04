import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all transfer rates for a specific transfer
export async function GET(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create transfer_rates table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfer_rates (
        id SERIAL PRIMARY KEY,
        transfer_id INTEGER NOT NULL,
        from_date DATE NOT NULL,
        to_date DATE NOT NULL,
        type VARCHAR(10) NOT NULL CHECK (type IN ('SIC', 'PVT')),
        adult_count INTEGER NOT NULL DEFAULT 1,
        child_count INTEGER NOT NULL DEFAULT 0,
        vehicle VARCHAR(100),
        adult_price DECIMAL(10,2) DEFAULT 0,
        child_price DECIMAL(10,2) DEFAULT 0,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        FOREIGN KEY (transfer_id) REFERENCES transfers(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS idx_transfer_rates_transfer_id ON transfer_rates(transfer_id);
      CREATE INDEX IF NOT EXISTS idx_transfer_rates_dates ON transfer_rates(from_date, to_date);
      CREATE INDEX IF NOT EXISTS idx_transfer_rates_type ON transfer_rates(type);
    `)
    
    const { searchParams } = new URL(request.url)
    const transferId = searchParams.get('transferId')
    
    if (!transferId) {
      return NextResponse.json({ error: 'Transfer ID is required' }, { status: 400 })
    }
    
    const result = await client.query(`
      SELECT id, transfer_id, from_date, to_date, type, adult_count, child_count, 
             vehicle, adult_price, child_price, created_at, updated_at
      FROM transfer_rates 
      WHERE transfer_id = $1
      ORDER BY from_date DESC, created_at DESC
    `, [transferId])
    
    return NextResponse.json({ rates: result.rows })
  } catch (error) {
    console.error('Transfer rates GET error:', error)
    return NextResponse.json({ error: 'Failed to fetch transfer rates' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST - Add new transfer rate
export async function POST(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { transferId, fromDate, toDate, type, adultCount, childCount, vehicle, adultPrice, childPrice } = body
    
    if (!transferId || !fromDate || !toDate || !type) {
      return NextResponse.json({ error: 'Transfer ID, dates, and type are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO transfer_rates (transfer_id, from_date, to_date, type, adult_count, child_count, vehicle, adult_price, child_price)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING id, transfer_id, from_date, to_date, type, adult_count, child_count, 
                vehicle, adult_price, child_price, created_at, updated_at
    `, [transferId, fromDate, toDate, type, adultCount || 1, childCount || 0, vehicle || '', adultPrice || 0, childPrice || 0])
    
    return NextResponse.json({ 
      rate: result.rows[0],
      message: 'Transfer rate added successfully'
    })
  } catch (error) {
    console.error('Transfer rates POST error:', error)
    return NextResponse.json({ error: 'Failed to add transfer rate' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT - Update transfer rate
export async function PUT(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, fromDate, toDate, type, adultCount, childCount, vehicle, adultPrice, childPrice } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE transfer_rates 
      SET from_date = $2, to_date = $3, type = $4, adult_count = $5, child_count = $6, 
          vehicle = $7, adult_price = $8, child_price = $9, updated_at = NOW()
      WHERE id = $1
      RETURNING id, transfer_id, from_date, to_date, type, adult_count, child_count, 
                vehicle, adult_price, child_price, created_at, updated_at
    `, [id, fromDate, toDate, type, adultCount, childCount, vehicle, adultPrice, childPrice])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transfer rate not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      rate: result.rows[0],
      message: 'Transfer rate updated successfully'
    })
  } catch (error) {
    console.error('Transfer rates PUT error:', error)
    return NextResponse.json({ error: 'Failed to update transfer rate' }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE - Remove transfer rate
export async function DELETE(request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Rate ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM transfer_rates 
      WHERE id = $1
      RETURNING id
    `, [id])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transfer rate not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Transfer rate deleted successfully' })
  } catch (error) {
    console.error('Transfer rates DELETE error:', error)
    return NextResponse.json({ error: 'Failed to delete transfer rate' }, { status: 500 })
  } finally {
    await client.end()
  }
}


