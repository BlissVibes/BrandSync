const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { deriveParentCategories } = require('../db/categoryTaxonomy');

function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

// GET /api/controversies?client_id=&brand_id=
router.get('/', (req, res) => {
  const db = getDb();
  const { client_id, brand_id } = req.query;

  let query = 'SELECT * FROM controversies WHERE 1=1';
  const params = [];
  if (client_id) { query += ' AND client_id = ?'; params.push(client_id); }
  if (brand_id) { query += ' AND brand_id = ?'; params.push(brand_id); }
  query += ' ORDER BY date_occurred DESC';

  const rows = db.prepare(query).all(...params);
  res.json(rows.map(r => ({ ...r, relevance_to_brands: parseJSON(r.relevance_to_brands, []) })));
});

// GET /api/controversies/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const row = db.prepare('SELECT * FROM controversies WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'Not found' });
  res.json({ ...row, relevance_to_brands: parseJSON(row.relevance_to_brands, []) });
});

// POST /api/controversies
router.post('/', (req, res) => {
  const db = getDb();
  const { client_id, brand_id, title, summary, source_url, date_occurred, severity, category, relevance_to_brands } = req.body;

  if (!title) return res.status(400).json({ error: 'Title is required' });

  // Auto-derive relevance from category if not provided
  let relevance = Array.isArray(relevance_to_brands) ? relevance_to_brands : [];
  if (relevance.length === 0 && category) {
    const parents = deriveParentCategories([category]);
    const { CATEGORY_TAXONOMY } = require('../db/categoryTaxonomy');
    relevance = [category];
    for (const parent of parents) {
      if (CATEGORY_TAXONOMY[parent]) relevance.push(...CATEGORY_TAXONOMY[parent]);
    }
    relevance = [...new Set(relevance)];
  }

  const result = db.prepare(`
    INSERT INTO controversies
      (client_id, brand_id, title, summary, source_url, date_occurred, severity, category, relevance_to_brands)
    VALUES
      (@client_id, @brand_id, @title, @summary, @source_url, @date_occurred, @severity, @category, @relevance_to_brands)
  `).run({
    client_id: client_id || null,
    brand_id: brand_id || null,
    title,
    summary: summary || null,
    source_url: source_url || null,
    date_occurred: date_occurred || null,
    severity: severity || 'medium',
    category: category || null,
    relevance_to_brands: JSON.stringify(relevance),
  });

  const row = db.prepare('SELECT * FROM controversies WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json({ ...row, relevance_to_brands: parseJSON(row.relevance_to_brands, []) });
});

// PUT /api/controversies/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM controversies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });

  const { title, summary, source_url, date_occurred, severity, category, relevance_to_brands } = req.body;
  const relevance = Array.isArray(relevance_to_brands) ? relevance_to_brands : parseJSON(existing.relevance_to_brands, []);

  db.prepare(`
    UPDATE controversies SET title = @title, summary = @summary, source_url = @source_url,
    date_occurred = @date_occurred, severity = @severity, category = @category, relevance_to_brands = @relevance_to_brands
    WHERE id = @id
  `).run({
    id: req.params.id,
    title: title || existing.title,
    summary: summary !== undefined ? summary : existing.summary,
    source_url: source_url !== undefined ? source_url : existing.source_url,
    date_occurred: date_occurred !== undefined ? date_occurred : existing.date_occurred,
    severity: severity || existing.severity,
    category: category !== undefined ? category : existing.category,
    relevance_to_brands: JSON.stringify(relevance),
  });

  const row = db.prepare('SELECT * FROM controversies WHERE id = ?').get(req.params.id);
  res.json({ ...row, relevance_to_brands: parseJSON(row.relevance_to_brands, []) });
});

// DELETE /api/controversies/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM controversies WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Not found' });
  db.prepare('DELETE FROM controversies WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
