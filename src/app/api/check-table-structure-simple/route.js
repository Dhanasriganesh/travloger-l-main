import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function GET() {
  try {
    console.log('🔍 Checking leads table structure...')
    
    // First, let's try to get a simple count to see if the table exists
    const { data: countData, error: countError } = await supabaseServer
      .from('leads')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('Error checking table:', countError)
      return NextResponse.json({
        success: false,
        error: 'Table check failed',
        details: countError.message,
        code: countError.code
      })
    }
    
    // Get sample data to see the structure
    const { data: sampleData, error: sampleError } = await supabaseServer
      .from('leads')
      .select('*')
      .limit(1)
    
    if (sampleError) {
      console.error('Error getting sample data:', sampleError)
      return NextResponse.json({
        success: false,
        error: 'Sample data failed',
        details: sampleError.message
      })
    }
    
    // Analyze the structure
    const recordCount = countData || 0
    const sampleRecord = sampleData?.[0]
    
    if (!sampleRecord) {
      return NextResponse.json({
        success: true,
        message: 'Table exists but is empty',
        record_count: recordCount,
        columns: []
      })
    }
    
    // Extract column information from the sample record
    const columns = Object.keys(sampleRecord).map(key => ({
      name: key,
      type: typeof sampleRecord[key],
      sample_value: sampleRecord[key],
      is_uuid: typeof sampleRecord[key] === 'string' && sampleRecord[key].includes('-') && sampleRecord[key].length === 36
    }))
    
    console.log('✅ Table structure analyzed:', columns)
    
    return NextResponse.json({
      success: true,
      message: 'Table structure analyzed successfully',
      record_count: recordCount,
      columns: columns,
      sample_record: sampleRecord,
      analysis: {
        has_uuid_id: columns.some(col => col.name === 'id' && col.is_uuid),
        needs_migration: columns.some(col => col.name === 'id' && col.is_uuid),
        available_columns: columns.map(col => col.name)
      }
    })
    
  } catch (error) {
    console.error('❌ Error in table structure check:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error.message
    })
  }
}






