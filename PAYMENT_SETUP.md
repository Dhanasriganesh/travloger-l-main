# Payment Integration Setup Guide

This document explains how to set up the Razorpay payment integration for the Travloger Admin System.

## Overview

The payment system allows employees to:
1. Assign itineraries to leads
2. Generate Razorpay payment links
3. Send payment links via email with full booking details
4. Track payment status in the Bookings page
5. See payment confirmation in the Employee Dashboard

## Current Status

The system is configured to work in **TEST MODE** with placeholder Razorpay keys. Once you have your real Razorpay account, follow the steps below to configure production keys.

## Setup Instructions

### 1. Get Razorpay API Keys

1. Sign up at [https://razorpay.com/](https://razorpay.com/)
2. Complete the KYC verification for production access
3. Go to **Settings** → **API Keys**
4. Generate your API keys:
   - **Key ID** (starts with `rzp_live_` or `rzp_test_`)
   - **Key Secret**

### 2. Configure Environment Variables

Add the following variables to your `.env.local` file:

```env
# Razorpay Configuration
RAZORPAY_KEY_ID=your_razorpay_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_key_secret_here

# Email Configuration (Gmail)
GMAIL_USER=your_email@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Application URL (for payment callbacks)
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### 3. Gmail App Password Setup

To send emails with payment links:

1. Go to your Google Account settings
2. Enable 2-Factor Authentication
3. Go to **Security** → **App Passwords**
4. Generate a new app password for "Mail"
5. Use this 16-character password as `GMAIL_APP_PASSWORD`

### 4. Configure Razorpay Webhooks (Optional but Recommended)

For automatic payment status updates:

1. Go to Razorpay Dashboard → **Settings** → **Webhooks**
2. Add webhook URL: `https://your-domain.com/api/razorpay/callback`
3. Select events to track:
   - `payment_link.paid`
   - `payment.captured`
4. Copy the webhook secret and add to `.env.local`:
   ```env
   RAZORPAY_WEBHOOK_SECRET=your_webhook_secret
   ```

## How It Works

### Payment Flow

1. **Employee assigns itinerary to lead**
   - Employee selects a lead from the Leads section
   - Chooses an itinerary/package to assign
   - System shows payment page with member and itinerary details

2. **Generate Payment Link**
   - Employee clicks "Generate and Send Payment Link"
   - System calculates amount: `map_rate + eb` (for hotels) or fixed plan amount
   - Creates Razorpay payment link
   - Creates booking record in database with status "Pending"
   - Sends email to customer with:
     - Member details
     - Itinerary details
     - Payment amount
     - Razorpay payment link

3. **Customer Pays**
   - Customer receives email
   - Clicks payment link
   - Completes payment through Razorpay
   - Razorpay redirects back to your application

4. **Payment Confirmation**
   - Booking status updates from "Pending" to "Confirmed"
   - Payment status updates from "Pending" to "Paid"
   - Booking appears in "Confirmed" section of Bookings page
   - Lead shows green "Payment Confirmed" badge in Employee Dashboard

## Database Schema

The `bookings` table includes:

```sql
- id: Booking ID
- lead_id: Reference to lead
- customer: Customer name
- email: Customer email
- phone: Customer phone
- package_name: Name of the itinerary
- destination: Travel destination
- travelers: Number of travelers
- amount: Payment amount
- status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed'
- payment_status: 'Pending' | 'Paid' | 'Partial' | 'Refunded'
- razorpay_order_id: Razorpay order ID
- razorpay_payment_link: Razorpay payment link URL
- razorpay_payment_id: Payment ID after successful payment
- itinerary_details: Full itinerary JSON
- assigned_agent: Employee who created the booking
- created_at: Booking creation timestamp
- updated_at: Last update timestamp
```

## Testing

### Test Mode

Currently configured with test keys. You can test the flow using:
- Test payment link will be generated
- Email will be sent to the customer
- Use Razorpay test cards to complete payment:
  - Card: `4111 1111 1111 1111`
  - CVV: Any 3 digits
  - Expiry: Any future date

### Production Mode

Once you add real Razorpay keys:
1. Update `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` with live keys
2. Real payment links will be generated
3. Real payments will be processed
4. Money will be credited to your Razorpay account

## API Endpoints

### Payment APIs
- `POST /api/razorpay/create-payment-link` - Generate payment link
- `GET /api/razorpay/callback` - Handle payment success/failure
- `POST /api/razorpay/callback` - Webhook handler for payment events

### Booking APIs
- `GET /api/bookings` - Fetch all bookings (with filters)
- `POST /api/bookings` - Create new booking
- `PATCH /api/bookings` - Update booking status

### Email API
- `POST /api/email/send-payment-link` - Send payment email to customer

## Troubleshooting

### Email Not Sending
- Verify `GMAIL_USER` and `GMAIL_APP_PASSWORD` are correct
- Check that 2FA is enabled on Gmail account
- Ensure "Less secure app access" is NOT enabled (use App Password instead)

### Payment Link Not Working
- Verify Razorpay API keys are correct
- Check that amount is greater than 0
- Ensure customer email is valid

### Payment Status Not Updating
- Check webhook configuration in Razorpay dashboard
- Verify webhook URL is accessible from internet
- Check API logs for webhook events

## Support

For issues or questions:
- Razorpay Documentation: [https://razorpay.com/docs/](https://razorpay.com/docs/)
- Razorpay Support: support@razorpay.com

## Security Notes

- Never commit `.env.local` to version control
- Keep API keys and secrets secure
- Use environment variables for all sensitive data
- Enable webhook signature verification in production
- Use HTTPS for all production URLs




