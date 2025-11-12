import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  const missing = [
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !supabaseServiceKey ? 'SUPABASE_SERVICE_ROLE_KEY' : null,
  ].filter(Boolean)
  throw new Error(
    `[Supabase] Missing required environment variable(s): ${missing.join(
      ', '
    )}. Update your .env(.local) file and restart the dev server.`
  )
}

export const supabaseServer = createClient(supabaseUrl, supabaseServiceKey)
