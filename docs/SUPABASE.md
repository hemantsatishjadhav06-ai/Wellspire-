# Wellspire — Connecting Supabase (persistent data + storage)

Wellspire runs out of the box in **Demo mode** on in-memory sample data. Connect a
**Supabase** project to get a real **Postgres** database (persistent data) and
**Storage** (student photos & documents). The app **auto-switches Demo → Live** the
moment the two server keys are present — no code change.

> **The switch, precisely:** the server treats itself as Live when **both**
> `SUPABASE_URL` **and** `SUPABASE_SERVICE_ROLE_KEY` are set. Otherwise it stays in
> Demo mode. `GET /api/status` reports the current `mode`, and the sidebar badge
> flips from **"Demo mode"** to **"Live · Supabase"**.

---

## 1. Create a project

1. Go to **[supabase.com](https://supabase.com)** → **New project**.
2. Pick an organisation, name (e.g. `wellspire`), a strong **database password**
   (save it), and a region close to your users.
3. Wait for provisioning (~2 minutes).

---

## 2. Get your keys and connection string

### API keys — **Project Settings → API**

| Value | Env var(s) | Notes |
| --- | --- | --- |
| **Project URL** | `SUPABASE_URL`, `VITE_SUPABASE_URL` | e.g. `https://YOUR-PROJECT.supabase.co` |
| **`anon` public key** | `SUPABASE_ANON_KEY`, `VITE_SUPABASE_ANON_KEY` | Safe to expose to the browser. |
| **`service_role` secret key** | `SUPABASE_SERVICE_ROLE_KEY` | **Server-only. Bypasses RLS. NEVER ship to the browser or commit it.** |

### Database connection string — **Project Settings → Database → Connection string → URI**
Copy the **URI** and set it as `SUPABASE_DB_URL` (used only for running
migrations, see §4). It looks like:

```
postgresql://postgres:YOUR-DB-PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres
```

> Replace the password placeholder with the DB password you set in §1. For
> serverless/pooled connections use the **Connection pooling** URI (port `6543`);
> for one-off migrations the direct `5432` URI is fine.

---

## 3. Set environment variables

Set these where the app runs (Render dashboard, Railway, Fly, Cloud Run, or a
local `.env` — see [`.env.example`](../.env.example)). The `VITE_*` ones are
build-time and baked into the browser bundle, so only ever put **public** values
there.

```bash
# --- server (secret) ---
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key      # secret — server only
SUPABASE_ANON_KEY=your-anon-key                       # public

# --- frontend build-time (public only) ---
VITE_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# --- migrations only (not needed at runtime) ---
SUPABASE_DB_URL=postgresql://postgres:PASSWORD@db.YOUR-PROJECT.supabase.co:5432/postgres
```

**Minimum to go Live:** `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`. The others
enable direct browser access via the anon key and the frontend Supabase client.

> **Never commit secrets.** `.env` is git-ignored; set real values only in your
> host's environment settings. If a key was ever pasted into chat/email, rotate it
> in Supabase before use.

---

## 4. Run the migrations

The full schema lives in [`supabase/schema.sql`](../supabase/schema.sql), which
includes every migration **in order**:

| File | Purpose |
| --- | --- |
| `0001_core_schema.sql` | Core tables (schools, students, teachers, classes, timetable, attendance, fees, library, inventory, notifications, audit…). |
| `0002_functions_triggers.sql` | Triggers that maintain derived state (invoice totals/status, library `available_copies`, inventory `quantity`) + `mark_overdue_*` helpers. |
| `0003_rls_policies.sql` | Row-Level Security policies (read for authenticated, write for staff roles). |
| `0004_seed.sql` | Realistic starter data (optional). |
| `0005_auth.sql` | Auth glue: `handle_new_user` (first account → admin) and `set_user_role()`. |
| `0006_platform.sql` | Multi-tenant + operations (transport/GPS, hostel, labs, infirmary, HR, CRM, marketing, facilities, AI agents). |

`schema.sql` is **idempotent** — safe to run more than once (`IF NOT EXISTS`,
`CREATE OR REPLACE`, `ON CONFLICT DO NOTHING`). Apply it either way:

### Option A — "Set up database" GitHub Action (one click)
1. Add a repo secret **`SUPABASE_DB_URL`** (your §2 connection string):
   **Settings → Secrets and variables → Actions**.
2. **Actions → "Set up database" → Run workflow.**
3. It applies the entire `supabase/schema.sql` (all of `0001`…`0006`) in one shot.
   Safe to re-run.

### Option B — Supabase SQL Editor (manual)
- Open **SQL Editor** and paste the contents of `supabase/schema.sql`, then **Run**.
- Or run each `migrations/000x_*.sql` file in order (`0001` → `0006`).

### Option C — Supabase CLI

```bash
supabase link --project-ref <your-ref>
supabase db push          # applies everything under supabase/migrations/
# or, direct with psql:
psql "$SUPABASE_DB_URL" -v ON_ERROR_STOP=1 -f supabase/schema.sql
```

---

## 5. Enable Authentication

1. **Authentication → Providers → Email** — enable email/password sign-in.
2. The **first account that signs up becomes `admin`** automatically (via the
   `handle_new_user` trigger in `0005`); everyone else defaults to `parent`.
3. Promote anyone from the **SQL Editor**:

   ```sql
   select set_user_role('teacher@wellspire.school', 'teacher');
   ```

   Valid roles: `admin, principal, teacher, parent, student, accountant,
   librarian, staff`.

---

## 6. Enable Storage (student photos & documents)

Wellspire stores images/files as **URLs** — e.g. `students.photo_url` and
`facility_logs.photo_url` (cleaning proof photos). Use Supabase **Storage** to
host those files and save the resulting URL on the record.

1. **Storage → Create bucket.** Recommended buckets:
   - **`student-photos`** — profile pictures. Mark **Public** if photos should be
     viewable via a plain URL, or keep **Private** and serve via signed URLs.
   - **`student-documents`** — birth certificates, transfer certificates, medical
     forms, etc. Keep this **Private**.
2. **Upload a file** to the bucket (Storage UI, the Supabase JS client, or the
   Storage API).
3. **Get the URL and save it** on the record:
   - Public bucket → the object's **public URL**
     (`https://YOUR-PROJECT.supabase.co/storage/v1/object/public/student-photos/<path>`).
   - Private bucket → generate a **signed URL** (time-limited) and store/serve
     that.
   - Put the URL in the record's `photo_url` (or a document field) — the app renders
     it directly.
4. **Storage RLS / access policies.** Buckets have their own policies. For a
   public bucket, enable public read. For private buckets, add Storage policies so
   only authenticated staff can read/write, and rely on **signed URLs** for
   controlled sharing. Set a sensible **file-size limit** and **allowed MIME
   types** (e.g. `image/*`, `application/pdf`) per bucket.

> **Recommendation:** keep student **documents** private (signed URLs only) and,
> if you prefer, photos private too. Public buckets are simplest but expose anyone
> with the URL.

---

## 7. Row-Level Security (RLS) notes

- The **API server uses the `service_role` key**, which **bypasses RLS** — the
  server enforces access itself (reads need a session; writes need a staff role).
- The RLS policies in **`0003`** are **defence-in-depth** for any *direct* browser
  access using the **anon key**. Rule of thumb enforced there:
  - **Read** — any authenticated user (helpers `auth_role()`, `auth_school()`).
  - **Write** — staff roles only (`is_staff()` = admin/principal/teacher/
    librarian/accountant/staff; `is_admin()` = admin/principal).
- **Multi-tenant:** every domain row carries `school_id`; scope reads/writes to the
  caller's school as your compliance needs require (tighten the shipped policies
  per school if you expose the anon key widely).
- **Don't hand-write derived columns.** Invoice status/paid-amount, library
  `available_copies` and inventory `quantity` are maintained by triggers (`0002`).
  `mark_overdue_invoices()` / `mark_overdue_loans()` are called by the automation
  jobs and can also be run manually from the SQL editor.

---

## 8. Flip Demo → Live

1. Set `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (and the `anon`/`VITE_*` keys)
   in your host's environment.
2. Run the migrations (§4).
3. **Redeploy / restart** the app so it reads the new env vars.
4. On boot the server logs `Supabase connected (service role)`, `GET /api/status`
   returns `"mode": "supabase"`, and the sidebar badge shows **"Live · Supabase"**.
   Every change now persists in Postgres.

**Troubleshooting**
- Still showing **Demo**? Both `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` must
  be present, and the app must have been restarted after setting them.
- **Empty screens after going live?** Run the seed (`0004`) or add your own data —
  Live starts empty unless you seeded.
- **Writes rejected via the browser anon key?** That's RLS working as intended;
  the app writes through the server (service role), not the anon client.
- **Keep `service_role` server-side only** — never put it in a `VITE_*` var or the
  browser bundle.

---

*See also: [`FEATURES.md`](./FEATURES.md) for the full feature set and
[`MOBILE_APP.md`](./MOBILE_APP.md) for the installable mobile app.*
