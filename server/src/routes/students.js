// Students — CRUD plus enrichment (class name + primary guardian) and a
// per-student 360° view (fees, attendance, loans).
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';
import { parse } from './crud.js';

const router = Router();

const createSchema = z.object({
  full_name: z.string().min(1),
  admission_no: z.string().min(1),
  roll_no: z.string().optional(),
  gender: z.enum(['male', 'female', 'other', 'undisclosed']).optional(),
  date_of_birth: z.string().optional(),
  class_id: z.string().optional(),
  blood_group: z.string().optional(),
  address: z.string().optional(),
}).passthrough();

async function enrich(students) {
  const classes = await db.mapById('classes');
  const links = await db.list('student_guardians');
  const guardians = await db.mapById('guardians');
  return students.map((s) => {
    const link = links.find((l) => l.student_id === s.id && l.is_primary) ||
      links.find((l) => l.student_id === s.id);
    const guardian = link ? guardians[link.guardian_id] : null;
    return {
      ...s,
      class_name: classes[s.class_id]?.name || null,
      guardian_name: guardian?.full_name || null,
      guardian_phone: guardian?.phone || null,
      guardian_email: guardian?.email || null,
    };
  });
}

router.get('/', asyncHandler(async (req, res) => {
  const query = { order: { column: 'full_name', ascending: true } };
  if (req.query.class_id) query.eq = { class_id: req.query.class_id };
  if (req.query.search) query.ilike = { full_name: `%${req.query.search}%` };
  const students = await db.list('students', query);
  res.json({ data: await enrich(students), count: students.length, mode: db.mode });
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const student = await db.getById('students', req.params.id);
  if (!student) throw new HttpError(404, 'Student not found');
  const [enriched] = await enrich([student]);
  const invoices = await db.list('fee_invoices', { eq: { student_id: student.id }, order: { column: 'due_date', ascending: false } });
  const attendance = await db.list('attendance', { eq: { student_id: student.id }, order: { column: 'date', ascending: false }, limit: 30 });
  const loans = await db.list('library_loans', { eq: { student_id: student.id } });
  res.json({ data: { ...enriched, invoices, attendance, loans } });
}));

router.post('/', asyncHandler(async (req, res) => {
  const body = parse(createSchema, req.body);
  body.school_id = config.defaultSchoolId;
  const student = await db.insert('students', body);
  // optional guardian creation
  if (req.body.guardian && req.body.guardian.full_name) {
    const g = await db.insert('guardians', { school_id: config.defaultSchoolId, ...req.body.guardian });
    await db.insert('student_guardians', {
      student_id: student.id, guardian_id: g.id,
      relationship: req.body.guardian.relationship || 'parent', is_primary: true,
    });
  }
  res.status(201).json({ data: student });
}));

router.patch('/:id', asyncHandler(async (req, res) => {
  const row = await db.update('students', req.params.id, req.body);
  if (!row) throw new HttpError(404, 'Student not found');
  res.json({ data: row });
}));

router.delete('/:id', asyncHandler(async (req, res) => {
  await db.remove('students', req.params.id);
  res.json({ ok: true });
}));

export default router;
