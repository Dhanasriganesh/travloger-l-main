import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

async function ensureTable(client: Client) {
  // Create table if not exists
  await client.query(`
    CREATE TABLE IF NOT EXISTS media_library (
      id SERIAL PRIMARY KEY,
      file_name TEXT NOT NULL,
      image_url TEXT NOT NULL,
      linked_type TEXT NOT NULL,
      title TEXT NOT NULL,
      caption TEXT DEFAULT '',
      upload_date DATE DEFAULT CURRENT_DATE,
      usage_notes TEXT DEFAULT '',
      status TEXT DEFAULT 'Active',
      created_by TEXT DEFAULT 'Travloger.in',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `)
  // Add missing columns for legacy tables
  await client.query(`
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS file_name TEXT NOT NULL DEFAULT '';
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS image_url TEXT NOT NULL DEFAULT '';
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS linked_type TEXT NOT NULL DEFAULT '';
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS title TEXT NOT NULL DEFAULT '';
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS caption TEXT DEFAULT '';
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS upload_date DATE DEFAULT CURRENT_DATE;
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS usage_notes TEXT DEFAULT '';
    ALTER TABLE media_library ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'Active';
  `)
  await client.query(`
    CREATE INDEX IF NOT EXISTS idx_media_library_file_name ON media_library(file_name);
    CREATE INDEX IF NOT EXISTS idx_media_library_linked_type ON media_library(linked_type);
    CREATE INDEX IF NOT EXISTS idx_media_library_status ON media_library(status);
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
      SELECT 
        id, file_name, image_url, linked_type, title, caption,
        upload_date, usage_notes, status, created_by,
        TO_CHAR(created_at, 'DD-MM-YYYY') AS date, created_at, updated_at
      FROM media_library
      ORDER BY created_at DESC
    `)
    
    const mediaItems = result.rows.map(r => ({
      id: r.id,
      file_name: r.file_name,
      image_url: r.image_url,
      linked_type: r.linked_type,
      title: r.title,
      caption: r.caption || '',
      upload_date: r.upload_date ? r.upload_date.toISOString().split('T')[0] : null,
      usage_notes: r.usage_notes || '',
      status: r.status || 'Active',
      created_by: r.created_by,
      date: r.date
    }))
    return NextResponse.json({ mediaItems })
  } catch (error: any) {
    console.error('MediaLibrary GET error:', error)
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
    console.error('MediaLibrary POST - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }

  const fileName: string = body.fileName?.trim() || body.file_name?.trim() || 'image'
  if (!body.imageUrl && !body.image_url) {
    return NextResponse.json({ error: 'Image URL is required' }, { status: 400 })
  }
  if (!body.linkedType && !body.linked_type) {
    return NextResponse.json({ error: 'Linked type is required' }, { status: 400 })
  }
  if (!body.title?.trim()) {
    return NextResponse.json({ error: 'Title is required' }, { status: 400 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      fileName,
      body.imageUrl || body.image_url,
      body.linkedType || body.linked_type,
      body.title.trim(),
      body.caption?.trim() || '',
      body.uploadDate || body.upload_date || null,
      body.usageNotes?.trim() || body.usage_notes?.trim() || '',
      body.status || 'Active'
    ]
    
    const insert = await client.query(
      `INSERT INTO media_library (
        file_name, image_url, linked_type, title, caption, upload_date, usage_notes, status
      )
      VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`,
      values
    )
    return NextResponse.json({ id: insert.rows[0].id, message: 'Media item created' })
  } catch (error: any) {
    console.error('MediaLibrary POST error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to create media item' }, { status: 500 })
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
    console.error('MediaLibrary PUT - JSON parse error:', error)
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
  }
  
  const id = Number(body.id)
  if (!id) return NextResponse.json({ error: 'Invalid id' }, { status: 400 })

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await ensureTable(client)
    
    const values = [
      body.fileName?.trim() || body.file_name?.trim() || '',
      body.imageUrl || body.image_url || '',
      body.linkedType || body.linked_type || '',
      body.title?.trim() || '',
      body.caption?.trim() || '',
      body.uploadDate || body.upload_date || null,
      body.usageNotes?.trim() || body.usage_notes?.trim() || '',
      body.status || 'Active',
      id
    ]
    
    await client.query(
      `UPDATE media_library SET 
         file_name = $1, image_url = $2, linked_type = $3, title = $4, caption = $5,
         upload_date = $6, usage_notes = $7, status = $8,
         updated_at = NOW()
       WHERE id = $9`,
      values
    )
    return NextResponse.json({ message: 'Media item updated' })
  } catch (error: any) {
    console.error('MediaLibrary PUT error:', error)
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    })
    return NextResponse.json({ error: error.message || 'Failed to update media item' }, { status: 500 })
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
    await client.query('DELETE FROM media_library WHERE id = $1', [id])
    return NextResponse.json({ message: 'Media item deleted' })
  } catch (error: any) {
    console.error('MediaLibrary DELETE error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  } finally {
    await client.end()
  }
}

