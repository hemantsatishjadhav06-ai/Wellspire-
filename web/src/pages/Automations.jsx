import React, { useState } from 'react';
import { Zap, Bell, GraduationCap, Play, Loader2, CheckCircle2, XCircle } from 'lucide-react';
import api from '../lib/api.js';
import { Card, PageHeader, Spinner, ErrorNote, Badge, useAsync } from '../components/ui.jsx';

export default function Automations() {
  const { loading, data, error } = useAsync(() => api.get('/automations/status'), []);
  const [output, setOutput] = useState(null);
  const [busy, setBusy] = useState('');

  async function run(kind, dry) {
    setBusy(kind + (dry ? ':dry' : '')); setOutput(null);
    try {
      const path = kind === 'fee' ? '/automations/fee-reminders/run' : '/automations/teacher-reminders/run';
      const r = await api.post(path, {}, dry ? { dry: '1' } : undefined);
      setOutput({ kind, dry, result: r });
    } catch (e) { setOutput({ kind, error: e.message }); } finally { setBusy(''); }
  }

  if (loading) return <Spinner />;
  if (error) return <ErrorNote error={error} />;

  return (
    <div>
      <PageHeader title="Automations" subtitle="Scheduled jobs that run without anyone lifting a finger." />

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <IntegrationCard label="Database" ok={data.integrations.supabase} onText="Supabase connected" offText="Demo mode (in-memory)" />
        <IntegrationCard label="AI (OpenRouter)" ok={data.integrations.openrouter} onText="Model connected" offText="Add OPENROUTER_API_KEY" />
        <IntegrationCard label="Email (SMTP)" ok={data.integrations.email} onText="Email delivery on" offText="Recording in-app only" />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <JobCard
          icon={Bell} tint="bg-amber-100 text-amber-700"
          title="Fee reminders"
          desc="Finds invoices due soon or overdue, writes a warm reminder (AI-personalised when available) and notifies the guardian."
          schedule={data.jobs.find((j) => j.key === 'fee_reminders')?.cron}
          busy={busy} kind="fee" onRun={run}
        />
        <JobCard
          icon={GraduationCap} tint="bg-sky-100 text-sky-700"
          title="Teacher class reminders"
          desc="Each morning, tells every teacher exactly which classes they teach today, built live from the timetable."
          schedule={data.jobs.find((j) => j.key === 'teacher_reminders')?.cron}
          busy={busy} kind="teacher" onRun={run}
        />
      </div>

      {output && (
        <Card className="mt-6 p-5">
          <div className="mb-3 flex items-center gap-2">
            {output.error ? <XCircle className="h-5 w-5 text-rose-500" /> : <CheckCircle2 className="h-5 w-5 text-emerald-500" />}
            <h3 className="font-semibold text-slate-900">
              {output.kind === 'fee' ? 'Fee reminders' : 'Teacher reminders'} {output.dry ? '(dry run)' : ''}
            </h3>
          </div>
          {output.error ? (
            <ErrorNote error={{ message: output.error }} />
          ) : (
            <>
              <p className="mb-3 text-sm text-slate-500">Processed {output.result.count} recipient(s).</p>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {(output.result.reminders || []).map((r, i) => (
                  <div key={i} className="rounded-xl bg-slate-50 p-3 text-sm">
                    <p className="font-medium text-slate-800">{r.student || r.teacher}{r.guardian ? ` · ${r.guardian}` : ''}{r.classes ? ` · ${r.classes} class(es)` : ''}</p>
                    <p className="mt-1 whitespace-pre-wrap text-xs text-slate-500">{(r.message || r.body || '').slice(0, 400)}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

function IntegrationCard({ label, ok, onText, offText }) {
  return (
    <Card className="flex items-center gap-3 p-4">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
        <Zap className="h-5 w-5" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{ok ? onText : offText}</p>
      </div>
      <Badge className="ml-auto" color={ok ? 'emerald' : 'slate'}>{ok ? 'On' : 'Off'}</Badge>
    </Card>
  );
}

function JobCard({ icon: Icon, tint, title, desc, schedule, busy, kind, onRun }) {
  return (
    <Card className="p-5">
      <div className="flex items-start gap-3">
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}><Icon className="h-5 w-5" /></div>
        <div className="flex-1">
          <h3 className="font-semibold text-slate-900">{title}</h3>
          <p className="mt-1 text-sm text-slate-500">{desc}</p>
          <p className="mt-2 text-xs text-slate-400">Schedule: <code className="rounded bg-slate-100 px-1.5 py-0.5">{schedule}</code></p>
        </div>
      </div>
      <div className="mt-4 flex gap-2">
        <button className="btn-outline flex-1" onClick={() => onRun(kind, true)} disabled={!!busy}>
          {busy === `${kind}:dry` ? <Loader2 className="h-4 w-4 animate-spin" /> : null} Dry run
        </button>
        <button className="btn-primary flex-1" onClick={() => onRun(kind, false)} disabled={!!busy}>
          {busy === kind ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />} Run now
        </button>
      </div>
    </Card>
  );
}
