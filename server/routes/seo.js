const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const {
  getEntitySEOData,
  calculateCorrelation,
  fetchGoogleTrendsPair,
  fetchLiveSEOData,
  generateMockSEOData,
} = require('../services/seoService');
const { getStoredControversies } = require('../services/controversyService');
const { getCategoryOverlap } = require('../db/categoryTaxonomy');

function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// GET /api/seo/entity/:type/:id
router.get('/entity/:type/:id', (req, res) => {
  const { type, id } = req.params;
  if (!['client', 'brand'].includes(type)) return res.status(400).json({ error: 'Invalid type' });
  const data = getEntitySEOData(id, type).map(s => ({ ...s, trend_data: parseJSON(s.trend_data, []) }));
  res.json(data);
});

// GET /api/seo/correlation?client_id=&brand_id=
// Fetches live Google Trends data for the primary keyword of each entity,
// then computes Pearson correlation. Falls back to stored DB data on error.
router.get('/correlation', async (req, res) => {
  const { client_id, brand_id } = req.query;
  if (!client_id || !brand_id) return res.status(400).json({ error: 'client_id and brand_id are required' });

  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(client_id);
  const brand  = db.prepare('SELECT * FROM brands WHERE id = ?').get(brand_id);
  if (!client || !brand) return res.status(404).json({ error: 'Client or brand not found' });

  const brandCategories = parseJSON(brand.categories, []);
  const controversies   = getStoredControversies(db, client_id, brandCategories);

  const controversyFlags = controversies.filter(c => {
    const overlap = getCategoryOverlap(c.relevance_to_brands, brandCategories);
    return overlap.directMatches.length > 0 || overlap.sharedParents.length > 0;
  });

  // Live Google Trends fetch (async, with stored-data fallback inside)
  const correlation = await calculateCorrelation(client_id, brand_id);

  res.json({
    client: { id: client.id, name: client.name, display_name: client.display_name },
    brand:  { id: brand.id, name: brand.name, categories: brandCategories, primary_category: brand.primary_category },
    correlation,
    controversyFlags,
    riskAssessment: computeRiskAssessment(correlation.coefficient, controversyFlags, brandCategories),
  });
});

// POST /api/seo/correlation/adhoc
// Both names fetched together from Google Trends so values are on the same scale.
router.post('/correlation/adhoc', async (req, res) => {
  const { client_name, brand_name, brand_categories = [] } = req.body;
  if (!client_name || !brand_name) return res.status(400).json({ error: 'client_name and brand_name are required' });

  const { trend1, trend2, source } = await fetchGoogleTrendsPair(client_name, brand_name);

  const { pearsonCorrelation } = require('../services/seoService');
  const coefficient = pearsonCorrelation(trend1.map(d => d.value), trend2.map(d => d.value));

  res.json({
    client: { name: client_name },
    brand:  { name: brand_name, categories: brand_categories },
    correlation: { coefficient, clientData: trend1, brandData: trend2, source },
    riskAssessment: computeRiskAssessment(coefficient, [], brand_categories),
  });
});

// POST /api/seo/seed-entity
router.post('/seed-entity', async (req, res) => {
  const db = getDb();
  const { entity_id, entity_type, name } = req.body;
  if (!entity_id || !entity_type || !name) return res.status(400).json({ error: 'Missing params' });

  const mock = generateMockSEOData(name);
  const result = db.prepare(`
    INSERT INTO seo_data (entity_id, entity_type, keyword, search_volume, trend_data, last_updated)
    VALUES (@entity_id, @entity_type, @keyword, @search_volume, @trend_data, @last_updated)
  `).run({
    entity_id,
    entity_type,
    keyword: name,
    search_volume: mock.search_volume,
    trend_data: JSON.stringify(mock.trend_data),
    last_updated: new Date().toISOString(),
  });

  res.status(201).json({ id: result.lastInsertRowid });
});

// ─── Risk assessment ──────────────────────────────────────────────────────────

function computeRiskAssessment(coefficient, controversyFlags, brandCategories) {
  let score = 0;
  const reasons = [];

  if (coefficient !== null) {
    if (coefficient >= 0.6)       { score += 30; reasons.push('Strong positive SEO correlation'); }
    else if (coefficient >= 0.2)  { score += 15; reasons.push('Moderate SEO correlation'); }
    else if (coefficient >= -0.2) { score +=  5; reasons.push('Neutral SEO correlation'); }
    else if (coefficient >= -0.5) { score -= 10; reasons.push('Negative SEO correlation'); }
    else                          { score -= 25; reasons.push('Strong negative SEO correlation'); }
  }

  const criticals = controversyFlags.filter(c => c.severity === 'critical').length;
  const highs     = controversyFlags.filter(c => c.severity === 'high').length;
  const mediums   = controversyFlags.filter(c => c.severity === 'medium').length;

  if (criticals) { score -= 50; reasons.push(`${criticals} critical controversy in this category`); }
  if (highs)     { score -= 25; reasons.push(`${highs} high-severity controversy in this category`); }
  if (mediums)   { score -= 10; reasons.push(`${mediums} medium-severity controversy`); }
  if (!controversyFlags.length) { score += 20; reasons.push('No relevant controversies found'); }
  if (brandCategories.length >= 4) { score += 5; reasons.push('Brand has diverse category presence'); }

  let recommendation;
  if (score >= 40)       recommendation = 'Strong Fit';
  else if (score >= 15)  recommendation = 'Proceed with Caution';
  else if (score >= -10) recommendation = 'High Risk';
  else                   recommendation = 'Do Not Recommend';

  return { score, recommendation, reasons };
}

module.exports = router;
