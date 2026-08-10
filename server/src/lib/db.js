// Unified data-access layer.
//
// When Supabase is configured, every call hits Postgres via the service-role
// client. When it isn't, the exact same interface runs against an in-memory
// dataset (DEMO mode) so the app is fully explorable before any DB is wired.
//
// Routes only ever talk to THIS module, never to Supabase directly, so the two
// modes stay behaviourally identical. Derived state that Postgres triggers
// maintain (invoice totals, library copies, stock levels) is replicated here
// for DEMO mode in `applyDemoSideEffects`.
import { randomUUID } from 'node:crypto';
import supabase, { supabaseConfigured } from './supabaseClient.js';
import { buildMockData } from './mockData.js';
import logger from './logger.js';

export const mode = supabaseConfigured ? 'supabase' : 'demo';

// ---- DEMO in-memory store --------------------------------------------------
const store = supabaseConfigured ? null : buildMockData();

const nowIso = () => new Date().toISOString();

function matches(row, eq = {}) {
  return Object.entries(eq).every(([k, v]) => {
    if (Array.isArray(v)) return v.includes(row[k]);
    return row[k] === v;
  });
}

function demoList(table, { eq = {}, order, limit, ilike } = {}) {
  let rows = (store[table] || []).filter((r) => matches(r, eq));
  if (ilike) {
    const [col, term] = Object.entries(ilike)[0];
    const needle = String(term).replace(/%/g, '').toLowerCase();
    rows = rows.filter((r) => String(r[col] ?? '').toLowerCase().includes(needle));
  }
  if (order) {
    const { column, ascending = true } = order;
    rows = [...rows].sort((a, b) => {
      const av = a[column], bv = b[column];
      if (av === bv) return 0;
      const cmp = av > bv ? 1 : -1;
      return ascending ? cmp : -cmp;
    });
  }
  if (limit) rows = rows.slice(0, limit);
  return rows.map((r) => ({ ...r }));
}

function applyDemoSideEffects(table, row, op) {
  // Replicate the Postgres triggers so DEMO mode behaves like production.
  if (table === 'fee_payments' && op === 'insert') {
    const inv = store.fee_invoices.find((i) => i.id === row.invoice_id);
    if (inv) {
      const paid = store.fee_payments
        .filter((p) => p.invoice_id === inv.id)
        .reduce((s, p) => s + Number(p.amount), 0);
      inv.amount_paid = paid;
      const overdue = new Date(inv.due_date) < new Date();
      inv.status = paid <= 0 ? (overdue ? 'overdue' : 'pending')
        : paid >= Number(inv.amount) ? 'paid'
        : (overdue ? 'overdue' : 'partially_paid');
      inv.updated_at = nowIso();
    }
  }
  if (table === 'library_loans') {
    const book = store.library_books.find((b) => b.id === row.book_id);
    if (book) {
      if (op === 'insert' && row.status === 'issued') {
        book.available_copies = Math.max(0, book.available_copies - 1);
      }
      if (op === 'update' && row.__prevStatus === 'issued' && ['returned', 'lost'].includes(row.status)) {
        book.available_copies = Math.min(book.total_copies, book.available_copies + 1);
      }
    }
  }
  if (table === 'inventory_transactions' && op === 'insert') {
    const item = store.inventory_items.find((i) => i.id === row.item_id);
    if (item) {
      const q = Number(row.quantity);
      if (['inbound', 'returned'].includes(row.type)) item.quantity += q;
      else if (['outbound', 'damaged'].includes(row.type)) item.quantity = Math.max(0, item.quantity - q);
      else if (row.type === 'adjustment') item.quantity = q;
      item.updated_at = nowIso();
    }
  }
}

// ---- Public API ------------------------------------------------------------
export async function list(table, opts = {}) {
  if (!supabaseConfigured) return demoList(table, opts);

  let q = supabase.from(table).select(opts.select || '*', { count: opts.count ? 'exact' : undefined });
  for (const [k, v] of Object.entries(opts.eq || {})) {
    q = Array.isArray(v) ? q.in(k, v) : q.eq(k, v);
  }
  if (opts.ilike) {
    const [col, term] = Object.entries(opts.ilike)[0];
    q = q.ilike(col, term);
  }
  if (opts.gte) for (const [k, v] of Object.entries(opts.gte)) q = q.gte(k, v);
  if (opts.lte) for (const [k, v] of Object.entries(opts.lte)) q = q.lte(k, v);
  if (opts.order) q = q.order(opts.order.column, { ascending: opts.order.ascending ?? true });
  if (opts.limit) q = q.limit(opts.limit);

  const { data, error } = await q;
  if (error) throw new Error(`db.list(${table}): ${error.message}`);
  return data || [];
}

export async function getById(table, id) {
  if (!supabaseConfigured) return (store[table] || []).find((r) => r.id === id) || null;
  const { data, error } = await supabase.from(table).select('*').eq('id', id).maybeSingle();
  if (error) throw new Error(`db.getById(${table}): ${error.message}`);
  return data;
}

export async function insert(table, row) {
  const payload = { ...row };
  if (!supabaseConfigured) {
    const record = {
      id: payload.id || randomUUID(),
      created_at: nowIso(),
      updated_at: nowIso(),
      ...payload,
    };
    store[table] = store[table] || [];
    store[table].push(record);
    applyDemoSideEffects(table, record, 'insert');
    return { ...record };
  }
  const { data, error } = await supabase.from(table).insert(payload).select().single();
  if (error) throw new Error(`db.insert(${table}): ${error.message}`);
  return data;
}

export async function update(table, id, patch) {
  if (!supabaseConfigured) {
    const rows = store[table] || [];
    const idx = rows.findIndex((r) => r.id === id);
    if (idx === -1) return null;
    const prevStatus = rows[idx].status;
    rows[idx] = { ...rows[idx], ...patch, updated_at: nowIso() };
    applyDemoSideEffects(table, { ...rows[idx], __prevStatus: prevStatus }, 'update');
    return { ...rows[idx] };
  }
  const { data, error } = await supabase.from(table).update(patch).eq('id', id).select().single();
  if (error) throw new Error(`db.update(${table}): ${error.message}`);
  return data;
}

export async function remove(table, id) {
  if (!supabaseConfigured) {
    store[table] = (store[table] || []).filter((r) => r.id !== id);
    return true;
  }
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) throw new Error(`db.remove(${table}): ${error.message}`);
  return true;
}

export async function rpc(fn, args = {}) {
  if (!supabaseConfigured) {
    // Minimal DEMO equivalents for the functions we call.
    if (fn === 'mark_overdue_invoices') {
      let n = 0;
      for (const inv of store.fee_invoices) {
        if (new Date(inv.due_date) < new Date() && ['pending', 'partially_paid'].includes(inv.status)) {
          inv.status = 'overdue';
          n++;
        }
      }
      return n;
    }
    if (fn === 'mark_overdue_loans') {
      let n = 0;
      for (const ln of store.library_loans) {
        if (ln.status === 'issued' && new Date(ln.due_date) < new Date()) {
          ln.status = 'overdue';
          n++;
        }
      }
      return n;
    }
    return null;
  }
  const { data, error } = await supabase.rpc(fn, args);
  if (error) throw new Error(`db.rpc(${fn}): ${error.message}`);
  return data;
}

// Build a lookup map { id: row } for cheap in-JS joins.
export async function mapById(table, opts = {}) {
  const rows = await list(table, opts);
  return Object.fromEntries(rows.map((r) => [r.id, r]));
}

export default { mode, list, getById, insert, update, remove, rpc, mapById };
