// Browser Supabase client (anon key). Returns null when public env vars aren't
// set — the app then runs in demo mode with no real login required.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabaseEnabled = Boolean(url && anon && !url.includes('YOUR-PROJECT'));

export const supabase = supabaseEnabled
  ? createClient(url, anon, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;
