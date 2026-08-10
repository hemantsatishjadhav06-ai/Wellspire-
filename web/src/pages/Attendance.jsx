import React, { useState, useEffect, useCallback } from 'react';
import { Save, Check, Loader2, ClipboardCheck } from 'lucide-react';
import api from '../lib/api.js';
import { initials, colorFor } from '../lib/format.js';
import { Card, PageHeader, ErrorNote, EmptyState, Select, Input, Spinner } from '../components/ui.jsx';

const STATUSES = [
  { key: 'present', label: 'Present', color: 'bg-emerald-500' },
  { key: 'absent', label: 'Absent', color: 'bg-rose-500' },
  { key: 'late', label: 'Late', color: 'bg-amber-500' },
  { key: 'excused', label: 'Excused', color: 'bg-slate-400' },
];

export default function Attendance() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [roster, setRoster] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get('/classes').then((r) => { setClasses(r.data); if (r.data[0]) setClassId(r.data[0].id); }).catch(setError);
  }, []);

  const load = useCallback(() => {
    if (!classId) return;
    setLoading(true); setSaved(false);
    api.get('/attendance', { class_id: classId, date })
      .then((r) => setRoster(r.data)).catch(setError).finally(() => setLoading(false));
  }, [classId, date]);

  useEffect(load, [load]);

  const setStatus = (studentId, status) =>
    setRoster((r) => r.map((s) => (s.student_id === studentId ? { ...s, status } : s)));

  const markAll = (status) => setRoster((r) => r.map((s) => ({ ...s, status })));

  async function save() {
    setSaving(true); setError(null);
    try {
      await api.post('/attendance', { class_id: classId, date, entries: roster.map((s) => ({ student_id: s.student_id, status: s.status })) });
      setSaved(true);
    } catch (e) { setError(e); } finally { setSaving(false); }
  }

  const present = roster.filter((s) => s.status === 'present').length;

  return (
    <div>
      <PageHeader title="Attendance" subtitle="Mark and save the daily register per class."
        actions={
          <div className="flex items-center gap-2">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="!w-auto">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="!w-auto" />
            <button className="btn-primary" onClick={save} disabled={saving || !roster.length}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : <Save className="h-4 w-4" />}
              {saved ? 'Saved' : 'Save'}
            </button>
          </div>
        } />

      {error && <div className="mb-4"><ErrorNote error={error} /></div>}

      {roster.length > 0 && (
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <span className="text-sm text-slate-500">{present}/{roster.length} present</span>
          <div className="flex gap-1.5">
            {STATUSES.map((s) => (
              <button key={s.key} className="btn-outline !py-1 !text-xs" onClick={() => markAll(s.key)}>All {s.label}</button>
            ))}
          </div>
        </div>
      )}

      <Card>
        {loading ? <Spinner /> : !roster.length ? (
          <EmptyState title="No students in this class" icon={ClipboardCheck} />
        ) : (
          <ul className="divide-y divide-slate-50">
            {roster.map((s) => (
              <li key={s.student_id} className="flex items-center gap-3 px-4 py-3">
                <div className="grid h-9 w-9 place-items-center rounded-full text-xs font-bold text-white" style={{ background: colorFor(s.full_name) }}>
                  {initials(s.full_name)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-slate-800">{s.full_name}</p>
                  <p className="text-xs text-slate-400">Roll {s.roll_no || '—'}</p>
                </div>
                <div className="flex gap-1.5">
                  {STATUSES.map((st) => (
                    <button
                      key={st.key}
                      onClick={() => setStatus(s.student_id, st.key)}
                      className={`h-8 rounded-lg px-3 text-xs font-semibold transition ${
                        s.status === st.key ? `${st.color} text-white` : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                      }`}
                    >
                      {st.label}
                    </button>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
