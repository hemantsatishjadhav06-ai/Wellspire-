// Platform modules: multi-tenant schools + operational modules (transport,
// hostel, labs, infirmary, HR, CRM, marketing, facilities, appointments) and
// the AI-agents hub. Most resources use the generic CRUD router; a few have
// specialised endpoints.
import { Router } from 'express';
import { crudRouter } from './crud.js';
import db from '../lib/db.js';
import config from '../config.js';
import openrouter from '../lib/openrouter.js';
import { asyncHandler, HttpError } from '../middleware/index.js';

const router = Router();

// [mountPath, table, searchColumn, orderColumn, ascending]
const RESOURCES = [
  ['/schools', 'schools', 'name', 'name', true],
  ['/transport/vehicles', 'transport_vehicles', 'code', 'code', true],
  ['/transport/routes', 'transport_routes', 'name', 'name', true],
  ['/transport/stops', 'transport_stops', 'name', 'seq', true],
  ['/hostels', 'hostels', 'name', 'name', true],
  ['/hostel/rooms', 'hostel_rooms', 'room_no', 'room_no', true],
  ['/hostel/allocations', 'hostel_allocations', null, 'id', true],
  ['/labs', 'labs', 'name', 'name', true],
  ['/lab/equipment', 'lab_equipment', 'name', 'name', true],
  ['/infirmary', 'infirmary_visits', null, 'visited_at', false],
  ['/medical', 'medical_records', null, 'id', true],
  ['/appointments', 'appointments', 'requester_name', 'created_at', false],
  ['/staff', 'staff', 'full_name', 'full_name', true],
  ['/leave', 'leave_requests', 'staff_name', 'created_at', false],
  ['/leads', 'leads', 'parent_name', 'created_at', false],
  ['/campaigns', 'campaigns', 'name', 'created_at', false],
  ['/facilities', 'facility_logs', 'location', 'logged_at', false],
];

for (const [path, table, search, order, asc] of RESOURCES) {
  router.use(path, crudRouter({
    table,
    searchColumn: search || undefined,
    defaultOrder: { column: order, ascending: asc },
  }));
}

// --- Platform overview (super-admin) ---------------------------------------
router.get('/platform/overview', asyncHandler(async (_req, res) => {
  const [schools, students, staff, vehicles, leads] = await Promise.all([
    db.list('schools', {}), db.list('students', {}), db.list('staff', {}),
    db.list('transport_vehicles', {}), db.list('leads', {}),
  ]);
  res.json({
    schools: schools.map((s) => ({ id: s.id, name: s.name, board_type: s.board_type, plan: s.plan, brand_color: s.brand_color, is_active: s.is_active, website_enabled: s.website_enabled })),
    totals: {
      schools: schools.length,
      students: students.length,
      staff: staff.length,
      vehicles: vehicles.length,
      open_leads: leads.filter((l) => !['enrolled', 'lost'].includes(l.stage)).length,
    },
  });
}));

// --- Transport live: each vehicle + its latest GPS ping --------------------
router.get('/transport/live', asyncHandler(async (_req, res) => {
  const vehicles = await db.list('transport_vehicles', {});
  const pings = await db.list('transport_pings', { order: { column: 'recorded_at', ascending: false } });
  const routes = await db.list('transport_routes', {});
  const data = vehicles.map((v) => {
    const latest = pings.find((p) => p.vehicle_id === v.id) || null;
    const route = routes.find((r) => r.vehicle_id === v.id) || null;
    return {
      ...v,
      route_name: route?.name || null,
      lat: latest?.lat ?? null, lng: latest?.lng ?? null,
      speed_kmph: latest?.speed_kmph ?? null, recorded_at: latest?.recorded_at ?? null,
      moving: (latest?.speed_kmph ?? 0) > 1,
    };
  });
  res.json({ data, count: data.length });
}));

// --- AI agents -------------------------------------------------------------
const AGENT_PROMPTS = {
  marketing: 'You are the marketing copywriter for a school. Write warm, credible, concise admissions marketing copy (ads, social posts, emails) in the school\'s voice. Never invent facts or fake statistics.',
  sales: 'You are an admissions/sales assistant for a school. Qualify the enquiry, suggest the single next best action, and draft a short, warm follow-up message to the parent. Be practical and specific.',
  hr: 'You are an HR assistant for a school. Draft clear job descriptions, offer letters, and answer HR-policy questions professionally and concisely. Flag anything that needs a human decision.',
  teacher_fit: 'You are a staffing assistant for a school. Given teachers, subjects and classes, recommend teacher-to-class assignments balancing subject expertise, workload and fit. Explain the reasoning briefly.',
  principal: 'You are the Principal\'s copilot. Summarise the school day from the provided data, highlight what needs attention (fees, attendance, incidents, low stock), and suggest 3 priorities. Be crisp.',
  timetable: 'You are a timetabling assistant. Explain how you would structure a conflict-free weekly timetable for the given constraints. (Generation itself runs in the Timetable module.)',
};

router.get('/ai-agents', asyncHandler(async (_req, res) => {
  const data = await db.list('ai_agents', { order: { column: 'name', ascending: true } });
  res.json({ data, openrouter: openrouter.configured });
}));

router.post('/ai-agents/:key/run', asyncHandler(async (req, res) => {
  const key = req.params.key;
  const input = String(req.body?.input || '').slice(0, 4000);
  if (!input) throw new HttpError(400, 'Provide an "input" prompt for the agent.');

  const sys = AGENT_PROMPTS[key] || 'You are a helpful assistant for a school.';
  if (!openrouter.configured) {
    return res.json({
      output: 'The AI is not connected yet. Add an OPENROUTER_API_KEY environment variable to enable the AI agents. ' +
        `(Agent: ${key}. Your input was received.)`,
      grounded: false,
    });
  }
  // Give sales/principal agents a light data snapshot for grounding.
  let context = '';
  if (key === 'sales' || key === 'principal') {
    const [students, invoices, leads] = await Promise.all([db.list('students', {}), db.list('fee_invoices', {}), db.list('leads', {})]);
    context = `\n\nSCHOOL SNAPSHOT: students=${students.length}, overdue_invoices=${invoices.filter((i) => i.status === 'overdue').length}, open_leads=${leads.filter((l) => !['enrolled', 'lost'].includes(l.stage)).length}.`;
  }
  const output = await openrouter.chat(
    [{ role: 'system', content: sys + context }, { role: 'user', content: input }],
    { temperature: 0.6 }
  );
  await db.insert('ai_runs', { school_id: config.defaultSchoolId, agent_key: key, input, output, model: config.openrouter.model }).catch(() => {});
  res.json({ output, grounded: Boolean(context), model: config.openrouter.model });
}));

export default router;
