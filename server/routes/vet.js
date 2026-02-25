const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { fetchImageForEntity } = require('../services/imageService');
const { generateMockSEOData, pearsonCorrelation } = require('../services/seoService');
const { getCategoryOverlap, deriveParentCategories, getControversionMatchLevel } = require('../db/categoryTaxonomy');

function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function computeRiskScore(coefficient, controversyFlags) {
  let score = 0;
  if (coefficient !== null) {
    if (coefficient >= 0.6) score += 30;
    else if (coefficient >= 0.2) score += 15;
    else if (coefficient >= -0.2) score += 5;
    else if (coefficient >= -0.5) score -= 10;
    else score -= 25;
  }
  const criticals = controversyFlags.filter(c => c.severity === 'critical').length;
  const highs = controversyFlags.filter(c => c.severity === 'high').length;
  const mediums = controversyFlags.filter(c => c.severity === 'medium').length;
  if (criticals > 0) score -= 50;
  if (highs > 0) score -= 25;
  if (mediums > 0) score -= 10;
  if (controversyFlags.length === 0) score += 20;
  return score;
}

function getRiskLabel(score) {
  if (score >= 40) return 'Strong Fit';
  if (score >= 15) return 'Proceed with Caution';
  if (score >= -10) return 'High Risk';
  return 'Do Not Recommend';
}

// POST /api/vet
// Body: { client_name: string, client_id?: number (if already in DB) }
router.post('/', async (req, res) => {
  const db = getDb();
  const { client_name, client_id } = req.body;
  if (!client_name) return res.status(400).json({ error: 'client_name is required' });

  // Fetch image
  const image_url = await fetchImageForEntity(client_name);

  // Get SEO data for new client (mock)
  const clientSEO = generateMockSEOData(client_name);

  // Get all brands
  const brands = db.prepare('SELECT * FROM brands').all().map(b => ({
    ...b,
    categories: parseJSON(b.categories, []),
    parent_categories: parseJSON(b.parent_categories, []),
  }));

  // Get controversies for existing client or from DB by name
  let controversies = [];
  if (client_id) {
    const rows = db.prepare('SELECT * FROM controversies WHERE client_id = ?').all(client_id);
    controversies = rows.map(r => ({ ...r, relevance_to_brands: parseJSON(r.relevance_to_brands, []) }));
  }

  // Build comparison matrix
  const matrix = brands.map(brand => {
    // SEO correlation using brand's stored data
    let brandTrendData = [];
    const brandSEORow = db.prepare(
      'SELECT trend_data FROM seo_data WHERE entity_id = ? AND entity_type = ? ORDER BY search_volume DESC LIMIT 1'
    ).get(brand.id, 'brand');
    if (brandSEORow) {
      brandTrendData = parseJSON(brandSEORow.trend_data, []);
    } else {
      brandTrendData = generateMockSEOData(brand.name).trend_data;
    }

    const clientValues = clientSEO.trend_data.map(d => d.value);
    const brandValues = brandTrendData.map(d => d.value);
    const coefficient = pearsonCorrelation(clientValues, brandValues);

    // Category overlap per controversy
    const controversyFlags = controversies.filter(c => {
      const level = getControversionMatchLevel(c.relevance_to_brands, brand.categories);
      return level !== null;
    });

    // Per-category chip status for this brand
    const categoryChips = brand.categories.map(cat => {
      // Direct match: controversy directly tags this category
      const directHit = controversies.some(c => c.relevance_to_brands.includes(cat));
      if (directHit) return { category: cat, status: 'red' };

      // Parent match: controversy shares a parent category
      const parentHit = controversies.some(c => {
        const cParents = deriveParentCategories(c.relevance_to_brands);
        const bParents = deriveParentCategories([cat]);
        return cParents.some(p => bParents.includes(p));
      });
      if (parentHit) return { category: cat, status: 'yellow' };

      return { category: cat, status: 'green' };
    });

    const overlapCount = categoryChips.filter(c => c.status === 'red').length;
    const adjacentCount = categoryChips.filter(c => c.status === 'yellow').length;
    const riskScore = computeRiskScore(coefficient, controversyFlags);
    const recommendation = getRiskLabel(riskScore);

    return {
      brand: { id: brand.id, name: brand.name, logo_url: brand.logo_url, primary_category: brand.primary_category, categories: brand.categories },
      coefficient,
      categoryChips,
      overlapCount,
      adjacentCount,
      controversyFlags,
      riskScore,
      recommendation,
      brandTrendData,
      clientTrendData: clientSEO.trend_data,
    };
  });

  // Sort best fit to worst
  matrix.sort((a, b) => b.riskScore - a.riskScore);

  const strongFit = matrix.filter(r => r.recommendation === 'Strong Fit').length;
  const totalBrands = matrix.length;

  res.json({
    clientName: client_name,
    clientSEO: { keyword: clientSEO.keyword, search_volume: clientSEO.search_volume, trend_data: clientSEO.trend_data },
    image_url,
    matrix,
    summary: {
      strongFit,
      totalBrands,
      label: `${client_name} is a strong/moderate/poor fit for ${strongFit} of ${totalBrands} brand${totalBrands !== 1 ? 's' : ''}`,
    },
  });
});

module.exports = router;
