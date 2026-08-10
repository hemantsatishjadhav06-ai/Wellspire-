// Dashboard aggregates — a single call that powers the landing screen:
// headline counters, fee collection, attendance snapshot, and alert lists.
import { Router } from 'express';
import db from '../lib/db.js';
import { asyncHandler } from '../middleware/index.js';

const router = Router();

router.get('/', asyncHandler(async (_req, res) => {
  const [students, teachers, classes, guardians, invoices, loans, items, books] = await Promise.all([
    db.list('students', {}),
    db.list('teachers', {}),
    db.list('classes', {}),
    db.list('guardians', {}),
    db.list('fee_invoices', {}),
    db.list('library_loans', {}),
    db.list('inventory_items', {}),
    db.list('library_books', {}),
  ]);

  const activeStudents = students.filter((s) => s.is_active !== false).length;
  const outstanding = invoices
    .filter((i) => ['pending', 'partially_paid', 'overdue'].includes(i.status))
    .reduce((sum, i) => sum + (Number(i.amount) - Number(i.amount_paid || 0)), 0);
  const collected = invoices.reduce((sum, i) => sum + Number(i.amount_paid || 0), 0);
  const billed = invoices.reduce((sum, i) => sum + Number(i.amount || 0), 0);
  const overdueInvoices = invoices.filter((i) => i.status === 'overdue');
  const lowStock = items.filter((i) => Number(i.quantity) <= Number(i.reorder_level));
  const overdueLoans = loans.filter((l) => l.status === 'overdue');

  const studentMap = Object.fromEntries(students.map((s) => [s.id, s]));

  res.json({
    mode: db.mode,
    stats: {
      active_students: activeStudents,
      active_teachers: teachers.filter((t) => t.is_active !== false).length,
      classes: classes.length,
      guardians: guardians.length,
      library_books: books.length,
      active_loans: loans.filter((l) => ['issued', 'overdue'].includes(l.status)).length,
      outstanding_fees: Math.round(outstanding),
      collected_fees: Math.round(collected),
      billed_fees: Math.round(billed),
      collection_rate: billed ? Math.round((collected / billed) * 100) : 0,
      overdue_invoices: overdueInvoices.length,
      low_stock_items: lowStock.length,
    },
    alerts: {
      overdue_fees: overdueInvoices.slice(0, 6).map((i) => ({
        invoice_no: i.invoice_no,
        student: studentMap[i.student_id]?.full_name || '—',
        outstanding: Number(i.amount) - Number(i.amount_paid || 0),
        due_date: i.due_date,
      })),
      low_stock: lowStock.slice(0, 6).map((i) => ({ name: i.name, quantity: i.quantity, reorder_level: i.reorder_level, unit: i.unit })),
      overdue_loans: overdueLoans.slice(0, 6).map((l) => ({ book_id: l.book_id, borrower: l.borrower_name, due_date: l.due_date })),
    },
  });
}));

export default router;
