// /api/create-checkout-session.js
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Expect PRICE_WHITELIST as a comma-separated list of allowed price IDs
function getAllowedPrices() {
  const raw = process.env.PRICE_WHITELIST || '';
  return new Set(raw.split(',').map(s => s.trim()).filter(Boolean));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { cart, studentName, ensembleName, email } = req.body || {};

    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return res.status(400).json({ error: 'Cart is empty' });
    }

    const allowed = getAllowedPrices();
    if (allowed.size === 0) {
      console.error('PRICE_WHITELIST not configured (env PRICE_WHITELIST).');
      return res.status(500).json({ error: 'Server misconfiguration: PRICE_WHITELIST is not set.' });
    }

    // Validate and sanitize cart items
    const line_items = [];
    for (const item of cart) {
      if (!item || typeof item.id !== 'string') {
        return res.status(400).json({ error: 'Invalid cart item format' });
      }
      const priceId = item.id;
      const qty = Math.max(1, parseInt(item.qty || 1, 10) || 1);

      if (!allowed.has(priceId)) {
        return res.status(400).json({ error: `Invalid price id: ${priceId}` });
      }

      line_items.push({ price: priceId, quantity: qty });
    }

    const origin = process.env.ORIGIN || `${req.headers['x-forwarded-proto'] || 'https'}://${req.headers.host}`;

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items,
      mode: 'payment',
      customer_email: email || undefined,
      metadata: {
        student_name: typeof studentName === 'string' ? studentName : '',
        ensemble_name: typeof ensembleName === 'string' ? ensembleName : ''
      },
      success_url: `${origin}/thank-you.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}`
    });

    return res.status(200).json({ id: session.id });
  } catch (err) {
    console.error('create-checkout-session error', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
}
