const fs = require('fs');
const path = require('path');
const { isStoreOpen } = require('./_airtable');

const pages = {
  '/': 'index.html',
  '/index.html': 'index.html',
  '/thank-you.html': 'thank-you.html',
};

module.exports = async function handler(req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).send('Method not allowed');
  }

  let open = false;
  try {
    open = await isStoreOpen();
  } catch (error) {
    // If Airtable is unreachable, keep the customer-facing site closed.
    console.error('Store status error:', error.message);
  }

  const requestedPath = typeof req.query.path === 'string' ? req.query.path : '/';
  const file = open ? pages[requestedPath] : 'maintenance.html';

  if (!file) return res.status(404).send('Not found');

  try {
    const html = fs.readFileSync(path.join(process.cwd(), file));
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Cache-Control', 'no-store, max-age=0');
    if (!open) res.setHeader('Retry-After', '300');
    return res.status(open ? 200 : 503).send(req.method === 'HEAD' ? '' : html);
  } catch (error) {
    console.error(`Unable to serve ${file}:`, error.message);
    return res.status(500).send('Unable to serve page.');
  }
};
