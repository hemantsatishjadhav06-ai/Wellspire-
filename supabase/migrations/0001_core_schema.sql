-- ============================================================================
-- Wellspire SMS — Core Schema
-- Migration 0001: extensions, enums, and all module tables
-- ----------------------------------------------------------------------------
-- Design notes:
--   * Every table has id (uuid), created_at, updated_at.
--   * `profiles` extends Supabase auth.users with a role. All people (staff,
--     teachers, parents, students) can optionally have a login profile.
--   * Multi-tenant-ready: a `schools` table exists; single-school installs
--     just use the one seeded row.
--   * Referential integrity is enforced with foreign keys; soft-delete via
--     `archived_at` where records must be retained for audit.
-- ============================================================================

create extension if not exists "pgcrypto";      -- gen_random_uuid()
create extension if not exists "pg_trgm";        -- fuzzy search on names/titles

-- ---------------------------------------------------------------------------
-- Enumerated types
-- ---------------------------------------------------------------------------
do $$ begin
  create type user_role as enum ('admin','principal','teacher','parent','student','librarian','accountant','staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type gender_type as enum ('male','female','other','undisclosed');
exception when duplicate_object then null; end $$;

do $$ begin
  create type attendance_status as enum ('present','absent','late','excused','holiday');
exception when duplicate_object then null; end $$;

do $$ begin
  create type invoice_status as enum ('draft','pending','partially_paid','paid','overdue','waived','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type payment_method as enum ('cash','card','upi','bank_transfer','cheque','online','scholarship');
exception when duplicate_object then null; end $$;

do $$ begin
  create type loan_status as enum ('issued','returned','overdue','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type stock_txn_type as enum ('inbound','outbound','adjustment','damaged','returned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_channel as enum ('in_app','email','sms','push');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_status as enum ('scheduled','queued','sent','failed','read');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_kind as enum ('fee_reminder','teacher_class_reminder','timetable_update','announcement','attendance_alert','library_due','inventory_low_stock','general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type job_status as enum ('pending','running','succeeded','failed');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tenancy & people
-- ---------------------------------------------------------------------------
create table if not exists schools (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  code         text unique not null default 'WELLSPIRE',
  address      text,
  phone        text,
  email        text,
  logo_url     text,
  timezone     text not null default 'Asia/Kolkata',
  currency     text not null default 'INR',
  settings     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- Extends auth.users. `id` matches auth.users.id when the person has a login.
create table if not exists profiles (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid references schools(id) on delete cascade,
  auth_user_id uuid unique,                       -- FK to auth.users(id) in Supabase
  role         user_role not null default 'staff',
  full_name    text not null,
  email        text,
  phone        text,
  avatar_url   text,
  is_active    boolean not null default true,
  metadata     jsonb not null default '{}'::jsonb,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
create index if not exists idx_profiles_role on profiles(role);
create index if not exists idx_profiles_school on profiles(school_id);

-- ---------------------------------------------------------------------------
-- Academic structure
-- ---------------------------------------------------------------------------
create table if not exists academic_years (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  name         text not null,                     -- e.g. "2025-2026"
  start_date   date not null,
  end_date     date not null,
  is_current   boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create table if not exists subjects (
  id           uuid primary key default gen_random_uuid(),
  school_id    uuid not null references schools(id) on delete cascade,
  name         text not null,
  code         text,
  color        text default '#6366f1',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists teachers (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete set null,
  employee_code text,
  full_name     text not null,
  email         text,
  phone         text,
  qualification text,
  date_of_join  date,
  subjects      uuid[] not null default '{}',     -- subject ids they can teach
  is_active     boolean not null default true,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_teachers_school on teachers(school_id);

-- A class = grade + section (e.g. "Grade 5 - A")
create table if not exists classes (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  academic_year_id  uuid references academic_years(id) on delete set null,
  grade             text not null,                 -- e.g. "5", "KG1", "12"
  section           text not null default 'A',
  name              text generated always as (('Grade ' || grade || ' - ' || section)) stored,
  room              text,
  class_teacher_id  uuid references teachers(id) on delete set null,
  capacity          int default 40,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (school_id, academic_year_id, grade, section)
);

create table if not exists students (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  profile_id       uuid references profiles(id) on delete set null,
  admission_no     text not null,
  roll_no          text,
  full_name        text not null,
  gender           gender_type default 'undisclosed',
  date_of_birth    date,
  class_id         uuid references classes(id) on delete set null,
  blood_group      text,
  address          text,
  photo_url        text,
  admission_date   date default current_date,
  is_active        boolean not null default true,
  archived_at      timestamptz,
  metadata         jsonb not null default '{}'::jsonb,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  unique (school_id, admission_no)
);
create index if not exists idx_students_class on students(class_id);
create index if not exists idx_students_name_trgm on students using gin (full_name gin_trgm_ops);

-- Guardians / parents (a guardian can have several children; a child several guardians)
create table if not exists guardians (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  profile_id    uuid references profiles(id) on delete set null,
  full_name     text not null,
  email         text,
  phone         text,
  occupation    text,
  address       text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists student_guardians (
  student_id    uuid not null references students(id) on delete cascade,
  guardian_id   uuid not null references guardians(id) on delete cascade,
  relationship  text not null default 'parent',    -- father / mother / guardian
  is_primary    boolean not null default false,
  primary key (student_id, guardian_id)
);

-- ---------------------------------------------------------------------------
-- Timetable
-- ---------------------------------------------------------------------------
-- day_of_week: 1=Mon ... 7=Sun ; period is the slot index within the day.
create table if not exists timetable_slots (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  class_id      uuid not null references classes(id) on delete cascade,
  subject_id    uuid references subjects(id) on delete set null,
  teacher_id    uuid references teachers(id) on delete set null,
  day_of_week   int not null check (day_of_week between 1 and 7),
  period        int not null check (period between 1 and 12),
  start_time    time not null,
  end_time      time not null,
  room          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (class_id, day_of_week, period)
);
create index if not exists idx_tt_teacher_day on timetable_slots(teacher_id, day_of_week);
create index if not exists idx_tt_class_day on timetable_slots(class_id, day_of_week);

-- AI generation jobs — records each timetable AI run + its output for audit/sync
create table if not exists timetable_jobs (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  requested_by  uuid references profiles(id) on delete set null,
  status        job_status not null default 'pending',
  model         text,
  constraints   jsonb not null default '{}'::jsonb,   -- input constraints
  result        jsonb,                                 -- generated grid
  error         text,
  created_at    timestamptz not null default now(),
  completed_at  timestamptz
);

-- ---------------------------------------------------------------------------
-- Attendance
-- ---------------------------------------------------------------------------
create table if not exists attendance (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  student_id    uuid not null references students(id) on delete cascade,
  class_id      uuid references classes(id) on delete set null,
  date          date not null default current_date,
  status        attendance_status not null default 'present',
  marked_by     uuid references profiles(id) on delete set null,
  note          text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (student_id, date)
);
create index if not exists idx_attendance_date on attendance(date);

-- ---------------------------------------------------------------------------
-- Fees
-- ---------------------------------------------------------------------------
create table if not exists fee_structures (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  academic_year_id  uuid references academic_years(id) on delete set null,
  name              text not null,                 -- e.g. "Term 1 Tuition"
  category          text default 'tuition',
  grade             text,                          -- applies to a grade (null = all)
  amount            numeric(12,2) not null default 0,
  frequency         text default 'term',           -- term / monthly / annual / one_time
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create table if not exists fee_invoices (
  id                uuid primary key default gen_random_uuid(),
  school_id         uuid not null references schools(id) on delete cascade,
  student_id        uuid not null references students(id) on delete cascade,
  fee_structure_id  uuid references fee_structures(id) on delete set null,
  invoice_no        text not null,
  title             text not null,
  amount            numeric(12,2) not null default 0,
  amount_paid       numeric(12,2) not null default 0,
  due_date          date not null,
  status            invoice_status not null default 'pending',
  last_reminded_at  timestamptz,
  reminder_count    int not null default 0,
  notes             text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  unique (school_id, invoice_no)
);
create index if not exists idx_invoices_student on fee_invoices(student_id);
create index if not exists idx_invoices_status_due on fee_invoices(status, due_date);

create table if not exists fee_payments (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  invoice_id    uuid not null references fee_invoices(id) on delete cascade,
  amount        numeric(12,2) not null,
  method        payment_method not null default 'cash',
  reference     text,
  paid_at       timestamptz not null default now(),
  recorded_by   uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_payments_invoice on fee_payments(invoice_id);

-- ---------------------------------------------------------------------------
-- Library
-- ---------------------------------------------------------------------------
create table if not exists library_books (
  id               uuid primary key default gen_random_uuid(),
  school_id        uuid not null references schools(id) on delete cascade,
  title            text not null,
  author           text,
  isbn             text,
  publisher        text,
  category         text default 'general',
  shelf            text,
  total_copies     int not null default 1,
  available_copies int not null default 1,
  cover_url        text,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index if not exists idx_books_title_trgm on library_books using gin (title gin_trgm_ops);

create table if not exists library_loans (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  book_id       uuid not null references library_books(id) on delete cascade,
  -- borrower can be a student or a teacher; store both optionally
  student_id    uuid references students(id) on delete set null,
  teacher_id    uuid references teachers(id) on delete set null,
  borrower_name text,
  issued_at     date not null default current_date,
  due_date      date not null,
  returned_at   date,
  status        loan_status not null default 'issued',
  fine_amount   numeric(10,2) not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_loans_status_due on library_loans(status, due_date);

-- ---------------------------------------------------------------------------
-- Inventory / assets
-- ---------------------------------------------------------------------------
create table if not exists inventory_categories (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  name          text not null,
  created_at    timestamptz not null default now(),
  unique (school_id, name)
);

create table if not exists inventory_items (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  category_id   uuid references inventory_categories(id) on delete set null,
  name          text not null,
  sku           text,
  unit          text default 'unit',
  quantity      numeric(12,2) not null default 0,
  reorder_level numeric(12,2) not null default 0,
  location      text,
  unit_cost     numeric(12,2) default 0,
  supplier      text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index if not exists idx_inventory_low_stock on inventory_items(school_id) where quantity <= reorder_level;

create table if not exists inventory_transactions (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  item_id       uuid not null references inventory_items(id) on delete cascade,
  type          stock_txn_type not null,
  quantity      numeric(12,2) not null,
  note          text,
  performed_by  uuid references profiles(id) on delete set null,
  created_at    timestamptz not null default now()
);
create index if not exists idx_inv_txn_item on inventory_transactions(item_id);

-- ---------------------------------------------------------------------------
-- Communication: notifications & announcements
-- ---------------------------------------------------------------------------
create table if not exists notifications (
  id             uuid primary key default gen_random_uuid(),
  school_id      uuid not null references schools(id) on delete cascade,
  recipient_id   uuid references profiles(id) on delete cascade,   -- null = broadcast
  recipient_email text,
  recipient_phone text,
  kind           notification_kind not null default 'general',
  channel        notification_channel not null default 'in_app',
  title          text not null,
  body           text,
  data           jsonb not null default '{}'::jsonb,
  status         notification_status not null default 'scheduled',
  scheduled_for  timestamptz not null default now(),
  sent_at        timestamptz,
  read_at        timestamptz,
  error          text,
  created_at     timestamptz not null default now()
);
create index if not exists idx_notif_recipient on notifications(recipient_id, status);
create index if not exists idx_notif_scheduled on notifications(status, scheduled_for);

create table if not exists announcements (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid not null references schools(id) on delete cascade,
  author_id     uuid references profiles(id) on delete set null,
  title         text not null,
  body          text,
  audience      user_role[],                      -- who should see it; null = everyone
  pinned        boolean not null default false,
  published_at  timestamptz not null default now(),
  created_at    timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Audit log — every write-through the API is recorded for traceability
-- ---------------------------------------------------------------------------
create table if not exists audit_logs (
  id            uuid primary key default gen_random_uuid(),
  school_id     uuid references schools(id) on delete set null,
  actor_id      uuid references profiles(id) on delete set null,
  action        text not null,                    -- e.g. "student.create"
  entity        text,
  entity_id     uuid,
  changes       jsonb,
  ip            text,
  created_at    timestamptz not null default now()
);
create index if not exists idx_audit_entity on audit_logs(entity, entity_id);
create index if not exists idx_audit_created on audit_logs(created_at desc);
