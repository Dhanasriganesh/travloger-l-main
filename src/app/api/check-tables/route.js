import { NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabaseClient'

export async function GET() {
  try {
    const tables = ['packages', 'employees', 'bookings', 'leads', 'blogs', 'payments']
    const results = {}
    const missingTables = []
    const existingTables = []

    for (const table of tables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('id')
          .limit(1)
        
        if (error) {
          if (error.code === 'PGRST116') {
            // Table doesn't exist
            results[table] = { exists: false, error: 'Table not found' }
            missingTables.push(table)
          } else {
            results[table] = { exists: false, error: error.message }
            missingTables.push(table)
          }
        } else {
          results[table] = { exists: true, error: null }
          existingTables.push(table)
        }
      } catch (err) {
        results[table] = { exists: false, error: err.message }
        missingTables.push(table)
      }
    }

    return NextResponse.json({
      success: true,
      summary: {
        total: tables.length,
        existing: existingTables.length,
        missing: missingTables.length
      },
      existingTables,
      missingTables,
      details: results,
      instructions: missingTables.length > 0 ? {
        message: 'Some tables are missing. Please run the database setup.',
        sqlFile: 'DATABASE_SETUP.sql',
        steps: [
          '1. Go to your Supabase dashboard',
          '2. Navigate to SQL Editor',
          '3. Copy and paste the contents of DATABASE_SETUP.sql',
          '4. Run the SQL script',
          '5. Refresh this page to verify tables are created'
        ]
      } : {
        message: 'All required tables exist!',
        nextSteps: [
          '1. Set up your environment variables',
          '2. Test the admin panel functionality',
          '3. Add sample data if needed'
        ]
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: 'Failed to check tables',
      details: error.message,
      instructions: {
        message: 'Unable to connect to Supabase. Please check your configuration.',
        steps: [
          '1. Verify your Supabase URL and API key',
          '2. Check your .env.local file',
          '3. Ensure Supabase project is active'
        ]
      }
    }, { status: 500 })
  }
}

