const fetch = require('node-fetch');

module.exports = async function handler(req, res) {
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

    console.log('Sending to Airtable:', {
      url: airtableUrl,
      orderId,
      customerInfo,
      amountPaid,
      buyerEmail,
      stripeReference,
    });

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

    console.log('Airtable response status:', response.status);

    if (!response.ok) {
      const error = await response.json();
      console.error('Airtable error:', JSON.stringify(error, null, 2));
      return res.status(500).json({ error: 'Failed to save order to Airtable', details: error });
    }

    const data = await response.json();
    console.log('Airtable success:', data);
    return res.status(200).json({ success: true, airtableId: data.records[0].id });
  } catch (error) {
    console.error('Error saving to Airtable:', error.message);
    console.error('Error stack:', error.stack);
    return res.status(500).json({ error: error.message || 'Internal server error' });
  }
};
