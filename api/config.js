// /api/config.js
// Returns non-secret config values for the client (publishable key only)
export default function handler(req, res) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const publishableKey = process.env.STRIPE_PUBLISHABLE_KEY || null;
  if (!publishableKey) {
    console.warn('STRIPE_PUBLISHABLE_KEY not set in environment variables.');
  }

  res.setHeader('Content-Type', 'application/json');
  res.status(200).send(JSON.stringify({ publishableKey }));
}
