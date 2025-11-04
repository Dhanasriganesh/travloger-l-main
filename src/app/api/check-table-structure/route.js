import { NextResponse } from 'next/server'
import { supabaseServer } from '../../../lib/supabaseServer.js'

export async function GET() {
  try {
    // Get table structure information
    const { data: tableInfo, error: tableError } = await supabaseServer.rpc('exec_sql', {
      sql: `
        SELECT 
          column_name, 
          data_type, 
          is_nullable, 
          column_default,
          character_maximum_length
        FROM information_schema.columns 
        WHERE table_name = 'leads' 
        AND table_schema = 'public'
        ORDER BY ordinal_position;
      `
    })
    
    if (tableError) {
      console.error('Error fetching table structure:', tableError)
      return NextResponse.json(
        { error: 'Failed to fetch table structure' },
        { status: 500 }
      )
    }
    
    // Get sample data
    const { data: sampleData, error: sampleError } = await supabaseServer
      .from('leads')
      .select('*')
      .limit(3)
    
    if (sampleError) {
      console.error('Error fetching sample data:', sampleError)
      return NextResponse.json(
        { error: 'Failed to fetch sample data' },
        { status: 500 }
      )
    }
    
    // Get count and ID range
    const { data: countData, error: countError } = await supabaseServer.rpc('exec_sql', {
      sql: `
        SELECT 
          COUNT(*) as total_records,
          MIN(id) as min_id,
          MAX(id) as max_id,
          pg_typeof(id) as id_type
        FROM leads;
      `
    })
    
    if (countError) {
      console.error('Error fetching count data:', countError)
      return NextResponse.json(
        { error: 'Failed to fetch count data' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      table_structure: tableInfo,
      sample_data: sampleData,
      statistics: countData?.[0],
      analysis: {
        id_type: countData?.[0]?.id_type,
        needs_migration: countData?.[0]?.id_type?.includes('uuid') || false,
        recommendation: countData?.[0]?.id_type?.includes('uuid') 
          ? 'Table uses UUIDs. Need to convert to integer IDs for 1000+ series.'
          : 'Table uses integer IDs. Migration may be needed if IDs < 1000.'
      }
    })
    
  } catch (error) {
    console.error('Error in table structure check:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}






