import { NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * POST /api/expense-tracking-setup
 * Creates expense_tracking_master table
 */
export async function POST() {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()

    // 1. Create expense_tracking_master table
    await client.query(`
      CREATE TABLE IF NOT EXISTS expense_tracking_master (
        id SERIAL PRIMARY KEY,
        expense_category VARCHAR(100) NOT NULL,
        trip_id VARCHAR(100),
        booking_reference VARCHAR(100),
        expense_amount NUMERIC(10,2) NOT NULL,
        payment_status VARCHAR(20) DEFAULT 'Pending',
        payment_date DATE,
        vendor_name VARCHAR(255),
        vendor_payout_id INTEGER,
        description TEXT,
        notes TEXT,
        receipt_url TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    // 2. Create indexes for performance
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_expense_category ON expense_tracking_master(expense_category);
      CREATE INDEX IF NOT EXISTS idx_expense_trip_id ON expense_tracking_master(trip_id);
      CREATE INDEX IF NOT EXISTS idx_expense_status ON expense_tracking_master(payment_status);
      CREATE INDEX IF NOT EXISTS idx_expense_booking ON expense_tracking_master(booking_reference);
    `)

    // 3. Add foreign key to vendor_payout_master if it exists
    try {
      await client.query(`
        ALTER TABLE expense_tracking_master 
        ADD CONSTRAINT fk_expense_vendor_payout 
        FOREIGN KEY (vendor_payout_id) REFERENCES vendor_payout_master(id) 
        ON DELETE SET NULL
      `)
    } catch (err) {
      console.log('Vendor payout FK constraint not added (table may not exist yet)')
    }

    return NextResponse.json({
      success: true,
      message: 'Expense Tracking Master setup completed successfully',
      timestamp: new Date().toISOString()
    })

  } catch (error: any) {
    console.error('Expense Tracking Setup Error:', error)
    return NextResponse.json({
      error: 'Setup failed',
      details: error.message
    }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * GET /api/expense-tracking-setup
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
        WHERE table_name = 'expense_tracking_master'
      )
    `)

    // Get expense statistics
    type CategoryStat = {
      expense_category: string
      count: number
      total: number
    }

    let expenseStats: { 
      total: number
      pending: number
      paid: number
      total_amount: number
      by_category: CategoryStat[]
    } = { 
      total: 0, 
      pending: 0, 
      paid: 0,
      total_amount: 0,
      by_category: []
    }
    
    if (tableCheck.rows[0].exists) {
      const statsResult = await client.query(`
        SELECT 
          COUNT(*) as total,
          COUNT(*) FILTER (WHERE payment_status = 'Pending') as pending,
          COUNT(*) FILTER (WHERE payment_status = 'Paid') as paid,
          COALESCE(SUM(expense_amount), 0) as total_amount
        FROM expense_tracking_master
      `)
      
      const categoryResult = await client.query(`
        SELECT 
          expense_category,
          COUNT(*) as count,
          COALESCE(SUM(expense_amount), 0) as total
        FROM expense_tracking_master
        GROUP BY expense_category
        ORDER BY total DESC
      `)
      
      const categoryStats: CategoryStat[] = categoryResult.rows.map((row: any) => ({
        expense_category: row.expense_category,
        count: parseInt(row.count),
        total: parseFloat(row.total)
      }))

      expenseStats = {
        total: parseInt(statsResult.rows[0].total),
        pending: parseInt(statsResult.rows[0].pending),
        paid: parseInt(statsResult.rows[0].paid),
        total_amount: parseFloat(statsResult.rows[0].total_amount),
        by_category: categoryStats
      }
    }

    return NextResponse.json({
      table_exists: tableCheck.rows[0].exists,
      expense_stats: expenseStats,
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



