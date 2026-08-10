// The three automations the school asked for:
//   1. Fee reminders   — nudge guardians about invoices due soon / overdue.
//   2. Teacher class reminders — each morning, tell every teacher the classes
//      they teach today (built from the live timetable).
//   3. Timetable sync  — persisting an AI timetable replaces slots atomically
//      (implemented in routes/timetable.js; this file exposes the reminders).
//
// AI (OpenRouter) is used to write warm, personalised copy when available;
// otherwise a clean template is used. Either way the reminder is recorded and,
// if SMTP is set, emailed.
import config from '../config.js';
import db from '../lib/db.js';
import openrouter from '../lib/openrouter.js';
import logger from '../lib/logger.js';
import { createNotification } from './notifications.js';

const currency = (n) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(n || 0);

const daysUntil = (dateStr) =>
  Math.round((new Date(dateStr).getTime() - Date.now()) / (24 * 60 * 60 * 1000));

// ---------------------------------------------------------------------------
// 1. FEE REMINDERS
// ---------------------------------------------------------------------------
export async function runFeeReminders({ dryRun = false } = {}) {
  await db.rpc('mark_overdue_invoices').catch(() => {});

  const invoices = await db.list('fee_invoices', {
    eq: { status: ['pending', 'partially_paid', 'overdue'] },
    order: { column: 'due_date', ascending: true },
  });
  const students = await db.mapById('students');
  const links = await db.list('student_guardians');
  const guardians = await db.mapById('guardians');

  const windowDays = config.automations.feeReminderDaysBefore;
  const targets = invoices.filter((inv) => {
    const d = daysUntil(inv.due_date);
    return inv.status === 'overdue' || d <= windowDays;
  });

  const results = [];
  for (const inv of targets) {
    const student = students[inv.student_id];
    const link = links.find((l) => l.student_id === inv.student_id && l.is_primary) ||
      links.find((l) => l.student_id === inv.student_id);
    const guardian = link ? guardians[link.guardian_id] : null;
    const outstanding = Number(inv.amount) - Number(inv.amount_paid || 0);
    if (outstanding <= 0) continue;

    const message = await feeMessage({ inv, student, guardian, outstanding });
    results.push({ invoice_no: inv.invoice_no, student: student?.full_name, guardian: guardian?.full_name, outstanding, message });

    if (!dryRun) {
      await createNotification({
        kind: 'fee_reminder',
        channel: guardian?.email ? 'email' : 'in_app',
        recipientId: guardian?.profile_id || null,
        recipientEmail: guardian?.email || null,
        title: `Fee reminder — ${student?.full_name || 'student'}`,
        body: message,
        data: { invoice_id: inv.id, invoice_no: inv.invoice_no, outstanding },
      });
      await db.update('fee_invoices', inv.id, {
        last_reminded_at: new Date().toISOString(),
        reminder_count: (inv.reminder_count || 0) + 1,
      }).catch(() => {});
    }
  }
  logger.info(`Fee reminders: ${results.length} ${dryRun ? '(dry run)' : 'sent'}.`);
  return { count: results.length, dryRun, reminders: results };
}

async function feeMessage({ inv, student, guardian, outstanding }) {
  const d = daysUntil(inv.due_date);
  const status = d < 0 ? `overdue by ${Math.abs(d)} day(s)` : d === 0 ? 'due today' : `due in ${d} day(s)`;
  const fallback =
    `Dear ${guardian?.full_name || 'Parent/Guardian'},\n\n` +
    `This is a friendly reminder that the fee "${inv.title}" for ${student?.full_name || 'your ward'} ` +
    `(invoice ${inv.invoice_no}) of ${currency(outstanding)} is ${status} (due ${inv.due_date}).\n\n` +
    `Kindly arrange the payment at your earliest convenience. Please ignore this message if already paid.\n\n` +
    `Warm regards,\nWellspire International School`;

  if (!openrouter.configured) return fallback;
  try {
    const text = await openrouter.chat(
      [
        { role: 'system', content: 'You write short, warm, professional school fee reminders (<120 words). Never invent facts.' },
        { role: 'user', content:
          `Write a fee reminder.\nGuardian: ${guardian?.full_name || 'Parent'}\nStudent: ${student?.full_name}\n` +
          `Invoice: ${inv.invoice_no} (${inv.title})\nOutstanding: ${currency(outstanding)}\nStatus: ${status}\nDue date: ${inv.due_date}\n` +
          `School: Wellspire International School. End with the school name.` },
      ],
      { temperature: 0.5 }
    );
    return text?.trim() || fallback;
  } catch {
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// 2. TEACHER CLASS REMINDERS
// ---------------------------------------------------------------------------
export async function runTeacherReminders({ dryRun = false, dayOfWeek } = {}) {
  const dow = dayOfWeek || isoDay(new Date());
  const slots = await db.list('timetable_slots', { eq: { day_of_week: dow }, order: { column: 'period', ascending: true } });
  const teachers = await db.mapById('teachers');
  const classes = await db.mapById('classes');
  const subjects = await db.mapById('subjects');

  // group by teacher
  const byTeacher = new Map();
  for (const s of slots) {
    if (!s.teacher_id) continue;
    if (!byTeacher.has(s.teacher_id)) byTeacher.set(s.teacher_id, []);
    byTeacher.get(s.teacher_id).push(s);
  }

  const results = [];
  for (const [teacherId, tSlots] of byTeacher) {
    const teacher = teachers[teacherId];
    if (!teacher) continue;
    tSlots.sort((a, b) => a.period - b.period);
    const lines = tSlots.map(
      (s) => `• P${s.period} ${s.start_time}-${s.end_time} — ${subjects[s.subject_id]?.name || 'Class'} @ ${classes[s.class_id]?.name || ''} (${s.room || 'room TBD'})`
    );
    const body =
      `Good morning ${teacher.full_name},\n\nYour schedule for ${dayName(dow)}:\n${lines.join('\n')}\n\n` +
      `Have a great day!\nWellspire International School`;

    results.push({ teacher: teacher.full_name, classes: tSlots.length, body });
    if (!dryRun) {
      await createNotification({
        kind: 'teacher_class_reminder',
        channel: teacher.email ? 'email' : 'in_app',
        recipientId: teacher.profile_id || null,
        recipientEmail: teacher.email || null,
        title: `Your classes today — ${dayName(dow)} (${tSlots.length})`,
        body,
        data: { day_of_week: dow, count: tSlots.length },
      });
    }
  }
  logger.info(`Teacher reminders: ${results.length} teacher(s) ${dryRun ? '(dry run)' : 'notified'}.`);
  return { count: results.length, dayOfWeek: dow, dryRun, reminders: results };
}

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------
const isoDay = (d) => ((d.getDay() + 6) % 7) + 1; // JS Sun=0 → ISO Mon=1..Sun=7
const DAY_NAMES = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const dayName = (n) => DAY_NAMES[n] || `Day ${n}`;

export default { runFeeReminders, runTeacherReminders };
