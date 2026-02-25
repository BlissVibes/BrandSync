const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

// POST /api/relationships
router.post('/', (req, res) => {
  const db = getDb();
  const { client_id, brand_id, status, start_date, end_date, end_reason, end_reason_source_url, is_public_end, ended_by } = req.body;

  if (!client_id || !brand_id) return res.status(400).json({ error: 'client_id and brand_id are required' });

  const result = db.prepare(`
    INSERT INTO client_brand_relationships
      (client_id, brand_id, status, start_date, end_date, end_reason, end_reason_source_url, is_public_end, ended_by)
    VALUES
      (@client_id, @brand_id, @status, @start_date, @end_date, @end_reason, @end_reason_source_url, @is_public_end, @ended_by)
  `).run({
    client_id,
    brand_id,
    status: status || 'active',
    start_date: start_date || null,
    end_date: end_date || null,
    end_reason: end_reason || null,
    end_reason_source_url: end_reason_source_url || null,
    is_public_end: is_public_end ? 1 : 0,
    ended_by: ended_by || 'unknown',
  });

  res.status(201).json({ id: result.lastInsertRowid });
});

// PUT /api/relationships/:id
router.put('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM client_brand_relationships WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Relationship not found' });

  const { status, start_date, end_date, end_reason, end_reason_source_url, is_public_end, ended_by } = req.body;

  db.prepare(`
    UPDATE client_brand_relationships SET
      status = @status, start_date = @start_date, end_date = @end_date,
      end_reason = @end_reason, end_reason_source_url = @end_reason_source_url,
      is_public_end = @is_public_end, ended_by = @ended_by
    WHERE id = @id
  `).run({
    id: req.params.id,
    status: status || existing.status,
    start_date: start_date !== undefined ? start_date : existing.start_date,
    end_date: end_date !== undefined ? end_date : existing.end_date,
    end_reason: end_reason !== undefined ? end_reason : existing.end_reason,
    end_reason_source_url: end_reason_source_url !== undefined ? end_reason_source_url : existing.end_reason_source_url,
    is_public_end: is_public_end !== undefined ? (is_public_end ? 1 : 0) : existing.is_public_end,
    ended_by: ended_by || existing.ended_by,
  });

  res.json(db.prepare('SELECT * FROM client_brand_relationships WHERE id = ?').get(req.params.id));
});

// DELETE /api/relationships/:id
router.delete('/:id', (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT * FROM client_brand_relationships WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ error: 'Relationship not found' });
  db.prepare('DELETE FROM client_brand_relationships WHERE id = ?').run(req.params.id);
  res.json({ success: true });
});

module.exports = router;
