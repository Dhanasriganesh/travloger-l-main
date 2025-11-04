import { NextResponse } from 'next/server'
import { Client } from 'pg'

const alterSql = `
ALTER TABLE IF EXISTS city_content
  ADD COLUMN IF NOT EXISTS "header" JSONB,
  ADD COLUMN IF NOT EXISTS "tripOptions" JSONB,
  ADD COLUMN IF NOT EXISTS "tripHighlights" JSONB,
  ADD COLUMN IF NOT EXISTS "usp" JSONB,
  ADD COLUMN IF NOT EXISTS "faq" JSONB,
  ADD COLUMN IF NOT EXISTS "groupCta" JSONB,
  ADD COLUMN IF NOT EXISTS "reviews" JSONB,
  ADD COLUMN IF NOT EXISTS "brands" JSONB;
`;

export async function POST() {
  const dbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL
  if (!dbUrl) {
    return NextResponse.json({
      message: 'SUPABASE_DB_URL or DATABASE_URL not set. Run SQL manually in Supabase.',
      sql: alterSql
    }, { status: 200 })
  }

  const client = new Client({ connectionString: dbUrl })
  try {
    await client.connect()
    await client.query(alterSql)
    return NextResponse.json({ ok: true, message: 'city_content columns added if missing' })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  } finally {
    await client.end()
  }
}


