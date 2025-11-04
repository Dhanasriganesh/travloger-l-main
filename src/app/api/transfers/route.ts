import { NextResponse } from 'next/server'
import { Client } from 'pg'

// GET all transfers
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create transfers table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS transfers (
        id SERIAL PRIMARY KEY,
        query_name TEXT NOT NULL,
        destination TEXT NOT NULL,
        price DECIMAL(10,2) DEFAULT 0,
        content TEXT DEFAULT '',
        photo_url TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_transfers_query_name ON transfers(query_name);
      CREATE INDEX IF NOT EXISTS idx_transfers_destination ON transfers(destination);
      CREATE INDEX IF NOT EXISTS idx_transfers_status ON transfers(status);
    `)
    
    // Add missing columns if they don't exist (for existing tables)
    await client.query(`
      DO $$ 
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='transfers' AND column_name='content') THEN
          ALTER TABLE transfers ADD COLUMN content TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                        WHERE table_name='transfers' AND column_name='photo_url') THEN
          ALTER TABLE transfers ADD COLUMN photo_url TEXT DEFAULT '';
        END IF;
      END $$;
    `)

    // Add new business fields, guarded
    await client.query(`
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS supplier_id INTEGER;
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT '';
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS distance_duration TEXT DEFAULT '';
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS rate_type TEXT DEFAULT 'fixed';
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS base_rate DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS extra_km_rate DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS waiting_charge DECIMAL(10,2) DEFAULT 0;
      ALTER TABLE transfers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    `)
    // Create supplier_id index only when present
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transfers' AND column_name='supplier_id') THEN
          CREATE INDEX IF NOT EXISTS idx_transfers_supplier_id ON transfers(supplier_id);
        END IF;
      END $$;
    `)
    
    const result = await client.query(`
      SELECT id, query_name, destination, price, content, photo_url, status,
             supplier_id, vehicle_type, distance_duration, rate_type, base_rate, extra_km_rate, waiting_charge, notes,
             created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM transfers 
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ transfers: result.rows })
  } catch (error) {
    console.error('Transfers GET error:', error)
    return NextResponse.json({ error: (error as any).message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new transfer
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { queryName, destination, price, content, photoUrl, status,
      supplierId, vehicleType, distanceDuration, rateType, baseRate, extraKmRate, waitingCharge, notes } = body
    
    if (!queryName || !destination) {
      return NextResponse.json({ error: 'Query name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO transfers (
        query_name, destination, price, content, photo_url, status,
        supplier_id, vehicle_type, distance_duration, rate_type, base_rate, extra_km_rate, waiting_charge, notes
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
      RETURNING id, query_name, destination, price, content, photo_url, status,
                supplier_id, vehicle_type, distance_duration, rate_type, base_rate, extra_km_rate, waiting_charge, notes,
                created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      queryName, destination, price || 0, content || '', photoUrl || '', status || 'Active',
      supplierId || null, vehicleType || '', distanceDuration || '', rateType || 'fixed', baseRate ?? price ?? 0, extraKmRate || 0, waitingCharge || 0, notes || ''
    ])
    
    return NextResponse.json({ 
      transfer: result.rows[0],
      message: 'Transfer created successfully'
    })
  } catch (error) {
    console.error('Transfers POST error:', error)
    return NextResponse.json({ error: (error as any).message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update transfer
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, queryName, destination, price, content, photoUrl, status,
      supplierId, vehicleType, distanceDuration, rateType, baseRate, extraKmRate, waitingCharge, notes } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Transfer ID is required' }, { status: 400 })
    }
    
    if (!queryName || !destination) {
      return NextResponse.json({ error: 'Query name and destination are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE transfers 
      SET query_name = $1, destination = $2, price = $3, content = $4, photo_url = $5, status = $6,
          supplier_id = COALESCE($7, supplier_id), vehicle_type = COALESCE($8, vehicle_type), distance_duration = COALESCE($9, distance_duration),
          rate_type = COALESCE($10, rate_type), base_rate = COALESCE($11, base_rate), extra_km_rate = COALESCE($12, extra_km_rate),
          waiting_charge = COALESCE($13, waiting_charge), notes = COALESCE($14, notes), updated_at = NOW()
      WHERE id = $15
      RETURNING id, query_name, destination, price, content, photo_url, status,
                supplier_id, vehicle_type, distance_duration, rate_type, base_rate, extra_km_rate, waiting_charge, notes,
                created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      queryName, destination, price || 0, content || '', photoUrl || '', status || 'Active',
      supplierId || null, vehicleType || null, distanceDuration || null, rateType || null, baseRate ?? null, extraKmRate ?? null, waitingCharge ?? null, notes || null, id
    ])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      transfer: result.rows[0],
      message: 'Transfer updated successfully'
    })
  } catch (error) {
    console.error('Transfers PUT error:', error)
    return NextResponse.json({ error: (error as any).message }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE transfer
export async function DELETE(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const url = new URL(request.url)
    const id = url.searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'Transfer ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM transfers WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Transfer not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Transfer deleted successfully' })
  } catch (error) {
    console.error('Transfers DELETE error:', error)
    return NextResponse.json({ error: (error as any).message }, { status: 500 })
  } finally {
    await client.end()
  }
}
