// /api/webhook.js
import Stripe from 'stripe';

export const config = { api: { bodyParser: false } };

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

function buffer(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let rawBody;
  try {
    rawBody = await buffer(req);
  } catch (err) {
    console.error('Error reading request body', err);
    return res.status(400).send(`Error reading request body`);
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed.', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;

      // Fetch full line items
      const lineItemsResp = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      const lineItems = (lineItemsResp?.data || []).map(li => ({
        description: li.description || li.price?.product || li.price?.id,
        quantity: li.quantity,
        price: (li.price?.unit_amount || li.amount_subtotal || 0) / 100
      }));

      // Build Airtable payload fields
      const airtableFields = {
        stripe_session_id: session.id,
        payment_intent_id: session.payment_intent || '',
        student_name: session.metadata?.student_name || '',
        ensemble: session.metadata?.ensemble_name || '',
        parent_email: session.customer_email || '',
        line_items: JSON.stringify(lineItems),
        amount_total: (session.amount_total || 0) / 100,
        currency: session.currency || '',
        payment_status: session.payment_status || '',
        checkout_created: new Date((session.created || Date.now()) * 1000).toISOString()
      };

      // Idempotency: check if a record with this session id already exists
      const airtableBase = process.env.AIRTABLE_BASE_ID;
      const airtableTable = encodeURIComponent(process.env.AIRTABLE_TABLE_NAME || 'Orders');
      const airtableKey = process.env.AIRTABLE_API_KEY;

      if (!airtableBase || !airtableKey) {
        console.warn('Airtable keys not configured; skipping Airtable write');
      } else {
        const airtableSearchUrl = `https://api.airtable.com/v0/${airtableBase}/${airtableTable}?filterByFormula=${encodeURIComponent("{stripe_session_id}='" + session.id + "'")}`;

        const searchResp = await fetch(airtableSearchUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${airtableKey}`,
            'Content-Type': 'application/json'
          }
        });

        if (!searchResp.ok) {
          console.error('Airtable search failed', await searchResp.text());
        } else {
          const searchJson = await searchResp.json();
          if ((searchJson.records || []).length > 0) {
            console.log('Airtable record already exists for session', session.id);
          } else {
            const createUrl = `https://api.airtable.com/v0/${airtableBase}/${airtableTable}`;
            const createBody = { fields: airtableFields };

            const createResp = await fetch(createUrl, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${airtableKey}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify(createBody)
            });

            if (!createResp.ok) {
              console.error('Airtable create failed', await createResp.text());
            } else {
              console.log('Airtable record created for session', session.id);
            }
          }
        }
      }
    }

    // Return 200 to acknowledge receipt of the event
    res.status(200).send('OK');
  } catch (err) {
    console.error('Error handling webhook', err);
    res.status(500).send('Webhook handler error');
  }
}
