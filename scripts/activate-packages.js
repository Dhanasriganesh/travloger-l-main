// Activate Draft packages by setting status to 'Active'
// Usage: node scripts/activate-packages.js

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

    console.log("Activating packages with status <> 'Active' ...")
    const res = await client.query("update public.packages set status = 'Active', updated_at = now() where status <> 'Active' returning id, name, status, trip_type;")
    console.log(`Updated ${res.rowCount} rows`)
    if (res.rows.length) {
      console.table(res.rows)
    }

    console.log('Fixing placeholder image paths...')
    const img = await client.query("update public.packages set image = '/cards/1.jpg' where image like '/api/placeholder/%' returning id, name, image;")
    console.log(`Fixed ${img.rowCount} image rows`)
    if (img.rows.length) {
      console.table(img.rows)
    }
  } catch (e) {
    console.error('Activation failed:', e.message)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()
