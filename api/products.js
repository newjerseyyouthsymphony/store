const { listMerchandise, isActive, isStoreOpen } = require('./_airtable');

module.exports = async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    if (!(await isStoreOpen())) {
      res.setHeader('Cache-Control', 'no-store');
      return res.status(503).json({ error: 'The store is temporarily closed.' });
    }

    const records = await listMerchandise();

    const products = records
      .filter((record) => isActive(record.fields))
      .map((record) => ({
        id: record.id,
        name: String(record.fields['Item Name'] || '').trim(),
        size: String(record.fields.Size || '').trim(),
        color: String(record.fields.Color || '').trim(),
        price: Number(record.fields.Price),
      }))
      .filter((item) =>
        item.name &&
        item.size &&
        item.color &&
        Number.isFinite(item.price) &&
        item.price >= 0
      );

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ products });
  } catch (error) {
    console.error('Products error:', error.message);
    return res.status(500).json({
      error: 'Unable to load merchandise.',
    });
  }
};
