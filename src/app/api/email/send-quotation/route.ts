import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

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
  try {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
      return NextResponse.json(
        { error: 'Email service not configured' },
        { status: 500 }
      )
    }

    const body = await request.json()
    const { 
      itineraryId, 
      queryId, 
      shareType, 
      recipients, 
      ccMail, 
      message,
      quotationData 
    } = body

    if (!recipients || recipients.length === 0) {
      return NextResponse.json({ error: 'At least one recipient is required' }, { status: 400 })
    }

    const transporter = createTransporter()

    // Prepare email content
    const recipientEmails = recipients.map((r: any) => r.email).join(', ')
    const recipientNames = recipients.map((r: any) => r.name).join(', ')

    const subject = `Quotation for ${quotationData?.destination || 'Your Trip'}`

    // Build the quotation content
    const quotationHTML = quotationData ? `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <h2 style="color: #667eea;">Dear ${quotationData.customerName},</h2>
        <p>Please find below the quotation details for your trip to <strong>${quotationData.destination}</strong>.</p>
        
        <div style="background: #000; color: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Query Details</h3>
          <p><strong>QueryId:</strong> ${quotationData.queryId}</p>
          <p><strong>Adult(s):</strong> ${quotationData.adults}</p>
          <p><strong>Child(s):</strong> ${quotationData.children}</p>
          <p><strong>Nights:</strong> ${quotationData.nights} Nights & ${quotationData.days} Days</p>
          <p><strong>Start Date:</strong> ${quotationData.startDate}</p>
          <p><strong>End Date:</strong> ${quotationData.endDate}</p>
        </div>

        ${quotationData.hotels?.length > 0 ? `
          <h3>Hotel Details</h3>
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f0f0f0;">
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">City</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Hotel Name</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Check In</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Check Out</th>
                <th style="border: 1px solid #ddd; padding: 8px; text-align: left;">Room Type</th>
              </tr>
            </thead>
            <tbody>
              ${quotationData.hotels.map((hotel: any) => `
                <tr>
                  <td style="border: 1px solid #ddd; padding: 8px;">${hotel.city}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${hotel.hotelName}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${hotel.checkIn}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${hotel.checkOut}</td>
                  <td style="border: 1px solid #ddd; padding: 8px;">${hotel.roomType}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div style="text-align: center; margin: 30px 0; padding: 20px; border-top: 2px solid #ddd;">
          <h2 style="color: #667eea;">Total Package Price: ₹${quotationData.totalPrice?.toLocaleString('en-IN') || '0'}</h2>
        </div>

        ${shareType === 'private' ? `
          <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Note:</strong> This quotation is shared privately. You may be prompted to create a login to view full itinerary details.</p>
          </div>
        ` : ''}
      </div>
    ` : ''

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>${subject}</title>
      </head>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          ${message ? `<div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
            <p style="margin: 0;">${message.replace(/\n/g, '<br>')}</p>
          </div>` : ''}
          
          ${quotationHTML}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; text-align: center; color: #666; font-size: 14px;">
            <p>&copy; ${new Date().getFullYear()} Travloger. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `

    const textContent = `
      Dear ${recipientNames},

      ${message ? message + '\n\n' : ''}Please find below the quotation details for your trip.

      Query Details:
      QueryId: ${quotationData?.queryId || 'N/A'}
      Adults: ${quotationData?.adults || 0}
      Children: ${quotationData?.children || 0}
      Destination: ${quotationData?.destination || 'N/A'}
      Total Price: ₹${quotationData?.totalPrice?.toLocaleString('en-IN') || '0'}

      Best regards,
      Travloger Team
    `

    const mailOptions: any = {
      from: {
        name: 'Travloger',
        address: process.env.GMAIL_USER
      },
      to: recipientEmails,
      subject: subject,
      text: textContent,
      html: htmlContent,
    }

    if (ccMail) {
      mailOptions.cc = ccMail
    }

    const info = await transporter.sendMail(mailOptions)

    return NextResponse.json({ 
      success: true,
      messageId: info.messageId,
      message: 'Quotation sent successfully'
    })
  } catch (error: any) {
    console.error('Error sending quotation email:', error)
    return NextResponse.json({ 
      error: `Failed to send email: ${error.message}`,
      details: error.message
    }, { status: 500 })
  }
}













