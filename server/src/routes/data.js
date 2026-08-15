// Data connectivity: Excel export/import, global keyword search, and Google
// Drive sync — one consistent layer across every module.
import { Router } from 'express';
import db from '../lib/db.js';
import config from '../config.js';
import { rowsToXlsx, xlsxToRows } from '../lib/excel.js';
import drive from '../lib/googleDrive.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

const router = Router();

// resource → { table, cols (export/import columns), search (keyword fields), label }
const RES = {
  students: { table: 'students', label: 'Students', cols: ['admission_no', 'full_name', 'gender', 'date_of_birth', 'roll_no', 'class_id'], search: ['full_name', 'admission_no'] },
  teachers: { table: 'teachers', label: 'Teachers', cols: ['employee_code', 'full_name', 'email', 'phone', 'qualification'], search: ['full_name', 'email'] },
  staff: { table: 'staff', label: 'Staff', cols: ['full_name', 'role', 'department', 'email', 'phone', 'salary'], search: ['full_name', 'role', 'department'] },
  guardians: { table: 'guardians', label: 'Guardians', cols: ['full_name', 'email', 'phone', 'occupation'], search: ['full_name', 'phone', 'email'] },
  leads: { table: 'leads', label: 'Admissions leads', cols: ['parent_name', 'child_name', 'grade', 'phone', 'email', 'source', 'stage', 'owner'], search: ['parent_name', 'child_name', 'phone'] },
  campaigns: { table: 'campaigns', label: 'Campaigns', cols: ['name', 'channel', 'status', 'budget', 'spend', 'leads_generated'], search: ['name', 'channel'] },
  fees: { table: 'fee_invoices', label: 'Fee invoices', cols: ['invoice_no', 'student_id', 'title', 'amount', 'amount_paid', 'due_date', 'status'], search: ['invoice_no', 'title'] },
  books: { table: 'library_books', label: 'Library books', cols: ['title', 'author', 'isbn', 'category', 'shelf', 'total_copies', 'available_copies'], search: ['title', 'author', 'isbn'] },
  inventory: { table: 'inventory_items', label: 'Inventory', cols: ['name', 'sku', 'unit', 'quantity', 'reorder_level', 'location'], search: ['name', 'sku'] },
  vehicles: { table: 'transport_vehicles', label: 'Vehicles', cols: ['code', 'registration_no', 'model', 'capacity', 'driver_name', 'driver_phone'], search: ['code', 'registration_no', 'driver_name'] },
  labs: { table: 'labs', label: 'Labs', cols: ['name', 'type', 'room', 'in_charge', 'capacity'], search: ['name', 'type'] },
  appointments: { table: 'appointments', label: 'Appointments', cols: ['requester_name', 'requester_email', 'with_role', 'purpose', 'status', 'meet_link'], search: ['requester_name', 'purpose'] },
  facilities: { table: 'facility_logs', label: 'Facilities', cols: ['facility', 'location', 'status', 'cleaned_by', 'note'], search: ['location', 'cleaned_by'] },
  leave: { table: 'leave_requests', label: 'Leave', cols: ['staff_name', 'type', 'from_date', 'to_date', 'reason', 'status'], search: ['staff_name', 'reason'] },
  hostel_rooms: { table: 'hostel_rooms', label: 'Hostel rooms', cols: ['room_no', 'floor', 'capacity', 'occupied'], search: ['room_no', 'floor'] },
  infirmary: { table: 'infirmary_visits', label: 'Infirmary visits', cols: ['symptoms', 'treatment', 'nurse', 'parent_notified'], search: ['symptoms', 'nurse'] },
};

function resolve(name) {
  const key = String(name).replace(/\.xlsx$/i, '');
  const def = RES[key];
  if (!def) throw new HttpError(404, `Unknown data set "${key}". Available: ${Object.keys(RES).join(', ')}`);
  return { key, ...def };
}

async function buildXlsx(name) {
  const r = resolve(name);
  const rows = await db.list(r.table, {});
  const columns = r.cols.map((k) => ({ key: k, header: k.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()) }));
  const shaped = rows.map((row) => Object.fromEntries(r.cols.map((k) => [k, row[k] ?? ''])));
  const buffer = await rowsToXlsx(r.label, columns, shaped);
  return { filename: `${r.key}.xlsx`, buffer, count: rows.length, label: r.label };
}

// GET /api/export/:resource(.xlsx) — download an Excel file
router.get('/export/:resource', asyncHandler(async (req, res) => {
  const { filename, buffer } = await buildXlsx(req.params.resource);
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(buffer);
}));

// GET /api/export — list exportable data sets
router.get('/export', (_req, res) => {
  res.json({ datasets: Object.entries(RES).map(([key, v]) => ({ key, label: v.label, columns: v.cols })) });
});

// POST /api/import/:resource  { dataBase64 }  — bulk add rows from an .xlsx
router.post('/import/:resource', asyncHandler(async (req, res) => {
  const r = resolve(req.params.resource);
  const b64 = req.body?.dataBase64;
  if (!b64) throw new HttpError(400, 'Provide dataBase64 (base64 of an .xlsx file).');
  const buffer = Buffer.from(b64.replace(/^data:.*;base64,/, ''), 'base64');
  const { rows } = await xlsxToRows(buffer);
  const allowed = new Set(r.cols);
  let inserted = 0;
  const errors = [];
  for (const raw of rows) {
    const row = {};
    for (const [k, v] of Object.entries(raw)) {
      const key = k.toLowerCase().replace(/\s+/g, '_');
      if (allowed.has(key)) row[key] = v;
    }
    if (!Object.keys(row).length) continue;
    row.school_id = config.defaultSchoolId;
    try { await db.insert(r.table, row); inserted++; } catch (e) { errors.push(e.message); }
  }
  res.json({ ok: true, resource: r.key, parsed: rows.length, inserted, errors: errors.slice(0, 5) });
}));

// GET /api/search?q=  — keyword search across modules
router.get('/search', asyncHandler(async (req, res) => {
  const q = String(req.query.q || '').trim().toLowerCase();
  if (q.length < 2) return res.json({ q, groups: [] });
  const groups = [];
  for (const [key, def] of Object.entries(RES)) {
    const rows = await db.list(def.table, {});
    const matches = rows.filter((row) => def.search.some((f) => String(row[f] ?? '').toLowerCase().includes(q)));
    if (matches.length) {
      groups.push({
        resource: key, label: def.label, count: matches.length,
        items: matches.slice(0, 6).map((row) => ({
          id: row.id,
          title: String(row[def.search[0]] ?? row[def.cols[0]] ?? '—'),
          subtitle: def.cols.slice(1, 3).map((k) => row[k]).filter(Boolean).join(' · '),
        })),
      });
    }
  }
  res.json({ q, groups, total: groups.reduce((s, g) => s + g.count, 0) });
}));

// --- Google Drive ----------------------------------------------------------
router.get('/drive/status', (_req, res) => {
  res.json({ configured: drive.configured, folder_set: Boolean(config.googleDrive.folderId) });
});

// POST /api/drive/sync/:resource  — export to Excel and push to Drive
router.post('/drive/sync/:resource', asyncHandler(async (req, res) => {
  const { filename, buffer, count, label } = await buildXlsx(req.params.resource);
  if (!drive.configured) {
    return res.json({
      configured: false,
      message: 'Google Drive is not connected yet. Set GOOGLE_SERVICE_ACCOUNT_JSON + GOOGLE_DRIVE_FOLDER_ID to enable one-click sync. You can still download the Excel below.',
      download_url: `/api/export/${req.params.resource}.xlsx`, rows: count, label,
    });
  }
  const file = await drive.uploadXlsx(filename, buffer);
  res.json({ configured: true, uploaded: file, rows: count, label });
}));

// POST /api/drive/sync-all — push every data set to Drive
router.post('/drive/sync-all', asyncHandler(async (_req, res) => {
  if (!drive.configured) return res.json({ configured: false, message: 'Google Drive not connected.' });
  const results = [];
  for (const key of Object.keys(RES)) {
    const { filename, buffer, count } = await buildXlsx(key);
    const file = await drive.uploadXlsx(filename, buffer);
    results.push({ resource: key, rows: count, link: file.link });
  }
  res.json({ configured: true, synced: results.length, results });
}));

// GET /api/drive/search?q= — keyword search across Drive files
router.get('/drive/search', asyncHandler(async (req, res) => {
  if (!drive.configured) return res.json({ configured: false, files: [] });
  const files = await drive.searchFiles(String(req.query.q || ''));
  res.json({ configured: true, files });
}));

export default router;
