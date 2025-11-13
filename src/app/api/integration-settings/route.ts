import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

type IntegrationSettingRow = {
  id: number
  integration_name: string
  api_key: string
  endpoint_url: string
  integration_type: 'Messaging' | 'Lead' | 'Payment' | 'Analytics' | 'Other'
  last_synced: string | null
  connection_status: 'Active' | 'Inactive'
  added_by: string
  notes: string | null
  created_at: string
  updated_at: string
}

async function ensureTable(client: Client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'integration_settings_master'
    )
  `)

  if (!result.rows[0]?.exists) {
    await client.query(`
      CREATE TABLE integration_settings_master (
        id SERIAL PRIMARY KEY,
        integration_name VARCHAR(255) NOT NULL,
        api_key TEXT NOT NULL,
        endpoint_url TEXT NOT NULL,
        integration_type VARCHAR(50) NOT NULL,
        last_synced TIMESTAMP,
        connection_status VARCHAR(20) DEFAULT 'Active',
        added_by VARCHAR(255) NOT NULL,
        notes TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `)

    await client.query(`CREATE INDEX IF NOT EXISTS integration_settings_name_idx ON integration_settings_master(integration_name)`)
    await client.query(`CREATE INDEX IF NOT EXISTS integration_settings_type_idx ON integration_settings_master(integration_type)`)
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
    const type = searchParams.get('type')
    const status = searchParams.get('status')

    let query = `SELECT * FROM integration_settings_master WHERE 1=1`
    const params: any[] = []
    let index = 1

    if (type) {
      query += ` AND integration_type = $${index++}`
      params.push(type)
    }

    if (status) {
      query += ` AND connection_status = $${index++}`
      params.push(status)
    }

    query += ` ORDER BY updated_at DESC`

    const integrationResult = await client.query(query, params)
    const settings = integrationResult.rows as IntegrationSettingRow[]
    return NextResponse.json({ settings })
  } catch (error: unknown) {
    console.error('Integration settings GET error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch integration settings', details: message }, { status: 500 })
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
      integration_name,
      api_key,
      endpoint_url,
      integration_type,
      last_synced,
      connection_status,
      added_by,
      notes
    } = body

    if (!integration_name || !api_key || !endpoint_url || !integration_type || !added_by) {
      return NextResponse.json({
        error: 'Integration name, API key, endpoint URL, integration type, and added by are required'
      }, { status: 400 })
    }

    const result = await client.query(
      `
        INSERT INTO integration_settings_master (
          integration_name,
          api_key,
          endpoint_url,
          integration_type,
          last_synced,
          connection_status,
          added_by,
          notes
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8)
        RETURNING *
      `,
      [
        integration_name,
        api_key,
        endpoint_url,
        integration_type,
        last_synced ? new Date(last_synced) : null,
        connection_status || 'Active',
        added_by,
        notes || null
      ]
    )

    const integration = result.rows[0] as IntegrationSettingRow
    return NextResponse.json({ success: true, integration })
  } catch (error: unknown) {
    console.error('Integration settings POST error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create integration setting', details: message }, { status: 500 })
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
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const allowed = [
      'integration_name',
      'api_key',
      'endpoint_url',
      'integration_type',
      'last_synced',
      'connection_status',
      'added_by',
      'notes'
    ]

    const statements: string[] = []
    const values: any[] = []
    let index = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowed.includes(key) && value !== undefined) {
        if (key === 'last_synced' && value) {
          statements.push(`last_synced = $${index++}`)
          values.push(new Date(value))
        } else {
          statements.push(`${key} = $${index++}`)
          values.push(value)
        }
      }
    }

    if (statements.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    statements.push(`updated_at = NOW()`)
    values.push(id)

    const result = await client.query(
      `
        UPDATE integration_settings_master
        SET ${statements.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Integration setting not found' }, { status: 404 })
    }

    const integration = result.rows[0] as IntegrationSettingRow
    return NextResponse.json({ success: true, integration })
  } catch (error: unknown) {
    console.error('Integration settings PUT error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update integration setting', details: message }, { status: 500 })
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
      return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 })
    }

    const result = await client.query(
      `
        DELETE FROM integration_settings_master
        WHERE id = $1
        RETURNING id
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Integration setting not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Integration settings DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete integration setting', details: message }, { status: 500 })
  } finally {
    await client.end()
  }
}


