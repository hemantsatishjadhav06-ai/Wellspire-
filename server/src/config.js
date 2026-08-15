// Centralised runtime configuration. Everything comes from environment
// variables so nothing secret is ever hard-coded. Missing values degrade
// gracefully rather than crashing — the app still boots so you can deploy
// first and connect services after.
import 'dotenv/config';

const {
  NODE_ENV = 'development',
  PORT = '8080',
  APP_URL = `http://localhost:${process.env.PORT || 8080}`,

  SUPABASE_URL = '',
  SUPABASE_ANON_KEY = '',
  SUPABASE_SERVICE_ROLE_KEY = '',

  OPENROUTER_API_KEY = '',
  OPENROUTER_MODEL = 'anthropic/claude-3.5-sonnet',

  SMTP_HOST = '',
  SMTP_PORT = '587',
  SMTP_USER = '',
  SMTP_PASS = '',
  SMTP_FROM = 'Wellspire School <no-reply@wellspire.school>',

  GOOGLE_SERVICE_ACCOUNT_JSON = '',
  GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 = '',
  GOOGLE_DRIVE_FOLDER_ID = '',

  ENABLE_AUTOMATIONS = 'true',
  SCHOOL_TIMEZONE = 'Asia/Kolkata',
  FEE_REMINDER_DAYS_BEFORE = '7',
  CRON_FEE_REMINDERS = '0 9 * * *',
  CRON_TEACHER_REMINDERS = '0 7 * * 1-6',

  DEFAULT_SCHOOL_ID = '11111111-1111-1111-1111-111111111111',
} = process.env;

export const config = {
  env: NODE_ENV,
  isProd: NODE_ENV === 'production',
  port: Number(PORT),
  appUrl: APP_URL,

  supabase: {
    url: SUPABASE_URL,
    anonKey: SUPABASE_ANON_KEY,
    serviceKey: SUPABASE_SERVICE_ROLE_KEY,
    configured: Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY),
  },

  openrouter: {
    apiKey: OPENROUTER_API_KEY,
    model: OPENROUTER_MODEL,
    configured: Boolean(OPENROUTER_API_KEY),
    baseUrl: 'https://openrouter.ai/api/v1',
  },

  smtp: {
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    user: SMTP_USER,
    pass: SMTP_PASS,
    from: SMTP_FROM,
    configured: Boolean(SMTP_HOST && SMTP_USER && SMTP_PASS),
  },

  googleDrive: (() => {
    const json = GOOGLE_SERVICE_ACCOUNT_JSON ||
      (GOOGLE_SERVICE_ACCOUNT_JSON_BASE64 ? Buffer.from(GOOGLE_SERVICE_ACCOUNT_JSON_BASE64, 'base64').toString('utf8') : '');
    return { serviceAccount: json, folderId: GOOGLE_DRIVE_FOLDER_ID, configured: Boolean(json && GOOGLE_DRIVE_FOLDER_ID) };
  })(),

  automations: {
    enabled: ENABLE_AUTOMATIONS !== 'false',
    timezone: SCHOOL_TIMEZONE,
    feeReminderDaysBefore: Number(FEE_REMINDER_DAYS_BEFORE),
    cronFeeReminders: CRON_FEE_REMINDERS,
    cronTeacherReminders: CRON_TEACHER_REMINDERS,
  },

  defaultSchoolId: DEFAULT_SCHOOL_ID,
};

export default config;
