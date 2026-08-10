import React, { useState } from 'react';
import { Plus, Mail, Phone } from 'lucide-react';
import api from '../lib/api.js';
import { initials, colorFor } from '../lib/format.js';
import { Card, PageHeader, Spinner, ErrorNote, EmptyState, Badge, Modal, Field, Input, useAsync } from '../components/ui.jsx';

export default function Teachers() {
  const [open, setOpen] = useState(false);
  const { loading, data, error, reload } = useAsync(() => api.get('/teachers'), []);
  const subjects = useAsync(() => api.get('/subjects'), []);
  const subMap = Object.fromEntries((subjects.data?.data || []).map((s) => [s.id, s]));

  return (
    <div>
      <PageHeader title="Teachers" subtitle="Faculty directory and subject expertise."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add teacher</button>} />

      {loading ? <Spinner /> : error ? <ErrorNote error={error} /> : !data.data.length ? (
        <Card><EmptyState title="No teachers yet" hint="Add your first faculty member." /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.data.map((t) => (
            <Card key={t.id} className="p-5">
              <div className="flex items-center gap-3">
                <div className="grid h-12 w-12 place-items-center rounded-2xl text-sm font-bold text-white" style={{ background: colorFor(t.full_name) }}>
                  {initials(t.full_name)}
                </div>
                <div>
                  <p className="font-semibold text-slate-900">{t.full_name}</p>
                  <p className="text-xs text-slate-400">{t.employee_code || 'Faculty'} · {t.qualification || '—'}</p>
                </div>
              </div>
              <div className="mt-4 space-y-1.5 text-sm text-slate-600">
                {t.email && <p className="flex items-center gap-2"><Mail className="h-3.5 w-3.5 text-slate-400" /> {t.email}</p>}
                {t.phone && <p className="flex items-center gap-2"><Phone className="h-3.5 w-3.5 text-slate-400" /> {t.phone}</p>}
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {(t.subjects || []).map((sid) => <Badge key={sid} color="brand">{subMap[sid]?.name || 'Subject'}</Badge>)}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddTeacher open={open} onClose={() => setOpen(false)} onSaved={reload} />
    </div>
  );
}

function AddTeacher({ open, onClose, onSaved }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/teachers', {
        full_name: form.full_name, employee_code: form.employee_code,
        email: form.email, phone: form.phone, qualification: form.qualification,
      });
      onSaved?.(); onClose(); setForm({});
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add teacher"
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !form.full_name}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name *"><Input value={form.full_name || ''} onChange={set('full_name')} /></Field>
        <Field label="Employee code"><Input value={form.employee_code || ''} onChange={set('employee_code')} /></Field>
        <Field label="Email"><Input value={form.email || ''} onChange={set('email')} /></Field>
        <Field label="Phone"><Input value={form.phone || ''} onChange={set('phone')} /></Field>
        <Field label="Qualification"><Input value={form.qualification || ''} onChange={set('qualification')} /></Field>
      </div>
    </Modal>
  );
}
