import React, { useState } from 'react';
import { Plus, School } from 'lucide-react';
import api from '../lib/api.js';
import { Card, PageHeader, Spinner, ErrorNote, EmptyState, Badge, Modal, Field, Input, Select, useAsync } from '../components/ui.jsx';

export default function Classes() {
  const [open, setOpen] = useState(false);
  const { loading, data, error, reload } = useAsync(() => api.get('/classes'), []);
  const teachers = useAsync(() => api.get('/teachers'), []);
  const students = useAsync(() => api.get('/students'), []);
  const tMap = Object.fromEntries((teachers.data?.data || []).map((t) => [t.id, t]));
  const countByClass = (students.data?.data || []).reduce((acc, s) => {
    if (s.class_id) acc[s.class_id] = (acc[s.class_id] || 0) + 1;
    return acc;
  }, {});

  return (
    <div>
      <PageHeader title="Classes" subtitle="Grades, sections, rooms and class teachers."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add class</button>} />

      {loading ? <Spinner /> : error ? <ErrorNote error={error} /> : !data.data.length ? (
        <Card><EmptyState title="No classes yet" icon={School} /></Card>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {data.data.map((c) => {
            const filled = countByClass[c.id] || 0;
            const pct = Math.min(100, Math.round((filled / (c.capacity || 40)) * 100));
            return (
              <Card key={c.id} className="p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-lg font-bold text-slate-900">{c.name}</p>
                    <p className="text-xs text-slate-400">Room {c.room || 'TBD'}</p>
                  </div>
                  <Badge color="brand">{filled}/{c.capacity || 40}</Badge>
                </div>
                <div className="mt-4">
                  <div className="mb-1 flex justify-between text-xs text-slate-500"><span>Capacity</span><span>{pct}%</span></div>
                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                    <div className="h-full rounded-full bg-brand-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
                <p className="mt-4 text-sm text-slate-600">
                  Class teacher: <span className="font-medium text-slate-800">{tMap[c.class_teacher_id]?.full_name || 'Unassigned'}</span>
                </p>
              </Card>
            );
          })}
        </div>
      )}

      <AddClass open={open} onClose={() => setOpen(false)} onSaved={reload} teachers={teachers.data?.data || []} />
    </div>
  );
}

function AddClass({ open, onClose, onSaved, teachers }) {
  const [form, setForm] = useState({ section: 'A', capacity: 35 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/classes', {
        grade: form.grade, section: form.section || 'A', room: form.room,
        capacity: Number(form.capacity) || 35, class_teacher_id: form.class_teacher_id || undefined,
      });
      onSaved?.(); onClose(); setForm({ section: 'A', capacity: 35 });
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="Add class"
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !form.grade}>{saving ? 'Saving…' : 'Save'}</button>
      </>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Grade *"><Input value={form.grade || ''} onChange={set('grade')} placeholder="5" /></Field>
        <Field label="Section"><Input value={form.section || ''} onChange={set('section')} placeholder="A" /></Field>
        <Field label="Room"><Input value={form.room || ''} onChange={set('room')} placeholder="R-201" /></Field>
        <Field label="Capacity"><Input type="number" value={form.capacity || ''} onChange={set('capacity')} /></Field>
        <Field label="Class teacher">
          <Select value={form.class_teacher_id || ''} onChange={set('class_teacher_id')}>
            <option value="">Unassigned</option>
            {teachers.map((t) => <option key={t.id} value={t.id}>{t.full_name}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}
