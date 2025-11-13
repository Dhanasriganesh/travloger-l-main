import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'profit_calculation_master'
    )
  `)
  
  if (!tableCheck.rows[0].exists) {
    await client.query(`
      CREATE TABLE profit_calculation_master (
        id SERIAL PRIMARY KEY,
        trip_id VARCHAR(100) NOT NULL,
        booking_reference VARCHAR(100),
        customer_name VARCHAR(255),
        total_revenue NUMERIC(10,2) DEFAULT 0,
        total_expenses NUMERIC(10,2) DEFAULT 0,
        total_vendor_payouts NUMERIC(10,2) DEFAULT 0,
        gross_profit NUMERIC(10,2) DEFAULT 0,
        profit_margin NUMERIC(5,2) DEFAULT 0,
        calculation_date DATE DEFAULT CURRENT_DATE,
        status VARCHAR(20) DEFAULT 'Draft',
        notes TEXT,
        created_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)
  }
}

// GET: Fetch profit calculations
export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const trip_id = searchParams.get('trip_id')
    const status = searchParams.get('status')

    let query = `SELECT * FROM profit_calculation_master WHERE 1=1`
    const params: any[] = []
    let paramIndex = 1

    if (trip_id) {
      query += ` AND trip_id = $${paramIndex}`
      params.push(trip_id)
      paramIndex++
    }

    if (status) {
      query += ` AND status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC`

    const result = await client.query(query, params)

    return NextResponse.json({ profitCalculations: result.rows })

  } catch (error: unknown) {
    console.error('Profit Calculation GET error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch profit calculations', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

// POST: Create new profit calculation or auto-calculate
export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const {
      trip_id,
      booking_reference,
      customer_name,
      total_revenue,
      auto_calculate,
      status,
      notes,
      created_by
    } = body

    if (!trip_id) {
      return NextResponse.json({ error: 'Trip ID is required' }, { status: 400 })
    }

    let calculatedRevenue = total_revenue || 0
    let calculatedExpenses = 0
    let calculatedPayouts = 0

    // Auto-calculate if requested
    if (auto_calculate) {
      // Get total expenses for this trip
      const expensesResult = await client.query(`
        SELECT COALESCE(SUM(expense_amount), 0) as total_expenses
        FROM expense_tracking_master
        WHERE trip_id = $1
      `, [trip_id])
      calculatedExpenses = parseFloat(expensesResult.rows[0]?.total_expenses || 0)

      // Get total vendor payouts for this trip
      const payoutsResult = await client.query(`
        SELECT COALESCE(SUM(payable_amount), 0) as total_payouts
        FROM vendor_payout_master
        WHERE trip_id = $1
      `, [trip_id])
      calculatedPayouts = parseFloat(payoutsResult.rows[0]?.total_payouts || 0)
    } else {
      calculatedExpenses = 0
      calculatedPayouts = 0
    }

    // Calculate profit
    const grossProfit = calculatedRevenue - calculatedExpenses - calculatedPayouts
    const profitMargin = calculatedRevenue > 0 ? (grossProfit / calculatedRevenue) * 100 : 0

    const result = await client.query(`
      INSERT INTO profit_calculation_master 
        (trip_id, booking_reference, customer_name, total_revenue, total_expenses, 
         total_vendor_payouts, gross_profit, profit_margin, status, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
      RETURNING *
    `, [
      trip_id,
      booking_reference || null,
      customer_name || null,
      calculatedRevenue,
      calculatedExpenses,
      calculatedPayouts,
      grossProfit,
      profitMargin,
      status || 'Draft',
      notes || null,
      created_by || 'System'
    ])

    return NextResponse.json({
      success: true,
      profitCalculation: result.rows[0],
      message: 'Profit calculation created successfully'
    })

  } catch (error: unknown) {
    console.error('Profit Calculation POST error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create profit calculation', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

// PUT: Update profit calculation
export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Profit calculation ID is required' }, { status: 400 })
    }

    // If auto-recalculate is requested
    if (updates.auto_calculate && updates.trip_id) {
      const expensesResult = await client.query(`
        SELECT COALESCE(SUM(expense_amount), 0) as total_expenses
        FROM expense_tracking_master
        WHERE trip_id = $1
      `, [updates.trip_id])
      updates.total_expenses = parseFloat(expensesResult.rows[0]?.total_expenses || 0)

      const payoutsResult = await client.query(`
        SELECT COALESCE(SUM(payable_amount), 0) as total_payouts
        FROM vendor_payout_master
        WHERE trip_id = $1
      `, [updates.trip_id])
      updates.total_vendor_payouts = parseFloat(payoutsResult.rows[0]?.total_payouts || 0)

      const revenue = updates.total_revenue || 0
      updates.gross_profit = revenue - updates.total_expenses - updates.total_vendor_payouts
      updates.profit_margin = revenue > 0 ? (updates.gross_profit / revenue) * 100 : 0
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    const allowedFields = [
      'trip_id', 'booking_reference', 'customer_name', 'total_revenue', 
      'total_expenses', 'total_vendor_payouts', 'gross_profit', 'profit_margin',
      'status', 'notes'
    ]

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined && key !== 'auto_calculate') {
        updateFields.push(`${key} = $${paramIndex}`)
        values.push(value)
        paramIndex++
      }
    }

    if (updateFields.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const query = `
      UPDATE profit_calculation_master 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await client.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profit calculation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      profitCalculation: result.rows[0],
      message: 'Profit calculation updated successfully'
    })

  } catch (error: unknown) {
    console.error('Profit Calculation PUT error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update profit calculation', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

// DELETE: Delete profit calculation
export async function DELETE(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Profit calculation ID is required' }, { status: 400 })
    }

    const result = await client.query(`
      DELETE FROM profit_calculation_master 
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Profit calculation not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Profit calculation deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Profit Calculation DELETE error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete profit calculation', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

