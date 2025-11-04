import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS vehicle_drivers (
      id SERIAL PRIMARY KEY,
      vehicle_name TEXT DEFAULT '',
      registration_number TEXT DEFAULT '',
      vehicle_type TEXT NOT NULL,
      supplier_name TEXT NOT NULL,
      driver_name TEXT NOT NULL,
      driver_contact TEXT NOT NULL,
      license_expiry DATE,
      rc_expiry DATE,
      availability_status TEXT DEFAULT 'Available',
      notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS vehicle_name TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS registration_number TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS vehicle_type TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS supplier_name TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS driver_name TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS driver_contact TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS license_expiry DATE;
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS rc_expiry DATE;
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS availability_status TEXT DEFAULT 'Available';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS notes TEXT DEFAULT '';
    ALTER TABLE vehicle_drivers ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_registration ON vehicle_drivers(registration_number);
    CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_vehicle_type ON vehicle_drivers(vehicle_type);
    CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_supplier ON vehicle_drivers(supplier_name);
    CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_driver ON vehicle_drivers(driver_name);
    CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_availability ON vehicle_drivers(availability_status);
    CREATE INDEX IF NOT EXISTS idx_vehicle_drivers_status ON vehicle_drivers(status);
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
      SELECT id, vehicle_name, registration_number, vehicle_type, supplier_name, driver_name,
             driver_contact, license_expiry, rc_expiry, availability_status, notes, status,
             created_by, TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM vehicle_drivers
      ORDER BY created_at DESC
    `)
    
    // Map DB columns to expected API shape
    const vehicleDrivers = result.rows.map(r => ({
      id: r.id,
      vehicle_name: r.vehicle_name || '',
      registration_number: r.registration_number || '',
      vehicle_type: r.vehicle_type || '',
      supplier_name: r.supplier_name || '',
      driver_name: r.driver_name || '',
      driver_contact: r.driver_contact || '',
      license_expiry: r.license_expiry ? r.license_expiry.toISOString().split('T')[0] : null,
      rc_expiry: r.rc_expiry ? r.rc_expiry.toISOString().split('T')[0] : null,
      availability_status: r.availability_status || 'Available',
      notes: r.notes || '',
      status: r.status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ vehicleDrivers })
  } catch (error: any) {
    console.error('VehicleDrivers GET error:', error)
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
    console.error('VehicleDrivers POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  if (!body.vehicleType && !body.vehicle_type) return NextResponse.json({ error: 'Vehicle type is required' }, { status: 400 })
  if (!body.supplierName && !body.supplier_name) return NextResponse.json({ error: 'Supplier name is required' }, { status: 400 })
  if (!body.driverName && !body.driver_name) return NextResponse.json({ error: 'Driver name is required' }, { status: 400 })
  if (!body.driverContact && !body.driver_contact) return NextResponse.json({ error: 'Driver contact is required' }, { status: 400 })

  if (!body.vehicleName && !body.vehicle_name && !body.registrationNumber && !body.registration_number) {
    return NextResponse.json({ error: 'Vehicle name or registration number is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.vehicleName || body.vehicle_name || '',
      body.registrationNumber || body.registration_number || '',
      body.vehicleType || body.vehicle_type || '',
      body.supplierName || body.supplier_name || '',
      body.driverName || body.driver_name || '',
      body.driverContact || body.driver_contact || '',
      body.licenseExpiry || body.license_expiry || null,
      body.rcExpiry || body.rc_expiry || null,
      body.availabilityStatus || body.availability_status || 'Available',
      body.notes || '',
      body.status || 'Active'
    ]
    
    const insert = await client.query(
      `INSERT INTO vehicle_drivers (
        vehicle_name, registration_number, vehicle_type, supplier_name, driver_name,
        driver_contact, license_expiry, rc_expiry, availability_status, notes, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Vehicle & Driver created' })
  } catch (error: any) {
    console.error('VehicleDrivers POST error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to create vehicle & driver' }, { status: 500 })
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
    console.error('VehicleDrivers PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.vehicleName || body.vehicle_name || '',
      body.registrationNumber || body.registration_number || '',
      body.vehicleType || body.vehicle_type || '',
      body.supplierName || body.supplier_name || '',
      body.driverName || body.driver_name || '',
      body.driverContact || body.driver_contact || '',
      body.licenseExpiry || body.license_expiry || null,
      body.rcExpiry || body.rc_expiry || null,
      body.availabilityStatus || body.availability_status || 'Available',
      body.notes || '',
      body.status || 'Active',
      id
    ]
    
    await client.query(
      `UPDATE vehicle_drivers SET 
         vehicle_name = $1, registration_number = $2, vehicle_type = $3, supplier_name = $4,
         driver_name = $5, driver_contact = $6, license_expiry = $7, rc_expiry = $8,
         availability_status = $9, notes = $10, status = $11,
         updated_at = NOW()
       WHERE id = $12`,
      values
    )
    return NextResponse.json({ message: 'Vehicle & Driver updated' })
  } catch (error: any) {
    console.error('VehicleDrivers PUT error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to update vehicle & driver' }, { status: 500 })
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
    await client.query('DELETE FROM vehicle_drivers WHERE id = $1', [id])
    return NextResponse.json({ message: 'Vehicle & Driver deleted' })
  } catch (error: any) {
    console.error('VehicleDrivers DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

