import fetch from 'node-fetch';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, customerInfo, amountPaid, buyerEmail, stripeReference } = req.body;

    if (!process.env.AIRTABLE_API_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      console.error('Missing Airtable credentials');
      return res.status(500).json({ error: 'Airtable not configured' });
    }

    const airtableUrl = `https://api.airtable.com/v0/${process.env.AIRTABLE_BASE_ID}/Merch%20Orders`;

    const response = await fetch(airtableUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.AIRTABLE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        records: [
          {
            fields: {
              'Order ID': orderId,
              'Customer Info': customerInfo,
              'Amount Paid': amountPaid,
              'Buyer Email': buyerEmail,
              'Stripe Reference Block': stripeReference,
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Airtable error:', error);
      return res.status(500).json({ error: 'Failed to save order to Airtable' });
    }

    const data = await response.json();
    return res.status(200).json({ success: true, airtableId: data.records[0].id });
  } catch (error) {
    console.error('Error saving to Airtable:', error);
    return res.status(500).json({ error: error.message });
  }
}
