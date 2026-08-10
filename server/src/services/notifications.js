// Notification service: persists notifications to the DB and (optionally)
// delivers them by email via SMTP. In-app notifications are always recorded so
// the dashboard bell works even without SMTP configured.
import nodemailer from 'nodemailer';
import config from '../config.js';
import db from '../lib/db.js';
import logger from '../lib/logger.js';

let transporter = null;
if (config.smtp.configured) {
  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: { user: config.smtp.user, pass: config.smtp.pass },
  });
  logger.info('SMTP transport ready — email notifications enabled.');
} else {
  logger.warn('SMTP not configured — notifications will be recorded in-app only.');
}

/**
 * Create + (attempt to) deliver a notification.
 * @param {object} n
 * @param {string} n.title
 * @param {string} [n.body]
 * @param {string} [n.kind]
 * @param {string} [n.channel]  in_app | email | sms | push
 * @param {string} [n.recipientId]
 * @param {string} [n.recipientEmail]
 * @param {object} [n.data]
 */
export async function createNotification(n) {
  const channel = n.channel || 'in_app';
  const record = await db.insert('notifications', {
    school_id: config.defaultSchoolId,
    recipient_id: n.recipientId || null,
    recipient_email: n.recipientEmail || null,
    recipient_phone: n.recipientPhone || null,
    kind: n.kind || 'general',
    channel,
    title: n.title,
    body: n.body || '',
    data: n.data || {},
    status: 'sent',
    scheduled_for: new Date().toISOString(),
    sent_at: new Date().toISOString(),
  });

  if (channel === 'email' && n.recipientEmail) {
    await sendEmail(n.recipientEmail, n.title, n.body).catch(async (err) => {
      logger.error('Email send failed', err.message);
      await db.update('notifications', record.id, { status: 'failed', error: err.message }).catch(() => {});
    });
  }
  return record;
}

export async function sendEmail(to, subject, text) {
  if (!transporter) {
    logger.info(`[email suppressed → ${to}] ${subject}`);
    return { suppressed: true };
  }
  const info = await transporter.sendMail({
    from: config.smtp.from,
    to,
    subject,
    text,
    html: `<div style="font-family:system-ui,sans-serif;line-height:1.6">${String(text).replace(/\n/g, '<br>')}</div>`,
  });
  return { messageId: info.messageId };
}

export default { createNotification, sendEmail };
