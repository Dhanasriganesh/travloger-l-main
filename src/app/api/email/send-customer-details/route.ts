import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'
import path from 'path'
import fs from 'fs'

// Create transporter using Gmail (same as other email APIs)
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

export async function POST(request: NextRequest) {
  console.log('=== CUSTOMER DETAILS EMAIL API DEBUG START ===')
  try {
    // Check if environment variables are set
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not set')
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set')
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('❌ Email service not configured - missing environment variables')
      console.error('GMAIL_USER:', process.env.GMAIL_USER)
      console.error('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? '***hidden***' : 'Not set')
      return NextResponse.json(
        { error: 'Email service not configured - missing GMAIL_USER or GMAIL_APP_PASSWORD' },
        { status: 500 }
      )
    }

    const requestBody = await request.json()
    console.log('📧 Customer Details Email API received request body:', requestBody)
    
    const { 
      employeeEmail, 
      employeeName, 
      customerName, 
      customerEmail, 
      customerPhone, 
      destination, 
      numberOfTravelers, 
      travelDates, 
      source, 
      customNotes 
    } = requestBody

    console.log('📧 Parsed customer details email data:', {
      employeeEmail,
      employeeName,
      customerName,
      customerEmail,
      customerPhone,
      destination,
      numberOfTravelers,
      travelDates,
      source,
      customNotes
    })

    if (!employeeEmail || !employeeName || !customerName || !customerEmail) {
      console.error('❌ Missing required fields:', {
        employeeEmail: !!employeeEmail,
        employeeName: !!employeeName,
        customerName: !!customerName,
        customerEmail: !!customerEmail
      })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transporter = createTransporter()

    // Email content
    const subject = `New Lead Assignment - ${customerName} (${destination})`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Lead Assignment</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .customer-card { background: white; border-radius: 10px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .customer-info { display: flex; align-items: center; margin-bottom: 20px; }
          .customer-avatar { width: 60px; height: 60px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-right: 20px; }
          .customer-details h3 { margin: 0 0 10px 0; color: #333; }
          .contact-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .contact-item { display: flex; align-items: center; margin: 10px 0; }
          .contact-item svg { width: 20px; height: 20px; margin-right: 10px; color: #1976d2; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .logo { max-width: 120px; height: auto; margin-bottom: 15px; }
          .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 15px 0; }
          .info-item { background: #f8f9fa; padding: 10px; border-radius: 6px; }
          .info-label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; }
          .info-value { color: #333; font-size: 14px; margin-top: 2px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="Travloger Logo" class="logo" />
            <h1>🎯 New Lead Assignment</h1>
            <p>You have been assigned a new customer for ${destination}</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${employeeName}</strong>,</p>
            
            <p>Great news! You have been assigned a new customer for your expertise in <strong>${destination}</strong>. Please review the customer details below and reach out to them as soon as possible.</p>
            
            <div class="customer-card">
              <div class="customer-info">
                <div class="customer-avatar">
                  ${customerName.charAt(0).toUpperCase()}
                </div>
                <div class="customer-details">
                  <h3>${customerName}</h3>
                  <p style="color: #555; margin: 0;">Your New Customer</p>
                </div>
              </div>
              
              <div class="contact-info">
                <p style="font-weight: bold; margin-bottom: 10px; color: #1976d2;">Contact Details:</p>
                <div class="contact-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
                  <a href="mailto:${customerEmail}" style="color: #333; text-decoration: none;">${customerEmail}</a>
                </div>
                <div class="contact-item">
                  <svg fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path></svg>
                  <a href="tel:${customerPhone}" style="color: #333; text-decoration: none;">${customerPhone}</a>
                </div>
              </div>
              
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Destination</div>
                  <div class="info-value">${destination}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Travelers</div>
                  <div class="info-value">${numberOfTravelers || 'Not specified'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Travel Dates</div>
                  <div class="info-value">${travelDates || 'Not specified'}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Lead Source</div>
                  <div class="info-value">${source}</div>
                </div>
              </div>
              
              ${customNotes ? `
                <div class="highlight">
                  <p style="margin: 0; font-size: 14px;"><strong>Customer Notes:</strong> ${customNotes}</p>
                </div>
              ` : ''}
              
              <div class="highlight">
                <p style="margin: 0; font-size: 14px;"><strong>Action Required:</strong> Please contact the customer within 24 hours to discuss their travel requirements and provide personalized assistance.</p>
              </div>
            </div>
            
            <p>We trust you to provide excellent service and create an unforgettable travel experience for ${customerName}.</p>
            <p style="margin-top: 20px;">Best regards,<br>The Travloger Team</p>
          </div>
          <div class="footer">
            <p>&copy; ${new Date().getFullYear()} Travloger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `
    
    const textContent = `
      Dear ${employeeName},

      You have been assigned a new customer for ${destination}.

      Customer Details:
      Name: ${customerName}
      Email: ${customerEmail}
      Phone: ${customerPhone}
      Destination: ${destination}
      Travelers: ${numberOfTravelers || 'Not specified'}
      Travel Dates: ${travelDates || 'Not specified'}
      Lead Source: ${source}
      ${customNotes ? `Notes: ${customNotes}` : ''}

      Action Required: Please contact the customer within 24 hours to discuss their travel requirements and provide personalized assistance.

      Best regards,
      The Travloger Team
    `

    // Prepare logo attachment
    const logoPath = path.join(process.cwd(), 'src', 'assets', 'images', 'logo.png')
    let attachments = []
    
    try {
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: 'logo.png',
          path: logoPath,
          cid: 'logo' // This is the content ID used in the HTML
        })
        console.log('📧 Logo attachment added:', logoPath)
      } else {
        console.log('⚠️ Logo file not found at:', logoPath)
      }
    } catch (error) {
      console.error('❌ Error adding logo attachment:', error)
    }

    const mailOptions = {
      from: {
        name: 'Travloger',
        address: process.env.GMAIL_USER
      },
      to: employeeEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: attachments,
    }

    console.log('📧 Sending customer details email to employee:', employeeEmail)
    console.log('📧 From:', process.env.GMAIL_USER)
    console.log('📧 Subject:', subject)
    
    // Test the connection first
    try {
      console.log('🔍 Testing SMTP connection...')
      await transporter.verify()
      console.log('✅ SMTP connection verified successfully')
    } catch (verifyError) {
      console.error('❌ SMTP connection failed:', verifyError)
      const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
      console.error('❌ SMTP Error details:', {
        message: errorMessage,
        code: (verifyError as any)?.code,
        response: (verifyError as any)?.response
      })
      throw new Error(`SMTP connection failed: ${errorMessage}`)
    }
    
    console.log('📧 Sending email...')
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Customer details email sent to employee successfully!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📧 Response:', info.response)
    
    return NextResponse.json({ 
      success: true,
      messageId: info.messageId,
      message: 'Customer details email sent to employee successfully'
    })
  } catch (error: any) {
    console.error('❌ Error sending customer details email to employee:', error)
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    })
    console.log('=== CUSTOMER DETAILS EMAIL API DEBUG END ===')
    return NextResponse.json({ 
      error: `Failed to send email: ${error.message}`,
      details: error.message
    }, { status: 500 })
  }
}

