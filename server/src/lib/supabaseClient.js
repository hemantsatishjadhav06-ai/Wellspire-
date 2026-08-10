// Server-side Supabase client using the service_role key (bypasses RLS).
// Returns null when Supabase isn't configured yet, so the rest of the app can
// fall back to in-memory sample data and still run.
import { createClient } from '@supabase/supabase-js';
import config from '../config.js';
import logger from './logger.js';

let client = null;

if (config.supabase.configured) {
  client = createClient(config.supabase.url, config.supabase.serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  logger.info('Supabase connected (service role).');
} else {
  logger.warn(
    'Supabase not configured — running in DEMO mode with in-memory sample data. ' +
      'Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to use the real database.'
  );
}

export const supabase = client;
export const supabaseConfigured = Boolean(client);
export default supabase;
