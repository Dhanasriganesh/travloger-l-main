import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    const { searchParams } = new URL(request.url)
    const queryId = searchParams.get('queryId')
    const guestId = searchParams.get('guestId')
    if (!queryId || !guestId) return NextResponse.json({ error: 'queryId and guestId required' }, { status: 400 })
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS guest_documents (
        id SERIAL PRIMARY KEY,
        query_id TEXT NOT NULL,
        guest_id INTEGER NOT NULL,
        pan_url TEXT,
        passport_front_url TEXT,
        passport_back_url TEXT,
        flight_urls JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(query_id, guest_id)
      );
      CREATE INDEX IF NOT EXISTS idx_guest_documents_query_guest ON guest_documents(query_id, guest_id);
    `)
    const res = await client.query('SELECT * FROM guest_documents WHERE query_id=$1 AND guest_id=$2 LIMIT 1', [queryId, guestId])
    return NextResponse.json({ doc: res.rows[0] || null })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  } finally {
    await client.end()
  }
}

export async function POST(request: Request) {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) return NextResponse.json({ error: 'Database not configured' }, { status: 500 })

  const client = new Client({ connectionString: dbUrl })
  try {
    const body = await request.json()
    const { queryId, guestId, panUrl, passportFrontUrl, passportBackUrl, flightUrls } = body
    if (!queryId || !guestId) return NextResponse.json({ error: 'queryId and guestId required' }, { status: 400 })
    await client.connect()
    await client.query(`
      CREATE TABLE IF NOT EXISTS guest_documents (
        id SERIAL PRIMARY KEY,
        query_id TEXT NOT NULL,
        guest_id INTEGER NOT NULL,
        pan_url TEXT,
        passport_front_url TEXT,
        passport_back_url TEXT,
        flight_urls JSONB,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        UNIQUE(query_id, guest_id)
      );
      CREATE INDEX IF NOT EXISTS idx_guest_documents_query_guest ON guest_documents(query_id, guest_id);
    `)

    const result = await client.query(
      `INSERT INTO guest_documents (query_id, guest_id, pan_url, passport_front_url, passport_back_url, flight_urls)
       VALUES ($1,$2,$3,$4,$5,$6)
       ON CONFLICT (query_id, guest_id)
       DO UPDATE SET pan_url=COALESCE(EXCLUDED.pan_url, guest_documents.pan_url),
                     passport_front_url=COALESCE(EXCLUDED.passport_front_url, guest_documents.passport_front_url),
                     passport_back_url=COALESCE(EXCLUDED.passport_back_url, guest_documents.passport_back_url),
                     flight_urls=COALESCE(EXCLUDED.flight_urls, guest_documents.flight_urls),
                     updated_at=NOW()
       RETURNING *`,
      [queryId, guestId, panUrl || null, passportFrontUrl || null, passportBackUrl || null, Array.isArray(flightUrls) ? JSON.stringify(flightUrls) : (flightUrls || null)]
    )
    return NextResponse.json({ doc: result.rows[0] })
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || 'Failed' }, { status: 500 })
  } finally {
    await client.end()
  }
}












