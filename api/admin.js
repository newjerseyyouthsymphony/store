const { airtable, listMerchandise, isActive } = require('./_airtable');

module.exports = async function handler(req, res) {
  if (req.headers['x-admin-password'] !== process.env.ADMIN_PASSWORD) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    if (req.method === 'GET') {
      const records = await listMerchandise();

      return res.status(200).json({
        products: records.map(record => ({
          id: record.id,
          name: record.fields['Item Name'] || '',
          size: record.fields.Size || '',
          color: record.fields.Color || '',
          price: record.fields.Price || 0,
          active: isActive(record.fields)
        }))
      });
    }

    if (req.method === 'PATCH') {
      const { id, active } = req.body || {};

      if (!id || typeof active !== 'boolean') {
        return res.status(400).json({ error: 'Invalid update' });
      }

      await airtable(`${encodeURIComponent('Merchandise')}/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        body: JSON.stringify({
          fields: { 'Active Status': active }
        })
      });

      return res.status(200).json({ ok: true });
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Admin error:', error.message);
    return res.status(500).json({ error: 'Unable to manage merchandise.' });
  }
};