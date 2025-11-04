import { createClient } from '@supabase/supabase-js'

// Supabase configuration
// These should be replaced with your actual Supabase project URL and anon key
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'your-anon-key'

// Safe diagnostics: verifies env presence without leaking secrets
if (typeof window !== 'undefined') {
  const hasUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL
  const hasAnon = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!hasUrl || !hasAnon) {
    // Do not print actual values; just signal missing config
    console.warn('[Supabase] Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Using placeholders. Login will fail.')
  } else {
    // Minimal format check to catch trailing spaces or malformed values without exposing secrets
    const urlLooksOk = /^https:\/\/.+\.(supabase\.co|supabase\.in)/.test(process.env.NEXT_PUBLIC_SUPABASE_URL)
    const keyLooksJwtLike = typeof process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY === 'string' && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.split('.').length === 3
    if (!urlLooksOk || !keyLooksJwtLike) {
      console.warn('[Supabase] Env vars detected but may be malformed (URL should be https://*.supabase.co and key should be a JWT-like string).')
    }
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
