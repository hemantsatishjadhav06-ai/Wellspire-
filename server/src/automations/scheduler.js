// Cron scheduler. Registers the recurring automations when ENABLE_AUTOMATIONS
// is on. All schedules run in the school's timezone.
import cron from 'node-cron';
import config from '../config.js';
import logger from '../lib/logger.js';
import { runFeeReminders, runTeacherReminders } from '../services/reminders.js';

export function startScheduler() {
  if (!config.automations.enabled) {
    logger.warn('Automations disabled (ENABLE_AUTOMATIONS=false). Skipping cron jobs.');
    return;
  }
  const tz = config.automations.timezone;

  register(config.automations.cronFeeReminders, 'fee-reminders', tz, async () => {
    const r = await runFeeReminders({});
    logger.info(`[cron] fee reminders → ${r.count} sent`);
  });

  register(config.automations.cronTeacherReminders, 'teacher-reminders', tz, async () => {
    const r = await runTeacherReminders({});
    logger.info(`[cron] teacher reminders → ${r.count} notified`);
  });

  logger.info(`Scheduler started (tz=${tz}). Fees="${config.automations.cronFeeReminders}", Teachers="${config.automations.cronTeacherReminders}".`);
}

function register(expr, name, tz, fn) {
  if (!cron.validate(expr)) {
    logger.error(`Invalid cron for ${name}: "${expr}" — skipped.`);
    return;
  }
  cron.schedule(expr, () => {
    fn().catch((err) => logger.error(`[cron:${name}] failed: ${err.message}`));
  }, { timezone: tz });
}

export default { startScheduler };
