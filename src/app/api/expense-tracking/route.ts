import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'expense_tracking_master'
    )
  `)
  
  if (!tableCheck.rows[0].exists) {
    await client.query(`
      CREATE TABLE expense_tracking_master (
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
  }
}

export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const category = searchParams.get('category')
    const trip_id = searchParams.get('trip_id')
    const status = searchParams.get('status')

    let query = `SELECT * FROM expense_tracking_master WHERE 1=1`
    const params: any[] = []
    let paramIndex = 1

    if (category) {
      query += ` AND expense_category = $${paramIndex}`
      params.push(category)
      paramIndex++
    }

    if (trip_id) {
      query += ` AND trip_id = $${paramIndex}`
      params.push(trip_id)
      paramIndex++
    }

    if (status) {
      query += ` AND payment_status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    query += ` ORDER BY created_at DESC`

    const result = await client.query(query, params)

    return NextResponse.json({ expenses: result.rows })

  } catch (error: unknown) {
    console.error('Expense Tracking GET error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch expenses', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const {
      expense_category,
      trip_id,
      booking_reference,
      expense_amount,
      payment_status,
      payment_date,
      vendor_name,
      vendor_payout_id,
      description,
      notes,
      receipt_url,
      created_by
    } = body

    if (!expense_category || !expense_amount) {
      return NextResponse.json({ error: 'Category and amount are required' }, { status: 400 })
    }

    const result = await client.query(`
      INSERT INTO expense_tracking_master 
        (expense_category, trip_id, booking_reference, expense_amount, payment_status,
         payment_date, vendor_name, vendor_payout_id, description, notes, receipt_url, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `, [
      expense_category,
      trip_id || null,
      booking_reference || null,
      expense_amount,
      payment_status || 'Pending',
      payment_date || null,
      vendor_name || null,
      vendor_payout_id || null,
      description || null,
      notes || null,
      receipt_url || null,
      created_by || 'System'
    ])

    return NextResponse.json({
      success: true,
      expense: result.rows[0],
      message: 'Expense created successfully'
    })

  } catch (error: unknown) {
    console.error('Expense POST error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create expense', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

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
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    const allowedFields = [
      'expense_category', 'trip_id', 'booking_reference', 'expense_amount', 
      'payment_status', 'payment_date', 'vendor_name', 'vendor_payout_id',
      'description', 'notes', 'receipt_url'
    ]

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
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
      UPDATE expense_tracking_master 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await client.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      expense: result.rows[0],
      message: 'Expense updated successfully'
    })

  } catch (error: unknown) {
    console.error('Expense PUT error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update expense', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

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
      return NextResponse.json({ error: 'Expense ID is required' }, { status: 400 })
    }

    const result = await client.query(`
      DELETE FROM expense_tracking_master 
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Expense not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Expense deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Expense DELETE error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete expense', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}



