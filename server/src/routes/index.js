// Mounts every module router under /api.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import openrouter from '../lib/openrouter.js';
import config from '../config.js';
import { crudRouter } from './crud.js';
import { requireAuth, requireStaff } from '../middleware/index.js';

import auth from './auth.js';
import publicRoutes from './public.js';
import platform from './platform.js';
import data from './data.js';
import students from './students.js';
import timetable from './timetable.js';
import fees from './fees.js';
import library from './library.js';
import inventory from './inventory.js';
import attendance from './attendance.js';
import dashboard from './dashboard.js';
import ai from './ai.js';
import automations from './automations.js';
import notifications from './notifications.js';
import uploads from './uploads.js';

const api = Router();

// --- system ---------------------------------------------------------------
api.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));
api.get('/status', (_req, res) => {
  res.json({
    mode: db.mode,
    integrations: {
      supabase: db.mode === 'supabase',
      openrouter: openrouter.configured,
      email: config.smtp.configured,
      automations: config.automations.enabled,
    },
    school_id: config.defaultSchoolId,
  });
});

// --- auth + public (unguarded) --------------------------------------------
api.use('/auth', auth);
api.use(publicRoutes); // /public/* — website enquiry form + school card

// --- access control -------------------------------------------------------
// Everything below requires an authenticated caller (auto-passes in demo mode).
// Mutations additionally require a staff role. Read-only + AI chat + the
// notifications feed are exempt from the staff requirement.
const STAFF_EXEMPT = ['/ai', '/notifications'];
api.use((req, res, next) => {
  requireAuth(req, res, (err) => {
    if (err) return next(err);
    const isWrite = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method);
    const exempt = STAFF_EXEMPT.some((p) => req.path.startsWith(p));
    if (isWrite && !exempt) return requireStaff(req, res, next);
    next();
  });
});

// --- simple CRUD resources ------------------------------------------------
api.use('/teachers', crudRouter({
  table: 'teachers',
  searchColumn: 'full_name',
  filterColumns: ['is_active'],
  defaultOrder: { column: 'full_name', ascending: true },
  createSchema: z.object({ full_name: z.string().min(1) }).passthrough(),
}));

api.use('/guardians', crudRouter({
  table: 'guardians',
  searchColumn: 'full_name',
  defaultOrder: { column: 'full_name', ascending: true },
  createSchema: z.object({ full_name: z.string().min(1) }).passthrough(),
}));

api.use('/classes', crudRouter({
  table: 'classes',
  filterColumns: ['grade', 'academic_year_id'],
  defaultOrder: { column: 'grade', ascending: true },
  createSchema: z.object({ grade: z.string().min(1), section: z.string().min(1) }).passthrough(),
}));

api.use('/subjects', crudRouter({
  table: 'subjects',
  searchColumn: 'name',
  defaultOrder: { column: 'name', ascending: true },
  createSchema: z.object({ name: z.string().min(1) }).passthrough(),
}));

api.use('/academic-years', crudRouter({
  table: 'academic_years',
  defaultOrder: { column: 'start_date', ascending: false },
  createSchema: z.object({ name: z.string().min(1), start_date: z.string(), end_date: z.string() }).passthrough(),
}));

api.use('/announcements', crudRouter({
  table: 'announcements',
  defaultOrder: { column: 'published_at', ascending: false },
  createSchema: z.object({ title: z.string().min(1) }).passthrough(),
}));

// --- module routers -------------------------------------------------------
api.use('/students', students);
api.use('/timetable', timetable);
api.use('/fees', fees);
api.use('/library', library);
api.use('/inventory', inventory);
api.use('/attendance', attendance);
api.use('/dashboard', dashboard);
api.use('/ai', ai);
api.use('/automations', automations);
api.use('/notifications', notifications);
api.use(uploads); // /uploads + /uploads/status — Supabase Storage-backed file uploads

// --- platform modules (multi-tenant + operations + AI agents) -------------
api.use(platform);

// --- data connectivity: Excel export/import, search, Google Drive ---------
api.use(data);

export default api;
