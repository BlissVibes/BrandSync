const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');
const { fetchImageForEntity } = require('../services/imageService');
const { getEntitySEOData } = require('../services/seoService');

// GET /api/clients
router.get('/', (req, res) => {
  const db = getDb();
  const clients = db.prepare('SELECT * FROM clients ORDER BY name').all();

  const enriched = clients.map(client => {
    const activeRels = db.prepare(
      "SELECT COUNT(*) as count FROM client_brand_relationships WHERE client_id = ? AND status = 'active'"
    ).get(client.id);

    const controversies = db.prepare(
      'SELECT severity, COUNT(*) as count FROM controversies WHERE client_id = ? GROUP BY severity'
    ).all(client.id);

    const worstSeverity = getWorstSeverity(controversies);
    const controversyCount = controversies.reduce((s, r) => s + r.count, 0);

    return {
      ...client,
      activeBrandCount: activeRels.count,
      controversyCount,
      worstSeverity,
    };
  });

  res.json(enriched);
});

// GET /api/clients/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const relationships = db.prepare(`
    SELECT cbr.*, b.name as brand_name, b.logo_url, b.categories, b.parent_categories, b.primary_category
    FROM client_brand_relationships cbr
    JOIN brands b ON b.id = cbr.brand_id
    WHERE cbr.client_id = ?
    ORDER BY cbr.status ASC, cbr.start_date DESC
  `).all(req.params.id);

  const controversies = db.prepare('SELECT * FROM controversies WHERE client_id = ? ORDER BY date_occurred DESC').all(req.params.id);
  const seoData = getEntitySEOData(req.params.id, 'client');
  const sponsorships = db.prepare('SELECT * FROM sponsorship_history WHERE client_id = ? ORDER BY start_date DESC').all(req.params.id);

  const parsedRels = relationships.map(r => ({
    ...r,
    categories: parseJSON(r.categories, []),
    parent_categories: parseJSON(r.parent_categories, []),
  }));

  const parsedControversies = controversies.map(c => ({
    ...c,
    relevance_to_brands: parseJSON(c.relevance_to_brands, []),
  }));

  const parsedSEO = seoData.map(s => ({
    ...s,
    trend_data: parseJSON(s.trend_data, []),
  }));

  res.json({
    ...client,
    relationships: parsedRels,
    controversies: parsedControversies,
    seoData: parsedSEO,
    sponsorships,
  });
});

// POST /api/clients
router.post('/', async (req, res) => {
  const db = getDb();
  const { name, display_name, category, platform, org, notes } = req.body;
  if (!name) return res.status(400).json({ error: 'Name is required' });

  let image_url = req.body.image_url || null;
  if (!image_url) {
    image_url = await fetchImageForEntity(name);
  }

  const result = db.prepare(`
    INSERT INTO clients (name, display_name, image_url, category, platform, org, notes)
    VALUES (@name, @display_name, @image_url, @category, @platform, @org, @notes)
  `).run({ name, display_name: display_name || name, image_url, category: category || '', platform: platform || 'Both', org: org || null, notes: notes || null });

  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(client);
});

// PUT /api/clients/:id
router.put('/:id', async (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Client not found' });

  const { name, display_name, image_url, category, platform, org, notes } = req.body;

  db.prepare(`
    UPDATE clients SET name = @name, display_name = @display_name, image_url = @image_url,
    category = @category, platform = @platform, org = @org, notes = @notes
    WHERE id = @id
  `).run({
    id: req.params.id,
    name: name || existing.name,
    display_name: display_name || existing.display_name,
    image_url: image_url !== undefined ? image_url : existing.image_url,
    category: category !== undefined ? category : existing.category,
    platform: platform || existing.platform,
    org: org !== undefined ? org : existing.org,
    notes: notes !== undefined ? notes : existing.notes,
  });

  res.json(db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id));
});

// DELETE /api/clients/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Client not found' });
  db.prepare('DELETE FROM clients WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

// POST /api/clients/:id/fetch-image
router.post('/:id/fetch-image', async (req, res) => {
  const db = getDb();
  const client = db.prepare('SELECT * FROM clients WHERE id = ?').get(req.params.id);
  if (!client) return res.status(404).json({ error: 'Client not found' });

  const image_url = await fetchImageForEntity(client.name);
  if (!image_url) return res.status(404).json({ error: 'No image found' });

  db.prepare('UPDATE clients SET image_url = ? WHERE id = ?').run(image_url, req.params.id);
  res.json({ image_url });
});

function parseJSON(str, fallback) {
  try { return JSON.parse(str); } catch { return fallback; }
}

function getWorstSeverity(rows) {
  const order = ['critical', 'high', 'medium', 'low'];
  for (const sev of order) {
    if (rows.find(r => r.severity === sev)) return sev;
  }
  return null;
}

module.exports = router;
