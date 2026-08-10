// Notifications feed for the in-app bell + mark-as-read.
import { Router } from 'express';
import db from '../lib/db.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
  const query = { order: { column: 'created_at', ascending: false }, limit: Number(req.query.limit) || 50 };
  if (req.query.kind) query.eq = { kind: req.query.kind };
  const data = await db.list('notifications', query);
  const unread = data.filter((n) => !n.read_at).length;
  res.json({ data, unread });
}));

router.post('/:id/read', asyncHandler(async (req, res) => {
  const row = await db.update('notifications', req.params.id, { read_at: new Date().toISOString(), status: 'read' });
  if (!row) throw new HttpError(404, 'Notification not found');
  res.json({ data: row });
}));

export default router;
