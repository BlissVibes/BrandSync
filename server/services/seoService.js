/**
 * SEO Service Interface
 * Currently uses mock/stub data. Plug in SEMrush, Ahrefs, or Moz here.
 */

const { getDb } = require('../db/schema');

// Pearson correlation coefficient
function pearsonCorrelation(xs, ys) {
  const n = Math.min(xs.length, ys.length);
  if (n < 2) return 0;

  const xSlice = xs.slice(0, n);
  const ySlice = ys.slice(0, n);

  const meanX = xSlice.reduce((a, b) => a + b, 0) / n;
  const meanY = ySlice.reduce((a, b) => a + b, 0) / n;

  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xSlice[i] - meanX;
    const dy = ySlice[i] - meanY;
    num += dx * dy;
    denX += dx * dx;
    denY += dy * dy;
  }

  const denom = Math.sqrt(denX * denY);
  return denom === 0 ? 0 : parseFloat((num / denom).toFixed(3));
}

function getEntitySEOData(entityId, entityType) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM seo_data WHERE entity_id = ? AND entity_type = ? ORDER BY keyword'
  ).all(entityId, entityType);
}

function getPrimaryTrend(entityId, entityType) {
  const db = getDb();
  const row = db.prepare(
    'SELECT trend_data FROM seo_data WHERE entity_id = ? AND entity_type = ? ORDER BY search_volume DESC LIMIT 1'
  ).get(entityId, entityType);
  if (!row) return [];
  try {
    return JSON.parse(row.trend_data);
  } catch {
    return [];
  }
}

function calculateCorrelation(clientId, brandId) {
  const clientTrend = getPrimaryTrend(clientId, 'client');
  const brandTrend = getPrimaryTrend(brandId, 'brand');

  if (!clientTrend.length || !brandTrend.length) return { coefficient: null, clientData: [], brandData: [] };

  const clientValues = clientTrend.map(d => d.value);
  const brandValues = brandTrend.map(d => d.value);
  const coefficient = pearsonCorrelation(clientValues, brandValues);

  return {
    coefficient,
    clientData: clientTrend,
    brandData: brandTrend,
    months: clientTrend.map(d => d.month),
  };
}

// Stub for a real SEO API lookup
// Replace this with real API calls to SEMrush/Ahrefs/Moz
async function fetchLiveSEOData(entityName) {
  // STUB: return mock data until real API is configured
  const GOOGLE_API_KEY = process.env.GOOGLE_API_KEY;
  if (!GOOGLE_API_KEY || GOOGLE_API_KEY === 'your_google_api_key_here') {
    return generateMockSEOData(entityName);
  }

  // Real implementation placeholder
  // const response = await fetch(`https://api.semrush.com/...`)
  return generateMockSEOData(entityName);
}

function generateMockSEOData(name) {
  const base = 30 + Math.floor(Math.random() * 50);
  const months = 24;
  const trend = [];
  let current = base;
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    current = Math.max(10, current + (Math.random() - 0.45) * 15);
    trend.push({ month, value: Math.round(current) });
  }

  return {
    keyword: name,
    search_volume: Math.floor(base * 5000 + Math.random() * 100000),
    trend_data: trend,
  };
}

module.exports = {
  pearsonCorrelation,
  getEntitySEOData,
  getPrimaryTrend,
  calculateCorrelation,
  fetchLiveSEOData,
  generateMockSEOData,
};
