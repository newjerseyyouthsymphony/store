const Stripe = require('stripe');

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function buildDisplayName(item) {
  const baseName = item.name && item.name.startsWith('NJYS ') ? item.name : `NJYS ${item.name}`;
  const variationParts = [item.color, item.size].filter(Boolean);

  return variationParts.length > 0 ? `${baseName} — ${variationParts.join(' / ')}` : baseName;
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { lineItems, customerEmail, clientReferenceId, successUrl, cancelUrl } = req.body;

    if (!lineItems || !Array.isArray(lineItems) || lineItems.length === 0) {
      return res.status(400).json({ error: 'Invalid line items' });
    }

    const stripeLineItems = await Promise.all(lineItems.map(async (item) => {
      if (!item || !item.id || !item.quantity) {
        throw new Error('Invalid line item');
      }

      const price = await stripe.prices.retrieve(item.id, {
        expand: ['product'],
      });
      const productName = typeof price.product === 'object' ? price.product.name : item.name;

      if (!productName || price.unit_amount == null) {
        throw new Error('Invalid line item');
      }

      return {
        price_data: {
          currency: price.currency || 'usd',
          unit_amount: price.unit_amount,
          product_data: {
            name: buildDisplayName({
              name: productName,
              color: item.color,
              size: item.size,
            }),
          },
        },
        quantity: item.quantity,
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
