// Inventory — categories, items (with low-stock flag), and stock movements.
// Item quantity is maintained by the transaction trigger (and DEMO replica),
// so record movements rather than editing quantity directly.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';
import { parse } from './crud.js';

const router = Router();

// ---- Categories ------------------------------------------------------------
router.get('/categories', asyncHandler(async (_req, res) => {
  const data = await db.list('inventory_categories', { order: { column: 'name', ascending: true } });
  res.json({ data });
}));
router.post('/categories', asyncHandler(async (req, res) => {
  const row = await db.insert('inventory_categories', { school_id: config.defaultSchoolId, ...req.body });
  res.status(201).json({ data: row });
}));

// ---- Items -----------------------------------------------------------------
router.get('/items', asyncHandler(async (req, res) => {
  const query = { order: { column: 'name', ascending: true } };
  if (req.query.search) query.ilike = { name: `%${req.query.search}%` };
  const items = await db.list('inventory_items', query);
  const categories = await db.mapById('inventory_categories');
  const data = items.map((i) => ({
    ...i,
    category_name: categories[i.category_id]?.name || null,
    low_stock: Number(i.quantity) <= Number(i.reorder_level),
  }));
  res.json({ data, count: data.length, mode: db.mode });
}));

const itemSchema = z.object({
  name: z.string().min(1),
  category_id: z.string().optional(),
  sku: z.string().optional(),
  unit: z.string().optional(),
  quantity: z.coerce.number().default(0),
  reorder_level: z.coerce.number().default(0),
  location: z.string().optional(),
  unit_cost: z.coerce.number().optional(),
  supplier: z.string().optional(),
}).passthrough();

router.post('/items', asyncHandler(async (req, res) => {
  const body = parse(itemSchema, req.body);
  body.school_id = config.defaultSchoolId;
  const row = await db.insert('inventory_items', body);
  res.status(201).json({ data: row });
}));

router.patch('/items/:id', asyncHandler(async (req, res) => {
  const row = await db.update('inventory_items', req.params.id, req.body);
  if (!row) throw new HttpError(404, 'Item not found');
  res.json({ data: row });
}));

// ---- Stock movements -------------------------------------------------------
const txnSchema = z.object({
  item_id: z.string().min(1),
  type: z.enum(['inbound', 'outbound', 'adjustment', 'damaged', 'returned']),
  quantity: z.coerce.number(),
  note: z.string().optional(),
}).passthrough();

router.post('/transactions', asyncHandler(async (req, res) => {
  const body = parse(txnSchema, req.body);
  const item = await db.getById('inventory_items', body.item_id);
  if (!item) throw new HttpError(404, 'Item not found');
  const txn = await db.insert('inventory_transactions', { school_id: config.defaultSchoolId, ...body });
  const updated = await db.getById('inventory_items', body.item_id);
  res.status(201).json({ data: txn, item: updated });
}));

router.get('/transactions', asyncHandler(async (req, res) => {
  const query = { order: { column: 'created_at', ascending: false }, limit: 100 };
  if (req.query.item_id) query.eq = { item_id: req.query.item_id };
  const data = await db.list('inventory_transactions', query);
  res.json({ data });
}));

export default router;
