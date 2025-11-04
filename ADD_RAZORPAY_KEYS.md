# 🔑 How to Add Your Razorpay Production Keys

## ✅ Code Updated for Production

The system is now configured to work with **real Razorpay keys** (not test mode). Follow the steps below to add your KYC-verified production keys.

---

## 📝 Step-by-Step Instructions

### Step 1: Get Your Razorpay Keys

1. Login to your Razorpay Dashboard: [https://dashboard.razorpay.com/](https://dashboard.razorpay.com/)
2. Go to **Settings** → **API Keys** (in the left sidebar)
3. Click on **"Generate Live Keys"** or **"Regenerate Live Keys"**
4. You'll see two keys:
   - **Key ID** (starts with `rzp_live_`)
   - **Key Secret** (long string - click "Show" to reveal)

⚠️ **Important:** Copy both keys immediately. The Key Secret is shown only once!

---

### Step 2: Add Keys to Environment File

Open your `.env.local` file located at:
```
h:\admin-main\admin\.env.local
```

Add these two lines at the end of the file:

```env
# Razorpay Production Keys
RAZORPAY_KEY_ID=rzp_live_your_actual_key_id_here
RAZORPAY_KEY_SECRET=your_actual_secret_key_here
```

**Example:**
```env
# Razorpay Production Keys
RAZORPAY_KEY_ID=rzp_live_AbCdEf1234567890
RAZORPAY_KEY_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ1234567890
```

---

### Step 3: Set Application URL (Optional but Recommended)

Add this line to `.env.local` to enable proper payment callbacks:

```env
# Application URL for payment callbacks
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

For local testing, use:
```env
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

### Step 4: Restart Your Development Server

After adding the keys, **restart your server**:

1. Stop the server (press `Ctrl + C` in terminal)
2. Start it again:
   ```bash
   npm run dev
   ```

---

### Step 5: Verify Setup

Run this command to verify your keys are configured:

```bash
npm run check-payment
```

You should see:
```
✅ RAZORPAY_KEY_ID: Configured (Live Mode)
✅ RAZORPAY_KEY_SECRET: Configured
✅ GMAIL_USER: Configured
✅ GMAIL_APP_PASSWORD: Configured
```

---

## 🧪 Test the Integration

### Test Flow:
1. Login as employee
2. Go to **Leads** section
3. Click on a lead
4. Assign an itinerary
5. Click **"Generate and Send Payment Link"**
6. Check the customer's email
7. Click the payment link
8. Complete payment with real card/UPI
9. Verify booking status changes to "Confirmed"

---

## 🔒 Security Best Practices

### DO:
✅ Keep keys in `.env.local` file only
✅ Never commit `.env.local` to Git (it's already in `.gitignore`)
✅ Use different keys for development and production
✅ Regenerate keys if compromised

### DON'T:
❌ Share keys in chat/email/screenshots
❌ Commit keys to version control
❌ Use production keys for testing
❌ Store keys in frontend code

---

## 📋 Complete `.env.local` File Structure

Your `.env.local` should look like this:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_DB_URL=your_database_url

# Email Configuration (Gmail)
GMAIL_USER=groupartihcus@gmail.com
GMAIL_APP_PASSWORD=your_gmail_app_password

# Razorpay Production Keys (KYC Verified Account)
RAZORPAY_KEY_ID=rzp_live_your_key_id
RAZORPAY_KEY_SECRET=your_secret_key

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Optional: Razorpay Webhook Secret (for production)
RAZORPAY_WEBHOOK_SECRET=your_webhook_secret_if_configured
```

---

## 🚀 Production Deployment

When deploying to production (Vercel/Netlify/etc.):

1. Add the same environment variables in your hosting platform's dashboard
2. Update `NEXT_PUBLIC_APP_URL` to your production domain
3. Configure Razorpay webhooks with your production URL

---

## 🆘 Troubleshooting

### Error: "Razorpay credentials not configured"
→ Keys not added to `.env.local`. Add them and restart server.

### Error: "Invalid API key"
→ Check if you copied the keys correctly (no extra spaces)

### Error: "Authentication failed"
→ Make sure you're using **live** keys (rzp_live_), not test keys (rzp_test_)

### Payments not working
→ Verify KYC is approved in Razorpay dashboard
→ Check account is activated for live payments

---

## 📞 Support

If you face any issues:
- Razorpay Support: [https://razorpay.com/support/](https://razorpay.com/support/)
- Razorpay Docs: [https://razorpay.com/docs/](https://razorpay.com/docs/)

---

## ✨ What Happens After Adding Keys

Once you add your production keys and restart:

1. ✅ Real Razorpay payment links will be generated
2. ✅ Customers can pay with real money (cards/UPI/wallets)
3. ✅ Money will be credited to your Razorpay account
4. ✅ Payment confirmations will work automatically
5. ✅ Bookings will update from Pending → Confirmed
6. ✅ Email notifications will include real payment links

---

## 🎯 Summary

**What to do:**
1. Copy your Razorpay Live Key ID and Secret from dashboard
2. Add them to `h:\admin-main\admin\.env.local`
3. Restart the dev server
4. Test with a small real payment

**That's it! Your payment system will be fully operational.** 🎉

