const fetch = require('node-fetch');

const BASE_ID = process.env.AIRTABLE_BASE_ID;
const TOKEN = process.env.AIRTABLE_API_TOKEN;

async function airtable(path, options = {}) {
  if (!BASE_ID || !TOKEN) throw new Error('Airtable is not configured');

  const response = await fetch(
    `https://api.airtable.com/v0/${encodeURIComponent(BASE_ID)}/${path}`,
    {
      ...options,
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
    }
  );

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error?.message || 'Airtable request failed');
  }

  return data;
}

async function listMerchandise() {
  const records = [];
  let offset;

  do {
    const params = new URLSearchParams();
    if (offset) params.set('offset', offset);

    const page = await airtable(`Merchandise?${params}`);
    records.push(...page.records);
    offset = page.offset;
  } while (offset);

  return records;
}

function isActive(fields) {
  const status = fields['Active Status'];
  return typeof status === 'string'
    ? status.trim().toLowerCase() === 'active'
    : status === true;
}

module.exports = { airtable, listMerchandise, isActive };