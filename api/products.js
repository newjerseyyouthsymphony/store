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
    const groups = new Map();

    for (const record of records) {
      if (!isActive(record.fields)) continue;

      const name = String(record.fields['Item Name'] || '').trim();
      const size = String(record.fields.Size || '').trim();
      const color = String(record.fields.Color || '').trim();
      const price = Number(record.fields.Price);

      if (!name || !size || !color || !Number.isFinite(price) || price < 0) continue;

      if (!groups.has(name)) {
        groups.set(name, { name, price, variants: [] });
      }

      const product = groups.get(name);
      product.price = price;

      if (!product.variants.some(variant => variant.size === size && variant.color === color)) {
        product.variants.push({ id: record.id, size, color, price });
      }
    }

    const products = [...groups.values()].map(product => {
      const sizes = [...new Set(product.variants.map(variant => variant.size))];
      const colors = [...new Set(product.variants.map(variant => variant.color))];
      return {
        name: product.name,
        price: product.price,
        sizes,
        colors,
        variants: product.variants,
      };
    });

    res.setHeader('Cache-Control', 'no-store');
    return res.status(200).json({ products });
  } catch (error) {
    console.error('Products error:', error.message);
    return res.status(500).json({ error: 'Unable to load merchandise.' });
  }
};
