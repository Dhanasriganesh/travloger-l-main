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
  console.log('=== EMAIL API DEBUG START ===')
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
    console.log('📧 Email API received request body:', requestBody)
    
    const { 
      customerEmail, 
      customerName, 
      destination, 
      employeeName, 
      employeePhone, 
      employeeEmail 
    } = requestBody

    console.log('📧 Parsed email data:', {
      customerEmail,
      customerName,
      destination,
      employeeName,
      employeePhone,
      employeeEmail
    })

    if (!customerEmail || !customerName || !employeeName) {
      console.error('❌ Missing required fields:', {
        customerEmail: !!customerEmail,
        customerName: !!customerName,
        employeeName: !!employeeName
      })
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const transporter = createTransporter()

    // Email content
    const subject = `Your Travel Guide Details - ${destination} Package`
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Travel Guide Details</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .guide-card { background: white; border-radius: 10px; padding: 25px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .guide-info { display: flex; align-items: center; margin-bottom: 20px; }
          .guide-avatar { width: 60px; height: 60px; background: #667eea; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold; margin-right: 20px; }
          .guide-details h3 { margin: 0 0 10px 0; color: #333; }
          .contact-info { background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .contact-item { display: flex; align-items: center; margin: 10px 0; }
          .contact-item svg { width: 20px; height: 20px; margin-right: 10px; color: #1976d2; }
          .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
          .highlight { background: #fff3cd; padding: 15px; border-radius: 8px; border-left: 4px solid #ffc107; margin: 20px 0; }
          .logo { max-width: 120px; height: auto; margin-bottom: 15px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="cid:logo" alt="Travloger Logo" class="logo" />
            <h1>🎉 Your Travel Guide is Assigned!</h1>
            <p>Welcome to your ${destination} adventure with Travloger</p>
          </div>
          
          <div class="content">
            <p>Dear <strong>${customerName}</strong>,</p>
            
            <p>Great news! We've assigned a dedicated travel guide for your ${destination} package. Your guide is ready to make your journey unforgettable!</p>
            
            <div class="guide-card">
              <div class="guide-info">
                <div class="guide-avatar">
                  ${employeeName.charAt(0).toUpperCase()}
                </div>
                <div class="guide-details">
                  <h3>${employeeName}</h3>
                  <p style="color: #666; margin: 0;">Your Personal Travel Guide</p>
                </div>
              </div>
              
              <div class="contact-info">
                <h4 style="margin-top: 0; color: #1976d2;">📞 Contact Information</h4>
                
                ${employeePhone ? `
                <div class="contact-item">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"/>
                  </svg>
                  <strong>Phone:</strong> <a href="tel:${employeePhone}" style="color: #1976d2; text-decoration: none;">${employeePhone}</a>
                </div>
                ` : ''}
                
                ${employeeEmail ? `
                <div class="contact-item">
                  <svg fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/>
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/>
                  </svg>
                  <strong>Email:</strong> <a href="mailto:${employeeEmail}" style="color: #1976d2; text-decoration: none;">${employeeEmail}</a>
                </div>
                ` : ''}
              </div>
            </div>
            
            <div class="highlight">
              <strong>💡 Pro Tip:</strong> Save your guide's contact information and feel free to reach out with any questions about your upcoming trip to ${destination}!
            </div>
            
            <p>Your guide will be in touch with you soon to discuss the details of your trip and answer any questions you might have.</p>
            
            <p>We're excited to be part of your travel journey!</p>
            
            <p>Best regards,<br>
            <strong>The Travloger Team</strong></p>
          </div>
          
          <div class="footer">
            <p>This email was sent because you have a travel package booked with Travloger.</p>
            <p>© 2024 Travloger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
      Your Travel Guide Details - ${destination} Package
      
      Dear ${customerName},
      
      Great news! We've assigned a dedicated travel guide for your ${destination} package.
      
      Your Travel Guide:
      Name: ${employeeName}
      ${employeePhone ? `Phone: ${employeePhone}` : ''}
      ${employeeEmail ? `Email: ${employeeEmail}` : ''}
      
      Your guide will be in touch with you soon to discuss the details of your trip.
      
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
      to: customerEmail,
      subject: subject,
      text: textContent,
      html: htmlContent,
      attachments: attachments,
    }

    console.log('📧 Sending employee details email to:', customerEmail)
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
    console.log('✅ Employee details email sent successfully!')
    console.log('📧 Message ID:', info.messageId)
    console.log('📧 Response:', info.response)
    
    return NextResponse.json({ 
      success: true,
      messageId: info.messageId,
      message: 'Employee details email sent successfully'
    })
  } catch (error: any) {
    console.error('❌ Error sending employee details email:', error)
    console.error('❌ Error details:', {
      message: error.message,
      code: error.code,
      response: error.response,
      stack: error.stack
    })
    console.log('=== EMAIL API DEBUG END ===')
    return NextResponse.json({ 
      error: `Failed to send email: ${error.message}`,
      details: error.message
    }, { status: 500 })
  }
}
