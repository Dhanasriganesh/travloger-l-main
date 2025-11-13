import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'
import { randomUUID } from 'crypto'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

type AuditLogRow = {
  id: number
  log_id: string
  activity_timestamp: string
  user_name: string
  module: string
  action_type: 'Create' | 'Update' | 'Delete' | 'Automation Trigger'
  old_value: string | null
  new_value: string | null
  ip_address: string | null
  notes: string | null
  created_at: string
}

async function ensureTable(client: Client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'audit_log_master'
    )
  `)

  if (!result.rows[0]?.exists) {
    await client.query(`
      CREATE TABLE audit_log_master (
        id SERIAL PRIMARY KEY,
        log_id VARCHAR(64) NOT NULL UNIQUE,
        activity_timestamp TIMESTAMP NOT NULL,
        user_name VARCHAR(255) NOT NULL,
        module VARCHAR(255) NOT NULL,
        action_type VARCHAR(50) NOT NULL,
        old_value TEXT,
        new_value TEXT,
        ip_address VARCHAR(100),
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW()
      )
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS audit_log_module_idx ON audit_log_master(module)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS audit_log_action_idx ON audit_log_master(action_type)
    `)
    await client.query(`
      CREATE INDEX IF NOT EXISTS audit_log_timestamp_idx ON audit_log_master(activity_timestamp)
    `)
  }
}

export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const module = searchParams.get('module')
    const action = searchParams.get('action')
    const user = searchParams.get('user')
    const limit = parseInt(searchParams.get('limit') || '200', 10)

    let query = `SELECT * FROM audit_log_master WHERE 1=1`
    const params: any[] = []
    let index = 1

    if (module) {
      query += ` AND module = $${index++}`
      params.push(module)
    }

    if (action) {
      query += ` AND action_type = $${index++}`
      params.push(action)
    }

    if (user) {
      query += ` AND user_name = $${index++}`
      params.push(user)
    }

    query += ` ORDER BY activity_timestamp DESC, id DESC`
    query += ` LIMIT $${index}`
    params.push(Number.isFinite(limit) ? Math.min(limit, 1000) : 200)

    const logsResult = await client.query(query, params)
    const logs = logsResult.rows as AuditLogRow[]

    return NextResponse.json({ logs })
  } catch (error: unknown) {
    console.error('Audit log GET error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch audit logs', details: message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const {
      log_id,
      activity_timestamp,
      user_name,
      module,
      action_type,
      old_value,
      new_value,
      ip_address,
      notes
    } = body

    if (!activity_timestamp || !user_name || !module || !action_type) {
      return NextResponse.json(
        { error: 'Activity timestamp, user name, module, and action type are required' },
        { status: 400 }
      )
    }

    const auditLogId = log_id || randomUUID()

    const result = await client.query(
      `
        INSERT INTO audit_log_master (
          log_id,
          activity_timestamp,
          user_name,
          module,
          action_type,
          old_value,
          new_value,
          ip_address,
          notes
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
        RETURNING *
      `,
      [
        auditLogId,
        activity_timestamp,
        user_name,
        module,
        action_type,
        old_value || null,
        new_value || null,
        ip_address || null,
        notes || null
      ]
    )

    const log = result.rows[0] as AuditLogRow
    return NextResponse.json({ success: true, log })
  } catch (error: unknown) {
    console.error('Audit log POST error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create audit log', details: message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function PUT(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: 'Log ID is required' }, { status: 400 })
    }

    const allowed = [
      'notes'
    ]

    const statements: string[] = []
    const values: any[] = []
    let index = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        statements.push(`${key} = $${index++}`)
        values.push(value)
      }
    }

    if (statements.length === 0) {
      return NextResponse.json({ error: 'Only notes can be updated for audit logs' }, { status: 400 })
    }

    values.push(id)

    const result = await client.query(
      `
        UPDATE audit_log_master
        SET ${statements.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 })
    }

    const log = result.rows[0] as AuditLogRow
    return NextResponse.json({ success: true, log })
  } catch (error: unknown) {
    console.error('Audit log PUT error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update audit log', details: message }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function DELETE(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  const client = new Client({ connectionString: dbUrl })

  try {
    await client.connect()
    await ensureTable(client)

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Audit log ID is required' }, { status: 400 })
    }

    const result = await client.query(
      `
        DELETE FROM audit_log_master
        WHERE id = $1
        RETURNING id
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Audit log not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Audit log DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete audit log', details: message }, { status: 500 })
  } finally {
    await client.end()
  }
}


