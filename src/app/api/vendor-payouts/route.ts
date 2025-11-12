import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * Ensure the vendor_payout_master table exists
 */
async function ensureTable(client: Client) {
  const tableCheck = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_name = 'vendor_payout_master'
    )
  `)
  
  if (!tableCheck.rows[0].exists) {
    await client.query(`
      CREATE TABLE vendor_payout_master (
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
  }
}

/**
 * GET /api/vendor-payouts
 * Fetch all vendor payouts with filters
 */
export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const vendor_name = searchParams.get('vendor_name')
    const from_date = searchParams.get('from_date')
    const to_date = searchParams.get('to_date')

    let query = `
      SELECT 
        vp.*,
        s.company_name as supplier_full_name,
        s.city as supplier_city
      FROM vendor_payout_master vp
      LEFT JOIN suppliers s ON vp.supplier_id = s.id
      WHERE 1=1
    `
    const params: any[] = []
    let paramIndex = 1

    if (status) {
      query += ` AND vp.payment_status = $${paramIndex}`
      params.push(status)
      paramIndex++
    }

    if (vendor_name) {
      query += ` AND vp.vendor_name ILIKE $${paramIndex}`
      params.push(`%${vendor_name}%`)
      paramIndex++
    }

    if (from_date) {
      query += ` AND vp.payment_due_date >= $${paramIndex}`
      params.push(from_date)
      paramIndex++
    }

    if (to_date) {
      query += ` AND vp.payment_due_date <= $${paramIndex}`
      params.push(to_date)
      paramIndex++
    }

    query += ` ORDER BY 
      CASE 
        WHEN vp.payment_status = 'Overdue' THEN 1
        WHEN vp.payment_status = 'Pending' THEN 2
        WHEN vp.payment_status = 'Paid' THEN 3
        ELSE 4
      END,
      vp.payment_due_date ASC
    `

    const result = await client.query(query, params)

    const payouts = result.rows.map(r => ({
      id: r.id,
      vendor_name: r.vendor_name,
      supplier_id: r.supplier_id,
      supplier_full_name: r.supplier_full_name,
      supplier_city: r.supplier_city,
      booking_reference: r.booking_reference || '',
      trip_id: r.trip_id || '',
      service_type: r.service_type || '',
      payable_amount: parseFloat(r.payable_amount) || 0,
      payment_due_date: r.payment_due_date,
      payment_status: r.payment_status || 'Pending',
      payment_date: r.payment_date,
      payment_mode: r.payment_mode || '',
      transaction_reference: r.transaction_reference || '',
      bank_name: r.bank_name || '',
      upi_id: r.upi_id || '',
      notes: r.notes || '',
      created_by: r.created_by,
      created_at: r.created_at,
      updated_at: r.updated_at
    }))

    return NextResponse.json({ payouts })

  } catch (error: unknown) {
    console.error('Vendor Payouts GET error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch vendor payouts', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * POST /api/vendor-payouts
 * Create a new vendor payout
 */
export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const {
      vendor_name,
      supplier_id,
      booking_reference,
      trip_id,
      service_type,
      payable_amount,
      payment_due_date,
      payment_status,
      payment_date,
      payment_mode,
      transaction_reference,
      bank_name,
      upi_id,
      notes,
      created_by
    } = body

    if (!vendor_name || !payable_amount || !payment_due_date) {
      return NextResponse.json({ error: 'Vendor name, payable amount, and due date are required' }, { status: 400 })
    }

    // Check if payment is overdue
    const dueDate = new Date(payment_due_date)
    const today = new Date()
    let finalStatus = payment_status || 'Pending'
    
    if (finalStatus === 'Pending' && dueDate < today) {
      finalStatus = 'Overdue'
    }

    const result = await client.query(`
      INSERT INTO vendor_payout_master 
        (vendor_name, supplier_id, booking_reference, trip_id, service_type,
         payable_amount, payment_due_date, payment_status, payment_date,
         payment_mode, transaction_reference, bank_name, upi_id, notes, created_by)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
      RETURNING *
    `, [
      vendor_name,
      supplier_id || null,
      booking_reference || null,
      trip_id || null,
      service_type || null,
      payable_amount,
      payment_due_date,
      finalStatus,
      payment_date || null,
      payment_mode || null,
      transaction_reference || null,
      bank_name || null,
      upi_id || null,
      notes || null,
      created_by || 'System'
    ])

    return NextResponse.json({
      success: true,
      payout: result.rows[0],
      message: 'Vendor payout created successfully'
    })

  } catch (error: unknown) {
    console.error('Vendor Payout POST error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create vendor payout', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * PUT /api/vendor-payouts
 * Update an existing vendor payout
 */
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
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 })
    }

    const updateFields = []
    const values = []
    let paramIndex = 1

    const allowedFields = [
      'vendor_name', 'supplier_id', 'booking_reference', 'trip_id', 'service_type',
      'payable_amount', 'payment_due_date', 'payment_status', 'payment_date',
      'payment_mode', 'transaction_reference', 'bank_name', 'upi_id', 'notes'
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

    // Add updated_at
    updateFields.push(`updated_at = NOW()`)
    values.push(id)

    const query = `
      UPDATE vendor_payout_master 
      SET ${updateFields.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `

    const result = await client.query(query, values)

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vendor payout not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      payout: result.rows[0],
      message: 'Vendor payout updated successfully'
    })

  } catch (error: unknown) {
    console.error('Vendor Payout PUT error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update vendor payout', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

/**
 * DELETE /api/vendor-payouts
 * Delete a vendor payout
 */
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
      return NextResponse.json({ error: 'Payout ID is required' }, { status: 400 })
    }

    const result = await client.query(`
      DELETE FROM vendor_payout_master 
      WHERE id = $1
      RETURNING *
    `, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Vendor payout not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Vendor payout deleted successfully'
    })

  } catch (error: unknown) {
    console.error('Vendor Payout DELETE error:', error)
    const errMsg = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete vendor payout', details: errMsg }, { status: 500 })
  } finally {
    await client.end()
  }
}

