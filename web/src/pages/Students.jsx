import React, { useState } from 'react';
import { Plus, Search, UserPlus } from 'lucide-react';
import api from '../lib/api.js';
import { dateFmt, initials, colorFor } from '../lib/format.js';
import {
  Card, PageHeader, Table, Spinner, ErrorNote, EmptyState, Badge, Modal, Field, Input, Select, useAsync,
} from '../components/ui.jsx';

export default function Students() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const classes = useAsync(() => api.get('/classes'), []);
  const { loading, data, error, reload } = useAsync(() => api.get('/students', { search }), [search]);

  return (
    <div>
      <PageHeader
        title="Students"
        subtitle="Enrolment records, class allocation and guardians."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add student</button>}
      />

      <Card className="mb-4 p-3">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            placeholder="Search students by name…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : (
          <Table head={['Student', 'Admission #', 'Class', 'Guardian', 'DOB', '']}
                 empty={!data.data.length && <EmptyState title="No students found" hint="Try a different search or add a new student." icon={UserPlus} />}>
            {data.data.map((s) => (
              <tr key={s.id} className="hover:bg-slate-50/60">
                <td className="td">
                  <div className="flex items-center gap-3">
                    <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white" style={{ background: colorFor(s.full_name) }}>
                      {initials(s.full_name)}
                    </div>
                    <div>
                      <p className="font-medium text-slate-800">{s.full_name}</p>
                      <p className="text-xs text-slate-400 capitalize">{s.gender || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="td font-mono text-xs">{s.admission_no}</td>
                <td className="td">{s.class_name ? <Badge color="brand">{s.class_name}</Badge> : '—'}</td>
                <td className="td">
                  {s.guardian_name ? (
                    <div><p className="text-slate-700">{s.guardian_name}</p><p className="text-xs text-slate-400">{s.guardian_phone}</p></div>
                  ) : '—'}
                </td>
                <td className="td">{dateFmt(s.date_of_birth)}</td>
                <td className="td text-right"><Badge color={s.is_active === false ? 'slate' : 'emerald'}>{s.is_active === false ? 'Inactive' : 'Active'}</Badge></td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <AddStudent open={open} onClose={() => setOpen(false)} classes={classes.data?.data || []} onSaved={reload} />
    </div>
  );
}

function AddStudent({ open, onClose, classes, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/students', {
        full_name: form.full_name,
        admission_no: form.admission_no || `ADM-${Date.now().toString().slice(-6)}`,
        roll_no: form.roll_no,
        gender: form.gender || 'undisclosed',
        date_of_birth: form.date_of_birth || undefined,
        class_id: form.class_id || undefined,
        guardian: form.guardian_name ? { full_name: form.guardian_name, phone: form.guardian_phone, email: form.guardian_email } : undefined,
      });
      onSaved?.(); onClose(); setForm({});
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add student" wide
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !form.full_name}>{saving ? 'Saving…' : 'Save student'}</button>
      </>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name *"><Input value={form.full_name || ''} onChange={set('full_name')} placeholder="Aarav Gupta" /></Field>
        <Field label="Admission no"><Input value={form.admission_no || ''} onChange={set('admission_no')} placeholder="auto if blank" /></Field>
        <Field label="Roll no"><Input value={form.roll_no || ''} onChange={set('roll_no')} /></Field>
        <Field label="Gender">
          <Select value={form.gender || ''} onChange={set('gender')}>
            <option value="">Select…</option><option value="male">Male</option><option value="female">Female</option><option value="other">Other</option>
          </Select>
        </Field>
        <Field label="Date of birth"><Input type="date" value={form.date_of_birth || ''} onChange={set('date_of_birth')} /></Field>
        <Field label="Class">
          <Select value={form.class_id || ''} onChange={set('class_id')}>
            <option value="">Unassigned</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
      </div>
      <div className="mt-5 rounded-xl bg-slate-50 p-4">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-slate-500">Primary guardian (optional)</p>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Name"><Input value={form.guardian_name || ''} onChange={set('guardian_name')} /></Field>
          <Field label="Phone"><Input value={form.guardian_phone || ''} onChange={set('guardian_phone')} /></Field>
          <Field label="Email"><Input value={form.guardian_email || ''} onChange={set('guardian_email')} /></Field>
        </div>
      </div>
    </Modal>
  );
}
