-- ============================================================================
-- Wellspire Platform — multi-tenant SaaS + operational modules
-- Migration 0006
-- ----------------------------------------------------------------------------
-- Turns the single-school app into a multi-school, multi-board platform and
-- adds the operational modules: transport (+GPS), hostel, labs, infirmary,
-- appointments, HR, CRM/admissions leads, marketing, facilities (cleaning),
-- and an AI-agents registry. Everything is per-school (school_id) so one
-- deployment serves many schools.
-- ============================================================================

do $$ begin
  create type board_type as enum ('state','cbse','icse','ib','cambridge','other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lead_stage as enum ('new','contacted','toured','applied','enrolled','lost');
exception when duplicate_object then null; end $$;

do $$ begin
  create type appointment_status as enum ('requested','scheduled','completed','cancelled','no_show');
exception when duplicate_object then null; end $$;

do $$ begin
  create type leave_status as enum ('pending','approved','rejected','cancelled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type lab_type as enum ('chemistry','biology','physics','computer','robotics','language','general');
exception when duplicate_object then null; end $$;

do $$ begin
  create type facility_kind as enum ('washroom','classroom','corridor','ground','cafeteria','lab','hostel','other');
exception when duplicate_object then null; end $$;

-- --- Multi-tenant: extend schools ------------------------------------------
alter table schools add column if not exists board_type board_type not null default 'cbse';
alter table schools add column if not exists plan text not null default 'standard';
alter table schools add column if not exists subdomain text;
alter table schools add column if not exists brand_color text default '#233F88';
alter table schools add column if not exists website_enabled boolean not null default true;
alter table schools add column if not exists is_active boolean not null default true;
create unique index if not exists idx_schools_subdomain on schools(subdomain) where subdomain is not null;

-- --- Transport --------------------------------------------------------------
create table if not exists transport_vehicles (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  code text not null, registration_no text, model text, capacity int default 40,
  driver_name text, driver_phone text, attendant_name text, active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists transport_routes (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, vehicle_id uuid references transport_vehicles(id) on delete set null,
  shift text default 'morning', active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists transport_stops (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  route_id uuid not null references transport_routes(id) on delete cascade,
  name text not null, seq int default 1, pickup_time time, lat numeric(9,6), lng numeric(9,6)
);
create table if not exists transport_assignments (
  student_id uuid not null references students(id) on delete cascade,
  route_id uuid not null references transport_routes(id) on delete cascade,
  stop_id uuid references transport_stops(id) on delete set null,
  primary key (student_id, route_id)
);
-- live GPS pings (device/driver app posts here; parents read the latest)
create table if not exists transport_pings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  vehicle_id uuid not null references transport_vehicles(id) on delete cascade,
  lat numeric(9,6) not null, lng numeric(9,6) not null, speed_kmph numeric(6,2),
  recorded_at timestamptz not null default now()
);
create index if not exists idx_pings_vehicle_time on transport_pings(vehicle_id, recorded_at desc);

-- --- Hostel -----------------------------------------------------------------
create table if not exists hostels (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, kind text default 'boys', warden_name text, warden_phone text,
  lat numeric(9,6), lng numeric(9,6),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists hostel_rooms (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  hostel_id uuid not null references hostels(id) on delete cascade,
  room_no text not null, floor text, capacity int default 4, occupied int default 0
);
create table if not exists hostel_allocations (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  room_id uuid not null references hostel_rooms(id) on delete cascade,
  allocated_on date default current_date, vacated_on date
);

-- --- Labs -------------------------------------------------------------------
create table if not exists labs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, type lab_type not null default 'general', room text,
  in_charge text, capacity int default 30,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists lab_equipment (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  lab_id uuid references labs(id) on delete cascade,
  name text not null, quantity numeric(10,2) default 0, unit text default 'unit',
  reorder_level numeric(10,2) default 0, status text default 'ok'
);
create table if not exists lab_bookings (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  lab_id uuid not null references labs(id) on delete cascade,
  class_id uuid references classes(id) on delete set null,
  teacher_id uuid references teachers(id) on delete set null,
  date date not null default current_date, period int, purpose text
);

-- --- Infirmary / medical ----------------------------------------------------
create table if not exists medical_records (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid not null references students(id) on delete cascade,
  blood_group text, allergies text, conditions text, emergency_contact text,
  updated_at timestamptz not null default now()
);
create table if not exists infirmary_visits (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  student_id uuid references students(id) on delete set null,
  visited_at timestamptz not null default now(),
  symptoms text, treatment text, nurse text, parent_notified boolean default false
);

-- --- Appointments (front desk / principal, with Google Meet) ---------------
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  requester_name text not null, requester_email text, requester_phone text,
  with_role text default 'principal', purpose text,
  scheduled_at timestamptz, status appointment_status not null default 'requested',
  meet_link text, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- --- HR ---------------------------------------------------------------------
create table if not exists departments (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade, name text not null
);
create table if not exists staff (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  full_name text not null, role text, department text, email text, phone text,
  employment_type text default 'full_time', salary numeric(12,2), date_of_join date,
  active boolean not null default true,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists leave_requests (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  staff_name text not null, type text default 'casual', from_date date, to_date date,
  reason text, status leave_status not null default 'pending',
  created_at timestamptz not null default now()
);

-- --- CRM / admissions leads (sales) ----------------------------------------
create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  parent_name text not null, child_name text, grade text, phone text, email text,
  source text default 'website', stage lead_stage not null default 'new',
  owner text, next_action_at timestamptz, notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

-- --- Marketing --------------------------------------------------------------
create table if not exists campaigns (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  name text not null, channel text default 'facebook', status text default 'draft',
  budget numeric(12,2) default 0, leads_generated int default 0, spend numeric(12,2) default 0,
  starts_on date, ends_on date,
  created_at timestamptz not null default now()
);

-- --- Facilities / cleaning (sweeper updates + camera photo) ----------------
create table if not exists facility_logs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid not null references schools(id) on delete cascade,
  facility facility_kind not null default 'washroom',
  location text, status text default 'clean', cleaned_by text,
  photo_url text, note text,
  logged_at timestamptz not null default now()
);

-- --- AI agents registry -----------------------------------------------------
create table if not exists ai_agents (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete cascade,
  key text not null, name text not null, category text, description text,
  model text, system_prompt text, enabled boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists ai_runs (
  id uuid primary key default gen_random_uuid(),
  school_id uuid references schools(id) on delete set null,
  agent_key text, input text, output text, model text,
  created_at timestamptz not null default now()
);

-- updated_at triggers for the new tables that have the column
do $$
declare t text;
begin
  for t in select unnest(array[
    'transport_vehicles','transport_routes','hostels','labs','staff','leads','appointments','medical_records'
  ]) loop
    execute format('drop trigger if exists trg_%1$s_updated on %1$s;
      create trigger trg_%1$s_updated before update on %1$s for each row execute function set_updated_at();', t);
  end loop;
end $$;
