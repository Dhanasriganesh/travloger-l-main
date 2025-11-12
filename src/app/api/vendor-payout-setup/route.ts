import { NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * POST /api/vendor-payout-setup
 * Creates vendor_payout_master table
 */
export async function POST() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    // 1. Create vendor_payout_master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS vendor_payout_master (
        id SERIAL PRIMARY KEY,
        vendor_name VARCHAR(255) NOT NULL,
        supplier_id INTEGER,
        booking_reference VARCHAR(100),
        trip_id VARCHAR(100),
        service_type VARCHAR(50),
        payable_amount NUMERIC(10,2) NOT NULL,
        payment_due_date DATE NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'Pending',
        payment_date DATE,
        payment_mode VARCHAR(50),
        transaction_reference VARCHAR(255),
        bank_name VARCHAR(255),
        upi_id VARCHAR(255),
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_vendor_payout_vendor ON vendor_payout_master(vendor_name);
      CREATE INDEX IF NOT EXISTS idx_vendor_payout_status ON vendor_payout_master(payment_status);
      CREATE INDEX IF NOT EXISTS idx_vendor_payout_due_date ON vendor_payout_master(payment_due_date);
      CREATE INDEX IF NOT EXISTS idx_vendor_payout_booking ON vendor_payout_master(booking_reference);
    `)

    // 3. Add foreign key to suppliers table if it exists
    try {
      await client.query(`
        ALTER TABLE vendor_payout_master 
        ADD CONSTRAINT fk_vendor_payout_supplier 
        FOREIGN KEY (supplier_id) REFERENCES suppliers(id) 
        ON DELETE SET NULL
      `)
    } catch (err) {
      console.log('Supplier FK constraint not added (suppliers table may not exist yet)')
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor Payout Master setup completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Vendor Payout Setup Error:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/vendor-payout-setup
 * Check current setup status
 */
export async function GET() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    // Check if table exists
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'vendor_payout_master'
      )
    `)

    // Count payouts by status
    let payoutStats = { total: 0, pending: 0, paid: 0 }
    if (tableCheck.rows[0].exists) {
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE payment_status = 'Pending') as pending,
          COUNT(*) FILTER (WHERE payment_status = 'Paid') as paid
        FROM vendor_payout_master
      `)
      payoutStats = {
        total: parseInt(statsResult.rows[0].total),
        pending: parseInt(statsResult.rows[0].pending),
        paid: parseInt(statsResult.rows[0].paid)
      }
    }

    return NextResponse.json({
      table_exists: tableCheck.rows[0].exists,
      payout_stats: payoutStats,
      setup_complete: tableCheck.rows[0].exists
    })

  } catch (error: any) {
    console.error('Setup check error:', error)
    return NextResponse.json({
      error: 'Check failed',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}



