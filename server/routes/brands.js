const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { deriveParentCategories, ALL_SUBCATEGORIES, CATEGORY_TAXONOMY } = require('../db/categoryTaxonomy');
const { getEntitySEOData } = require('../services/seoService');

function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// GET /api/brands
router.get('/', (req, res) => {
  const db = getDb();
  const brands = db.prepare('SELECT * FROM brands ORDER BY name').all();
  res.json(brands.map(b => ({
    ...b,
    categories: parseJSON(b.categories, []),
    parent_categories: parseJSON(b.parent_categories, []),
  })));
});

// GET /api/brands/taxonomy
router.get('/taxonomy', (req, res) => {
  res.json({ taxonomy: CATEGORY_TAXONOMY, allSubcategories: ALL_SUBCATEGORIES });
});

// GET /api/brands/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!brand) return res.status(404).json({ error: 'Brand not found' });

  const clients = db.prepare(`
    SELECT cbr.*, c.name as client_name, c.display_name, c.image_url, c.platform
    FROM client_brand_relationships cbr
    JOIN clients c ON c.id = cbr.client_id
    WHERE cbr.brand_id = ?
    ORDER BY cbr.status ASC, cbr.start_date DESC
  `).all(req.params.id);

  const seoData = getEntitySEOData(req.params.id, 'brand').map(s => ({
    ...s,
    trend_data: parseJSON(s.trend_data, []),
  }));

  res.json({
    ...brand,
    categories: parseJSON(brand.categories, []),
    parent_categories: parseJSON(brand.parent_categories, []),
    clients,
    seoData,
  });
});

// POST /api/brands
router.post('/', (req, res) => {
  const db = getDb();
  const { name, logo_url, categories, primary_category } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  const cats = Array.isArray(categories) ? categories : [];
  const parentCats = deriveParentCategories(cats);

  const result = db.prepare(`
    INSERT INTO brands (name, logo_url, categories, parent_categories, primary_category)
    VALUES (@name, @logo_url, @categories, @parent_categories, @primary_category)
  `).run({
    name,
    logo_url: logo_url || '',
    categories: JSON.stringify(cats),
    parent_categories: JSON.stringify(parentCats),
    primary_category: primary_category || cats[0] || '',
  });

  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({
    ...brand,
    categories: parseJSON(brand.categories, []),
    parent_categories: parseJSON(brand.parent_categories, []),
  });
});

// PUT /api/brands/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Brand not found' });

  const { name, logo_url, categories, primary_category } = req.body;
  const cats = Array.isArray(categories) ? categories : parseJSON(existing.categories, []);
  const parentCats = deriveParentCategories(cats);

  db.prepare(`
    UPDATE brands SET name = @name, logo_url = @logo_url, categories = @categories,
    parent_categories = @parent_categories, primary_category = @primary_category
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: name || existing.name,
    logo_url: logo_url !== undefined ? logo_url : existing.logo_url,
    categories: JSON.stringify(cats),
    parent_categories: JSON.stringify(parentCats),
    primary_category: primary_category || cats[0] || existing.primary_category,
  });

  const brand = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  res.json({ ...brand, categories: parseJSON(brand.categories, []), parent_categories: parseJSON(brand.parent_categories, []) });
});

// DELETE /api/brands/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM brands WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Brand not found' });
  db.prepare('DELETE FROM brands WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
