import React from 'react';
import { Database, Bot, Mail, ShieldCheck, ExternalLink } from 'lucide-react';
import { Card, PageHeader, Badge, useAsync, Spinner } from '../components/ui.jsx';
import api from '../lib/api.js';

export default function Settings() {
  const { loading, data } = useAsync(() => api.get('/status'), []);

  return (
    <div>
      <PageHeader title="Settings" subtitle="Connections and deployment status." />

      {loading ? <Spinner /> : (
        <div className="space-y-4">
          <Card className="p-5">
            <h3 className="mb-4 font-semibold text-slate-900">Integrations</h3>
            <div className="space-y-3">
              <Row icon={Database} label="Supabase (Postgres)" ok={data?.integrations?.supabase}
                   on="Connected — data is persistent" off="Demo mode — using in-memory sample data" />
              <Row icon={Bot} label="OpenRouter (AI)" ok={data?.integrations?.openrouter}
                   on="AI features enabled" off="Set OPENROUTER_API_KEY to enable AI" />
              <Row icon={Mail} label="Email (SMTP)" ok={data?.integrations?.email}
                   on="Reminders are emailed" off="Reminders recorded in-app only" />
              <Row icon={ShieldCheck} label="Automations" ok={data?.integrations?.automations}
                   on="Scheduled jobs running" off="Automations disabled" />
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="mb-3 font-semibold text-slate-900">Go live checklist</h3>
            <ol className="space-y-2 text-sm text-slate-600">
              <li className="flex gap-2"><span className="font-semibold text-brand-600">1.</span> Create a Supabase project and run the SQL in <code className="rounded bg-slate-100 px-1">supabase/migrations</code>.</li>
              <li className="flex gap-2"><span className="font-semibold text-brand-600">2.</span> In Render, set <code className="rounded bg-slate-100 px-1">SUPABASE_URL</code>, <code className="rounded bg-slate-100 px-1">SUPABASE_SERVICE_ROLE_KEY</code> and the anon key.</li>
              <li className="flex gap-2"><span className="font-semibold text-brand-600">3.</span> Add <code className="rounded bg-slate-100 px-1">OPENROUTER_API_KEY</code> for AI (rotate any key shared in plaintext first!).</li>
              <li className="flex gap-2"><span className="font-semibold text-brand-600">4.</span> Optionally add SMTP credentials to email reminders.</li>
              <li className="flex gap-2"><span className="font-semibold text-brand-600">5.</span> Redeploy — the banner will switch from “Demo” to “Live”.</li>
            </ol>
            <a href="https://render.com/docs/blueprint-spec" target="_blank" rel="noreferrer" className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 hover:text-brand-700">
              Render deploy docs <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </Card>

          <p className="text-center text-xs text-slate-400">
            Mode: <Badge color={data?.mode === 'supabase' ? 'emerald' : 'amber'}>{data?.mode}</Badge>
          </p>
        </div>
      )}
    </div>
  );
}

function Row({ icon: Icon, label, ok, on, off }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-slate-100 p-3">
      <div className={`grid h-10 w-10 place-items-center rounded-xl ${ok ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="flex-1">
        <p className="text-sm font-semibold text-slate-800">{label}</p>
        <p className="text-xs text-slate-400">{ok ? on : off}</p>
      </div>
      <Badge color={ok ? 'emerald' : 'slate'}>{ok ? 'Connected' : 'Not set'}</Badge>
    </div>
  );
}
