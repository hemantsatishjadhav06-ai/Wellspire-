# Wellspire — Feature Catalogue

An exhaustive reference for everything the Wellspire platform does. Wellspire is
an all-in-one **School Operating System**: a multi-tenant SaaS that runs one
school or a hundred, spanning academics, campus operations, finance, growth,
people and an AI layer woven through every module — plus a public marketing
website, a parent portal and an installable mobile app.

> **Two data modes.** Wellspire boots in **Demo mode** on in-memory sample data
> (no setup, fully explorable) and flips to **Live mode** the moment Supabase is
> connected. Every feature below behaves identically in both modes; only Live
> persists to Postgres. See [`SUPABASE.md`](./SUPABASE.md).

---

## 1. Platform at a glance

| Area | Modules |
| --- | --- |
| **Overview** | Dashboard (role-aware; parents get a dedicated portal home) |
| **Academics** | Students · Teachers · Classes · Timetable (AI) · Attendance |
| **Operations** | Transport (+ live GPS) · Hostel · Labs · Infirmary / Medical · Library · Inventory · Facilities / Cleaning · Appointments (Google Meet) |
| **Finance & Growth** | Fees (+ reminders) · Admissions CRM (leads) · Marketing (campaigns) |
| **People** | Staff (HR) · Leave |
| **Intelligence** | AI Copilot · Six AI Agents · Automations |
| **Data** | Excel export/import (16 datasets) · Global keyword search · Google Drive sync |
| **Platform** | Super-admin (Schools) · Roles & access · Settings / go-live |
| **Public + Mobile** | Multi-page marketing website · Admissions enquiry · Parent portal · Installable PWA |

The navigation is **role-aware**: each role only sees the modules it is entitled
to (see the [per-role matrix](#12-per-role-summary)). A **global search** box and
a **notification bell** sit in the top bar on every page.

---

## 2. Multi-tenant schools

Wellspire is multi-tenant from the ground up: every record carries a `school_id`,
so a single deployment serves many schools side-by-side.

- **Boards supported** — each school is tagged with a `board_type`:
  **State**, **CBSE**, **ICSE**, **IB**, **Cambridge**, or **Other**.
- **Per-school branding & config** — `plan`, `subdomain`, `brand_color`
  (default navy `#233F88`), `website_enabled`, `is_active`.
- **Super-admin console** (`/platform`, *Schools*) — a bird's-eye view across all
  tenants: totals for schools, students, staff, vehicles and open admissions
  leads, plus a per-school card (board, plan, brand colour, active/website
  status). Backed by `GET /api/platform/overview`.
- **Isolation** — Row-Level Security scopes reads/writes to the caller's school;
  the server uses the service-role key and governs writes itself.

---

## 3. Academics

### Students
- Enrolment records: admission number, name, gender, date of birth, roll number,
  class allocation, photo.
- **360° per-student view** — one screen pulling the student's fees, attendance
  history and library loans together (`GET /api/students/:id`).
- Primary guardian linkage via a `student_guardians` join (many guardians per
  student, with a "primary" flag).
- Add / edit students; Excel import & export.

### Teachers
- Faculty directory: employee code, name, email, phone, qualification, subject
  expertise, active status.
- Feeds timetable generation and the teacher-fit AI agent.

### Classes
- Grades + sections, room, capacity, class teacher.
- Capacity/utilisation surfaced on the dashboard and class views.

### Timetable — with **AI generation**
- **One-click AI generation** of a conflict-free weekly grid (Mon–Fri, up to 6
  periods/day with fixed period times).
- **How it works:** when OpenRouter is connected the model plans the grid; a
  **deterministic validator/repair pass always runs afterward** to *guarantee* no
  teacher is double-booked. Without an AI key, the deterministic generator alone
  produces a valid schedule. Source is reported as `openrouter+validator` or
  `deterministic`.
- **Preview → Apply** — review the draft, then apply to atomically replace the
  class's live slots (no partial/broken states).
- Parents see the read-only timetable for their child's class.

### Attendance
- Fast **daily register** per class: bulk-mark present/absent/late and save in one
  action.
- History feeds the per-student 360° view and the parent portal's attendance
  strip (last ~12 days).

---

## 4. Operations

### Transport — with **live GPS tracking**
- Fleet of **vehicles** (code, registration, model, capacity, driver name/phone,
  attendant).
- **Routes** (with shift: morning/evening) and ordered **stops** (sequence,
  pickup time, lat/lng).
- **Student ↔ route/stop assignments**.
- **Live map** — each vehicle's latest GPS ping (lat, lng, speed, timestamp)
  shown on a live fleet map with **Moving / Idle** status. Device or driver app
  posts positions to `POST /api/transport/pings`; the portal reads the newest
  via `GET /api/transport/live`.
- **Parents track their child's bus** in the parent portal.

### Hostel
- **Hostels** (boys/girls, warden name/phone, geolocation).
- **Rooms** (block/floor, capacity, occupied) with automatic **availability**
  (free-beds / Full).
- **Allocations** — student ↔ room, with allocated/vacated dates.

### Laboratories
- Lab registry typed as **chemistry, biology, physics, computer, robotics,
  language** or **general** — with room, in-charge and capacity.
- **Lab equipment** inventory (quantity, unit, reorder level, status) and **lab
  bookings**.

### Infirmary / Medical
- **Clinic visit log** — symptoms, treatment, attending nurse, timestamp, and a
  **parent-notified** flag (Notified / Pending).
- **Medical records** table for per-student health history.

### Library
- Book catalogue (title, author, ISBN, category, shelf, total/available copies).
- **Issue / return** loans; `available_copies` is auto-maintained by database
  triggers (mirrored in demo mode) so counts never drift.
- Overdue-loan handling via `mark_overdue_loans()`.

### Inventory
- Assets/consumables with SKU, unit, quantity, **reorder level**, location.
- **Stock movements** (in / out / adjust); `quantity` is trigger-maintained.
- **Low-stock alerts** surfaced on the dashboard.

### Facilities & Cleaning — **with camera**
- Housekeeping logs for washrooms, classrooms, corridors, grounds, cafeteria,
  labs, hostel and more.
- Fields: facility type, location, **status** (clean / needs attention / dirty /
  closed), cleaned-by, note, timestamp, and a **photo (camera) URL** — tap to
  view the proof-of-cleaning image.

### Appointments — with **Google Meet**
- Front-desk / principal meeting scheduler: requester name/email/phone, **with**
  (principal, vice-principal, accountant, admissions, front-desk), purpose,
  scheduled time, and **status** (requested / scheduled / completed / cancelled /
  no-show).
- Attach a **Google Meet link** — a one-click **Join** button appears on the row.

---

## 5. Finance & Growth

### Fees — with **automated reminders**
- **Fee structures**, **invoices** (invoice no, title, amount, amount paid, due
  date, status) and **payments**. Invoice status and paid-amount are
  trigger-maintained (`pending`, `partially_paid`, `paid`, `overdue`).
- **Summaries** — collection rate, outstanding totals, and charts on the
  dashboard.
- **One-click reminder run** and a **daily automation** (see §7): finds invoices
  due soon or overdue, writes a warm, AI-personalised message (clean template
  fallback), and notifies the guardian (email if SMTP is set, otherwise in-app).
- Parents see their child's fee balance and can act from the portal.

### Admissions CRM (Leads)
- Enquiries pipeline: parent & child name, grade, phone, email, **source**
  (website, referral, instagram, facebook, walk-in, call), **owner**, and
  **stage** (new → contacted → toured → applied → enrolled / lost).
- **Public enquiry intake** — the website's admissions form posts to
  `POST /api/public/enquiry`, which creates a lead and fans out notifications to
  the admissions team.

### Marketing (Campaigns)
- Campaigns across **facebook, instagram, google, whatsapp, email, offline**.
- Track status (draft/active/paused/ended), **budget**, **spend**, **leads
  generated**, and a computed **cost-per-lead**.

---

## 6. People (HR)

### Staff
- Directory of all employees, teaching and non-teaching: name, role, department
  (Academics / Administration / Transport / Support Staff / Finance), email,
  phone, employment type (full-time / part-time / contract), salary, join date,
  active status.

### Leave
- Staff leave requests: type (casual / sick / earned / unpaid), from/to dates,
  reason, and approval **status** (pending / approved / rejected / cancelled).

---

## 7. Intelligence (AI)

### AI Copilot (`/assistant`)
- A chat assistant **grounded in your live school data** — ask about enrolment,
  fees, attendance and more. Powered by OpenRouter (default model
  `anthropic/claude-3.5-sonnet`). Degrades to a helpful stub until a key is set.

### The six AI Agents (`/agents`)
A team of purpose-built copilots. Each runs end-to-end today; connecting
`OPENROUTER_API_KEY` switches the model call from preview to live. Some agents
get a live data snapshot for grounding.

| Agent | Category | What it does |
| --- | --- | --- |
| **Marketing Copywriter** | Growth | Drafts admissions ads, social posts and emails in the school's voice. |
| **Admissions / Sales Assistant** | Growth | Qualifies a lead, suggests the single next best action, drafts a warm follow-up (grounded on live snapshot). |
| **HR Assistant** | People | Drafts job descriptions, offer letters, and answers HR-policy questions. |
| **Teacher Compatibility (teacher-fit)** | People | Recommends teacher-to-class assignments by subject expertise, workload and fit. |
| **Timetable Architect** | Operations | Explains/structures a conflict-free timetable (generation runs in the Timetable module). |
| **Principal Copilot** | Leadership | Summarises the school day, flags what needs attention (fees, attendance, incidents, low stock), suggests 3 priorities (grounded). |

Every agent run is recorded (`ai_runs`) with the input, output and model.

### Automations
- Control panel to inspect and trigger scheduled jobs (`/automations`).
- **Three automations**, run by a cron scheduler in the school's timezone
  (`ENABLE_AUTOMATIONS` master switch):
  1. **Fee reminders** — invoices due soon/overdue → AI-personalised nudge to the
     guardian. *Default cron `0 9 * * *`.*
  2. **Teacher class reminders** — each morning tells every teacher exactly which
     classes they teach today, built live from the timetable. *Default cron
     `0 7 * * 1-6`.*
  3. **AI timetable → schedule sync** — the timetable AI drafts a grid, the
     validator guarantees no double-booking, and **Apply** atomically replaces the
     class's live slots.

---

## 8. Data connectivity

One consistent data layer across every module.

### Excel export / import — **16 datasets**
Download any dataset as a formatted `.xlsx`, or bulk-import rows from one.

`students · teachers · staff · guardians · leads · campaigns · fees ·
books · inventory · vehicles · labs · appointments · facilities · leave ·
hostel_rooms · infirmary`

- **Export:** `GET /api/export/:resource(.xlsx)`; list all datasets via
  `GET /api/export`.
- **Import:** `POST /api/import/:resource` with a base64 `.xlsx` — only whitelisted
  columns are accepted, rows are tagged with the school, and a parsed/inserted/
  errors summary is returned.

### Global keyword search
- Top-bar search across every module (`GET /api/search?q=`), grouped by resource
  with counts; clicking a result jumps to the right module.

### Google Drive sync
- Connect a **service account** (`GOOGLE_SERVICE_ACCOUNT_JSON` +
  `GOOGLE_DRIVE_FOLDER_ID`) to push formatted Excel exports to a shared Drive
  folder — per-dataset (`POST /api/drive/sync/:resource`), **sync-all**
  (`POST /api/drive/sync-all`), plus Drive file search. Falls back gracefully to a
  plain download link when Drive isn't connected.

---

## 9. Platform, roles & settings

### Roles
Eight roles drive both navigation and API access:

`admin · principal · teacher · parent · student · accountant · librarian · staff`

- **Supabase Auth** email/password sign-in; the **first account becomes admin**
  automatically, everyone else defaults to `parent`. Promote from SQL:
  `select set_user_role('teacher@wellspire.school','teacher');`
- **Reads** require a session; **writes** require a staff role; **AI chat** and the
  **notifications feed** are open to any signed-in user.
- **Demo mode** skips login — pick a role on the landing page and use the top-bar
  **role-switcher** to preview any role instantly.

### Settings / Go-live
- Integration status panel + go-live checklist for the four connectors that turn
  the demo into production: **Supabase** (persistent data), **OpenRouter** (AI),
  **SMTP** (email), **Google Drive** (Excel sync). Each is optional and
  independent. `GET /api/status` reports current mode and which integrations are
  live.

### Notifications
- In-app notification feed with unread badge; delivered by email when SMTP is
  configured, otherwise recorded in-app.

---

## 10. Public website (multi-page)

A standalone marketing site served from `server/public/site`, using its own brand
system (navy `#233F88`, gold `#DCBA63`, Roboto / Roboto Slab, crest logo).

- **Pages:** Home, About, Academics, Admissions, Campus, Contact — plus a full
  **Admissions Enquiry** form.
- **Live enquiry intake** — the enquiry form creates a CRM lead
  (`POST /api/public/enquiry`) and notifies admissions; a public school contact
  card is served from `GET /api/public/school`.
- Shared header/footer, social links, and a **Portal Login** button that opens the
  app.

---

## 11. Parent portal & mobile app

### Parent portal
When a parent signs in, the dashboard is replaced by a dedicated **family home**:
- Child switcher (multiple wards).
- **Fees** balance ("Cleared ✓" or amount due).
- **Today's timetable** for the child's class.
- **Attendance** strip (last ~12 days).
- **Library** loans.
- **School notices / announcements.**
- **Live bus tracking** for the child's route.

### Installable mobile app (PWA)
Wellspire ships as an installable **Progressive Web App** — manifest + service
worker, offline-safe app shell, "Add to Home Screen" on Android/iOS, and a path to
publish to the **Google Play Store** and **Apple App Store**. Full guide in
[`MOBILE_APP.md`](./MOBILE_APP.md).

---

## 12. Per-role summary

Which top-level modules each role sees in the sidebar. (Parents get the dedicated
parent-portal home instead of the staff dashboard; students are a supported
account type primarily surfaced through records and the family experience.)

| Module | admin | principal | teacher | accountant | librarian | parent |
| --- | :-: | :-: | :-: | :-: | :-: | :-: |
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (portal) |
| Students | ✅ | ✅ | ✅ | | | |
| Teachers | ✅ | ✅ | | | | |
| Classes | ✅ | ✅ | ✅ | | | |
| Timetable | ✅ | ✅ | ✅ | | | ✅ |
| Attendance | ✅ | ✅ | ✅ | | | |
| Transport (live GPS) | ✅ | ✅ | | | | ✅ |
| Hostel | ✅ | ✅ | | | | |
| Labs | ✅ | ✅ | ✅ | | | |
| Infirmary | ✅ | ✅ | ✅ | | | |
| Library | ✅ | ✅ | ✅ | | ✅ | |
| Inventory | ✅ | ✅ | | | | |
| Facilities | ✅ | ✅ | | | | |
| Appointments | ✅ | ✅ | | ✅ | | |
| Fees | ✅ | ✅ | | ✅ | | ✅ |
| Admissions (CRM) | ✅ | ✅ | | ✅ | | |
| Marketing | ✅ | ✅ | | | | |
| Staff (HR) | ✅ | ✅ | | | | |
| Leave | ✅ | ✅ | | | | |
| AI Copilot | ✅ | ✅ | ✅ | ✅ | | |
| AI Agents | ✅ | ✅ | | | | |
| Automations | ✅ | ✅ | | | | |
| Schools (super-admin) | ✅ | ✅ | | | | |
| Data & Excel | ✅ | ✅ | | | | |
| Settings | ✅ | ✅ | | | | |

**Role responsibilities in brief**

| Role | Primary use |
| --- | --- |
| **admin** | Full access — every module, super-admin, settings, data. |
| **principal** | Same reach as admin; leadership copilot and oversight. |
| **teacher** | Students, classes, timetable, attendance, labs, infirmary, library, AI copilot. |
| **accountant** | Fees, admissions CRM, appointments, AI copilot. |
| **librarian** | Library catalogue and issue/return. |
| **parent** | Family portal: fees, timetable, attendance, library, notices, bus tracking. |
| **student** | Supported account type (records, RLS scope); family-facing views. |
| **staff** | General non-teaching staff account; scoped by assignment. |

---

## 13. Cross-cutting capabilities

- **Demo ↔ Live parity** — identical behaviour on in-memory data or Postgres;
  database triggers that maintain derived state (invoice totals, library copies,
  stock levels) are replicated in demo mode.
- **Notifications** — in-app feed + optional email (SMTP).
- **Audit logs** — activity is recorded for accountability.
- **Graceful degradation** — every integration (Supabase, OpenRouter, SMTP, Drive)
  is optional; missing ones degrade to sensible fallbacks rather than crashing.
- **Security** — no secrets in the repo; the service-role key is server-only; RLS
  is defence-in-depth for direct client access.

---

*See also: [`SUPABASE.md`](./SUPABASE.md) for persistent data & storage, and
[`MOBILE_APP.md`](./MOBILE_APP.md) for installing and publishing the mobile app.*
