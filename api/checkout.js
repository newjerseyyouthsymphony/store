const Stripe = require('stripe');
const { listMerchandise, isActive } = require('./_airtable');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, customerEmail, clientReferenceId } = req.body || {};

    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error('Stripe is not configured');
    }

    if (!Array.isArray(lineItems) || lineItems.length === 0 || lineItems.length > 50) {
      return res.status(400).json({ error: 'Invalid line items' });
    }

    const records = await listMerchandise();
    const stripeItems = [];

    for (const item of lineItems) {
      const quantity = Number(item.quantity);

      if (!item.id || !Number.isInteger(quantity) || quantity < 1 || quantity > 99) {
        return res.status(400).json({ error: 'Invalid checkout item' });
      }

      const record = records.find((candidate) => candidate.id === item.id);

      if (!record || !isActive(record.fields)) {
        return res.status(409).json({
          error: 'An item in your cart is no longer available.',
        });
      }

      const fields = record.fields;
      const price = Number(fields.Price);
      const name = [fields['Item Name'], fields.Size, fields.Color]
        .filter(Boolean)
        .join(' — ');

      if (!Number.isFinite(price) || price < 0 || !name) {
        return res.status(400).json({
          error: 'An item has invalid merchandise details.',
        });
      }

      stripeItems.push({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(price * 100),
          product_data: { name },
        },
      });
    }

    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const origin = req.headers.origin || 'https://newjerseyyouthsymphony.github.io';

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeItems,
      customer_email: typeof customerEmail === 'string' ? customerEmail : undefined,
      client_reference_id:
        typeof clientReferenceId === 'string'
          ? clientReferenceId.slice(0, 200)
          : undefined,
      success_url: `${origin}/thank-you.html`,
      cancel_url: `${origin}/`,
    });

    return res.status(200).json({
      sessionId: session.id,
      url: session.url,
    });
  } catch (error) {
    console.error('Checkout error:', error.message);
    return res.status(500).json({
      error: 'Unable to start checkout.',
    });
  }
};