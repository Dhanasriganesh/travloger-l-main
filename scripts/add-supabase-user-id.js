// Migration: add supabase_user_id column to employees table
// Usage: node scripts/add-supabase-user-id.js

const path = require('path')
try {
  require('dotenv').config({ path: path.join(process.cwd(), '.env.local') })
} catch (_) {}

const { Client } = require('pg')

async function main() {
  const databaseUrl = process.env.SUPABASE_DB_URL
  if (!databaseUrl) {
    console.error('Missing SUPABASE_DB_URL in environment (.env.local)')
    process.exit(1)
  }
  
  const client = new Client({ connectionString: databaseUrl, ssl: { rejectUnauthorized: false } })
  
  try {
    console.log('Connecting to database...')
    await client.connect()
    
    console.log('Adding supabase_user_id column to employees table...')
    
    // Add supabase_user_id column
    await client.query(`
      ALTER TABLE public.employees 
      ADD COLUMN IF NOT EXISTS supabase_user_id TEXT;
    `)
    console.log('✅ Added supabase_user_id column')
    
    console.log('Migration completed successfully! 🎉')
    
  } catch (e) {
    console.error('Migration failed:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
