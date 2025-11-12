import { NextRequest, NextResponse } from 'next/server'
import { Client } from 'pg'

const getDbUrl = () => process.env.SUPABASE_DB_URL || process.env.DATABASE_URL

/**
 * Helper function to find matching lead source based on UTM parameters
 */
async function findMatchingLeadSource(
  utmSource: string, 
  utmCampaign: string
): Promise<number | null> {
  const dbUrl = getDbUrl()
  if (!dbUrl || !utmSource) return null

  const client = new Client({ connectionString: dbUrl })
  
  try {
    await client.connect()
    
    // Try to find exact match: utm_source AND utm_campaign
    if (utmCampaign) {
      const exactMatch = await client.query(`
        SELECT id FROM lead_source_detailed 
        WHERE LOWER(TRIM(utm_source)) = LOWER(TRIM($1))
        AND LOWER(TRIM(utm_campaign)) = LOWER(TRIM($2))
        AND status = 'Active'
        LIMIT 1
      `, [utmSource, utmCampaign])
      
      if (exactMatch.rows.length > 0) {
        return exactMatch.rows[0].id
      }
    }
    
    // Try partial match: just utm_source
    const sourceMatch = await client.query(`
      SELECT id FROM lead_source_detailed 
      WHERE LOWER(TRIM(utm_source)) = LOWER(TRIM($1))
      AND (utm_campaign = '' OR utm_campaign IS NULL)
      AND status = 'Active'
      LIMIT 1
    `, [utmSource])
    
    if (sourceMatch.rows.length > 0) {
      return sourceMatch.rows[0].id
    }
    
    // No match found, return Uncategorized Source
    const uncategorized = await client.query(`
      SELECT id FROM lead_source_detailed 
      WHERE source_name = 'Uncategorized Source'
      LIMIT 1
    `)
    
    return uncategorized.rows.length > 0 ? uncategorized.rows[0].id : null
    
  } catch (error) {
    console.error('Error finding matching lead source:', error)
    return null
  } finally {
    await client.end()
  }
}

/**
 * POST /api/leads/webhook
 * Webhook endpoint for Meta Lead Ads and Google Ads
 * 
 * Expected payload formats:
 * 
 * Meta Lead Ads:
 * {
 *   "platform": "meta",
 *   "lead_data": {
 *     "name": "John Doe",
 *     "email": "john@example.com",
 *     "phone": "1234567890",
 *     "utm_source": "facebook",
 *     "utm_medium": "cpc",
 *     "utm_campaign": "summer_campaign",
 *     "destination": "Kashmir",
 *     "custom_notes": "Interested in package tour"
 *   }
 * }
 * 
 * Google Ads:
 * {
 *   "platform": "google",
 *   "lead_data": {
 *     "name": "Jane Smith",
 *     "email": "jane@example.com",
 *     "phone": "0987654321",
 *     "utm_source": "google",
 *     "utm_medium": "cpc",
 *     "utm_campaign": "winter_campaign",
 *     "destination": "Ladakh"
 *   }
 * }
 * 
 * Generic format (for other platforms):
 * {
 *   "name": "Required",
 *   "email": "Required",
 *   "phone": "Required",
 *   "utm_source": "Optional",
 *   "utm_medium": "Optional",
 *   "utm_campaign": "Optional",
 *   "destination": "Optional",
 *   "number_of_travelers": "Optional",
 *   "travel_dates": "Optional",
 *   "custom_notes": "Optional"
 * }
 */
export async function POST(request: NextRequest) {
  try {
    console.log('📥 Webhook received')
    
    const body = await request.json().catch(() => ({}))
    console.log('Webhook payload:', JSON.stringify(body, null, 2))

    // Extract lead data based on platform or use direct format
    let leadData
    if (body.platform === 'meta' || body.platform === 'google') {
      leadData = body.lead_data || {}
    } else {
      leadData = body
    }

    // Validate required fields
    const { name, email, phone } = leadData
    if (!name || !email || !phone) {
      return NextResponse.json(
        { 
          error: 'Missing required fields', 
          required: ['name', 'email', 'phone'],
          received: { name: !!name, email: !!email, phone: !!phone }
        },
        { status: 400 }
      )
    }

    // Extract all fields
    const {
      utm_source,
      utm_medium,
      utm_campaign,
      destination,
      number_of_travelers,
      travel_dates,
      custom_notes,
      source
    } = leadData

    // Determine source based on platform
    let finalSource = source
    if (body.platform === 'meta') {
      finalSource = 'Meta Ads'
    } else if (body.platform === 'google') {
      finalSource = 'Google Ads'
    } else if (utm_source) {
      finalSource = utm_source.charAt(0).toUpperCase() + utm_source.slice(1)
    }

    // Find matching lead source based on UTM parameters
    let leadSourceId = null
    if (utm_source) {
      leadSourceId = await findMatchingLeadSource(
        utm_source || '',
        utm_campaign || ''
      )
      console.log(`🔗 Webhook UTM Tracking: source=${utm_source}, campaign=${utm_campaign}, matched_id=${leadSourceId}`)
    }

    const dbUrl = getDbUrl()
    if (!dbUrl) {
      return NextResponse.json({ 
        error: 'Database not configured' 
      }, { status: 500 })
    }

    // Insert lead with UTM tracking
    const client = new Client({ connectionString: dbUrl })
    try {
      await client.connect()
      
      const insertResult = await client.query(`
        INSERT INTO leads (
          name, email, phone, number_of_travelers, travel_dates,
          source, destination, custom_notes,
          utm_source, utm_medium, utm_campaign, lead_source_id,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW(), NOW()
        ) RETURNING *
      `, [
        name,
        email,
        phone,
        number_of_travelers ?? null,
        travel_dates ?? null,
        finalSource ?? 'Webhook',
        destination ?? null,
        custom_notes ?? null,
        utm_source ?? '',
        utm_medium ?? '',
        utm_campaign ?? '',
        leadSourceId
      ])

      const lead = insertResult.rows[0]
      
      console.log(`✅ Lead created via webhook: ID ${lead.id}`)
      
      return NextResponse.json({ 
        success: true,
        lead_id: lead.id,
        message: 'Lead created successfully',
        utm_tracking: {
          captured: !!(utm_source || utm_medium || utm_campaign),
          matched_source_id: leadSourceId,
          source_name: finalSource
        }
      }, { status: 201 })
      
    } finally {
      await client.end()
    }

  } catch (error) {
    console.error('❌ Error in webhook handler:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: message
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/leads/webhook
 * Test endpoint to verify webhook is working
 */
export async function GET() {
  return NextResponse.json({
    status: 'active',
    endpoint: '/api/leads/webhook',
    methods: ['POST'],
    description: 'Webhook endpoint for Meta Lead Ads, Google Ads, and other lead sources',
    required_fields: ['name', 'email', 'phone'],
    optional_fields: ['utm_source', 'utm_medium', 'utm_campaign', 'destination', 'number_of_travelers', 'travel_dates', 'custom_notes', 'source'],
    example_payload: {
      name: 'John Doe',
      email: 'john@example.com',
      phone: '1234567890',
      utm_source: 'facebook',
      utm_medium: 'cpc',
      utm_campaign: 'summer_campaign',
      destination: 'Kashmir',
      number_of_travelers: '2',
      travel_dates: '2024-06-15 to 2024-06-22'
    }
  })
}





