const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, customerEmail, clientReferenceId, successUrl, cancelUrl } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Invalid line items' });
    }

    const stripePriceCache = new Map();
    const getStripePrice = async (priceId) => {
      if (!stripePriceCache.has(priceId)) {
        stripePriceCache.set(priceId, stripe.prices.retrieve(priceId, { expand: ['product'] }));
      }
      return stripePriceCache.get(priceId);
    };

    const stripeLineItems = await Promise.all(lineItems.map(async (item) => {
      const priceId = typeof item?.price === 'string' ? item.price.trim() : '';
      const quantity = Number.isInteger(item?.quantity) ? item.quantity : Number.parseInt(item?.quantity, 10);

      if (!priceId || !Number.isInteger(quantity) || quantity < 1) {
        throw new Error('Invalid line item payload');
      }

      const stripePrice = await getStripePrice(priceId);
      if (
        stripePrice.billing_scheme !== 'per_unit'
        || !Number.isInteger(stripePrice.unit_amount)
        || stripePrice.tax_behavior === 'unspecified'
      ) {
        return { price: priceId, quantity };
      }

      const fallbackName = stripePrice.product && typeof stripePrice.product !== 'string'
        ? stripePrice.product.name
        : 'NJYS Merchandise';
      const itemName = typeof item?.name === 'string' && item.name.trim() ? item.name.trim() : fallbackName;
      const color = typeof item?.color === 'string' ? item.color.trim() : '';
      const size = typeof item?.size === 'string' ? item.size.trim() : '';
      const variation = [color, size].filter(Boolean).join(' / ');
      const displayName = variation ? `${itemName} — ${variation}` : itemName;
      const priceData = {
        currency: stripePrice.currency,
        unit_amount: stripePrice.unit_amount,
        product_data: { name: displayName },
      };

      if (stripePrice.tax_behavior) {
        priceData.tax_behavior = stripePrice.tax_behavior;
      }

      return {
        price_data: priceData,
        quantity,
      };
    }));

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      line_items: stripeLineItems,
      customer_email: customerEmail,
      client_reference_id: clientReferenceId,
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return res.status(200).json({ sessionId: session.id, url: session.url });
  } catch (error) {
    console.error('Stripe error:', error.message);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
