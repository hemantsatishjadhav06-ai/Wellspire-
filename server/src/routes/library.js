// Library — book catalogue + issue/return loans. Copy counts are maintained by
// DB triggers (and replicated in DEMO mode), so we never touch available_copies
// directly here.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';
import { parse } from './crud.js';

const router = Router();

// ---- Books -----------------------------------------------------------------
router.get('/books', asyncHandler(async (req, res) => {
  const query = { order: { column: 'title', ascending: true } };
  if (req.query.search) query.ilike = { title: `%${req.query.search}%` };
  const data = await db.list('library_books', query);
  res.json({ data, count: data.length, mode: db.mode });
}));

const bookSchema = z.object({
  title: z.string().min(1),
  author: z.string().optional(),
  isbn: z.string().optional(),
  category: z.string().optional(),
  shelf: z.string().optional(),
  total_copies: z.coerce.number().int().positive().default(1),
}).passthrough();

router.post('/books', asyncHandler(async (req, res) => {
  const body = parse(bookSchema, req.body);
  body.school_id = config.defaultSchoolId;
  body.available_copies = body.total_copies;
  const row = await db.insert('library_books', body);
  res.status(201).json({ data: row });
}));

router.patch('/books/:id', asyncHandler(async (req, res) => {
  const row = await db.update('library_books', req.params.id, req.body);
  if (!row) throw new HttpError(404, 'Book not found');
  res.json({ data: row });
}));

// ---- Loans -----------------------------------------------------------------
router.get('/loans', asyncHandler(async (req, res) => {
  const query = { order: { column: 'due_date', ascending: true } };
  if (req.query.status) query.eq = { status: req.query.status };
  const loans = await db.list('library_loans', query);
  const books = await db.mapById('library_books');
  const students = await db.mapById('students');
  const data = loans.map((l) => ({
    ...l,
    book_title: books[l.book_id]?.title || null,
    student_name: l.student_id ? students[l.student_id]?.full_name : l.borrower_name,
  }));
  res.json({ data, count: data.length, mode: db.mode });
}));

const issueSchema = z.object({
  book_id: z.string().min(1),
  student_id: z.string().optional(),
  teacher_id: z.string().optional(),
  borrower_name: z.string().optional(),
  due_date: z.string().optional(),
}).passthrough();

router.post('/loans', asyncHandler(async (req, res) => {
  const body = parse(issueSchema, req.body);
  const book = await db.getById('library_books', body.book_id);
  if (!book) throw new HttpError(404, 'Book not found');
  if ((book.available_copies ?? 0) <= 0) throw new HttpError(409, 'No copies available');
  const due = body.due_date || new Date(Date.now() + 14 * 864e5).toISOString().slice(0, 10);
  const loan = await db.insert('library_loans', {
    school_id: config.defaultSchoolId,
    book_id: body.book_id,
    student_id: body.student_id || null,
    teacher_id: body.teacher_id || null,
    borrower_name: body.borrower_name || null,
    issued_at: new Date().toISOString().slice(0, 10),
    due_date: due,
    status: 'issued',
  });
  res.status(201).json({ data: loan });
}));

// return a book
router.post('/loans/:id/return', asyncHandler(async (req, res) => {
  const loan = await db.getById('library_loans', req.params.id);
  if (!loan) throw new HttpError(404, 'Loan not found');
  const updated = await db.update('library_loans', loan.id, {
    status: 'returned',
    returned_at: new Date().toISOString().slice(0, 10),
    fine_amount: req.body?.fine_amount ?? loan.fine_amount ?? 0,
  });
  res.json({ data: updated });
}));

export default router;
