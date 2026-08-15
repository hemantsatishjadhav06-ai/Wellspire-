import React, { useState } from 'react';
import { Bot, Sparkles, Send, Loader2, Megaphone, Users2, Briefcase, UserCheck, CalendarClock, Crown } from 'lucide-react';
import api from '../lib/api.js';
import { Card, PageHeader, Spinner, ErrorNote, Badge, useAsync } from '../components/ui.jsx';

const ICONS = { marketing: Megaphone, sales: Users2, hr: Briefcase, teacher_fit: UserCheck, timetable: CalendarClock, principal: Crown };
const SUGGESTIONS = {
  marketing: 'Write a 2-line Instagram caption for our AI & Robotics lab open house.',
  sales: 'A parent enquired for Grade 1 from Instagram but hasn’t replied in 3 days. What next?',
  hr: 'Draft a short job description for a primary-school science teacher.',
  teacher_fit: 'Suggest which teacher should take Grade 6 Science and why.',
  principal: 'Summarise today and give me my top 3 priorities.',
  timetable: 'How should I structure a 6-period day for Grade 5 with no teacher clashes?',
};

export default function AIAgents() {
  const { loading, data, error } = useAsync(() => api.get('/ai-agents'), []);
  const [active, setActive] = useState(null);

  if (loading) return <Spinner label="Loading agents…" />;
  if (error) return <ErrorNote error={error} />;
  const agents = data?.data || [];
  const openrouter = data?.openrouter;

  return (
    <div>
      <PageHeader title="AI Agents" subtitle="A team of AI copilots for every corner of the school." />

      {!openrouter && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          ⚡ Add an <code>OPENROUTER_API_KEY</code> to switch the agents from preview to live. They already run end-to-end; only the model call is stubbed.
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.1fr_1.4fr]">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {agents.map((a) => {
            const Icon = ICONS[a.key] || Bot;
            const on = active?.key === a.key;
            return (
              <button key={a.id} onClick={() => setActive(a)}
                className={`rounded-2xl border p-4 text-left transition ${on ? 'border-brand-500 bg-brand-50 shadow-soft' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
                <div className="flex items-center gap-2">
                  <span className={`grid h-9 w-9 place-items-center rounded-xl ${on ? 'bg-brand-600 text-white' : 'bg-brand-50 text-brand-700'}`}><Icon className="h-4 w-4" /></span>
                  <Badge color="slate">{a.category}</Badge>
                </div>
                <p className="mt-3 text-sm font-semibold text-slate-900">{a.name}</p>
                <p className="mt-1 text-xs text-slate-500">{a.description}</p>
              </button>
            );
          })}
        </div>

        <div>{active ? <RunPanel agent={active} openrouter={openrouter} /> : (
          <Card className="grid h-full min-h-[320px] place-items-center p-8 text-center">
            <div>
              <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-2xl bg-brand-100 text-brand-700"><Sparkles className="h-6 w-6" /></div>
              <p className="font-semibold text-slate-800">Pick an agent to get started</p>
              <p className="mt-1 text-sm text-slate-400">Marketing, admissions, HR, staffing, timetabling and a principal copilot.</p>
            </div>
          </Card>
        )}</div>
      </div>
    </div>
  );
}

function RunPanel({ agent, openrouter }) {
  const [input, setInput] = useState(SUGGESTIONS[agent.key] || '');
  const [output, setOutput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  async function run() {
    setBusy(true); setErr(null); setOutput('');
    try { const r = await api.post(`/ai-agents/${agent.key}/run`, { input }); setOutput(r.output); }
    catch (e) { setErr(e); } finally { setBusy(false); }
  }

  return (
    <Card className="flex h-full flex-col p-5">
      <div className="mb-3 flex items-center gap-2">
        <Bot className="h-5 w-5 text-brand-600" /><h3 className="font-semibold text-slate-900">{agent.name}</h3>
        {openrouter && <Badge className="ml-auto" color="emerald">Live</Badge>}
      </div>
      <label className="label">Your request</label>
      <textarea className="input min-h-[96px]" value={input} onChange={(e) => setInput(e.target.value)} />
      <button className="btn-primary mt-3 self-start" onClick={run} disabled={busy || !input.trim()}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />} Run agent
      </button>
      {err && <div className="mt-3"><ErrorNote error={err} /></div>}
      {output && (
        <div className="mt-4 flex-1 whitespace-pre-wrap rounded-xl bg-slate-50 p-4 text-sm text-slate-700 ring-1 ring-inset ring-slate-100">{output}</div>
      )}
    </Card>
  );
}
