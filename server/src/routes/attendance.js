// Attendance — fetch a class's register for a date and bulk-save it.
import { Router } from 'express';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

const router = Router();

// GET /api/attendance?class_id=&date=YYYY-MM-DD  → students + their status
router.get('/', asyncHandler(async (req, res) => {
  const { class_id, date } = req.query;
  if (!class_id) throw new HttpError(400, 'class_id is required');
  const day = date || new Date().toISOString().slice(0, 10);
  const students = await db.list('students', { eq: { class_id }, order: { column: 'roll_no', ascending: true } });
  const records = await db.list('attendance', { eq: { class_id, date: day } });
  const byStudent = Object.fromEntries(records.map((r) => [r.student_id, r]));
  const roster = students.map((s) => ({
    student_id: s.id,
    full_name: s.full_name,
    roll_no: s.roll_no,
    status: byStudent[s.id]?.status || 'present',
    attendance_id: byStudent[s.id]?.id || null,
  }));
  res.json({ date: day, class_id, data: roster });
}));

// POST /api/attendance  { class_id, date, entries:[{student_id,status}] }
router.post('/', asyncHandler(async (req, res) => {
  const { class_id, date, entries } = req.body;
  if (!class_id || !Array.isArray(entries)) throw new HttpError(400, 'class_id and entries[] are required');
  const day = date || new Date().toISOString().slice(0, 10);
  const existing = await db.list('attendance', { eq: { class_id, date: day } });
  const existingByStudent = Object.fromEntries(existing.map((r) => [r.student_id, r]));

  let saved = 0;
  for (const e of entries) {
    if (existingByStudent[e.student_id]) {
      await db.update('attendance', existingByStudent[e.student_id].id, { status: e.status });
    } else {
      await db.insert('attendance', {
        school_id: config.defaultSchoolId,
        student_id: e.student_id,
        class_id,
        date: day,
        status: e.status || 'present',
      });
    }
    saved++;
  }
  res.json({ ok: true, saved, date: day });
}));

export default router;
