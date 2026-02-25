/**
 * Controversy Search Service
 * Uses Google Custom Search API to search for controversies.
 * Falls back to mock results when API key is not configured.
 */

const fetch = require('node-fetch');
const { getCategoryOverlap } = require('../db/categoryTaxonomy');

const SEARCH_PATTERNS = [
  '{name} controversy',
  '{name} scandal',
  '{name} dropped by sponsor',
  '{name} brand deal ended',
  '{name} endorsement controversy',
];

function buildSearchQueries(clientName, brandCategory = null, brandName = null) {
  const queries = SEARCH_PATTERNS.map(p => p.replace('{name}', clientName));
  if (brandCategory) {
    queries.push(`${clientName} ${brandCategory} controversy`);
    queries.push(`${clientName} ${brandCategory} scandal`);
  }
  if (brandName) {
    queries.push(`${clientName} vs ${brandName}`);
    queries.push(`${clientName} ${brandName} ended partnership`);
    queries.push(`${clientName} dropped by ${brandName}`);
  }
  return [...new Set(queries)];
}

async function searchControversiesViaGoogle(query) {
  const apiKey = process.env.GOOGLE_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || apiKey === 'your_google_api_key_here' || !cx || cx === 'your_search_engine_id_here') {
    return [];
  }

  try {
    const url = `https://www.googleapis.com/customsearch/v1?key=${apiKey}&cx=${cx}&q=${encodeURIComponent(query)}&num=5`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.items) return [];

    return data.items.map(item => ({
      title: item.title,
      snippet: item.snippet,
      url: item.link,
      date: item.pagemap?.metatags?.[0]?.['article:published_time'] || null,
    }));
  } catch (err) {
    console.error('Controversy search error:', err.message);
    return [];
  }
}

function getStoredControversies(db, clientId, brandCategories = []) {
  const rows = db.prepare('SELECT * FROM controversies WHERE client_id = ? ORDER BY date_occurred DESC').all(clientId);

  return rows.map(row => {
    let relevance = [];
    try { relevance = JSON.parse(row.relevance_to_brands || '[]'); } catch {}

    let overlap = { directMatches: [], sharedParents: [] };
    if (brandCategories.length > 0 && relevance.length > 0) {
      overlap = getCategoryOverlap(relevance, brandCategories);
    }

    return { ...row, relevance_to_brands: relevance, categoryOverlap: overlap };
  });
}

module.exports = {
  buildSearchQueries,
  searchControversiesViaGoogle,
  getStoredControversies,
};
