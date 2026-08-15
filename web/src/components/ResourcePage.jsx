import React, { useMemo, useState } from 'react';
import { Plus, Search } from 'lucide-react';
import api from '../lib/api.js';
import {
  Card, PageHeader, Table, Spinner, ErrorNote, EmptyState, Modal, Field, Input, Select, useAsync,
} from './ui.jsx';

/**
 * Config-driven CRUD page.
 * @param {object} p
 * @param {string} p.title
 * @param {string} [p.subtitle]
 * @param {string} p.endpoint            REST base (GET list, POST create)
 * @param {Array}  p.columns             [{key,label,render?}]
 * @param {Array}  [p.fields]            [{key,label,type,required,options,placeholder}]
 * @param {string} [p.searchKey]         client-side filter column
 * @param {string} [p.addLabel]
 * @param {function} [p.transform]       (rows)=>rows  (client enrichment)
 */
export default function ResourcePage(p) {
  const [q, setQ] = useState('');
  const [open, setOpen] = useState(false);
  const { loading, data, error, reload } = useAsync(() => api.get(p.endpoint), [p.endpoint]);

  const rows = useMemo(() => {
    let r = data?.data || [];
    if (p.transform) r = p.transform(r);
    if (q && p.searchKey) {
      const n = q.toLowerCase();
      r = r.filter((x) => String(x[p.searchKey] ?? '').toLowerCase().includes(n));
    }
    return r;
  }, [data, q, p]);

  return (
    <div>
      <PageHeader title={p.title} subtitle={p.subtitle}
        actions={p.fields ? <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> {p.addLabel || 'Add'}</button> : null} />

      {p.searchKey && (
        <Card className="mb-4 p-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input className="input pl-9" placeholder={`Search ${p.title.toLowerCase()}…`} value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
        </Card>
      )}

      <Card>
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : (
          <Table head={p.columns.map((c) => c.label)}
                 empty={!rows.length && <EmptyState title={`No ${p.title.toLowerCase()} yet`} hint={p.fields ? 'Add your first record.' : undefined} />}>
            {rows.map((row, i) => (
              <tr key={row.id || i} className="hover:bg-slate-50/60">
                {p.columns.map((c) => (
                  <td key={c.label} className="td">{c.render ? c.render(row) : (row[c.key] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </Table>
        )}
      </Card>

      {p.fields && <AddModal open={open} onClose={() => setOpen(false)} onSaved={reload} endpoint={p.endpoint} fields={p.fields} title={p.addLabel || `Add ${p.title}`} />}
    </div>
  );
}

function AddModal({ open, onClose, onSaved, endpoint, fields, title }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setSaving(true); setErr(null);
    try {
      const body = { ...form };
      for (const f of fields) if (f.type === 'number' && body[f.key] != null && body[f.key] !== '') body[f.key] = Number(body[f.key]);
      await api.post(endpoint, body);
      onSaved?.(); onClose(); setForm({});
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }

  const required = fields.filter((f) => f.required);
  const valid = required.every((f) => form[f.key]);

  return (
    <Modal open={open} onClose={onClose} title={title} wide
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !valid}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {fields.map((f) => (
          <Field key={f.key} label={f.label + (f.required ? ' *' : '')}>
            {f.options ? (
              <Select value={form[f.key] || ''} onChange={set(f.key)}>
                <option value="">Select…</option>
                {f.options.map((o) => <option key={o} value={o}>{o}</option>)}
              </Select>
            ) : (
              <Input type={f.type === 'number' ? 'number' : f.type === 'date' ? 'date' : 'text'}
                value={form[f.key] || ''} onChange={set(f.key)} placeholder={f.placeholder || ''} />
            )}
          </Field>
        ))}
      </div>
    </Modal>
  );
}
