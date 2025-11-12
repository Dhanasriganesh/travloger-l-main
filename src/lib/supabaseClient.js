import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  const missing = [
    !supabaseUrl ? 'NEXT_PUBLIC_SUPABASE_URL' : null,
    !supabaseAnonKey ? 'NEXT_PUBLIC_SUPABASE_ANON_KEY' : null,
  ].filter(Boolean)
  throw new Error(
    `[Supabase] Missing required environment variable(s): ${missing.join(
      ', '
    )}. Update your .env(.local) file and restart the dev server.`
  )
}

// Safe diagnostics: verifies env presence without leaking secrets
if (typeof window !== 'undefined') {
  // Minimal format check to catch trailing spaces or malformed values without exposing secrets
  const urlLooksOk = /^https:\/\/.+\.(supabase\.co|supabase\.in)/.test(
    supabaseUrl
  )
  const keyLooksJwtLike =
    typeof supabaseAnonKey === 'string' && supabaseAnonKey.split('.').length === 3
  if (!urlLooksOk || !keyLooksJwtLike) {
    console.warn(
      '[Supabase] Env vars detected but may be malformed (URL should be https://*.supabase.co and key should be a JWT-like string).'
    )
  }
}

// Create and export the Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    flowType: 'pkce'
  }
})

// Add global error handler for auth errors
if (typeof window !== 'undefined') {
  supabase.auth.onAuthStateChange((event, session) => {
    if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
      // Clear any corrupted auth data on sign out
      const projectId = supabaseUrl.split('//')[1]?.split('.')[0]
      if (projectId) {
        localStorage.removeItem(`sb-${projectId}-auth-token`)
      }
    }
  })
}
