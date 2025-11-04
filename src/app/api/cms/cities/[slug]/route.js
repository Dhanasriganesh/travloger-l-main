import { NextResponse } from 'next/server'
import { supabaseServer } from '@/lib/supabaseServer'

// Table: city_content
// Columns: slug (pk text), hero jsonb, about jsonb, gallery jsonb, contact jsonb, tripOptions jsonb, usp jsonb, faq jsonb, groupCta jsonb, updated_at timestamptz

export async function GET(request, { params }) {
  try {
    const { slug } = await params
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })

    const { data, error } = await supabaseServer
      .from('city_content')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error && error.code !== 'PGRST116') {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      hero: data?.hero || null,
      header: data?.header || null,
      contact: data?.contact || null,
      tripOptions: data?.tripOptions || null,
      tripHighlights: data?.tripHighlights || null,
      usp: data?.usp || null,
      faq: data?.faq || null,
      groupCta: data?.groupCta || null,
      reviews: data?.reviews || null,
      brands: data?.brands || null
    })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const { slug } = await params
    if (!slug) return NextResponse.json({ error: 'slug required' }, { status: 400 })
    
    // Check environment variables
    console.log('SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
    console.log('SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
    
    const body = await request.json()
    
    console.log('PUT /api/cms/cities/[slug] - Received body:', JSON.stringify(body, null, 2))
    console.log('Upload route deployment test - v1.0')

    // Build payload only with provided fields
    const payload = {
      slug,
      updated_at: new Date().toISOString()
    }
    
    // Only include fields that are actually provided in the request
    if (body.hero !== undefined) payload.hero = body.hero
    if (body.header !== undefined) payload.header = body.header
    if (body.contact !== undefined) payload.contact = body.contact
    if (body.tripOptions !== undefined) payload.tripOptions = body.tripOptions
    if (body.tripHighlights !== undefined) payload.tripHighlights = body.tripHighlights
    if (body.usp !== undefined) payload.usp = body.usp
    if (body.faq !== undefined) payload.faq = body.faq
    if (body.groupCta !== undefined) payload.groupCta = body.groupCta
    if (body.reviews !== undefined) payload.reviews = body.reviews
    if (body.brands !== undefined) payload.brands = body.brands

    console.log('PUT /api/cms/cities/[slug] - Final payload:', JSON.stringify(payload, null, 2))

    const { data, error } = await supabaseServer
      .from('city_content')
      .upsert(payload, { onConflict: 'slug' })
      .select('*')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true, content: data })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



