import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { amount, customer_name, customer_email, customer_phone, description, booking_id } = body
    
    if (!amount || !customer_email) {
      return NextResponse.json(
        { error: 'Amount and customer email are required' },
        { status: 400 }
      )
    }
    
    // Get Razorpay keys from environment
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET
    
    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error('Razorpay credentials not configured')
      return NextResponse.json(
        { error: 'Razorpay credentials not configured. Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to environment variables.' },
        { status: 500 }
      )
    }
    
    console.log('Using Razorpay Key ID:', razorpayKeyId.substring(0, 15) + '...')
    console.log('Creating payment link for amount:', amount)
    
    // Create Razorpay payment link
    const auth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString('base64')
    
    const paymentLinkData = {
      amount: Math.round(amount * 100), // Convert to paise
      currency: 'INR',
      description: description || 'Travel Package Payment',
      customer: {
        name: customer_name,
        email: customer_email,
        contact: customer_phone
      },
      notify: {
        sms: true,
        email: true
      },
      reminder_enable: true,
      notes: {
        booking_id: booking_id || ''
      },
      callback_url: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/razorpay/callback`,
      callback_method: 'get'
    }
    
    console.log('Sending request to Razorpay with data:', {
      amount: paymentLinkData.amount,
      currency: paymentLinkData.currency,
      customer: paymentLinkData.customer,
      description: paymentLinkData.description
    })
    
    const response = await fetch('https://api.razorpay.com/v1/payment_links', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(paymentLinkData)
    })
    
    console.log('Razorpay API response status:', response.status)
    
    const data = await response.json()
    console.log('Razorpay API response data:', data)
    
    if (!response.ok) {
      console.error('❌ Razorpay API error:', data)
      console.error('Error code:', data.error?.code)
      console.error('Error description:', data.error?.description)
      return NextResponse.json(
        { error: data.error?.description || 'Failed to create payment link' },
        { status: response.status }
      )
    }
    
    console.log('✅ Razorpay payment link created successfully!')
    console.log('Payment Link Details:', {
      id: data.id,
      short_url: data.short_url,
      order_id: data.order_id,
      status: data.status,
      amount: data.amount,
      currency: data.currency
    })
    
    // Verify the link was created by fetching it back
    console.log('Verifying payment link was created...')
    const verifyResponse = await fetch(`https://api.razorpay.com/v1/payment_links/${data.id}`, {
      headers: {
        'Authorization': `Basic ${auth}`
      }
    })
    
    if (verifyResponse.ok) {
      console.log('✅ Verification successful - payment link exists in Razorpay')
    } else {
      console.error('⚠️ Verification failed - payment link might not exist')
    }
    
    return NextResponse.json({
      success: true,
      payment_link: data.short_url,
      payment_link_id: data.id,
      order_id: data.id, // This is the payment link ID (plink_xxxxx)
      razorpay_order_id: data.order_id // This is the actual order ID
    })
    
  } catch (error: any) {
    console.error('Error creating payment link:', error)
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    )
  }
}

