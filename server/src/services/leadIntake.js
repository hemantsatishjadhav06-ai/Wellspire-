// Lead intake service: turns a public website enquiry into a CRM lead and
// nudges the admissions team. Email + notification side-effects are best-effort
// — each is wrapped so a delivery failure never blocks the lead from saving.
import config from '../config.js';
import db from '../lib/db.js';
import logger from '../lib/logger.js';
import { sendEmail, createNotification } from './notifications.js';

// The real inbox that should receive admissions alerts (never the no-reply From).
async function admissionsInbox() {
  try {
    const schools = await db.list('schools', {});
    return schools[0]?.email || config.smtp.user || null;
  } catch {
    return config.smtp.user || null;
  }
}

/**
 * Create a lead from a public enquiry and alert the admissions team.
 * The 2-day follow-up itself is handled by runLeadFollowups (the daily cron),
 * so we do NOT create a fake "scheduled" notification here (createNotification
 * sends immediately, which would just duplicate the alert below).
 * @returns the created lead row
 */
export async function createEnquiry(input) {
  const lead = await db.insert('leads', {
    school_id: config.defaultSchoolId,
    parent_name: input.parent_name,
    child_name: input.child_name || null,
    grade: input.grade || null,
    phone: input.phone || null,
    email: input.email || null,
    source: input.source || 'website',
    stage: 'new',
    owner: 'Front Desk',
    notes: input.message || null,
  });

  // (a) Warm confirmation to the parent (best-effort).
  if (input.email) {
    try {
      await sendEmail(
        input.email,
        'We received your enquiry — Wellspire International School',
        `Dear ${input.parent_name},\n` +
          `Thank you for your enquiry with Wellspire International School — we're delighted you're considering us${input.child_name ? ` for ${input.child_name}` : ''}.\n` +
          `Our admissions team will be in touch very soon to guide you through the next steps.\n` +
          `Warm regards,\nAdmissions Office · Wellspire International School`,
      );
    } catch (err) { logger.error('Enquiry confirmation email failed', err.message); }
  }

  // (b) Alert the admissions team once — emailed to the real inbox (or in-app).
  try {
    const inbox = await admissionsInbox();
    await createNotification({
      kind: 'general',
      channel: inbox ? 'email' : 'in_app',
      recipientEmail: inbox,
      title: `New admissions enquiry: ${input.parent_name}`,
      body: `${input.child_name || 'Child'} · ${input.grade || 'grade n/a'} · ${input.phone || input.email || 'no contact'}`,
      data: { lead_id: lead.id },
    });
  } catch (err) { logger.error('Enquiry alert failed', err.message); }

  return lead;
}

/**
 * Daily sweep: remind the admissions team about any 'new' lead untouched for
 * >2 days. Idempotent — each lead is reminded ONCE: after reminding we stamp
 * next_action_at, and only leads with no next_action_at are eligible, so the
 * same lead is never re-notified on subsequent runs.
 */
export async function runLeadFollowups({ dryRun = false } = {}) {
  const leads = await db.list('leads', { order: { column: 'created_at', ascending: true } });
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const stale = leads.filter((l) =>
    l.stage === 'new' && l.created_at && new Date(l.created_at).getTime() < cutoff && !l.next_action_at);

  const inbox = await admissionsInbox();
  let count = 0;
  for (const lead of stale) {
    if (!dryRun) {
      await createNotification({
        kind: 'general',
        channel: inbox ? 'email' : 'in_app',
        recipientEmail: inbox,
        title: `Follow up overdue: ${lead.parent_name}`,
        body: `${lead.parent_name} enquired${lead.child_name ? ` about ${lead.child_name}` : ''} and is still awaiting a call.`,
        data: { lead_id: lead.id },
      }).catch((err) => logger.error('Lead follow-up reminder failed', err.message));
      await db.update('leads', lead.id, { next_action_at: new Date().toISOString() }).catch(() => {});
    }
    count += 1;
  }
  logger.info(`Lead follow-ups: ${count} ${dryRun ? '(dry run)' : 'reminder(s) queued'}.`);
  return { count, dryRun };
}

export default { createEnquiry, runLeadFollowups };
