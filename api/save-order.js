const https = require('https');

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

    const baseId = process.env.AIRTABLE_BASE_ID;
    const token = process.env.AIRTABLE_API_TOKEN;

    console.log('Starting Airtable request...');
    console.log('Base ID:', baseId);
    console.log('Token starts with:', token.substring(0, 4));

    const data = JSON.stringify({
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

    console.log('Request options:', {
      method: options.method,
      hostname: options.hostname,
      path: options.path,
    });

    return new Promise((resolve) => {
      const request = https.request(options, (response) => {
        let body = '';

        response.on('data', (chunk) => {
          body += chunk;
        });

        response.on('end', () => {
          console.log('Response status:', response.statusCode);
          console.log('Response body:', body);

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
