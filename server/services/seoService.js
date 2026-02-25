/**
 * SEO Service
 *
 * fetchGoogleTrendsPair() fetches real relative search interest from Google Trends
 * for two keywords simultaneously, so the values are directly comparable.
 * Falls back to generateMockSEOData() on rate-limit or network errors.
 */

const googleTrends = require('google-trends-api');
const { getDb } = require('../db/schema');

// ─── Pearson correlation coefficient ─────────────────────────────────────────
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

// ─── Google Trends ────────────────────────────────────────────────────────────

/**
 * Fetch Google Trends interest-over-time for two keywords in a single request.
 * Requesting them together means the values are normalized on the same 0–100 scale,
 * which is exactly what we want for correlation analysis.
 *
 * Returns { trend1, trend2, source: 'google_trends' }
 * or falls back to mock on error.
 */
async function fetchGoogleTrendsPair(keyword1, keyword2) {
  const startTime = new Date();
  startTime.setMonth(startTime.getMonth() - 24);

  try {
    const raw = await googleTrends.interestOverTime({
      keyword: [keyword1, keyword2],
      startTime,
      granularTimeResolution: true,
    });

    const parsed = JSON.parse(raw);
    const timeline = parsed?.default?.timelineData;
    if (!timeline || timeline.length === 0) throw new Error('Empty response');

    // Aggregate weekly data points → monthly averages
    const monthly1 = {}, monthly2 = {};
    for (const point of timeline) {
      const date = new Date(parseInt(point.time) * 1000);
      const month = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      if (!monthly1[month]) monthly1[month] = { sum: 0, count: 0 };
      if (!monthly2[month]) monthly2[month] = { sum: 0, count: 0 };
      monthly1[month].sum += point.value?.[0] ?? 0;
      monthly1[month].count++;
      monthly2[month].sum += point.value?.[1] ?? 0;
      monthly2[month].count++;
    }

    function toTrend(obj) {
      return Object.entries(obj)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, { sum, count }]) => ({ month, value: Math.round(sum / count) }));
    }

    return {
      trend1: toTrend(monthly1),
      trend2: toTrend(monthly2),
      source: 'google_trends',
    };
  } catch (err) {
    console.warn(`[seoService] Google Trends fetch failed for "${keyword1}" / "${keyword2}": ${err.message}. Using mock data.`);
    const m1 = generateMockSEOData(keyword1);
    const m2 = generateMockSEOData(keyword2);
    return { trend1: m1.trend_data, trend2: m2.trend_data, source: 'mock' };
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

function getEntitySEOData(entityId, entityType) {
  const db = getDb();
  return db.prepare(
    'SELECT * FROM seo_data WHERE entity_id = ? AND entity_type = ? ORDER BY keyword'
  ).all(entityId, entityType);
}

function getPrimaryKeyword(entityId, entityType) {
  const db = getDb();
  const row = db.prepare(
    'SELECT keyword FROM seo_data WHERE entity_id = ? AND entity_type = ? ORDER BY search_volume DESC LIMIT 1'
  ).get(entityId, entityType);
  return row?.keyword || null;
}

function getPrimaryTrend(entityId, entityType) {
  const db = getDb();
  const row = db.prepare(
    'SELECT trend_data FROM seo_data WHERE entity_id = ? AND entity_type = ? ORDER BY search_volume DESC LIMIT 1'
  ).get(entityId, entityType);
  if (!row) return [];
  try { return JSON.parse(row.trend_data); } catch { return []; }
}

/**
 * Calculate correlation for stored client+brand using live Google Trends.
 * Falls back to DB-stored trend data if no primary keyword exists or if
 * Google Trends fails.
 */
async function calculateCorrelation(clientId, brandId) {
  const db = getDb();
  const clientRow = db.prepare('SELECT name, display_name FROM clients WHERE id = ?').get(clientId);
  const brandRow  = db.prepare('SELECT name FROM brands WHERE id = ?').get(brandId);

  const clientKeyword = getPrimaryKeyword(clientId, 'client') || clientRow?.display_name || clientRow?.name;
  const brandKeyword  = getPrimaryKeyword(brandId,  'brand')  || brandRow?.name;

  if (clientKeyword && brandKeyword) {
    const { trend1, trend2, source } = await fetchGoogleTrendsPair(clientKeyword, brandKeyword);
    if (trend1.length > 0 && trend2.length > 0) {
      const coefficient = pearsonCorrelation(trend1.map(d => d.value), trend2.map(d => d.value));
      return { coefficient, clientData: trend1, brandData: trend2, source };
    }
  }

  // Fallback: use stored DB trend data
  const clientTrend = getPrimaryTrend(clientId, 'client');
  const brandTrend  = getPrimaryTrend(brandId, 'brand');
  if (!clientTrend.length || !brandTrend.length) {
    return { coefficient: null, clientData: [], brandData: [], source: 'none' };
  }
  const coefficient = pearsonCorrelation(clientTrend.map(d => d.value), brandTrend.map(d => d.value));
  return { coefficient, clientData: clientTrend, brandData: brandTrend, source: 'stored' };
}

// ─── Mock fallback ────────────────────────────────────────────────────────────

function generateMockSEOData(name) {
  const base = 30 + Math.floor(Math.random() * 50);
  const trend = [];
  let current = base;
  const now = new Date();

  for (let i = 23; i >= 0; i--) {
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

// Legacy alias used by seed-entity route
async function fetchLiveSEOData(entityName) {
  const mock = generateMockSEOData(entityName);
  return { ...mock, source: 'mock' };
}

module.exports = {
  pearsonCorrelation,
  getEntitySEOData,
  getPrimaryKeyword,
  getPrimaryTrend,
  calculateCorrelation,
  fetchGoogleTrendsPair,
  fetchLiveSEOData,
  generateMockSEOData,
};
