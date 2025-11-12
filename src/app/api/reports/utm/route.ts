import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * GET /api/reports/utm
 * Get UTM tracking reports and analytics
 * 
 * Query Parameters:
 * - utm_source: Filter by UTM source
 * - utm_campaign: Filter by UTM campaign
 * - from_date: Start date (YYYY-MM-DD)
 * - to_date: End date (YYYY-MM-DD)
 * - group_by: 'source' | 'campaign' | 'source_campaign' | 'all'
 */
export async function GET(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const utmSource = searchParams.get('utm_source')
    const utmCampaign = searchParams.get('utm_campaign')
    const fromDate = searchParams.get('from_date')
    const toDate = searchParams.get('to_date')
    const groupBy = searchParams.get('group_by') || 'source_campaign'

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    try {
      // Build WHERE clause
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      // Filter by UTM source
      if (utmSource) {
        conditions.push(`l.utm_source = $${paramIndex}`)
        params.push(utmSource)
        paramIndex++
      }

      // Filter by UTM campaign
      if (utmCampaign) {
        conditions.push(`l.utm_campaign = $${paramIndex}`)
        params.push(utmCampaign)
        paramIndex++
      }

      // Filter by date range
      if (fromDate) {
        conditions.push(`l.created_at >= $${paramIndex}::date`)
        params.push(fromDate)
        paramIndex++
      }

      if (toDate) {
        conditions.push(`l.created_at <= $${paramIndex}::date + INTERVAL '1 day'`)
        params.push(toDate)
        paramIndex++
      }

      // Only include leads with UTM tracking
      conditions.push(`(l.utm_source IS NOT NULL AND l.utm_source != '')`)

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      // Build GROUP BY clause based on requested grouping
      let groupByClause = ''
      let selectFields = ''

      switch (groupBy) {
        case 'source':
          selectFields = `
            l.utm_source as utm_source,
            '' as utm_campaign,
            '' as utm_medium
          `
          groupByClause = 'GROUP BY l.utm_source'
          break

        case 'campaign':
          selectFields = `
            '' as utm_source,
            l.utm_campaign as utm_campaign,
            '' as utm_medium
          `
          groupByClause = 'GROUP BY l.utm_campaign'
          break

        case 'source_campaign':
          selectFields = `
            l.utm_source as utm_source,
            l.utm_campaign as utm_campaign,
            l.utm_medium as utm_medium
          `
          groupByClause = 'GROUP BY l.utm_source, l.utm_campaign, l.utm_medium'
          break

        default: // 'all' - no grouping, return individual records
          selectFields = `
            l.utm_source as utm_source,
            l.utm_campaign as utm_campaign,
            l.utm_medium as utm_medium
          `
          groupByClause = 'GROUP BY l.utm_source, l.utm_campaign, l.utm_medium'
      }

      // Main query for UTM analytics
      const analyticsQuery = `
        SELECT 
          ${selectFields},
          COUNT(l.id) as total_leads,
          COUNT(DISTINCT l.email) as unique_leads,
          ls.source_name as matched_source_name,
          ls.avg_cpa as source_avg_cpa,
          ls.success_rate_percent as source_success_rate,
          MIN(l.created_at) as first_lead_date,
          MAX(l.created_at) as last_lead_date
        FROM leads l
        LEFT JOIN lead_source_detailed ls ON l.lead_source_id = ls.id
        ${whereClause}
        ${groupByClause}
        ORDER BY total_leads DESC
      `

      const analyticsResult = await client.query(analyticsQuery, params)

      // Get overall summary
      const summaryQuery = `
        SELECT 
          COUNT(l.id) as total_leads,
          COUNT(DISTINCT l.utm_source) as unique_sources,
          COUNT(DISTINCT l.utm_campaign) as unique_campaigns,
          COUNT(DISTINCT l.email) as unique_contacts,
          COUNT(CASE WHEN l.lead_source_id IS NOT NULL THEN 1 END) as matched_to_source,
          COUNT(CASE WHEN l.lead_source_id IS NULL THEN 1 END) as unmatched
        FROM leads l
        ${whereClause}
      `

      const summaryResult = await client.query(summaryQuery, params)

      // Get top sources
      const topSourcesQuery = `
        SELECT 
          l.utm_source,
          COUNT(l.id) as lead_count,
          COUNT(DISTINCT l.email) as unique_leads
        FROM leads l
        ${whereClause}
        GROUP BY l.utm_source
        ORDER BY lead_count DESC
        LIMIT 10
      `

      const topSourcesResult = await client.query(topSourcesQuery, params)

      // Get top campaigns
      const topCampaignsQuery = `
        SELECT 
          l.utm_campaign,
          l.utm_source,
          COUNT(l.id) as lead_count,
          COUNT(DISTINCT l.email) as unique_leads
        FROM leads l
        ${whereClause}
        AND (l.utm_campaign IS NOT NULL AND l.utm_campaign != '')
        GROUP BY l.utm_campaign, l.utm_source
        ORDER BY lead_count DESC
        LIMIT 10
      `

      const topCampaignsResult = await client.query(topCampaignsQuery, params)

      // Get uncategorized leads (with UTM but no match)
      const uncategorizedQuery = `
        SELECT 
          l.utm_source,
          l.utm_campaign,
          l.utm_medium,
          COUNT(l.id) as lead_count
        FROM leads l
        LEFT JOIN lead_source_detailed ls ON l.lead_source_id = ls.id
        ${whereClause}
        AND (l.lead_source_id IS NULL OR ls.source_name = 'Uncategorized Source')
        GROUP BY l.utm_source, l.utm_campaign, l.utm_medium
        ORDER BY lead_count DESC
      `

      const uncategorizedResult = await client.query(uncategorizedQuery, params)

      return NextResponse.json({
        success: true,
        filters: {
          utm_source: utmSource,
          utm_campaign: utmCampaign,
          from_date: fromDate,
          to_date: toDate,
          group_by: groupBy
        },
        summary: summaryResult.rows[0],
        analytics: analyticsResult.rows,
        top_sources: topSourcesResult.rows,
        top_campaigns: topCampaignsResult.rows,
        uncategorized: uncategorizedResult.rows
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('❌ Error generating UTM report:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to generate UTM report', 
      details: message 
    }, { status: 500 })
  }
}

/**
 * POST /api/reports/utm/export
 * Export UTM report data as CSV
 */
export async function POST(request: NextRequest) {
  const dbUrl = getDbUrl()
  if (!dbUrl) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 })
  }

  try {
    const body = await request.json()
    const { utm_source, utm_campaign, from_date, to_date } = body

    const client = new Client({ connectionString: dbUrl })
    await client.connect()

    try {
      const conditions: string[] = []
      const params: any[] = []
      let paramIndex = 1

      if (utm_source) {
        conditions.push(`l.utm_source = $${paramIndex}`)
        params.push(utm_source)
        paramIndex++
      }

      if (utm_campaign) {
        conditions.push(`l.utm_campaign = $${paramIndex}`)
        params.push(utm_campaign)
        paramIndex++
      }

      if (from_date) {
        conditions.push(`l.created_at >= $${paramIndex}::date`)
        params.push(from_date)
        paramIndex++
      }

      if (to_date) {
        conditions.push(`l.created_at <= $${paramIndex}::date + INTERVAL '1 day'`)
        params.push(to_date)
        paramIndex++
      }

      conditions.push(`(l.utm_source IS NOT NULL AND l.utm_source != '')`)

      const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''

      const exportQuery = `
        SELECT 
          l.id,
          l.name,
          l.email,
          l.phone,
          l.destination,
          l.utm_source,
          l.utm_medium,
          l.utm_campaign,
          ls.source_name as matched_source,
          l.created_at,
          l.source as lead_source
        FROM leads l
        LEFT JOIN lead_source_detailed ls ON l.lead_source_id = ls.id
        ${whereClause}
        ORDER BY l.created_at DESC
      `

      const result = await client.query(exportQuery, params)

      // Convert to CSV format
      const headers = ['ID', 'Name', 'Email', 'Phone', 'Destination', 'UTM Source', 'UTM Medium', 'UTM Campaign', 'Matched Source', 'Created At', 'Lead Source']
      const csvRows = [headers.join(',')]

      result.rows.forEach(row => {
        const values = [
          row.id,
          `"${row.name || ''}"`,
          `"${row.email || ''}"`,
          `"${row.phone || ''}"`,
          `"${row.destination || ''}"`,
          `"${row.utm_source || ''}"`,
          `"${row.utm_medium || ''}"`,
          `"${row.utm_campaign || ''}"`,
          `"${row.matched_source || 'Uncategorized'}"`,
          row.created_at,
          `"${row.lead_source || ''}"`
        ]
        csvRows.push(values.join(','))
      })

      const csvContent = csvRows.join('\n')

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="utm_report_${new Date().toISOString().split('T')[0]}.csv"`
        }
      })

    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('❌ Error exporting UTM report:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ 
      error: 'Failed to export UTM report', 
      details: message 
    }, { status: 500 })
  }
}





