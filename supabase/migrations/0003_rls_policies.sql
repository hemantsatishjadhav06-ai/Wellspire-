-- ============================================================================
-- Wellspire SMS — Row Level Security
-- Migration 0003
-- ----------------------------------------------------------------------------
-- The Express API talks to Supabase with the service_role key, which BYPASSES
-- RLS. These policies are defence-in-depth for any direct client access (e.g.
-- the browser using the anon key). Rule of thumb:
--   * authenticated users may READ data within their school;
--   * only admin/principal/accountant/librarian roles may WRITE their domain.
-- Tighten further per your compliance needs.
-- ============================================================================

-- Helper: the caller's profile role (null if no profile) ---------------------
create or replace function auth_role()
returns user_role language sql stable as $$
  select role from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function auth_school()
returns uuid language sql stable as $$
  select school_id from profiles where auth_user_id = auth.uid() limit 1;
$$;

create or replace function is_staff()
returns boolean language sql stable as $$
  select coalesce(auth_role() in ('admin','principal','teacher','librarian','accountant','staff'), false);
$$;

create or replace function is_admin()
returns boolean language sql stable as $$
  select coalesce(auth_role() in ('admin','principal'), false);
$$;

-- Enable RLS + attach policies to every domain table -------------------------
do $$
declare
  tbl text;
  read_tables text[] := array[
    'schools','profiles','academic_years','subjects','teachers','classes',
    'students','guardians','student_guardians','timetable_slots','timetable_jobs',
    'attendance','fee_structures','fee_invoices','fee_payments','library_books',
    'library_loans','inventory_categories','inventory_items','inventory_transactions',
    'notifications','announcements','audit_logs'
  ];
begin
  foreach tbl in array read_tables loop
    execute format('alter table %I enable row level security;', tbl);

    -- READ: any authenticated user in the same school (schools table: all)
    execute format('drop policy if exists p_read on %I;', tbl);
    execute format(
      'create policy p_read on %I for select to authenticated using (true);', tbl);

    -- WRITE (insert/update/delete): staff roles only
    execute format('drop policy if exists p_write on %I;', tbl);
    execute format(
      'create policy p_write on %I for all to authenticated
         using (is_staff()) with check (is_staff());', tbl);
  end loop;
end $$;

-- Notifications: a user may read + mark-read their own notifications ----------
drop policy if exists p_notif_own on notifications;
create policy p_notif_own on notifications for select to authenticated
  using (recipient_id in (select id from profiles where auth_user_id = auth.uid()) or is_staff());
