import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function POST() {
  try {
    console.log('🚀 Starting lead ID migration to 1000+ series...')
    
    // Step 1: Get current statistics
    const { data: currentStats, error: statsError } = await supabaseServer
      .from('leads')
      .select('id')
    
    if (statsError) {
      console.error('Error fetching current stats:', statsError)
      return NextResponse.json(
        { error: 'Failed to fetch current statistics' },
        { status: 500 }
      )
    }
    
    const recordCount = currentStats?.length || 0
    const maxId = recordCount > 0 ? Math.max(...currentStats.map(r => r.id)) : 0
    
    console.log(`Current records: ${recordCount}, Max ID: ${maxId}`)
    
    if (recordCount === 0) {
      // No records to migrate, just set sequence to start from 1000
      const { error: seqError } = await supabaseServer.rpc('exec_sql', {
        sql: `SELECT setval(pg_get_serial_sequence('leads', 'id'), 999, false);`
      })
      
      if (seqError) {
        console.error('Error setting sequence:', seqError)
        return NextResponse.json(
          { error: 'Failed to set sequence' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        message: 'No records to migrate. Sequence set to start from 1000.',
        stats: { total_records: 0, min_id: null, max_id: null }
      })
    }
    
    // Step 2: If max ID < 1000, we need to migrate
    if (maxId < 1000) {
      console.log('Migrating existing records to 1000+ range...')
      
      // Create backup table first
      const { error: backupError } = await supabaseServer.rpc('exec_sql', {
        sql: `CREATE TABLE IF NOT EXISTS leads_backup AS SELECT * FROM leads;`
      })
      
      if (backupError) {
        console.error('Error creating backup:', backupError)
        return NextResponse.json(
          { error: 'Failed to create backup' },
          { status: 500 }
        )
      }
      
      // Get all leads ordered by ID
      const { data: allLeads, error: fetchError } = await supabaseServer
        .from('leads')
        .select('*')
        .order('id', { ascending: true })
      
      if (fetchError) {
        console.error('Error fetching leads:', fetchError)
        return NextResponse.json(
          { error: 'Failed to fetch leads' },
          { status: 500 }
        )
      }
      
      // Update each lead with new ID
      const updates = []
      for (let i = 0; i < allLeads.length; i++) {
        const lead = allLeads[i]
        const newId = 1000 + i
        
        const { error: updateError } = await supabaseServer
          .from('leads')
          .update({ id: newId })
          .eq('id', lead.id)
        
        if (updateError) {
          console.error(`Error updating lead ${lead.id}:`, updateError)
          updates.push({ id: lead.id, success: false, error: updateError.message })
        } else {
          updates.push({ id: lead.id, newId, success: true })
        }
      }
      
      // Set sequence to next available ID
      const nextId = 1000 + allLeads.length
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
      
      // Get final statistics
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
        message: 'Lead IDs successfully migrated to 1000+ series',
        stats: {
          total_records: finalRecordCount,
          min_id: finalMinId,
          max_id: finalMaxId
        },
        migration_details: {
          records_migrated: allLeads.length,
          successful_updates: updates.filter(u => u.success).length,
          failed_updates: updates.filter(u => !u.success).length,
          sequence_set_to: nextId
        }
      })
      
    } else {
      // Records already in 1000+ range
      return NextResponse.json({
        success: true,
        message: 'Records already in 1000+ range. No migration needed.',
        stats: { total_records: recordCount, min_id: Math.min(...currentStats.map(r => r.id)), max_id: maxId }
      })
    }
    
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
    
    return NextResponse.json({
      current_stats: {
        total_records: recordCount,
        min_id: minId,
        max_id: maxId,
        needs_migration: minId !== null && minId < 1000
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






