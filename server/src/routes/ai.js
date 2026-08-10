// AI assistant — a school-admin copilot backed by OpenRouter. It is given a
// compact, live snapshot of the school so answers are grounded in real data.
// Degrades to a helpful message when OPENROUTER_API_KEY isn't set.
import { Router } from 'express';
import { z } from 'zod';
import db from '../lib/db.js';
import openrouter from '../lib/openrouter.js';
import config from '../config.js';
import { asyncHandler } from '../middleware/index.js';
import { parse } from './crud.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    openrouter: openrouter.configured,
    model: openrouter.configured ? config.openrouter.model : null,
    supabase: db.mode === 'supabase',
    mode: db.mode,
  });
});

const chatSchema = z.object({
  message: z.string().min(1),
  history: z.array(z.object({ role: z.enum(['user', 'assistant']), content: z.string() })).optional(),
});

router.post('/chat', asyncHandler(async (req, res) => {
  const { message, history = [] } = parse(chatSchema, req.body);

  if (!openrouter.configured) {
    return res.json({
      reply:
        "The AI assistant isn't connected yet. Add an OPENROUTER_API_KEY environment variable " +
        '(from openrouter.ai/keys) in Render and redeploy to enable it. ' +
        'Everything else in Wellspire works without it.',
      grounded: false,
    });
  }

  const snapshot = await buildSnapshot();
  const messages = [
    {
      role: 'system',
      content:
        'You are Wellspire Copilot, an assistant for a school management system. Be concise and practical. ' +
        'Use the JSON school snapshot for facts; if the answer is not in it, say what data you would need. ' +
        'Never invent student data.\n\nSNAPSHOT:\n' + JSON.stringify(snapshot),
    },
    ...history.slice(-8),
    { role: 'user', content: message },
  ];
  const reply = await openrouter.chat(messages, { temperature: 0.5 });
  res.json({ reply, grounded: true, model: config.openrouter.model });
}));

async function buildSnapshot() {
  const [students, teachers, classes, invoices, items] = await Promise.all([
    db.list('students', {}), db.list('teachers', {}), db.list('classes', {}),
    db.list('fee_invoices', {}), db.list('inventory_items', {}),
  ]);
  const outstanding = invoices
    .filter((i) => ['pending', 'partially_paid', 'overdue'].includes(i.status))
    .reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid || 0)), 0);
  return {
    students: students.length,
    teachers: teachers.length,
    classes: classes.map((c) => c.name),
    overdue_invoices: invoices.filter((i) => i.status === 'overdue').length,
    outstanding_fees_inr: Math.round(outstanding),
    low_stock_items: items.filter((i) => Number(i.quantity) <= Number(i.reorder_level)).map((i) => i.name),
  };
}

export default router;
