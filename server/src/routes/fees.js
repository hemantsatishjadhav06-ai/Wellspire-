// Fees — structures, invoices (with student names + outstanding), recording
// payments, and manually triggering the fee-reminder automation.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import config from '../config.js';
import { asyncHandler, HttpError } from '../middleware/index.js';
import { parse } from './crud.js';
import { runFeeReminders } from '../services/reminders.js';

const router = Router();

// ---- Fee structures --------------------------------------------------------
router.get('/structures', asyncHandler(async (_req, res) => {
  const data = await db.list('fee_structures', { order: { column: 'created_at', ascending: false } });
  res.json({ data });
}));
router.post('/structures', asyncHandler(async (req, res) => {
  const row = await db.insert('fee_structures', { school_id: config.defaultSchoolId, ...req.body });
  res.status(201).json({ data: row });
}));

// ---- Invoices --------------------------------------------------------------
router.get('/invoices', asyncHandler(async (req, res) => {
  const query = { order: { column: 'due_date', ascending: true } };
  if (req.query.status) query.eq = { status: req.query.status };
  if (req.query.student_id) query.eq = { ...(query.eq || {}), student_id: req.query.student_id };
  const invoices = await db.list('fee_invoices', query);
  const students = await db.mapById('students');
  const data = invoices.map((inv) => ({
    ...inv,
    student_name: students[inv.student_id]?.full_name || null,
    outstanding: Number(inv.amount) - Number(inv.amount_paid || 0),
  }));
  res.json({ data, count: data.length, mode: db.mode });
}));

const invoiceSchema = z.object({
  student_id: z.string().min(1),
  title: z.string().min(1),
  amount: z.coerce.number().nonnegative(),
  due_date: z.string().min(1),
  fee_structure_id: z.string().optional(),
}).passthrough();

router.post('/invoices', asyncHandler(async (req, res) => {
  const body = parse(invoiceSchema, req.body);
  body.school_id = config.defaultSchoolId;
  body.invoice_no = body.invoice_no || `INV-${new Date().getFullYear()}-${Date.now().toString().slice(-6)}`;
  body.status = new Date(body.due_date) < new Date() ? 'overdue' : 'pending';
  const row = await db.insert('fee_invoices', body);
  res.status(201).json({ data: row });
}));

router.get('/invoices/:id', asyncHandler(async (req, res) => {
  const inv = await db.getById('fee_invoices', req.params.id);
  if (!inv) throw new HttpError(404, 'Invoice not found');
  const payments = await db.list('fee_payments', { eq: { invoice_id: inv.id }, order: { column: 'paid_at', ascending: false } });
  res.json({ data: { ...inv, payments, outstanding: Number(inv.amount) - Number(inv.amount_paid || 0) } });
}));

// ---- Payments (trigger recomputes invoice status) --------------------------
const paymentSchema = z.object({
  invoice_id: z.string().min(1),
  amount: z.coerce.number().positive(),
  method: z.enum(['cash', 'card', 'upi', 'bank_transfer', 'cheque', 'online', 'scholarship']).optional(),
  reference: z.string().optional(),
}).passthrough();

router.post('/payments', asyncHandler(async (req, res) => {
  const body = parse(paymentSchema, req.body);
  const invoice = await db.getById('fee_invoices', body.invoice_id);
  if (!invoice) throw new HttpError(404, 'Invoice not found');
  const payment = await db.insert('fee_payments', { school_id: config.defaultSchoolId, method: 'cash', ...body });
  const updated = await db.getById('fee_invoices', body.invoice_id);
  res.status(201).json({ data: payment, invoice: updated });
}));

// ---- Reminder automation (manual trigger) ----------------------------------
router.post('/reminders/run', asyncHandler(async (req, res) => {
  const result = await runFeeReminders({ dryRun: req.query.dry === '1' || req.body?.dryRun === true });
  res.json(result);
}));

export default router;
