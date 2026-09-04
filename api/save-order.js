const https = require('https');

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { orderId, customerInfo, amountPaid, buyerEmail, stripeReference, orderContents } = req.body;

    if (!process.env.AIRTABLE_API_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      console.error('Missing Airtable credentials');
      return res.status(500).json({ error: 'Airtable not configured' });
    }

    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_API_TOKEN;

    const data = JSON.stringify({
      records: [
        {
          fields: {
            'Order ID': orderId,
            'Customer Info': customerInfo,
            'Amount Paid': amountPaid,
            'Buyer Email': buyerEmail,
            'Stripe Reference Block': stripeReference,
            'Order Contents': orderContents || '',
          },
        },
      ],
    });

    const options = {
      hostname: 'api.airtable.com',
      port: 443,
      path: `/v0/${baseId}/Merch%20Orders`,
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Content-Length': data.length,
      },
    };

    return new Promise((resolve) => {
      const request = https.request(options, (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          if (response.statusCode === 200) {
            const result = JSON.parse(body);
            resolve(res.status(200).json({ success: true, airtableId: result.records[0].id }));
          } else {
            resolve(res.status(500).json({ error: 'Failed to save order to Airtable', details: JSON.parse(body) }));
          }
        });
      });

      request.on('error', (error) => {
        console.error('Request error:', error.message);
        resolve(res.status(500).json({ error: error.message }));
      });

      request.write(data);
      request.end();
    });
  } catch (error) {
    console.error('Error:', error.message);
    return res.status(500).json({ error: error.message });
  }
};