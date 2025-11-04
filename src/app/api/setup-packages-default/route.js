import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'

export async function POST() {
  try {
    // Use PostgREST RPC helper if available; fall back to direct SQL via http if configured
    const { error } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
          IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_schema = 'public' AND table_name = 'packages' AND column_name = 'status'
          ) THEN
            ALTER TABLE public.packages ALTER COLUMN status SET DEFAULT 'Active';
          END IF;
        END $$;
      `
    })
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    return NextResponse.json({ updated: true, message: "packages.status default set to 'Active'" })
  } catch (e) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}



