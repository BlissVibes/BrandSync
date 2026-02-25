const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// GET /api/sponsorships?client_id=
router.get('/', (req, res) => {
  const db = getDb();
  const { client_id } = req.query;
  if (!client_id) return res.status(400).json({ error: 'client_id is required' });
  const rows = db.prepare('SELECT * FROM sponsorship_history WHERE client_id = ? ORDER BY start_date DESC').all(client_id);
  res.json(rows);
});

// POST /api/sponsorships
router.post('/', (req, res) => {
  const db = getDb();
  const { client_id, brand_name, brand_category, status, start_date, end_date, end_reason, source_url, is_verified } = req.body;
  if (!client_id || !brand_name) return res.status(400).json({ error: 'client_id and brand_name are required' });

  const result = db.prepare(`
    INSERT INTO sponsorship_history (client_id, brand_name, brand_category, status, start_date, end_date, end_reason, source_url, is_verified)
    VALUES (@client_id, @brand_name, @brand_category, @status, @start_date, @end_date, @end_reason, @source_url, @is_verified)
  `).run({
    client_id,
    brand_name,
    brand_category: brand_category || null,
    status: status || 'active',
    start_date: start_date || null,
    end_date: end_date || null,
    end_reason: end_reason || null,
    source_url: source_url || null,
    is_verified: is_verified ? 1 : 0,
  });

  res.status(201).json({ id: result.lastInsertRowid });
});

// DELETE /api/sponsorships/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  db.prepare('DELETE FROM sponsorship_history WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
