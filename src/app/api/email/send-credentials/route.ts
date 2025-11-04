import { NextRequest, NextResponse } from 'next/server'
// @ts-ignore
import nodemailer from 'nodemailer'

interface EmployeeCredentials {
  name: string
  email: string
  password: string
  role: string
  destination: string
}

// Create transporter using Travloger credentials
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_APP_PASSWORD,
    },
  })
}

// Email template for employee credentials
const createEmployeeCredentialsTemplate = (data: EmployeeCredentials) => {
  const { name, email, password, role, destination } = data

  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Welcome to Travloger - Your Account Details</title>
        <style>
            body {
                font-family: 'Manrope', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
            }
            .email-container {
                background-color: #ffffff;
                padding: 30px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            }
            .logo {
                text-align: center;
                margin-bottom: 30px;
            }
            .logo img {
                max-width: 150px;
                height: auto;
            }
            .header {
                text-align: center;
                margin-bottom: 30px;
            }
            .greeting {
                font-size: 18px;
                font-weight: bold;
                color: #2c3e50;
                margin-bottom: 20px;
            }
            .content {
                margin-bottom: 25px;
            }
            .credentials-box {
                background-color: #f8f9fa;
                padding: 20px;
                border-radius: 8px;
                margin: 20px 0;
                border-left: 4px solid #00A99D;
            }
            .credential-item {
                margin: 10px 0;
                padding: 8px 0;
                border-bottom: 1px solid #eee;
            }
            .credential-item:last-child {
                border-bottom: none;
            }
            .label {
                font-weight: bold;
                color: #00A99D;
                display: inline-block;
                width: 120px;
            }
            .value {
                color: #333;
            }
            .password {
                background-color: #fff3cd;
                padding: 8px 12px;
                border-radius: 4px;
                font-family: monospace;
                font-weight: bold;
                color: #856404;
            }
            .important-note {
                background-color: #d1ecf1;
                border: 1px solid #bee5eb;
                border-radius: 8px;
                padding: 15px;
                margin: 20px 0;
            }
            .footer {
                text-align: center;
                margin-top: 30px;
                padding-top: 20px;
                border-top: 1px solid #eee;
                color: #666;
            }
            .contact-info {
                margin-top: 15px;
                font-size: 14px;
            }
            .login-button {
                display: inline-block;
                background-color: #00A99D;
                color: white;
                padding: 12px 24px;
                text-decoration: none;
                border-radius: 6px;
                font-weight: bold;
                margin: 20px 0;
            }
        </style>
    </head>
    <body>
        <div class="email-container">
            <div class="logo">
                <img src="https://travloger.in/logo.png" alt="Travloger Logo">
            </div>
            
            <div class="header">
                <h1 style="color: #00A99D; margin: 0;">Welcome to Travloger!</h1>
            </div>
            
            <div class="greeting">
                Dear ${name},
            </div>
            
            <div class="content">
                <p>Welcome to the Travloger team! Your account has been created and you can now access the admin panel.</p>
                
                <div class="credentials-box">
                    <h3 style="color: #00A99D; margin-top: 0;">Your Login Credentials:</h3>
                    <div class="credential-item">
                        <span class="label">Email:</span>
                        <span class="value">${email}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Password:</span>
                        <span class="password">${password}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Role:</span>
                        <span class="value">${role}</span>
                    </div>
                    <div class="credential-item">
                        <span class="label">Destination:</span>
                        <span class="value">${destination}</span>
                    </div>
                </div>
                
                <div class="important-note">
                    <strong>🔐 Important Security Note:</strong><br>
                    For your security, you will be required to change your password on your first login. Please use a strong password that includes letters, numbers, and special characters.
                </div>
                
                <div style="text-align: center;">
                    <a href="https://admin.travloger.in/login" class="login-button">Login to Admin Panel</a>
                </div>
                
                <p>If you have any questions or need assistance, please contact your administrator.</p>
                
                <p>We're excited to have you on the team!</p>
            </div>
            
            <div class="footer">
                <p><strong>Best regards,</strong><br>
                Travloger Admin Team</p>
                
                <div class="contact-info">
                    <p>📧 admin@travloger.in<br>
                    🌐 https://travloger.in</p>
                </div>
            </div>
        </div>
    </body>
    </html>
  `
}

export async function POST(request: NextRequest) {
  try {
    // Check if environment variables are set
    console.log('GMAIL_USER:', process.env.GMAIL_USER ? 'Set' : 'Not set')
    console.log('GMAIL_APP_PASSWORD:', process.env.GMAIL_APP_PASSWORD ? 'Set' : 'Not set')
    
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      console.error('Email service not configured - missing environment variables')
      return NextResponse.json(
        { error: 'Email service not configured - missing GMAIL_USER or GMAIL_APP_PASSWORD' },
        { status: 500 }
      )
    }

    const data: EmployeeCredentials = await request.json()

    if (!data.name || !data.email || !data.password || !data.role || !data.destination) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const transporter = createTransporter()

    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: data.email,
      subject: `Welcome to Travloger - Your Account Details`,
      html: createEmployeeCredentialsTemplate(data),
    }

    console.log('Sending email to:', data.email)
    console.log('From:', process.env.GMAIL_USER)
    
    // Test the connection first
    try {
      await transporter.verify()
      console.log('SMTP connection verified successfully')
    } catch (verifyError) {
      console.error('SMTP connection failed:', verifyError)
      const errorMessage = verifyError instanceof Error ? verifyError.message : 'Unknown error'
      throw new Error(`SMTP connection failed: ${errorMessage}`)
    }
    
    const info = await transporter.sendMail(mailOptions)
    console.log('Employee credentials email sent:', info.messageId)
    
    return NextResponse.json({ 
      success: true,
      messageId: info.messageId
    })

  } catch (error) {
    console.error('Error sending employee credentials email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const errorCode = (error as any)?.code || 'UNKNOWN'
    const errorStack = error instanceof Error ? error.stack : 'No stack trace'
    
    console.error('Error details:', {
      message: errorMessage,
      code: errorCode,
      stack: errorStack
    })
    return NextResponse.json(
      { error: `Failed to send email: ${errorMessage}` },
      { status: 500 }
    )
  }
}
