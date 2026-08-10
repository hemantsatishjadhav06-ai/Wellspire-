// A small factory that builds standard REST routes for a table:
//   GET  /            list (optional ?search= on a text column, ?<col>=<val> filters)
//   GET  /:id         fetch one
//   POST /            create
//   PATCH /:id        update
//   DELETE /:id       delete
// Complex resources (fees, timetable, library…) get their own routers instead.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

/**
 * @param {object} opts
 * @param {string} opts.table
 * @param {string} [opts.searchColumn]     column used by ?search=
 * @param {string[]} [opts.filterColumns]  query params allowed as eq filters
 * @param {z.ZodType} [opts.createSchema]
 * @param {z.ZodType} [opts.updateSchema]
 * @param {object} [opts.defaultOrder]     { column, ascending }
 */
export function crudRouter(opts) {
  const {
    table,
    searchColumn,
    filterColumns = [],
    createSchema,
    updateSchema,
    defaultOrder = { column: 'created_at', ascending: false },
  } = opts;
  const router = Router();

  router.get('/', asyncHandler(async (req, res) => {
    const query = { order: defaultOrder };
    const eq = {};
    for (const col of filterColumns) {
      if (req.query[col] !== undefined) eq[col] = req.query[col];
    }
    if (Object.keys(eq).length) query.eq = eq;
    if (searchColumn && req.query.search) query.ilike = { [searchColumn]: `%${req.query.search}%` };
    if (req.query.limit) query.limit = Number(req.query.limit);
    const data = await db.list(table, query);
    res.json({ data, count: data.length, mode: db.mode });
  }));

  router.get('/:id', asyncHandler(async (req, res) => {
    const row = await db.getById(table, req.params.id);
    if (!row) throw new HttpError(404, `${table} not found`);
    res.json({ data: row });
  }));

  router.post('/', asyncHandler(async (req, res) => {
    const body = createSchema ? parse(createSchema, req.body) : req.body;
    if (!('school_id' in body)) body.school_id = config.defaultSchoolId;
    const row = await db.insert(table, body);
    res.status(201).json({ data: row });
  }));

  router.patch('/:id', asyncHandler(async (req, res) => {
    const body = updateSchema ? parse(updateSchema, req.body) : req.body;
    const row = await db.update(table, req.params.id, body);
    if (!row) throw new HttpError(404, `${table} not found`);
    res.json({ data: row });
  }));

  router.delete('/:id', asyncHandler(async (req, res) => {
    await db.remove(table, req.params.id);
    res.json({ ok: true });
  }));

  return router;
}

export function parse(schema, body) {
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new HttpError(422, 'Validation failed', result.error.flatten());
  }
  return result.data;
}
