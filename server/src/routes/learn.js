// Student learning API: CBSE syllabus, study materials, and the interactive
// test/quiz engine. Reads are open to any authenticated user (students,
// parents, teachers). Quiz answers are graded SERVER-SIDE — the correct option
// is never sent to the browser until the attempt is submitted.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

const router = Router();

// GET /api/syllabus?grade=&subject=  → CBSE chapters
router.get('/syllabus', asyncHandler(async (req, res) => {
  const { grade, subject } = req.query;
  const eq = {};
  if (grade) eq.grade = String(grade);
  if (subject) eq.subject = String(subject);
  const rows = await db.list('syllabus', { eq, order: { column: 'chapter_no', ascending: true } });
  res.json({ data: rows });
}));

// GET /api/study-materials?grade=&subject=&type=
router.get('/study-materials', asyncHandler(async (req, res) => {
  const { grade, subject, type } = req.query;
  const eq = {};
  if (grade) eq.grade = String(grade);
  if (subject) eq.subject = String(subject);
  if (type) eq.type = String(type);
  const rows = await db.list('study_materials', { eq, order: { column: 'subject', ascending: true } });
  res.json({ data: rows });
}));

// Small helper: the distinct grades/subjects available, for filter menus.
router.get('/learn/catalog', asyncHandler(async (_req, res) => {
  const syllabus = await db.list('syllabus', {});
  const grades = [...new Set(syllabus.map((r) => r.grade))].sort();
  const subjectsByGrade = {};
  for (const r of syllabus) {
    (subjectsByGrade[r.grade] ||= new Set()).add(r.subject);
  }
  res.json({
    grades,
    subjectsByGrade: Object.fromEntries(Object.entries(subjectsByGrade).map(([g, s]) => [g, [...s].sort()])),
  });
}));

// GET /api/quizzes?grade=&subject=  → quiz cards (no questions)
router.get('/quizzes', asyncHandler(async (req, res) => {
  const { grade, subject } = req.query;
  const eq = {};
  if (grade) eq.grade = String(grade);
  if (subject) eq.subject = String(subject);
  const rows = await db.list('quizzes', { eq, order: { column: 'subject', ascending: true } });
  res.json({ data: rows });
}));

// GET /api/quizzes/:id  → quiz + questions WITHOUT the answers
router.get('/quizzes/:id', asyncHandler(async (req, res) => {
  const quiz = await db.getById('quizzes', req.params.id);
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  const questions = (await db.list('quiz_questions', { eq: { quiz_id: quiz.id }, order: { column: 'seq', ascending: true } }))
    .map(({ correct_index, explanation, ...safe }) => safe); // strip the answer
  res.json({ ...quiz, questions });
}));

const submitSchema = z.object({
  student_name: z.string().optional(),
  student_id: z.string().optional(),
  duration_sec: z.number().int().nonnegative().optional(),
  answers: z.array(z.number().int().nullable()).min(1), // selected option index per question (null = skipped)
});

// POST /api/quizzes/:id/submit  → grade server-side, record attempt, return review
router.post('/quizzes/:id/submit', asyncHandler(async (req, res) => {
  const quiz = await db.getById('quizzes', req.params.id);
  if (!quiz) throw new HttpError(404, 'Quiz not found');
  const parsed = submitSchema.safeParse(req.body);
  if (!parsed.success) throw new HttpError(422, 'Validation failed', parsed.error.flatten());

  const questions = await db.list('quiz_questions', { eq: { quiz_id: quiz.id }, order: { column: 'seq', ascending: true } });
  const { answers, student_name, student_id, duration_sec } = parsed.data;

  let score = 0;
  const review = questions.map((q, i) => {
    const chosen = answers[i] ?? null;
    const correct = chosen === q.correct_index;
    if (correct) score += q.marks || 1;
    return {
      id: q.id, prompt: q.prompt, options: q.options,
      chosen, correct_index: q.correct_index, correct, explanation: q.explanation,
    };
  });
  const total = questions.reduce((s, q) => s + (q.marks || 1), 0);
  const percent = total ? Math.round((score / total) * 100) : 0;
  const badge = percent >= 90 ? 'gold' : percent >= 70 ? 'silver' : percent >= 50 ? 'bronze' : 'none';

  const attempt = await db.insert('quiz_attempts', {
    quiz_id: quiz.id, school_id: config.defaultSchoolId,
    student_name: student_name || (req.profile?.full_name) || 'Student',
    student_id: student_id || req.profile?.id || null,
    score, total, percent, badge, duration_sec: duration_sec || null,
    taken_at: new Date().toISOString(),
  });

  res.status(201).json({ attempt_id: attempt.id, score, total, percent, badge, review });
}));

// GET /api/quizzes/:id/leaderboard  → top attempts for a quiz
router.get('/quizzes/:id/leaderboard', asyncHandler(async (req, res) => {
  const attempts = await db.list('quiz_attempts', { eq: { quiz_id: req.params.id } });
  const top = attempts
    .sort((a, b) => (b.percent - a.percent) || ((a.duration_sec || 1e9) - (b.duration_sec || 1e9)))
    .slice(0, 10)
    .map((a, i) => ({ rank: i + 1, student_name: a.student_name, percent: a.percent, score: a.score, total: a.total, badge: a.badge, taken_at: a.taken_at }));
  res.json({ data: top });
}));

export default router;
