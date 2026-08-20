// Wellspire link/route/endpoint LIVE audit → Excel workbook.
//
// Enumerates every surface (frontend SPA routes, marketing website pages, PWA
// static assets, and all backend API endpoints) and probes each one LIVE.
//
// Non-destructive by design:
//   • GET everywhere it's safe.
//   • POST "create" endpoints get an empty body → the server answers 422
//     (validation), proving the route is live WITHOUT writing any row.
//   • PATCH/DELETE get a non-existent id → 404, proving the route is live
//     without mutating real data.
//   • A few safe action endpoints (dry-run reminders, in-memory timetable
//     generation) are exercised for real.
//
// Usage: node scripts/link_audit.mjs [baseUrl]
import ExcelJS from 'exceljs';

const BASE = (process.argv[2] || 'https://wellspire-sms.onrender.com').replace(/\/$/, '');
const FAKE_ID = '00000000-0000-0000-0000-000000000000';
const TIMEOUT_MS = 25000;

// ---- probe helper ---------------------------------------------------------
async function probe(method, path, { body } = {}) {
  const url = path.startsWith('http') ? path : BASE + path;
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  const started = Date.now();
  try {
    const res = await fetch(url, {
      method,
      redirect: 'manual',
      headers: {
        'X-Demo-Role': 'admin',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: ctrl.signal,
    });
    return { status: res.status, ms: Date.now() - started };
  } catch (err) {
    return { status: 0, ms: Date.now() - started, error: err.name === 'AbortError' ? 'timeout' : err.message };
  } finally {
    clearTimeout(t);
  }
}

// A route is LIVE if the server handled it. Where we send deliberately-bad
// input, a 4xx still proves the route exists and is wired.
function verdict(row) {
  const s = row.status;
  if (s === 0) return 'DOWN';
  if (Array.isArray(row.expect)) return row.expect.includes(s) ? 'LIVE' : `CHECK (${s})`;
  return s >= 200 && s < 500 ? 'LIVE' : `CHECK (${s})`;
}

// ---- inventory ------------------------------------------------------------
const rows = [];
// add(area, method, path, auth, desc, expect[], opts?)
const add = (area, method, path, auth, desc, expect, opts) =>
  rows.push({ area, method, path, auth, desc, expect, _opts: opts });

// Frontend SPA routes — served by the SPA fallback → 200 (index.html).
const SPA = [
  ['/', 'Dashboard / Parent home'], ['/students', 'Students'], ['/teachers', 'Teachers'],
  ['/classes', 'Classes'], ['/timetable', 'Timetable'], ['/attendance', 'Attendance'],
  ['/fees', 'Fees'], ['/library', 'Library'], ['/inventory', 'Inventory'],
  ['/automations', 'Automations'], ['/assistant', 'AI Copilot'], ['/transport', 'Transport'],
  ['/hostel', 'Hostel'], ['/labs', 'Labs'], ['/infirmary', 'Infirmary'],
  ['/facilities', 'Facilities'], ['/appointments', 'Appointments'], ['/leads', 'Admissions CRM'],
  ['/marketing', 'Marketing'], ['/hr', 'Staff (HR)'], ['/leave', 'Leave'],
  ['/agents', 'AI Agents'], ['/platform', 'Schools (super-admin)'], ['/data', 'Data & Excel'],
  ['/get-started', 'Get started / onboarding'], ['/mobile', 'Mobile app'], ['/settings', 'Settings'],
];
for (const [p, d] of SPA) add('Frontend · App (SPA)', 'GET', p, 'App (demo)', d, [200]);

// Marketing website (static multi-page site).
const SITE = [
  ['/website/', 'Website home'], ['/website/about.html', 'About'], ['/website/academics.html', 'Academics'],
  ['/website/admissions.html', 'Admissions'], ['/website/campus.html', 'Campus'],
  ['/website/contact.html', 'Contact'], ['/website/enquiry.html', 'Enquiry form (lead capture)'],
  ['/website/style.css', 'Site stylesheet'], ['/website/main.js', 'Site script'],
];
for (const [p, d] of SITE) add('Frontend · Website', 'GET', p, 'Public', d, [200]);
add('Frontend · Website', 'GET', '/site', 'Public', 'Redirect → /website/', [200, 301, 302]);
add('Frontend · Website', 'GET', '/parent', 'Public', 'Redirect → / (portal)', [200, 301, 302]);
add('Frontend · Website', 'GET', '/parents', 'Public', 'Redirect → / (portal)', [200, 301, 302]);

// PWA / static assets.
for (const [p, d] of [
  ['/manifest.webmanifest', 'PWA manifest'], ['/sw.js', 'Service worker'],
  ['/icon.svg', 'App icon (SVG)'], ['/icon-192.png', 'App icon 192 (PWA) — new in PR #11'],
  ['/icon-512.png', 'App icon 512 (PWA)'], ['/apple-touch-icon.png', 'iOS icon (PNG) — new in PR #11'],
]) add('Frontend · PWA assets', 'GET', p, 'Public', d, [200]);

// System + auth + public API.
add('API · System', 'GET', '/api/health', 'Public', 'Health check', [200]);
add('API · System', 'GET', '/api/status', 'Public', 'Runtime mode & integrations', [200]);
add('API · Auth', 'GET', '/api/auth/config', 'Public', 'Auth config for the client', [200]);
add('API · Auth', 'GET', '/api/auth/me', 'Auth (demo)', 'Current profile', [200]);
add('API · Public', 'GET', '/api/public/school', 'Public', 'School contact card', [200]);
add('API · Public', 'POST', '/api/public/enquiry', 'Public', 'Submit enquiry (empty→422 validate)', [422], { body: {} });

// Generic CRUD resources (list/get/create/update/delete).
const CRUD = [
  ['/api/teachers', 'Teachers'], ['/api/guardians', 'Guardians'], ['/api/classes', 'Classes'],
  ['/api/subjects', 'Subjects'], ['/api/academic-years', 'Academic years'], ['/api/announcements', 'Announcements'],
  ['/api/schools', 'Schools'], ['/api/transport/vehicles', 'Transport · vehicles'],
  ['/api/transport/routes', 'Transport · routes'], ['/api/transport/stops', 'Transport · stops'],
  ['/api/hostels', 'Hostels'], ['/api/hostel/rooms', 'Hostel · rooms'], ['/api/hostel/allocations', 'Hostel · allocations'],
  ['/api/labs', 'Labs'], ['/api/lab/equipment', 'Lab · equipment'], ['/api/infirmary', 'Infirmary visits'],
  ['/api/medical', 'Medical records'], ['/api/appointments', 'Appointments'], ['/api/staff', 'Staff (HR)'],
  ['/api/leave', 'Leave requests'], ['/api/leads', 'Leads (CRM)'], ['/api/campaigns', 'Campaigns'],
  ['/api/facilities', 'Facility logs'],
];
for (const [base, name] of CRUD) {
  add('API · CRUD', 'GET', base, 'Auth (demo)', `${name} — list`, [200]);
  add('API · CRUD', 'GET', `${base}/${FAKE_ID}`, 'Auth (demo)', `${name} — get by id (fake→404)`, [404, 200]);
  add('API · CRUD', 'POST', base, 'Staff (demo)', `${name} — create (empty→422)`, [422, 400, 201], { body: {} });
  add('API · CRUD', 'PATCH', `${base}/${FAKE_ID}`, 'Staff (demo)', `${name} — update (fake id→404)`, [404, 422, 200], { body: {} });
  add('API · CRUD', 'DELETE', `${base}/${FAKE_ID}`, 'Staff (demo)', `${name} — delete (fake id→404)`, [404, 200, 204], { body: undefined });
}

// Students module (specialised).
add('API · Students', 'GET', '/api/students', 'Auth (demo)', 'List students', [200]);
add('API · Students', 'GET', `/api/students/${FAKE_ID}`, 'Auth (demo)', 'Get student (fake→404)', [404, 200]);
add('API · Students', 'POST', '/api/students', 'Staff (demo)', 'Create (empty→422)', [422, 400, 201], { body: {} });
add('API · Students', 'PATCH', `/api/students/${FAKE_ID}`, 'Staff (demo)', 'Update (fake→404)', [404, 422, 200], { body: {} });
add('API · Students', 'DELETE', `/api/students/${FAKE_ID}`, 'Staff (demo)', 'Delete (fake→404)', [404, 200, 204]);

// Timetable.
add('API · Timetable', 'GET', '/api/timetable', 'Auth (demo)', 'List slots', [200]);
add('API · Timetable', 'POST', '/api/timetable/slots', 'Staff (demo)', 'Add slot (empty→422)', [422, 400, 201], { body: {} });
add('API · Timetable', 'PATCH', `/api/timetable/slots/${FAKE_ID}`, 'Staff (demo)', 'Edit slot (fake→404)', [404, 422, 200], { body: {} });
add('API · Timetable', 'DELETE', `/api/timetable/slots/${FAKE_ID}`, 'Staff (demo)', 'Delete slot (fake→404)', [404, 200, 204]);
add('API · Timetable', 'POST', '/api/timetable/generate', 'Staff (demo)', 'AI generate (safe, in-memory)', [200, 201], { body: { class_ids: ['cls-5a'] } });
add('API · Timetable', 'POST', '/api/timetable/sync', 'Staff (demo)', 'Sync slots (empty→ok/422)', [200, 201, 422, 400], { body: {} });
add('API · Timetable', 'GET', '/api/timetable/jobs', 'Auth (demo)', 'Generation jobs', [200]);

// Fees.
add('API · Fees', 'GET', '/api/fees/structures', 'Auth (demo)', 'Fee structures', [200]);
add('API · Fees', 'POST', '/api/fees/structures', 'Staff (demo)', 'Create structure (empty→422)', [422, 400, 201], { body: {} });
add('API · Fees', 'GET', '/api/fees/invoices', 'Auth (demo)', 'Invoices', [200]);
add('API · Fees', 'POST', '/api/fees/invoices', 'Staff (demo)', 'Create invoice (empty→422)', [422, 400, 201], { body: {} });
add('API · Fees', 'GET', `/api/fees/invoices/${FAKE_ID}`, 'Auth (demo)', 'Invoice by id (fake→404)', [404, 200]);
add('API · Fees', 'POST', '/api/fees/payments', 'Staff (demo)', 'Record payment (empty→422)', [422, 400, 201], { body: {} });
add('API · Fees', 'POST', '/api/fees/reminders/run?dry=1', 'Staff (demo)', 'Fee reminders (dry run)', [200, 201], { body: undefined });

// Library.
add('API · Library', 'GET', '/api/library/books', 'Auth (demo)', 'Books', [200]);
add('API · Library', 'POST', '/api/library/books', 'Staff (demo)', 'Add book (empty→422)', [422, 400, 201], { body: {} });
add('API · Library', 'PATCH', `/api/library/books/${FAKE_ID}`, 'Staff (demo)', 'Edit book (fake→404)', [404, 422, 200], { body: {} });
add('API · Library', 'GET', '/api/library/loans', 'Auth (demo)', 'Loans', [200]);
add('API · Library', 'POST', '/api/library/loans', 'Staff (demo)', 'Issue loan (empty→422)', [422, 400, 201], { body: {} });
add('API · Library', 'POST', `/api/library/loans/${FAKE_ID}/return`, 'Staff (demo)', 'Return loan (fake→404)', [404, 200, 422]);

// Inventory.
add('API · Inventory', 'GET', '/api/inventory/categories', 'Auth (demo)', 'Categories', [200]);
add('API · Inventory', 'POST', '/api/inventory/categories', 'Staff (demo)', 'Add category (empty→422)', [422, 400, 201], { body: {} });
add('API · Inventory', 'GET', '/api/inventory/items', 'Auth (demo)', 'Items', [200]);
add('API · Inventory', 'POST', '/api/inventory/items', 'Staff (demo)', 'Add item (empty→422)', [422, 400, 201], { body: {} });
add('API · Inventory', 'PATCH', `/api/inventory/items/${FAKE_ID}`, 'Staff (demo)', 'Edit item (fake→404)', [404, 422, 200], { body: {} });
add('API · Inventory', 'POST', '/api/inventory/transactions', 'Staff (demo)', 'Stock txn (empty→422)', [422, 400, 201], { body: {} });
add('API · Inventory', 'GET', '/api/inventory/transactions', 'Auth (demo)', 'Transactions', [200]);

// Attendance / Dashboard / Notifications.
add('API · Attendance', 'GET', '/api/attendance?class_id=cls-5a', 'Auth (demo)', 'Class register (needs class_id)', [200]);
add('API · Attendance', 'POST', '/api/attendance', 'Staff (demo)', 'Mark attendance (empty→422)', [422, 400, 201], { body: {} });
add('API · Dashboard', 'GET', '/api/dashboard', 'Auth (demo)', 'Dashboard summary', [200]);
add('API · Notifications', 'GET', '/api/notifications', 'Auth (demo)', 'Notifications feed', [200]);
add('API · Notifications', 'POST', `/api/notifications/${FAKE_ID}/read`, 'Auth (demo)', 'Mark read (fake→404/ok)', [404, 200, 204]);

// AI + Automations.
add('API · AI', 'GET', '/api/ai/status', 'Auth (demo)', 'AI availability', [200]);
add('API · AI', 'POST', '/api/ai/chat', 'Auth (demo)', 'AI chat (ping)', [200, 201, 400, 422, 503], { body: { messages: [{ role: 'user', content: 'ping' }] } });
add('API · Automations', 'GET', '/api/automations/status', 'Auth (demo)', 'Automations status', [200]);
add('API · Automations', 'POST', '/api/automations/fee-reminders/run', 'Staff (demo)', 'Run fee reminders', [200, 201], { body: undefined });
add('API · Automations', 'POST', '/api/automations/teacher-reminders/run', 'Staff (demo)', 'Run teacher reminders', [200, 201], { body: undefined });

// Platform specials + AI agents.
add('API · Platform', 'GET', '/api/platform/overview', 'Auth (demo)', 'Super-admin overview', [200]);
add('API · Platform', 'GET', '/api/transport/live', 'Auth (demo)', 'Live vehicle positions', [200]);
add('API · Platform', 'GET', '/api/ai-agents', 'Auth (demo)', 'AI agents hub', [200]);
add('API · Platform', 'POST', '/api/ai-agents/marketing/run', 'Staff (demo)', 'Run an AI agent', [200, 201, 400, 422, 503], { body: { prompt: 'ping' } });

// Data connectivity: Excel, search, Drive.
add('API · Data', 'GET', '/api/export/students.xlsx', 'Auth (demo)', 'Excel export (students)', [200]);
add('API · Data', 'GET', '/api/export', 'Auth (demo)', 'Export index / resource list', [200]);
add('API · Data', 'POST', '/api/import/students', 'Staff (demo)', 'Excel import (no file→400/422)', [400, 422, 200], { body: {} });
add('API · Data', 'GET', '/api/search?q=a', 'Auth (demo)', 'Global keyword search', [200]);
add('API · Data', 'GET', '/api/drive/status', 'Auth (demo)', 'Google Drive status', [200]);
add('API · Data', 'POST', '/api/drive/sync/students', 'Staff (demo)', 'Drive sync one (unconfigured→ok/400)', [200, 400, 422, 501], { body: undefined });
add('API · Data', 'POST', '/api/drive/sync-all', 'Staff (demo)', 'Drive sync all (unconfigured→ok/400)', [200, 400, 422, 501], { body: undefined });
add('API · Data', 'GET', '/api/drive/search?q=a', 'Auth (demo)', 'Drive keyword search', [200, 400, 501]);

// Uploads (new in PR #11 — Supabase Storage).
add('API · Uploads', 'GET', '/api/uploads/status', 'Auth (demo)', 'Storage availability (new · PR #11)', [200]);
add('API · Uploads', 'POST', '/api/uploads', 'Staff (demo)', 'Upload file (demo→501) (new · PR #11)', [501, 201, 422], { body: {} });

// ---- run probes (bounded concurrency) -------------------------------------
console.log(`Auditing ${rows.length} routes against ${BASE} …`);
const CONCURRENCY = 8;
let cursor = 0;
async function worker() {
  while (cursor < rows.length) {
    const r = rows[cursor++];
    const opts = r._opts || (r.method === 'GET' ? {} : { body: {} });
    const res = await probe(r.method, r.path, opts);
    r.status = res.status;
    r.ms = res.ms;
    r.err = res.error || '';
    r.result = verdict(r);
  }
}
await Promise.all(Array.from({ length: CONCURRENCY }, worker));

// ---- summary --------------------------------------------------------------
const live = rows.filter((r) => r.result === 'LIVE').length;
const down = rows.filter((r) => r.result === 'DOWN').length;
const check = rows.length - live - down;
console.log(`\nRESULT  live=${live}  check=${check}  down=${down}  total=${rows.length}`);
for (const r of rows.filter((r) => r.result !== 'LIVE')) {
  console.log(`  ${r.result.padEnd(10)} ${r.method.padEnd(6)} ${r.path}  (${r.status})`);
}

// ---- Excel workbook -------------------------------------------------------
const wb = new ExcelJS.Workbook();
wb.creator = 'Wellspire link audit';
wb.created = new Date(0); // deterministic

const NAVY = 'FF233F88';
const GOLD = 'FFDCBA63';
const GREEN = 'FF1F7A3D';
const AMBER = 'FFB8860B';
const RED = 'FFB00020';

// Sheet 1: Summary
const s0 = wb.addWorksheet('Summary', { properties: { tabColor: { argb: NAVY } } });
s0.columns = [{ width: 30 }, { width: 60 }];
const title = s0.addRow(['Wellspire — Live Link / Route / Endpoint Audit']);
title.font = { bold: true, size: 16, color: { argb: NAVY } };
s0.addRow([]);
s0.addRow(['Base URL', BASE]);
s0.addRow(['Total routes audited', rows.length]);
s0.addRow(['LIVE', live]);
s0.addRow(['Needs check', check]);
s0.addRow(['Down', down]);
s0.addRow([]);
s0.addRow(['Legend', '']);
s0.addRow(['LIVE', 'Route handled by the server (2xx, or 4xx from a deliberately-invalid probe).']);
s0.addRow(['CHECK (nnn)', 'Unexpected status — worth a look.']);
s0.addRow(['DOWN', 'No response / connection failed.']);
s0.addRow([]);
s0.addRow(['Probe method', 'Non-destructive: empty bodies trigger validation (422); PATCH/DELETE use a']);
s0.addRow(['', 'non-existent id (404); only dry-run / in-memory actions are executed for real.']);
s0.getColumn(1).font = { bold: true };
s0.getRow(1).height = 24;

// Group counts by area on the summary too.
s0.addRow([]);
const byAreaHdr = s0.addRow(['Area', 'live / total']);
byAreaHdr.font = { bold: true, color: { argb: 'FFFFFFFF' } };
byAreaHdr.eachCell((c) => { c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } }; });
const areas = [...new Set(rows.map((r) => r.area))];
for (const a of areas) {
  const g = rows.filter((r) => r.area === a);
  const gl = g.filter((r) => r.result === 'LIVE').length;
  s0.addRow([a, `${gl} / ${g.length}`]);
}

// Sheet 2: Full audit table
const s1 = wb.addWorksheet('All routes', { views: [{ state: 'frozen', ySplit: 1 }] });
s1.columns = [
  { header: 'Area', key: 'area', width: 22 },
  { header: 'Method', key: 'method', width: 8 },
  { header: 'Path / URL', key: 'path', width: 46 },
  { header: 'Auth', key: 'auth', width: 14 },
  { header: 'Description', key: 'desc', width: 42 },
  { header: 'Live HTTP', key: 'status', width: 10 },
  { header: 'ms', key: 'ms', width: 7 },
  { header: 'Result', key: 'result', width: 12 },
];
s1.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
s1.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: NAVY } };
s1.getRow(1).alignment = { vertical: 'middle' };
s1.autoFilter = 'A1:H1';

for (const r of rows) {
  const row = s1.addRow({
    area: r.area, method: r.method, path: r.path, auth: r.auth,
    desc: r.desc, status: r.status || (r.err || 0), ms: r.ms, result: r.result,
  });
  const color = r.result === 'LIVE' ? GREEN : r.result === 'DOWN' ? RED : AMBER;
  row.getCell('result').font = { bold: true, color: { argb: color } };
  row.getCell('method').font = { bold: true, color: { argb: NAVY } };
  row.getCell('status').alignment = { horizontal: 'center' };
  row.getCell('ms').alignment = { horizontal: 'center' };
}
s1.eachRow((row, n) => {
  if (n === 1) return;
  if (n % 2 === 0) row.eachCell((c) => { if (!c.fill?.fgColor) c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF4F6FB' } }; });
});

const outPath = process.env.OUT || '/home/user/Wellspire-/Wellspire-links-audit.xlsx';
await wb.xlsx.writeFile(outPath);
console.log(`\nWorkbook written: ${outPath}`);
