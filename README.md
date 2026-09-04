# NJYS Web Store

A modern e-commerce storefront for New Jersey Youth Symphony merchandise, powered by Stripe and Vercel.

## Features

- 🛍️ **Product Catalog** - 6 products with multiple sizes and colors
- 🛒 **Shopping Cart** - Add/remove items with real-time totals
- 💳 **Stripe Integration** - Secure payment processing
- 📋 **Student Information** - Capture customer details at checkout
- ✨ **Responsive Design** - Works on desktop, tablet, and mobile
- ⚡ **Serverless Backend** - Runs on Vercel with zero infrastructure

## Quick Start

### For Customers
Simply visit the deployed store URL and start shopping!

### For Developers

#### Prerequisites
- Node.js 14+ (for local development)
- Stripe account (free at stripe.com)
- Vercel account (free at vercel.com)

#### Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/newjerseyyouthsymphony/store.git
   cd store
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Create `.env.local`**
   ```bash
   STRIPE_SECRET_KEY=sk_test_your_test_key_here
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open in browser**
   ```
   http://localhost:3000
   ```

#### Deployment to Vercel

**Automatic (Recommended):**
1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "New Project" and select this repository
4. In Environment Variables, add `STRIPE_SECRET_KEY` (your Stripe secret key)
5. Click "Deploy"

**Manual:**
1. Install Vercel CLI: `npm i -g vercel`
2. Run: `vercel` from the project directory
3. Follow the prompts
4. Add environment variables in Vercel dashboard

## Configuration

### Stripe Setup

1. **Get your keys** from https://dashboard.stripe.com/apikeys
2. **For development**: Use Test keys (start with `pk_test_` and `sk_test_`)
3. **For production**: Use Live keys (start with `pk_live_` and `sk_live_`)

### Adding Products

Edit `index.html` to:
- Change product names, prices, and colors
- Update Stripe Price IDs in the option values
- Modify size ranges

Product structure in HTML:
```html
<option value="STRIPE_PRICE_ID,SIZE_NAME,PRICE">SIZE_NAME - $PRICE</option>
```

### Customization

- **Colors/Branding**: Edit CSS in `<style>` section of `index.html`
- **Store Title**: Change "NJYS Web Store" in `<h1>`
- **Success Page**: Edit `thank-you.html`

## File Structure

```
.
├── index.html           # Main storefront
├── thank-you.html       # Order confirmation
├── package.json         # Dependencies
├── vercel.json          # Vercel configuration
├── api/
│   └── checkout.js      # Stripe checkout API
├── DEPLOYMENT.md        # Detailed deployment guide
└── README.md            # This file
```

## How It Works

1. Customer adds items to cart
2. Enters name, ensemble, and email
3. Clicks "Proceed to Payment"
4. Frontend calls `/api/checkout` API
5. Backend creates Stripe Checkout Session
6. Customer is redirected to Stripe's hosted checkout
7. Payment is processed
8. Customer is redirected to thank-you page

## Support & Troubleshooting

### Common Issues

**"Error: missing price ID"**
- Verify all Stripe Price IDs in `index.html` are valid
- Check they match your Stripe account

**"Stripe has not been initialized"**
- Verify Stripe publishable key in `index.html` is correct
- Check browser console for errors

**API not working after deployment**
- Verify `STRIPE_SECRET_KEY` environment variable is set in Vercel
- Check Vercel deployment logs
- Ensure `api/checkout.js` file exists in repository

**Payments not processing**
- Ensure you've switched from Test to Live keys in Stripe
- Update `STRIPE_SECRET_KEY` in Vercel with live secret key
- Check Stripe dashboard for failed payments

### Getting Help

- Stripe Docs: https://stripe.com/docs
- Vercel Docs: https://vercel.com/docs
- Stripe Support: https://support.stripe.com

## Testing

### Test Mode
Use Stripe's test card numbers:
- Success: `4242 4242 4242 4242`
- Decline: `4000 0000 0000 0002`
- Any future date and any 3-digit CVC

### Production Mode
Always test with test keys first before going live with real keys.

## Security

⚠️ **Important Security Notes:**
- Never commit `.env.local` to GitHub
- Never expose your `STRIPE_SECRET_KEY` in client-side code
- Always use Vercel environment variables for secrets
- The publishable key (`pk_live_...`) in `index.html` is safe to expose

## License

This project is maintained by New Jersey Youth Symphony.

## Contact

For questions about the store, contact: info@njys.org
