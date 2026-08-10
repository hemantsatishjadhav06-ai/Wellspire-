// Timetable — read the weekly grid, edit individual slots, and the flagship
// automation: AI generation + one-click "sync" that atomically replaces a
// class's (or the whole school's) slots with the AI-produced schedule.
import { Router } from 'express';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';
import { generateTimetable } from '../services/timetableAI.js';

const router = Router();

// GET /api/timetable?class_id=&teacher_id=&day_of_week=
router.get('/', asyncHandler(async (req, res) => {
  const eq = {};
  if (req.query.class_id) eq.class_id = req.query.class_id;
  if (req.query.teacher_id) eq.teacher_id = req.query.teacher_id;
  if (req.query.day_of_week) eq.day_of_week = Number(req.query.day_of_week);
  const slots = await db.list('timetable_slots', {
    ...(Object.keys(eq).length ? { eq } : {}),
    order: { column: 'period', ascending: true },
  });
  const subjects = await db.mapById('subjects');
  const teachers = await db.mapById('teachers');
  const classes = await db.mapById('classes');
  const enriched = slots.map((s) => ({
    ...s,
    subject_name: subjects[s.subject_id]?.name || null,
    subject_color: subjects[s.subject_id]?.color || null,
    teacher_name: teachers[s.teacher_id]?.full_name || null,
    class_name: classes[s.class_id]?.name || null,
  }));
  res.json({ data: enriched, count: enriched.length, mode: db.mode });
}));

// POST /api/timetable/slots  — create/update one slot
router.post('/slots', asyncHandler(async (req, res) => {
  const body = { school_id: config.defaultSchoolId, ...req.body };
  const row = await db.insert('timetable_slots', body);
  res.status(201).json({ data: row });
}));

router.patch('/slots/:id', asyncHandler(async (req, res) => {
  const row = await db.update('timetable_slots', req.params.id, req.body);
  if (!row) throw new HttpError(404, 'Slot not found');
  res.json({ data: row });
}));

router.delete('/slots/:id', asyncHandler(async (req, res) => {
  await db.remove('timetable_slots', req.params.id);
  res.json({ ok: true });
}));

// POST /api/timetable/generate  — AI (or deterministic) generation.
// body: { class_ids?: [], constraints?: {} }  → returns a preview + job id.
router.post('/generate', asyncHandler(async (req, res) => {
  const allClasses = await db.list('classes');
  const classes = req.body.class_ids?.length
    ? allClasses.filter((c) => req.body.class_ids.includes(c.id))
    : allClasses;
  if (!classes.length) throw new HttpError(400, 'No classes to schedule');
  const subjects = await db.list('subjects');
  const teachers = await db.list('teachers');

  const job = await db.insert('timetable_jobs', {
    school_id: config.defaultSchoolId,
    status: 'running',
    model: config.openrouter.configured ? config.openrouter.model : 'deterministic',
    constraints: req.body.constraints || {},
  });

  try {
    const result = await generateTimetable({ classes, subjects, teachers, constraints: req.body.constraints });
    await db.update('timetable_jobs', job.id, {
      status: 'succeeded',
      result: { slots: result.slots, source: result.source, notes: result.notes },
      completed_at: new Date().toISOString(),
    });
    res.json({ job_id: job.id, ...result, class_ids: classes.map((c) => c.id) });
  } catch (err) {
    await db.update('timetable_jobs', job.id, { status: 'failed', error: err.message, completed_at: new Date().toISOString() });
    throw new HttpError(500, `Timetable generation failed: ${err.message}`);
  }
}));

// POST /api/timetable/sync  — apply a generated schedule to the live timetable.
// body: { slots: [...], class_ids: [...] }  (from /generate). Automation #3.
router.post('/sync', asyncHandler(async (req, res) => {
  const slots = req.body.slots;
  if (!Array.isArray(slots) || !slots.length) throw new HttpError(400, 'No slots provided to sync');
  const classIds = req.body.class_ids?.length
    ? req.body.class_ids
    : [...new Set(slots.map((s) => s.class_id))];

  // Replace existing slots for the affected classes (atomic-ish).
  const existing = await db.list('timetable_slots', {});
  for (const slot of existing) {
    if (classIds.includes(slot.class_id)) await db.remove('timetable_slots', slot.id);
  }
  let inserted = 0;
  for (const s of slots) {
    await db.insert('timetable_slots', {
      school_id: config.defaultSchoolId,
      class_id: s.class_id,
      subject_id: s.subject_id,
      teacher_id: s.teacher_id,
      day_of_week: s.day_of_week,
      period: s.period,
      start_time: s.start_time,
      end_time: s.end_time,
      room: s.room || null,
    });
    inserted++;
  }
  res.json({ ok: true, replaced_classes: classIds.length, inserted });
}));

// GET /api/timetable/jobs — history of AI generations (audit)
router.get('/jobs', asyncHandler(async (_req, res) => {
  const jobs = await db.list('timetable_jobs', { order: { column: 'created_at', ascending: false }, limit: 20 });
  res.json({ data: jobs });
}));

export default router;
