// Automations control panel — inspect status and trigger the scheduled jobs
// on demand (the same code the cron scheduler runs).
import { Router } from 'express';
import config from '../config.js';
import db from '../lib/db.js';
import openrouter from '../lib/openrouter.js';
import { asyncHandler } from '../middleware/index.js';
import { runFeeReminders, runTeacherReminders } from '../services/reminders.js';

const router = Router();

router.get('/status', (_req, res) => {
  res.json({
    enabled: config.automations.enabled,
    timezone: config.automations.timezone,
    jobs: [
      { key: 'fee_reminders', cron: config.automations.cronFeeReminders, description: 'Remind guardians about due/overdue fees.' },
      { key: 'teacher_reminders', cron: config.automations.cronTeacherReminders, description: 'Tell each teacher their classes for the day.' },
    ],
    integrations: {
      supabase: db.mode === 'supabase',
      openrouter: openrouter.configured,
      email: config.smtp.configured,
    },
  });
});

router.post('/fee-reminders/run', asyncHandler(async (req, res) => {
  res.json(await runFeeReminders({ dryRun: req.query.dry === '1' }));
}));

router.post('/teacher-reminders/run', asyncHandler(async (req, res) => {
  const dow = req.query.day ? Number(req.query.day) : undefined;
  res.json(await runTeacherReminders({ dryRun: req.query.dry === '1', dayOfWeek: dow }));
}));

export default router;
