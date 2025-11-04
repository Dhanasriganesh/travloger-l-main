import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function POST() {
  try {
    console.log('🚀 Starting UUID to Integer ID conversion...')
    
    // Step 1: Get current data for backup
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
        message: 'No records to migrate. Setting up table for 1000+ ID series.',
        stats: { total_records: 0, min_id: null, max_id: null }
      })
    }
    
    // Step 2: Create backup table
    const { error: backupError } = await supabaseServer.rpc('exec_sql', {
      sql: `CREATE TABLE IF NOT EXISTS leads_backup_uuid AS SELECT * FROM leads;`
    })
    
    if (backupError) {
      console.error('Error creating backup:', backupError)
      return NextResponse.json(
        { error: 'Failed to create backup table' },
        { status: 500 }
      )
    }
    
    // Step 3: Add new integer ID column
    const { error: addColumnError } = await supabaseServer.rpc('exec_sql', {
      sql: `ALTER TABLE leads ADD COLUMN new_id BIGSERIAL;`
    })
    
    if (addColumnError) {
      console.error('Error adding new_id column:', addColumnError)
      return NextResponse.json(
        { error: 'Failed to add new_id column' },
        { status: 500 }
      )
    }
    
    // Step 4: Update new_id with sequential values starting from 1000
    const { error: updateError } = await supabaseServer.rpc('exec_sql', {
      sql: `
        UPDATE leads 
        SET new_id = 1000 + (ROW_NUMBER() OVER (ORDER BY created_at) - 1);
      `
    })
    
    if (updateError) {
      console.error('Error updating new_id values:', updateError)
      return NextResponse.json(
        { error: 'Failed to update new_id values' },
        { status: 500 }
      )
    }
    
    // Step 5: Drop old primary key constraint
    const { error: dropPkError } = await supabaseServer.rpc('exec_sql', {
      sql: `ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_pkey;`
    })
    
    if (dropPkError) {
      console.error('Error dropping primary key:', dropPkError)
      return NextResponse.json(
        { error: 'Failed to drop primary key constraint' },
        { status: 500 }
      )
    }
    
    // Step 6: Drop old UUID column
    const { error: dropColumnError } = await supabaseServer.rpc('exec_sql', {
      sql: `ALTER TABLE leads DROP COLUMN id;`
    })
    
    if (dropColumnError) {
      console.error('Error dropping old id column:', dropColumnError)
      return NextResponse.json(
        { error: 'Failed to drop old id column' },
        { status: 500 }
      )
    }
    
    // Step 7: Rename new_id to id
    const { error: renameError } = await supabaseServer.rpc('exec_sql', {
      sql: `ALTER TABLE leads RENAME COLUMN new_id TO id;`
    })
    
    if (renameError) {
      console.error('Error renaming column:', renameError)
      return NextResponse.json(
        { error: 'Failed to rename new_id to id' },
        { status: 500 }
      )
    }
    
    // Step 8: Add primary key constraint
    const { error: addPkError } = await supabaseServer.rpc('exec_sql', {
      sql: `ALTER TABLE leads ADD PRIMARY KEY (id);`
    })
    
    if (addPkError) {
      console.error('Error adding primary key:', addPkError)
      return NextResponse.json(
        { error: 'Failed to add primary key constraint' },
        { status: 500 }
      )
    }
    
    // Step 9: Set sequence to continue from next available ID
    const nextId = 1000 + recordCount
    const { error: seqError } = await supabaseServer.rpc('exec_sql', {
      sql: `SELECT setval(pg_get_serial_sequence('leads', 'id'), ${nextId - 1}, false);`
    })
    
    if (seqError) {
      console.error('Error setting sequence:', seqError)
      return NextResponse.json(
        { error: 'Failed to set sequence' },
        { status: 500 }
      )
    }
    
    // Step 10: Verify the migration
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






