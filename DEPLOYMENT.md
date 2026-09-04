# NJYS Store - Vercel Deployment Guide

This store is ready to be deployed on Vercel. Follow these steps to get it running:

## Prerequisites
- A Vercel account (free at https://vercel.com)
- Your Stripe Secret Key (from your Stripe Dashboard)
- GitHub access to this repository

## Deployment Steps

### 1. Connect to Vercel
1. Go to https://vercel.com and sign in with your GitHub account
2. Click "New Project"
3. Find and select the `newjerseyyouthsymphony/store` repository
4. Click "Import"

### 2. Set Environment Variables
In the Vercel project settings, add the following environment variable:

**Variable Name:** `STRIPE_SECRET_KEY`
**Value:** Your Stripe secret key (starts with `sk_live_` or `sk_test_`)

You can find your Stripe Secret Key at: https://dashboard.stripe.com/apikeys

### 3. Deploy
1. Click "Deploy"
2. Wait for the deployment to complete (usually takes 1-2 minutes)
3. You'll get a Vercel URL like `https://your-project.vercel.app`

## Testing

### Before Going Live
1. Test with Stripe's test card: `4242 4242 4242 4242`
2. Use any future expiration date and any 3-digit CVC
3. Verify the checkout flow works end-to-end

### Switch to Live Mode
Once you're confident everything works:
1. In your Stripe Dashboard, switch from Test Mode to Live Mode
2. Use your live Stripe keys (not test keys)
3. Update the `STRIPE_SECRET_KEY` environment variable in Vercel with your live secret key

## File Structure

```
.
├── index.html           # Main storefront page
├── thank-you.html       # Order confirmation page
├── package.json         # Dependencies (Stripe)
└── api/
    └── checkout.js      # Vercel serverless function for Stripe checkout
```

## How It Works

1. **Frontend** (`index.html`): User selects items, enters their info, and clicks "Proceed to Payment"
2. **API Call**: JavaScript calls `/api/checkout` with cart data
3. **Serverless Function** (`api/checkout.js`): 
   - Receives cart data
   - Creates a Stripe Checkout Session using the secret key
   - Returns the Stripe Checkout URL
4. **Redirect**: User is redirected to Stripe's hosted checkout
5. **Payment**: User completes payment on Stripe
6. **Redirect**: After payment, user is redirected to `thank-you.html`

## Support

If you encounter issues:
- Check the Vercel deployment logs (Vercel Dashboard → Project → Deployments)
- Verify your Stripe Secret Key is correctly set in environment variables
- Ensure all Stripe Price IDs in `index.html` are valid and active
- Contact Stripe support if you have payment-related issues

## Security Notes

- **Never commit your Stripe Secret Key** to GitHub - always use Vercel environment variables
- The publishable key in `index.html` is safe to expose in the browser
- All sensitive operations (session creation) happen on the Vercel backend
