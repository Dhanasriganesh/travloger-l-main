import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Check payment status with Razorpay and update booking
export async function POST(request: NextRequest) {
  try {
    const { bookingId, razorpayOrderId } = await request.json()
    
    if (!bookingId && !razorpayOrderId) {
      return NextResponse.json(
        { error: 'Booking ID or Razorpay Order ID required' },
        { status: 400 }
      )
    }
    
    // Get Razorpay keys
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      return NextResponse.json(
        { error: 'Razorpay not configured' },
        { status: 500 }
      )
    }
    
    // Find the booking
    let booking: any = null
    if (bookingId) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', bookingId)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Booking not found' },
          { status: 404 }
        )
      }
      booking = data
    } else if (razorpayOrderId) {
      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('razorpay_order_id', razorpayOrderId)
        .single()
      
      if (error || !data) {
        return NextResponse.json(
          { error: 'Booking not found for this order' },
          { status: 404 }
        )
      }
      booking = data
    }
    
    // Ensure booking was found
    if (!booking) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      )
    }
    
    // Check payment status with Razorpay
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')
    
    console.log('Booking data:', {
      id: booking.id,
      razorpay_order_id: booking.razorpay_order_id,
      razorpay_payment_link: booking.razorpay_payment_link
    })
    
    // Get payment link ID from razorpay_order_id or extract from payment link URL
    let paymentLinkId = booking.razorpay_order_id
    
    // If no order ID, try to find the payment link from Razorpay
    if (!paymentLinkId && booking.razorpay_payment_link) {
      console.log('No razorpay_order_id found. Searching Razorpay payment links...')
      console.log('Booking created at:', booking.created_at || booking.booking_date)
      console.log('Customer email:', booking.email)
      console.log('Amount:', booking.amount)
      
      // Calculate timestamp range (within 1 hour of booking creation)
      const bookingTime = new Date(booking.created_at || booking.booking_date).getTime()
      const fromTime = Math.floor((bookingTime - 3600000) / 1000) // 1 hour before
      const toTime = Math.floor((bookingTime + 3600000) / 1000) // 1 hour after
      
      // List payment links with filters
      try {
        const listUrl = `https://api.razorpay.com/v1/payment_links?from=${fromTime}&to=${toTime}`
        console.log('Fetching payment links from:', listUrl)
        
        const listResponse = await fetch(listUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${auth}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (listResponse.ok) {
          const listData = await listResponse.json()
          console.log('Found', listData.count, 'payment links in time range')
          
          // Find payment link by matching criteria
          const amountInPaise = Math.round(parseFloat(booking.amount) * 100)
          console.log('Looking for amount:', amountInPaise, 'paise')
          
          const matchingLink = listData.items?.find((link: any) => {
            const emailMatch = link.customer?.email?.toLowerCase() === booking.email?.toLowerCase()
            const amountMatch = link.amount === amountInPaise
            const urlMatch = link.short_url === booking.razorpay_payment_link
            
            console.log('Checking link:', link.id, {
              email: link.customer?.email,
              emailMatch,
              amount: link.amount,
              amountMatch,
              url: link.short_url,
              urlMatch
            })
            
            return (emailMatch && amountMatch) || urlMatch
          })
          
          if (matchingLink) {
            paymentLinkId = matchingLink.id
            console.log('✅ Found matching payment link ID:', paymentLinkId)
            console.log('Payment link status:', matchingLink.status)
            
            // Update the booking with the payment link ID for future checks
            const { error: updateErr } = await supabase
              .from('bookings')
              .update({ razorpay_order_id: paymentLinkId })
              .eq('id', booking.id)
            
            if (updateErr) {
              console.error('Failed to update booking:', updateErr)
            } else {
              console.log('✅ Updated booking with razorpay_order_id')
            }
          } else {
            console.log('❌ No matching payment link found in Razorpay')
          }
        } else {
          const errorText = await listResponse.text()
          console.error('Failed to list payment links:', errorText)
        }
      } catch (listError: any) {
        console.error('Error listing payment links:', listError.message)
      }
    }
    
    if (!paymentLinkId) {
      console.error('Could not determine payment link ID')
      return NextResponse.json(
        { 
          error: 'Unable to determine payment link ID. Please check Razorpay dashboard manually.',
          status: booking.status,
          booking_id: booking.id
        },
        { status: 200 }
      )
    }
    
    console.log('Checking payment link ID:', paymentLinkId)
    
    // Fetch payment link status from Razorpay
    const razorpayUrl = `https://api.razorpay.com/v1/payment_links/${paymentLinkId}`
    console.log('Fetching from:', razorpayUrl)
    
    try {
      const response = await fetch(razorpayUrl, {
        method: 'GET',
        headers: {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json'
        }
      })
      
      console.log('Razorpay response status:', response.status)
      
      if (!response.ok) {
        const errorText = await response.text()
        console.error('Razorpay API error response:', errorText)
        
        let errorJson
        try {
          errorJson = JSON.parse(errorText)
        } catch {
          errorJson = { description: errorText }
        }
        
        return NextResponse.json(
          { 
            error: `Razorpay error: ${errorJson.error?.description || errorText}`,
            status: booking.status
          },
          { status: 200 } // Return 200 to show current status
        )
      }
      
      const paymentLinkData = await response.json()
      console.log('Payment link status from Razorpay:', paymentLinkData.status)
      console.log('Payment link data:', paymentLinkData)
      
      // Update booking if paid
      if (paymentLinkData.status === 'paid') {
        console.log('Payment is PAID - updating booking status')
        
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            status: 'Confirmed',
            payment_status: 'Paid',
            razorpay_payment_id: paymentLinkData.payments?.[0]?.payment_id || null,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)
        
        if (updateError) {
          console.error('Error updating booking:', updateError)
          return NextResponse.json(
            { error: 'Failed to update booking status in database' },
            { status: 500 }
          )
        }
        
        console.log('Booking status updated to Confirmed')
        
        return NextResponse.json({
          success: true,
          status: 'paid',
          booking: {
            id: booking.id,
            status: 'Confirmed',
            payment_status: 'Paid'
          }
        })
      }
      
      // Return current status (not paid yet)
      console.log('Payment status is:', paymentLinkData.status, '- not paid yet')
      
      return NextResponse.json({
        success: true,
        status: paymentLinkData.status,
        booking: {
          id: booking.id,
          status: booking.status,
          payment_status: booking.payment_status
        }
      })
      
    } catch (fetchError: any) {
      console.error('Error fetching from Razorpay:', fetchError)
      return NextResponse.json(
        { 
          error: 'Failed to connect to Razorpay API: ' + fetchError.message,
          status: booking.status
        },
        { status: 200 }
      )
    }
    
  } catch (error: any) {
    console.error('Error checking payment status:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

