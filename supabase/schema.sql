-- ============================================================================
-- Wellspire SMS — consolidated schema
-- ----------------------------------------------------------------------------
-- Runs every migration in order, in one shot. Idempotent: safe to run more than
-- once (tables use IF NOT EXISTS, functions use CREATE OR REPLACE, seed rows use
-- ON CONFLICT DO NOTHING).
--
-- Apply it either way:
--   • One-click:  GitHub → Actions → "Set up database" → Run workflow
--                 (needs a SUPABASE_DB_URL secret)
--   • By hand:    paste this whole file into the Supabase SQL editor and run,
--                 OR:  psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql
--
-- \ir includes each file relative to this file's directory (supabase/).
-- ============================================================================
\ir migrations/0001_core_schema.sql
\ir migrations/0002_functions_triggers.sql
\ir migrations/0003_rls_policies.sql
\ir migrations/0004_seed.sql
\ir migrations/0005_auth.sql
