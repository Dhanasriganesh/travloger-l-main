import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// Site-wide CMS storage
// Table: site_content (page text PK, hero jsonb, sections jsonb, updated_at timestamptz)

async function ensureTable() {
  try {
    // Try simple select to see if table exists
    const { error } = await supabaseServer.from('site_content').select('page').limit(1)
    // If error is PGRST116 (relation not found), create table using exec_sql RPC
    if (error && (error as any).code === 'PGRST116') {
      await supabaseServer.rpc('exec_sql', {
        sql: `
          CREATE TABLE IF NOT EXISTS site_content (
            page TEXT PRIMARY KEY,
            hero JSONB,
            sections JSONB,
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      })
    }
  } catch {}
}

export async function GET(request: Request, { params }: { params: { page: string } }) {
  try {
    const page = params?.page
    if (!page) return NextResponse.json({ error: 'page required' }, { status: 400 })

    await ensureTable()

    const { data, error } = await supabaseServer
      .from('site_content')
      .select('*')
      .eq('page', page)
      .single()

    if (error && (error as any).code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      hero: data?.hero || null,
      sections: data?.sections || null
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { page: string } }) {
  try {
    const page = params?.page
    if (!page) return NextResponse.json({ error: 'page required' }, { status: 400 })

    await ensureTable()

    const body = await request.json().catch(() => ({}))

    const payload: any = {
      page,
      updated_at: new Date().toISOString()
    }
    if (body.hero !== undefined) payload.hero = body.hero
    if (body.sections !== undefined) payload.sections = body.sections

    const { data, error } = await supabaseServer
      .from('site_content')
      .upsert(payload, { onConflict: 'page' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, content: data })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}








