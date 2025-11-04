import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function POST() {
  try {
    console.log('🚀 Starting UUID to Integer ID conversion (simplified approach)...')
    
    // Step 1: Get current data
    const { data: currentLeads, error: fetchError } = await supabaseServer
      .from('leads')
      .select('*')
      .order('created_at', { ascending: true })
    
    if (fetchError) {
      console.error('Error fetching current leads:', fetchError)
      return NextResponse.json(
        { error: 'Failed to fetch current leads' },
        { status: 500 }
      )
    }
    
    const recordCount = currentLeads?.length || 0
    console.log(`Found ${recordCount} records to migrate`)
    
    if (recordCount === 0) {
      return NextResponse.json({
        success: true,
        message: 'No records to migrate.',
        stats: { total_records: 0, min_id: null, max_id: null }
      })
    }
    
    // Step 2: Create a new table with integer IDs
    console.log('Creating new leads table with integer IDs...')
    
    // First, let's create a new table structure
    const { error: createTableError } = await supabaseServer.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS leads_new (
          id BIGSERIAL PRIMARY KEY,
          name TEXT NOT NULL,
          email TEXT,
          phone TEXT,
          source TEXT DEFAULT 'Website',
          status TEXT DEFAULT 'New',
          destination TEXT,
          number_of_travelers TEXT,
          travel_dates TEXT,
          custom_notes TEXT,
          assigned_employee_id TEXT,
          assigned_employee_name TEXT,
          assigned_employee_email TEXT,
          assigned_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW()
        );
      `
    })
    
    if (createTableError) {
      console.error('Error creating new table:', createTableError)
      // Try a different approach - maybe the exec_sql function doesn't exist
      return NextResponse.json(
        { error: 'Failed to create new table. exec_sql function may not be available.' },
        { status: 500 }
      )
    }
    
    // Step 3: Insert data with new integer IDs
    console.log('Inserting data with new integer IDs...')
    
    const insertData = currentLeads.map((lead, index) => ({
      id: 1000 + index,
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status || 'New',
      destination: lead.destination,
      number_of_travelers: lead.number_of_travelers,
      travel_dates: lead.travel_dates,
      custom_notes: lead.custom_notes,
      assigned_employee_id: lead.assigned_employee_id,
      assigned_employee_name: lead.assigned_employee_name,
      assigned_employee_email: lead.assigned_employee_email,
      assigned_at: lead.assigned_at,
      created_at: lead.created_at,
      updated_at: lead.updated_at || lead.created_at
    }))
    
    const { data: insertedData, error: insertError } = await supabaseServer
      .from('leads_new')
      .insert(insertData)
      .select('*')
    
    if (insertError) {
      console.error('Error inserting data:', insertError)
      return NextResponse.json(
        { error: 'Failed to insert data into new table' },
        { status: 500 }
      )
    }
    
    // Step 4: Drop old table and rename new table
    console.log('Replacing old table with new table...')
    
    const { error: dropOldError } = await supabaseServer.rpc('exec_sql', {
      sql: `
        DROP TABLE IF EXISTS leads_backup_uuid;
        ALTER TABLE leads RENAME TO leads_backup_uuid;
        ALTER TABLE leads_new RENAME TO leads;
      `
    })
    
    if (dropOldError) {
      console.error('Error replacing tables:', dropOldError)
      return NextResponse.json(
        { error: 'Failed to replace tables' },
        { status: 500 }
      )
    }
    
    // Step 5: Set sequence to continue from next available ID
    const nextId = 1000 + recordCount
    const { error: seqError } = await supabaseServer.rpc('exec_sql', {
      sql: `SELECT setval(pg_get_serial_sequence('leads', 'id'), ${nextId - 1}, false);`
    })
    
    if (seqError) {
      console.error('Error setting sequence:', seqError)
      // This is not critical, we can continue
    }
    
    // Step 6: Verify the migration
    const { data: finalStats, error: finalStatsError } = await supabaseServer
      .from('leads')
      .select('id')
    
    if (finalStatsError) {
      console.error('Error fetching final stats:', finalStatsError)
      return NextResponse.json(
        { error: 'Failed to fetch final statistics' },
        { status: 500 }
      )
    }
    
    const finalRecordCount = finalStats?.length || 0
    const finalMinId = finalRecordCount > 0 ? Math.min(...finalStats.map(r => r.id)) : null
    const finalMaxId = finalRecordCount > 0 ? Math.max(...finalStats.map(r => r.id)) : null
    
    console.log('✅ Migration completed successfully!')
    
    return NextResponse.json({
      success: true,
      message: 'Successfully converted UUID IDs to integer IDs starting from 1000',
      stats: {
        total_records: finalRecordCount,
        min_id: finalMinId,
        max_id: finalMaxId
      },
      migration_details: {
        records_migrated: recordCount,
        sequence_set_to: nextId,
        backup_created: 'leads_backup_uuid'
      }
    })
    
  } catch (error) {
    console.error('❌ Migration failed:', error)
    return NextResponse.json(
      { error: 'Internal server error during migration' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // Get current statistics
    const { data: stats, error } = await supabaseServer
      .from('leads')
      .select('id')
    
    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch statistics' },
        { status: 500 }
      )
    }
    
    const recordCount = stats?.length || 0
    const minId = recordCount > 0 ? Math.min(...stats.map(r => r.id)) : null
    const maxId = recordCount > 0 ? Math.max(...stats.map(r => r.id)) : null
    
    // Check if IDs are integers or UUIDs
    const isInteger = recordCount > 0 && typeof stats[0].id === 'number'
    const isUUID = recordCount > 0 && typeof stats[0].id === 'string' && stats[0].id.includes('-')
    
    return NextResponse.json({
      current_stats: {
        total_records: recordCount,
        min_id: minId,
        max_id: maxId,
        id_type: isInteger ? 'integer' : isUUID ? 'uuid' : 'unknown',
        needs_conversion: isUUID || (isInteger && minId < 1000)
      }
    })
    
  } catch (error) {
    console.error('Error fetching stats:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






