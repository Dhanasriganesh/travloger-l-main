import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentLinkId = searchParams.get('razorpay_payment_link_id')
    const paymentId = searchParams.get('razorpay_payment_id')
    const paymentLinkReferenceId = searchParams.get('razorpay_payment_link_reference_id')
    const paymentLinkStatus = searchParams.get('razorpay_payment_link_status')
    
    console.log('Payment callback received:', {
      paymentLinkId,
      paymentId,
      paymentLinkReferenceId,
      paymentLinkStatus
    })
    
    // Find booking by razorpay_payment_link (which stores the payment link ID)
    if (paymentLinkId) {
      const { data: bookings, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .or(`razorpay_order_id.eq.${paymentLinkId},razorpay_payment_link.ilike.%${paymentLinkId}%`)
      
      if (!fetchError && bookings && bookings.length > 0) {
        const booking = bookings[0]
        
        // Update booking status if payment was successful
        if (paymentLinkStatus === 'paid') {
          const { error: updateError } = await supabase
            .from('bookings')
            .update({
              status: 'Confirmed',
              payment_status: 'Paid',
              razorpay_payment_id: paymentId,
              updated_at: new Date().toISOString()
            })
            .eq('id', booking.id)
          
          if (updateError) {
            console.error('Error updating booking:', updateError)
          } else {
            console.log('Booking updated successfully:', booking.id)
          }
          
          // Redirect to success page
          return NextResponse.redirect(
            new URL(`/payment-success?bookingId=${booking.id}`, request.url)
          )
        }
      }
    }
    
    // If payment status is not paid or booking not found
    return NextResponse.redirect(new URL('/payment-failed', request.url))
    
  } catch (error: any) {
    console.error('Error in payment callback:', error)
    return NextResponse.redirect(new URL('/payment-failed', request.url))
  }
}

// Webhook handler for Razorpay events
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const event = body.event
    const payload = body.payload?.payment_link?.entity || body.payload?.payment?.entity
    
    console.log('Razorpay webhook received:', event, payload)
    
    if (event === 'payment_link.paid' || event === 'payment.captured') {
      const paymentLinkId = payload.payment_link_id || payload.order_id
      const paymentId = payload.id
      
      // Find and update booking
      const { data: bookings } = await supabase
        .from('bookings')
        .select('*')
        .or(`razorpay_order_id.eq.${paymentLinkId},razorpay_payment_link.ilike.%${paymentLinkId}%`)
      
      if (bookings && bookings.length > 0) {
        const booking = bookings[0]
        
        await supabase
          .from('bookings')
          .update({
            status: 'Confirmed',
            payment_status: 'Paid',
            razorpay_payment_id: paymentId,
            updated_at: new Date().toISOString()
          })
          .eq('id', booking.id)
        
        console.log('Booking confirmed via webhook:', booking.id)
      }
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error: any) {
    console.error('Error in webhook handler:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}




