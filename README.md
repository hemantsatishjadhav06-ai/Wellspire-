# 🏫 Wellspire SMS — School Management System

An all-in-one **internal tooling platform** for schools: students, parents,
teachers, classes, timetable, attendance, **fees**, **library**, **inventory**,
notifications and audit — with **AI automations** for fee reminders, teacher
class reminders and timetable generation.

Built to deploy on **Render** with **Supabase (Postgres)** as the database and
**OpenRouter** for AI. Runs out-of-the-box in a **demo mode** (live sample data,
no setup) so you can see it working the moment it deploys, then becomes fully
persistent once you connect Supabase.

> **Data mode banner:** the app shows _Demo_ until `SUPABASE_URL` +
> `SUPABASE_SERVICE_ROLE_KEY` are set, then switches to _Live_.

---

## ✨ Features

| Module | What it does |
| --- | --- |
| **Dashboard** | Live KPIs — enrolment, collection rate, outstanding fees, low-stock & overdue alerts, fee-collection charts. |
| **Students** | Enrolment records, class allocation, primary guardian, 360° per-student view (fees, attendance, loans). |
| **Teachers** | Faculty directory with subject expertise. |
| **Classes** | Grades + sections, rooms, capacity utilisation, class teachers. |
| **Timetable** | **AI-generated, conflict-free** weekly schedules. One click to preview → apply. |
| **Attendance** | Fast daily register per class with bulk mark + save. |
| **Fees** | Fee structures, invoices, payments (auto status), summaries, **one-click reminder run**. |
| **Library** | Book catalogue + issue/return; copy counts auto-maintained. |
| **Inventory** | Assets, stock movements (in/out/adjust), reorder-level alerts. |
| **Automations** | Control panel to inspect & trigger scheduled jobs. |
| **AI Copilot** | Chat assistant grounded in your live school data (OpenRouter). |
| **Settings** | Integration status + go-live checklist. |

### 🤖 The three automations

1. **Fee reminders** — finds invoices due soon / overdue, writes a warm,
   AI-personalised message (falls back to a clean template) and notifies the
   guardian (email if SMTP set, otherwise in-app). _Cron: `0 9 * * *`._
2. **Teacher class reminders** — each morning tells every teacher exactly which
   classes they teach today, built live from the timetable. _Cron: `0 7 * * 1-6`._
3. **AI timetable → schedule sync** — the timetable AI drafts a grid, a
   deterministic validator guarantees no teacher double-booking, and **Apply**
   atomically replaces the class's live slots.

---

## 🧱 Architecture

```
┌────────────────────────────────────────────────────────────┐
│  Render Web Service (single deploy)                         │
│                                                            │
│   React + Vite + Tailwind  ──build──▶  web/dist  ──┐        │
│   (dashboard SPA)                                  │served  │
│                                                    ▼        │
│   Node + Express API  ── /api/* ──────────────────────────▶ │
│     • REST for every module      • node-cron automations    │
│     • OpenRouter AI (env key)    • graceful demo fallback   │
└───────────────┬─────────────────────────────┬──────────────┘
                │ service_role                 │ Bearer key
                ▼                              ▼
        Supabase (Postgres)            OpenRouter (AI models)
        RLS · triggers · views
```

**Tech:** Node 18+/Express, React 18/Vite/Tailwind, Supabase JS, node-cron,
nodemailer, zod, recharts, lucide-react.

**Why a data-access layer?** Routes only ever call `server/src/lib/db.js`. When
Supabase is configured it hits Postgres; when it isn't, the identical interface
runs against in-memory sample data. Postgres triggers that maintain derived
state (invoice totals, library copies, stock levels) are replicated in demo mode
so behaviour is identical either way.

---

## 📁 Repository layout

```
.
├── server/                 # Express API + automations
│   └── src/
│       ├── index.js        # entry (http + scheduler)
│       ├── app.js          # express app + static serving
│       ├── config.js       # env → config (graceful)
│       ├── lib/            # db, supabase, openrouter, mock data, logger
│       ├── middleware/     # async handler, errors, auth
│       ├── routes/         # one router per module
│       ├── services/       # timetableAI, reminders, notifications
│       └── automations/    # cron scheduler
├── web/                    # React + Vite + Tailwind dashboard
│   └── src/{pages,components,lib}
├── supabase/
│   ├── migrations/         # 0001 schema · 0002 triggers · 0003 RLS · 0004 seed
│   └── README.md
├── render.yaml             # Render blueprint
├── .env.example            # every env var, documented
└── package.json            # npm workspaces (server + web)
```

---

## 🚀 Deploy to Render + Supabase

### 1. Supabase
Create a project, then run the four migrations in
[`supabase/migrations`](supabase/migrations) via the SQL editor (in order).
See [`supabase/README.md`](supabase/README.md). Note your **URL**, **anon key**
and **service_role key**.

### 2. Render (one-click Blueprint)
1. Push this repo to GitHub.
2. Render → **New → Blueprint** → select the repo (it reads `render.yaml`).
3. Set the secret env vars when prompted (see table below).
4. Deploy. Build runs `npm install && npm run build`; start runs `npm start`.

### 3. Environment variables

| Variable | Required | Purpose |
| --- | --- | --- |
| `SUPABASE_URL` | for live data | Supabase project URL |
| `SUPABASE_SERVICE_ROLE_KEY` | for live data | Server DB access (secret) |
| `SUPABASE_ANON_KEY` / `VITE_SUPABASE_ANON_KEY` | optional | Public client key |
| `OPENROUTER_API_KEY` | for AI | AI reminders, timetable, copilot |
| `OPENROUTER_MODEL` | optional | Default `anthropic/claude-3.5-sonnet` |
| `SMTP_HOST/PORT/USER/PASS/FROM` | optional | Email delivery of reminders |
| `ENABLE_AUTOMATIONS` | optional | `true`/`false` master switch |
| `SCHOOL_TIMEZONE` | optional | Cron timezone (default `Asia/Kolkata`) |
| `CRON_FEE_REMINDERS` / `CRON_TEACHER_REMINDERS` | optional | Schedules |

Full list with defaults in [`.env.example`](.env.example).

---

## 🔐 Security

- **No secrets in the repo.** Every key is read from environment variables at
  runtime. `.env` is git-ignored.
- **Rotate any key shared in plaintext.** If an OpenRouter (or any) key was
  ever pasted into a chat, email or ticket, treat it as compromised and rotate
  it at [openrouter.ai/keys](https://openrouter.ai/keys) before use.
- The service_role key is **server-only** and never sent to the browser.
- RLS policies (`supabase/migrations/0003`) protect direct client access; the
  API uses service_role and therefore governs writes itself.

---

## 💻 Local development

```bash
cp .env.example .env      # optional — app runs without it (demo mode)
npm install               # installs server + web workspaces
npm run dev               # API on :8080, Vite on :5173 (proxies /api)
# or run the production shape:
npm run build && npm start   # serves web/dist + API on :8080
```

Open http://localhost:5173 (dev) or http://localhost:8080 (prod build).

---

## 🔌 API quick reference

`GET /api/health` · `GET /api/status` · `GET /api/dashboard`
`GET/POST /api/students` · `/teachers` · `/classes` · `/subjects` · `/guardians`
`GET /api/timetable` · `POST /api/timetable/generate` · `POST /api/timetable/sync`
`GET/POST /api/fees/invoices` · `POST /api/fees/payments` · `POST /api/fees/reminders/run`
`GET/POST /api/library/books` · `/library/loans` · `POST /api/library/loans/:id/return`
`GET/POST /api/inventory/items` · `/inventory/transactions`
`GET/POST /api/attendance` · `GET /api/notifications`
`POST /api/ai/chat` · `GET /api/automations/status` · `POST /api/automations/fee-reminders/run`

---

## 🗺️ Roadmap ideas

Report cards & gradebook · transport & hostel modules · parent mobile PWA ·
SMS/WhatsApp reminder channels · biometric attendance import · role-based auth
via Supabase Auth · exam scheduling · fee payment gateway integration.

---

Built as a production-grade foundation you can extend. PRs welcome.
