import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

type NotificationTemplateRow = {
  id: number
  template_name: string
  channel: 'WhatsApp' | 'Email' | 'SMS'
  template_id: string
  message_content: string
  linked_automation: string | null
  integration_reference: string | null
  lead_source_reference: string | null
  status: 'Active' | 'Inactive'
  notes: string | null
  last_updated_by: string | null
  updated_at: string
  created_at: string
}

async function ensureTable(client: Client) {
  const result = await client.query(`
    SELECT EXISTS (
      SELECT FROM information_schema.tables
      WHERE table_name = 'notification_template_master'
    )
  `)

  if (!result.rows[0]?.exists) {
    await client.query(`
      CREATE TABLE notification_template_master (
        id SERIAL PRIMARY KEY,
        template_name VARCHAR(255) NOT NULL,
        channel VARCHAR(20) NOT NULL,
        template_id VARCHAR(255) NOT NULL,
        message_content TEXT NOT NULL,
        linked_automation VARCHAR(255),
        integration_reference VARCHAR(255),
        lead_source_reference VARCHAR(255),
        status VARCHAR(20) DEFAULT 'Active',
        notes TEXT,
        last_updated_by VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
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
    const channel = searchParams.get('channel')
    const status = searchParams.get('status')
    const integration = searchParams.get('integration')

    let query = `SELECT * FROM notification_template_master WHERE 1=1`
    const params: any[] = []
    let index = 1

    if (channel) {
      query += ` AND channel = $${index++}`
      params.push(channel)
    }

    if (status) {
      query += ` AND status = $${index++}`
      params.push(status)
    }

    if (integration) {
      query += ` AND integration_reference = $${index++}`
      params.push(integration)
    }

    query += ` ORDER BY updated_at DESC`

    const templates = await client.query<NotificationTemplateRow>(query, params)
    return NextResponse.json({ templates: templates.rows })
  } catch (error: unknown) {
    console.error('Notification template GET error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to fetch templates', details: message }, { status: 500 })
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
      template_name,
      channel,
      template_id,
      message_content,
      linked_automation,
      integration_reference,
      lead_source_reference,
      status,
      notes,
      last_updated_by
    } = body

    if (!template_name || !channel || !template_id || !message_content) {
      return NextResponse.json({ error: 'Template name, channel, template ID, and message content are required' }, { status: 400 })
    }

    const result = await client.query<NotificationTemplateRow>(
      `
        INSERT INTO notification_template_master (
          template_name,
          channel,
          template_id,
          message_content,
          linked_automation,
          integration_reference,
          lead_source_reference,
          status,
          notes,
          last_updated_by
        )
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
        RETURNING *
      `,
      [
        template_name,
        channel,
        template_id,
        message_content,
        linked_automation || null,
        integration_reference || null,
        lead_source_reference || null,
        status || 'Active',
        notes || null,
        last_updated_by || 'System'
      ]
    )

    return NextResponse.json({ success: true, template: result.rows[0] })
  } catch (error: unknown) {
    console.error('Notification template POST error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to create template', details: message }, { status: 500 })
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
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const allowedFields = [
      'template_name',
      'channel',
      'template_id',
      'message_content',
      'linked_automation',
      'integration_reference',
      'lead_source_reference',
      'status',
      'notes',
      'last_updated_by'
    ]

    const setStatements: string[] = []
    const values: any[] = []
    let index = 1

    for (const [key, value] of Object.entries(updates)) {
      if (allowedFields.includes(key) && value !== undefined) {
        setStatements.push(`${key} = $${index++}`)
        values.push(value)
      }
    }

    if (setStatements.length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    setStatements.push(`updated_at = NOW()`)
    values.push(id)

    const result = await client.query<NotificationTemplateRow>(
      `
        UPDATE notification_template_master
        SET ${setStatements.join(', ')}
        WHERE id = $${index}
        RETURNING *
      `,
      values
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, template: result.rows[0] })
  } catch (error: unknown) {
    console.error('Notification template PUT error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update template', details: message }, { status: 500 })
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
      return NextResponse.json({ error: 'Template ID is required' }, { status: 400 })
    }

    const result = await client.query(
      `
        DELETE FROM notification_template_master
        WHERE id = $1
        RETURNING id
      `,
      [id]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error: unknown) {
    console.error('Notification template DELETE error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to delete template', details: message }, { status: 500 })
  } finally {
    await client.end()
  }
}


