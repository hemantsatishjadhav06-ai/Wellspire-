import React, { useState, useEffect, useCallback } from 'react';
import { Sparkles, Check, RotateCcw, CalendarDays, Loader2 } from 'lucide-react';
import api from '../lib/api.js';
import { DAYS } from '../lib/format.js';
import { Card, PageHeader, ErrorNote, EmptyState, Badge, Select } from '../components/ui.jsx';

const PERIODS = [1, 2, 3, 4, 5, 6];
const WEEK = [1, 2, 3, 4, 5];

export default function Timetable() {
  const [classes, setClasses] = useState([]);
  const [classId, setClassId] = useState('');
  const [slots, setSlots] = useState([]);
  const [preview, setPreview] = useState(null); // AI-generated, not yet applied
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState(null);
  const [source, setSource] = useState('');

  useEffect(() => {
    api.get('/classes').then((r) => {
      setClasses(r.data);
      if (r.data[0]) setClassId(r.data[0].id);
    }).catch(setError);
  }, []);

  const load = useCallback(() => {
    if (!classId) return;
    setLoading(true); setPreview(null);
    api.get('/timetable', { class_id: classId })
      .then((r) => setSlots(r.data))
      .catch(setError)
      .finally(() => setLoading(false));
  }, [classId]);

  useEffect(load, [load]);

  async function generate() {
    setGenerating(true); setError(null);
    try {
      const r = await api.post('/timetable/generate', { class_ids: [classId], constraints: { periodsPerDay: 6 } });
      setPreview(r.slots);
      setSource(r.source);
    } catch (e) { setError(e); } finally { setGenerating(false); }
  }

  async function apply() {
    setGenerating(true); setError(null);
    try {
      await api.post('/timetable/sync', { slots: preview, class_ids: [classId] });
      setPreview(null);
      load();
    } catch (e) { setError(e); } finally { setGenerating(false); }
  }

  const active = preview || slots;
  const cell = (day, period) => active.find((s) => s.day_of_week === day && s.period === period);
  const selectedClass = classes.find((c) => c.id === classId);

  return (
    <div>
      <PageHeader
        title="Timetable"
        subtitle="AI-generated, conflict-free weekly schedules — one click to apply."
        actions={
          <div className="flex items-center gap-2">
            <Select value={classId} onChange={(e) => setClassId(e.target.value)} className="!w-auto">
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
            {!preview ? (
              <button className="btn-primary" onClick={generate} disabled={generating || !classId}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />} Generate with AI
              </button>
            ) : (
              <>
                <button className="btn-outline" onClick={() => setPreview(null)}><RotateCcw className="h-4 w-4" /> Discard</button>
                <button className="btn-primary" onClick={apply} disabled={generating}>
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />} Apply schedule
                </button>
              </>
            )}
          </div>
        }
      />

      {error && <div className="mb-4"><ErrorNote error={error} /></div>}

      {preview && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-brand-50 px-4 py-3 text-sm text-brand-800 ring-1 ring-inset ring-brand-600/20">
          <Sparkles className="h-4 w-4" />
          <span>Preview of an AI-generated schedule{source ? ` (${source})` : ''}. Review, then <strong>Apply</strong> to make it live.</span>
        </div>
      )}

      <Card className="p-4">
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /> Loading…</div>
        ) : !active.length ? (
          <EmptyState title="No timetable yet" hint={`Generate a schedule for ${selectedClass?.name || 'this class'} with AI.`} icon={CalendarDays} />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-separate border-spacing-1.5">
              <thead>
                <tr>
                  <th className="w-16 text-xs font-semibold uppercase tracking-wide text-slate-400"></th>
                  {WEEK.map((d) => <th key={d} className="rounded-lg bg-slate-50 py-2 text-sm font-semibold text-slate-600">{DAYS[d]}</th>)}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map((p) => (
                  <tr key={p}>
                    <td className="text-center text-xs font-semibold text-slate-400">P{p}</td>
                    {WEEK.map((d) => {
                      const s = cell(d, p);
                      return (
                        <td key={d} className="align-top">
                          {s ? (
                            <div className="rounded-xl p-2.5 text-left" style={{ background: (s.subject_color || '#6366f1') + '18' }}>
                              <p className="text-sm font-semibold text-slate-800">{s.subject_name || 'Subject'}</p>
                              <p className="mt-0.5 text-xs text-slate-500">{s.teacher_name || '—'}</p>
                              {s.start_time && <p className="mt-1 text-[11px] text-slate-400">{s.start_time}–{s.end_time}</p>}
                            </div>
                          ) : (
                            <div className="rounded-xl border border-dashed border-slate-200 p-2.5 text-center text-xs text-slate-300">—</div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <p className="mt-4 text-xs text-slate-400">
        The generator guarantees no teacher is double-booked. When an OpenRouter key is configured the plan is drafted by the model and
        validated locally; otherwise a deterministic engine produces the grid. Applying replaces this class's live slots.
      </p>
    </div>
  );
}
