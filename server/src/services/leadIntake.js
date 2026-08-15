// Lead intake service: turns a public website enquiry into a CRM lead and
// nudges the admissions team. The email + notification side-effects are
// best-effort — each is wrapped so a delivery failure never blocks the lead
// from being saved.
import config from '../config.js';
import db from '../lib/db.js';
import logger from '../lib/logger.js';
import { sendEmail, createNotification } from './notifications.js';

/**
 * Create a lead from a public enquiry and fan out admissions notifications.
 * @param {object} input
 * @param {string} input.parent_name
 * @param {string} [input.child_name]
 * @param {string} [input.grade]
 * @param {string} [input.phone]
 * @param {string} [input.email]
 * @param {string} [input.source]
 * @param {string} [input.message]
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
    } catch (err) {
      logger.error('Enquiry confirmation email failed', err.message);
    }
  }

  // (b) In-app alert for the front desk.
  try {
    await createNotification({
      kind: 'general',
      channel: 'in_app',
      title: `New admissions enquiry: ${input.parent_name}`,
      body: `${input.child_name || ''} · ${input.grade || ''}`,
      data: { lead_id: lead.id },
    });
  } catch (err) {
    logger.error('Enquiry notification failed', err.message);
  }

  // (c) Schedule a follow-up nudge for the admissions inbox.
  try {
    await createNotification({
      kind: 'general',
      channel: config.smtp.configured ? 'email' : 'in_app',
      recipientEmail: config.smtp.from,
      title: `Follow up: ${input.parent_name}`,
      body: 'New lead needs a call',
      data: { lead_id: lead.id, due: '+2d' },
    });
  } catch (err) {
    logger.error('Enquiry follow-up scheduling failed', err.message);
  }

  return lead;
}

/**
 * Sweep open leads and remind the admissions team about any 'new' lead that has
 * been sitting untouched for more than two days.
 * @param {object} [opts]
 * @param {boolean} [opts.dryRun]
 * @returns {{ count:number, dryRun:boolean }}
 */
export async function runLeadFollowups({ dryRun = false } = {}) {
  const leads = await db.list('leads', { order: { column: 'created_at', ascending: true } });
  const cutoff = Date.now() - 2 * 24 * 60 * 60 * 1000;
  const stale = leads.filter((l) => {
    if (l.stage !== 'new' || !l.created_at) return false;
    return new Date(l.created_at).getTime() < cutoff;
  });

  let count = 0;
  for (const lead of stale) {
    if (!dryRun) {
      await createNotification({
        kind: 'general',
        channel: config.smtp.configured ? 'email' : 'in_app',
        recipientEmail: config.smtp.from,
        title: `Follow up overdue: ${lead.parent_name}`,
        body: `${lead.parent_name} enquired${lead.child_name ? ` about ${lead.child_name}` : ''} and is still awaiting a call.`,
        data: { lead_id: lead.id, stage: lead.stage },
      }).catch((err) => logger.error('Lead follow-up reminder failed', err.message));
    }
    count += 1;
  }
  logger.info(`Lead follow-ups: ${count} ${dryRun ? '(dry run)' : 'reminder(s) queued'}.`);
  return { count, dryRun };
}

export default { createEnquiry, runLeadFollowups };
