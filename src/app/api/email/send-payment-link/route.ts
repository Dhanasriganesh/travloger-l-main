import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

interface PaymentEmailData {
  member: {
    name: string
    email: string
    phone?: string
    leadId: string
    destination?: string
    travelDate?: string
    travelers?: number
    notes?: string
  }
  itinerary: {
    name: string
    destination: string
    planType?: string
    serviceType?: string
    hotel?: {
      name: string
      mapRate: number
      eb: number
      category: string
    }
    vehicle?: {
      type: string
      rate: number
      acExtra: number
    }
    fixedPlan?: {
      days: number
      adults: number
      pricePerPerson: number
    }
  }
  payment: {
    amount: number
    paymentLink: string
  }
}

const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

const createPaymentEmailTemplate = (data: PaymentEmailData) => {
  const { member, itinerary, payment } = data

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Travel Package - Payment Required</title>
        <style>
            body {
                font-family: 'Manrope', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 700px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background-color: #ffffff;
                padding: 0;
                border-radius: 12px;
                box-shadow: 0 4px 15px rgba(0,0,0,0.1);
                overflow: hidden;
            }
            .header {
                background: linear-gradient(135deg, #00A99D 0%, #008f85 100%);
                padding: 30px;
                text-align: center;
                color: white;
            }
            .logo img {
                max-width: 150px;
                height: auto;
                margin-bottom: 15px;
            }
            .header h1 {
                margin: 0;
                font-size: 24px;
            }
            .content {
                padding: 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .section {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #00A99D;
            }
            .section-title {
                color: #00A99D;
                font-size: 16px;
                font-weight: bold;
                margin: 0 0 15px 0;
                display: flex;
                align-items: center;
            }
            .section-title svg {
                width: 20px;
                height: 20px;
                margin-right: 8px;
            }
            .info-row {
                display: flex;
                justify-content: space-between;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .info-row:last-child {
                border-bottom: none;
            }
            .info-label {
                font-weight: 500;
                color: #666;
            }
            .info-value {
                color: #333;
                font-weight: 600;
            }
            .payment-section {
                background: linear-gradient(135deg, #e8f5f4 0%, #d4eeec 100%);
                padding: 25px;
                border-radius: 8px;
                margin: 25px 0;
                text-align: center;
                border: 2px solid #00A99D;
            }
            .amount {
                font-size: 32px;
                font-weight: bold;
                color: #00A99D;
                margin: 15px 0;
            }
            .payment-button {
                display: inline-block;
                background-color: #00A99D;
                color: white;
                padding: 15px 40px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: bold;
                margin: 15px 0;
                font-size: 16px;
                box-shadow: 0 4px 10px rgba(0,169,157,0.3);
                transition: all 0.3s;
            }
            .payment-button:hover {
                background-color: #008f85;
                box-shadow: 0 6px 15px rgba(0,169,157,0.4);
            }
            .important-note {
                background-color: #fff3cd;
                border: 1px solid #ffc107;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
                font-size: 14px;
            }
            .footer {
                text-align: center;
                padding: 20px;
                background-color: #f8f9fa;
                color: #666;
                font-size: 14px;
            }
            .footer a {
                color: #00A99D;
                text-decoration: none;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="header">
                <div class="logo">
                    <img src="https://travloger.in/logo.png" alt="Travloger Logo">
                </div>
                <h1>Your Travel Package Awaits!</h1>
            </div>
            
            <div class="content">
                <div class="greeting">
                    Dear ${member.name},
                </div>
                
                <p>Thank you for choosing Travloger for your travel needs! We're excited to help you create unforgettable memories.</p>
                
                <!-- Member Details Section -->
                <div class="section">
                    <h3 class="section-title">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        Member Details
                    </h3>
                    <div class="info-row">
                        <span class="info-label">Lead ID:</span>
                        <span class="info-value">#${member.leadId}</span>
                    </div>
                    ${member.email ? `
                    <div class="info-row">
                        <span class="info-label">Email:</span>
                        <span class="info-value">${member.email}</span>
                    </div>
                    ` : ''}
                    ${member.phone ? `
                    <div class="info-row">
                        <span class="info-label">Phone:</span>
                        <span class="info-value">${member.phone}</span>
                    </div>
                    ` : ''}
                    ${member.destination ? `
                    <div class="info-row">
                        <span class="info-label">Travel Destination:</span>
                        <span class="info-value">${member.destination}</span>
                    </div>
                    ` : ''}
                    ${member.travelers ? `
                    <div class="info-row">
                        <span class="info-label">Number of Travelers:</span>
                        <span class="info-value">${member.travelers}</span>
                    </div>
                    ` : ''}
                    ${member.travelDate ? `
                    <div class="info-row">
                        <span class="info-label">Travel Date:</span>
                        <span class="info-value">${member.travelDate}</span>
                    </div>
                    ` : ''}
                    ${member.notes ? `
                    <div class="info-row">
                        <span class="info-label">Notes:</span>
                        <span class="info-value">${member.notes}</span>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Itinerary Details Section -->
                <div class="section">
                    <h3 class="section-title">
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Itinerary Details
                    </h3>
                    <div class="info-row">
                        <span class="info-label">Package:</span>
                        <span class="info-value">${itinerary.name}</span>
                    </div>
                    <div class="info-row">
                        <span class="info-label">Destination:</span>
                        <span class="info-value">${itinerary.destination}</span>
                    </div>
                    ${itinerary.planType ? `
                    <div class="info-row">
                        <span class="info-label">Plan Type:</span>
                        <span class="info-value">${itinerary.planType}</span>
                    </div>
                    ` : ''}
                    ${itinerary.serviceType ? `
                    <div class="info-row">
                        <span class="info-label">Service Type:</span>
                        <span class="info-value">${itinerary.serviceType}</span>
                    </div>
                    ` : ''}
                    
                    ${itinerary.hotel ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #00A99D;">
                        <h4 style="color: #00A99D; margin: 0 0 10px 0; font-size: 14px;">Hotel Information</h4>
                        <div class="info-row">
                            <span class="info-label">Hotel:</span>
                            <span class="info-value">${itinerary.hotel.name}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Map Rate:</span>
                            <span class="info-value">₹${itinerary.hotel.mapRate}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">EB:</span>
                            <span class="info-value">₹${itinerary.hotel.eb}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Category:</span>
                            <span class="info-value">${itinerary.hotel.category}</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${itinerary.vehicle ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #00A99D;">
                        <h4 style="color: #00A99D; margin: 0 0 10px 0; font-size: 14px;">Vehicle Information</h4>
                        <div class="info-row">
                            <span class="info-label">Vehicle Type:</span>
                            <span class="info-value">${itinerary.vehicle.type}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Rate:</span>
                            <span class="info-value">₹${itinerary.vehicle.rate}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">AC Extra:</span>
                            <span class="info-value">₹${itinerary.vehicle.acExtra}</span>
                        </div>
                    </div>
                    ` : ''}
                    
                    ${itinerary.fixedPlan ? `
                    <div style="margin-top: 15px; padding-top: 15px; border-top: 2px solid #00A99D;">
                        <h4 style="color: #00A99D; margin: 0 0 10px 0; font-size: 14px;">Fixed Plan Details</h4>
                        <div class="info-row">
                            <span class="info-label">Duration:</span>
                            <span class="info-value">${itinerary.fixedPlan.days} days</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Adults:</span>
                            <span class="info-value">${itinerary.fixedPlan.adults}</span>
                        </div>
                        <div class="info-row">
                            <span class="info-label">Price per Person:</span>
                            <span class="info-value">₹${itinerary.fixedPlan.pricePerPerson}</span>
                        </div>
                    </div>
                    ` : ''}
                </div>
                
                <!-- Payment Section -->
                <div class="payment-section">
                    <h3 style="color: #00A99D; margin: 0 0 10px 0;">Total Amount</h3>
                    <div class="amount">₹${payment.amount.toLocaleString()}</div>
                    <p style="margin: 10px 0; color: #666;">Complete your booking by making the payment below</p>
                    <a href="${payment.paymentLink}" class="payment-button">
                        Pay Now with Razorpay
                    </a>
                    <p style="margin: 15px 0 0 0; font-size: 12px; color: #666;">Secure payment powered by Razorpay</p>
                </div>
                
                <div class="important-note">
                    <strong>⚠️ Important:</strong> Please complete the payment to confirm your booking. The payment link will expire in 30 days.
                </div>
                
                <p style="margin-top: 30px;">If you have any questions or need assistance, please don't hesitate to contact us.</p>
            </div>
            
            <div class="footer">
                <p><strong>Travloger</strong></p>
                <p>Email: <a href="mailto:support@travloger.in">support@travloger.in</a></p>
                <p>Website: <a href="https://travloger.in">www.travloger.in</a></p>
                <p style="margin-top: 15px; color: #999; font-size: 12px;">
                    © ${new Date().getFullYear()} Travloger. All rights reserved.
                </p>
            </div>
        </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Email service not configured')
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const data: PaymentEmailData = await request.json()

    if (!data.member?.email || !data.payment?.amount || !data.payment?.paymentLink) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: {
        name: 'Travloger',
        address: process.env.GMAIL_USER
      },
      to: data.member.email,
      subject: `Your Travel Package - Payment Required | ${data.itinerary.destination}`,
      html: createPaymentEmailTemplate(data),
    }

    console.log('Sending payment email to:', data.member.email)
    
    await transporter.verify()
    const info = await transporter.sendMail(mailOptions)
    console.log('Payment email sent:', info.messageId)
    
    return NextResponse.json({ 
      success: true,
      messageId: info.messageId
    })

  } catch (error: any) {
    console.error('Error sending payment email:', error)
    return NextResponse.json(
      { error: `Failed to send email: ${error.message}` },
      { status: 500 }
    )
  }
}




