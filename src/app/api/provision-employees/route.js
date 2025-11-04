import { NextResponse } from 'next/server'
import { Client } from 'pg'

export async function GET() {
  const databaseUrl = process.env.SUPABASE_DB_URL
  if (!databaseUrl) {
    return NextResponse.json({ ok: false, error: 'Missing SUPABASE_DB_URL' }, { status: 500 })
  }

  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  try {
    await client.connect()
    await client.query(`
      create table if not exists public.employees (
        id bigserial primary key,
        name text not null,
        email text,
        phone text,
        destination text,
        role text default 'employee',
        status text default 'Active',
        password_hash text,
        is_first_login boolean default true,
        inserted_at timestamptz default now()
      );
    `)
    
    // Add missing columns if table already exists
    await client.query(`
      alter table public.employees add column if not exists destination text;
      alter table public.employees add column if not exists password_hash text;
      alter table public.employees add column if not exists is_first_login boolean default true;
    `)
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  } finally {
    await client.end()
  }
}



