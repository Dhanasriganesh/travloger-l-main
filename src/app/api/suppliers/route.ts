import { NextResponse } from 'next/server'
import { Client } from 'pg'
import { getErrorMessage } from '@/lib/error'

// GET all suppliers
export async function GET() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Auto-create suppliers table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS suppliers (
        id SERIAL PRIMARY KEY,
        city TEXT NOT NULL,
        company_name TEXT NOT NULL,
        contact_person_name TEXT DEFAULT '',
        phone_number TEXT DEFAULT '',
        whatsapp_number TEXT DEFAULT '',
        email TEXT NOT NULL,
        address TEXT DEFAULT '',
        country TEXT DEFAULT '',
        gst_number TEXT DEFAULT '',
        pan_number TEXT DEFAULT '',
        bank_name TEXT DEFAULT '',
        bank_account_number TEXT DEFAULT '',
        bank_ifsc_swift TEXT DEFAULT '',
        payment_terms TEXT DEFAULT '',
        contract_start_date DATE,
        contract_end_date DATE,
        notes TEXT DEFAULT '',
        status TEXT DEFAULT 'Active',
        created_by TEXT DEFAULT 'Travloger.in',
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_suppliers_company ON suppliers(company_name);
      CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
    `)
    // Add missing columns for existing tables
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='contact_person_name') THEN
          ALTER TABLE suppliers ADD COLUMN contact_person_name TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='phone_number') THEN
          ALTER TABLE suppliers ADD COLUMN phone_number TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='country') THEN
          ALTER TABLE suppliers ADD COLUMN country TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='whatsapp_number') THEN
          ALTER TABLE suppliers ADD COLUMN whatsapp_number TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='gst_number') THEN
          ALTER TABLE suppliers ADD COLUMN gst_number TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='pan_number') THEN
          ALTER TABLE suppliers ADD COLUMN pan_number TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='bank_name') THEN
          ALTER TABLE suppliers ADD COLUMN bank_name TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='bank_account_number') THEN
          ALTER TABLE suppliers ADD COLUMN bank_account_number TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='bank_ifsc_swift') THEN
          ALTER TABLE suppliers ADD COLUMN bank_ifsc_swift TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='payment_terms') THEN
          ALTER TABLE suppliers ADD COLUMN payment_terms TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='contract_start_date') THEN
          ALTER TABLE suppliers ADD COLUMN contract_start_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='contract_end_date') THEN
          ALTER TABLE suppliers ADD COLUMN contract_end_date DATE;
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='notes') THEN
          ALTER TABLE suppliers ADD COLUMN notes TEXT DEFAULT '';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='status') THEN
          ALTER TABLE suppliers ADD COLUMN status TEXT DEFAULT 'Active';
        END IF;
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='created_by') THEN
          ALTER TABLE suppliers ADD COLUMN created_by TEXT DEFAULT 'Travloger.in';
        END IF;
      END $$;
    `)

    // Drop unused columns
    await client.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='title') THEN
          ALTER TABLE suppliers DROP COLUMN title;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='first_name') THEN
          ALTER TABLE suppliers DROP COLUMN first_name;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='last_name') THEN
          ALTER TABLE suppliers DROP COLUMN last_name;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='mobile_country_code') THEN
          ALTER TABLE suppliers DROP COLUMN mobile_country_code;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='mobile_number') THEN
          ALTER TABLE suppliers DROP COLUMN mobile_number;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='bank_account_holder') THEN
          ALTER TABLE suppliers DROP COLUMN bank_account_holder;
        END IF;
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='suppliers' AND column_name='supplier_type') THEN
          ALTER TABLE suppliers DROP COLUMN supplier_type;
        END IF;
      END $$;
    `)
    
    const result = await client.query(`
      SELECT id, city, company_name, contact_person_name, phone_number, whatsapp_number, email,
             address, country, gst_number, pan_number, bank_name, bank_account_number, bank_ifsc_swift,
             payment_terms, contract_start_date, contract_end_date, notes, status, created_by,
             TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
      FROM suppliers
      ORDER BY created_at DESC
    `)
    
    return NextResponse.json({ suppliers: result.rows })
  } catch (error: unknown) {
    console.error('Suppliers GET error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST create new supplier
export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { city, supplierName, contactPersonName, phoneNumber, whatsappNumber, email, address, country,
      gstNumber, panNumber, bankName, bankAccountNumber, bankIfscSwift, paymentTerms, contractStartDate, contractEndDate,
      notes, status } = body
    
    if (!supplierName || !contactPersonName || !phoneNumber) {
      return NextResponse.json({ error: 'Supplier name, contact person name, and phone number are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      INSERT INTO suppliers (
        city, company_name, contact_person_name, phone_number, whatsapp_number, email, address, country,
        gst_number, pan_number, bank_name, bank_account_number, bank_ifsc_swift,
        payment_terms, contract_start_date, contract_end_date, notes, status
      )
      VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8,
        $9, $10, $11, $12, $13,
        $14, $15, $16, $17, $18
      )
      RETURNING id, city, company_name, contact_person_name, phone_number, whatsapp_number, email,
                address, country, gst_number, pan_number, bank_name, bank_account_number, bank_ifsc_swift,
                payment_terms, contract_start_date, contract_end_date, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      city || '', supplierName, contactPersonName || '', phoneNumber || '', whatsappNumber || '', email || '', address || '', country || '',
      gstNumber || '', panNumber || '', bankName || '', bankAccountNumber || '', bankIfscSwift || '',
      paymentTerms || '', contractStartDate || null, contractEndDate || null, notes || '', status || 'Active'
    ])
    
    return NextResponse.json({ 
      supplier: result.rows[0],
      message: 'Supplier created successfully'
    })
  } catch (error: unknown) {
    console.error('Suppliers POST error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT update supplier
export async function PUT(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })
  
  try {
    const body = await request.json()
    const { id, city, supplierName, contactPersonName, phoneNumber, whatsappNumber, email, address, country,
      gstNumber, panNumber, bankName, bankAccountNumber, bankIfscSwift,
      paymentTerms, contractStartDate, contractEndDate, notes, status } = body
    
    if (!id) {
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }
    
    if (!supplierName || !contactPersonName || !phoneNumber) {
      return NextResponse.json({ error: 'Supplier name, contact person name, and phone number are required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      UPDATE suppliers 
      SET city = $1, company_name = $2, contact_person_name = $3, phone_number = $4,
          whatsapp_number = COALESCE($5, whatsapp_number), email = $6, address = $7,
          country = COALESCE($8, country), gst_number = COALESCE($9, gst_number), pan_number = COALESCE($10, pan_number),
          bank_name = COALESCE($11, bank_name), bank_account_number = COALESCE($12, bank_account_number), bank_ifsc_swift = COALESCE($13, bank_ifsc_swift),
          payment_terms = COALESCE($14, payment_terms), contract_start_date = COALESCE($15, contract_start_date), contract_end_date = COALESCE($16, contract_end_date),
          notes = COALESCE($17, notes), status = COALESCE($18, status),
          updated_at = NOW()
      WHERE id = $19
      RETURNING id, city, company_name, contact_person_name, phone_number, whatsapp_number, email,
                address, country, gst_number, pan_number, bank_name, bank_account_number, bank_ifsc_swift,
                payment_terms, contract_start_date, contract_end_date, notes, status, created_by,
                TO_CHAR(created_at, 'DD-MM-YYYY') as date, created_at, updated_at
    `, [
      city || '', supplierName, contactPersonName, phoneNumber,
      whatsappNumber || null, email || '', address || '',
      country || null, gstNumber || null, panNumber || null,
      bankName || null, bankAccountNumber || null, bankIfscSwift || null,
      paymentTerms || null, contractStartDate || null, contractEndDate || null,
      notes || null, status || null, id
    ])
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      supplier: result.rows[0],
      message: 'Supplier updated successfully'
    })
  } catch (error: unknown) {
    console.error('Suppliers PUT error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE supplier
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
      return NextResponse.json({ error: 'Supplier ID is required' }, { status: 400 })
    }
    
    await client.connect()
    
    const result = await client.query(`
      DELETE FROM suppliers WHERE id = $1
    `, [id])
    
    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Supplier not found' }, { status: 404 })
    }
    
    return NextResponse.json({ message: 'Supplier deleted successfully' })
  } catch (error: unknown) {
    console.error('Suppliers DELETE error:', error)
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 })
  } finally {
    await client.end()
  }
}


