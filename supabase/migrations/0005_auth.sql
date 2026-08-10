-- ============================================================================
-- Wellspire SMS — Auth wiring
-- Migration 0005: link Supabase Auth users to profiles + role bootstrapping.
-- ----------------------------------------------------------------------------
-- When someone signs up (or is invited), a `profiles` row is created and linked
-- via auth_user_id. Role + full_name come from the sign-up metadata; the very
-- first user of the school is promoted to `admin` automatically so you are never
-- locked out. Change roles later from the Supabase table editor or the app.
-- ============================================================================

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  v_school   uuid;
  v_role     user_role;
  v_is_first boolean;
  v_name     text;
begin
  -- default school = the single seeded school (or first row)
  select id into v_school from schools order by created_at asc limit 1;

  -- first-ever profile becomes admin
  select count(*) = 0 into v_is_first from profiles;

  v_role := coalesce(
    nullif(new.raw_user_meta_data->>'role','')::user_role,
    case when v_is_first then 'admin'::user_role else 'parent'::user_role end
  );
  v_name := coalesce(nullif(new.raw_user_meta_data->>'full_name',''), split_part(new.email,'@',1));

  insert into profiles (school_id, auth_user_id, role, full_name, email, is_active)
  values (v_school, new.id, v_role, v_name, new.email, true)
  on conflict (auth_user_id) do nothing;

  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- Convenience: promote an existing auth user to a role by email.
-- Usage:  select set_user_role('principal@wellspire.school', 'principal');
create or replace function set_user_role(p_email text, p_role user_role)
returns void language plpgsql security definer set search_path = public as $$
begin
  update profiles set role = p_role, updated_at = now()
  where lower(email) = lower(p_email);
end $$;
