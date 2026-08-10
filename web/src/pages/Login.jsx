import React, { useState } from 'react';
import {
  GraduationCap, Wallet, CalendarDays, BookOpen, Boxes, Bot, ShieldCheck,
  ArrowRight, Loader2, Sparkles, Users, ClipboardCheck,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

const FEATURES = [
  { icon: Users, text: 'Students, parents & staff in one place' },
  { icon: Wallet, text: 'Fees with automated reminders' },
  { icon: CalendarDays, text: 'AI timetable generation' },
  { icon: BookOpen, text: 'Library & inventory control' },
];

const DEMO_ROLES = [
  { key: 'admin', label: 'Administrator', desc: 'Full access', icon: ShieldCheck },
  { key: 'principal', label: 'Principal', desc: 'Oversight', icon: GraduationCap },
  { key: 'teacher', label: 'Teacher', desc: 'Classes & attendance', icon: ClipboardCheck },
  { key: 'accountant', label: 'Accountant', desc: 'Fees & finance', icon: Wallet },
  { key: 'librarian', label: 'Librarian', desc: 'Library desk', icon: BookOpen },
  { key: 'parent', label: 'Parent', desc: 'My child', icon: Users },
];

export default function Login() {
  const { mode } = useAuth();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <Hero />
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">
          {mode === 'supabase' ? <SupabaseAuth /> : <DemoAuth />}
        </div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative hidden overflow-hidden bg-slate-950 lg:flex lg:flex-col lg:justify-between lg:p-12 text-white">
      {/* decorative */}
      <div className="pointer-events-none absolute inset-0 opacity-[0.15]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '32px 32px' }} />
      <div className="pointer-events-none absolute -left-32 top-1/4 h-96 w-96 rounded-full bg-brand-600/40 blur-3xl" />
      <div className="pointer-events-none absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-sky-500/30 blur-3xl" />

      <div className="relative flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-lg font-bold shadow-lg">W</div>
        <div>
          <p className="text-lg font-bold leading-tight">Wellspire</p>
          <p className="text-xs text-slate-400">School Operating System</p>
        </div>
      </div>

      <div className="relative max-w-md">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium ring-1 ring-white/20">
          <Sparkles className="h-3.5 w-3.5" /> AI-native school management
        </div>
        <h1 className="text-4xl font-bold leading-tight">Run your entire school from one beautiful dashboard.</h1>
        <p className="mt-4 text-slate-300">
          Admissions to attendance, fees to library and inventory — automated, secure and effortless.
          Built for administrators, teachers and parents alike.
        </p>
        <ul className="mt-8 space-y-3">
          {FEATURES.map(({ icon: Icon, text }) => (
            <li key={text} className="flex items-center gap-3 text-sm text-slate-200">
              <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/10 ring-1 ring-white/15"><Icon className="h-4 w-4" /></span>
              {text}
            </li>
          ))}
        </ul>
      </div>

      <div className="relative flex items-center gap-6 text-xs text-slate-400">
        <span className="flex items-center gap-1.5"><ShieldCheck className="h-4 w-4" /> Bank-grade security</span>
        <span className="flex items-center gap-1.5"><Bot className="h-4 w-4" /> OpenRouter AI</span>
        <span className="flex items-center gap-1.5"><Boxes className="h-4 w-4" /> Supabase</span>
      </div>
    </div>
  );
}

function DemoAuth() {
  const { enterDemo } = useAuth();
  const [busy, setBusy] = useState('');
  const go = (r) => { setBusy(r); setTimeout(() => enterDemo(r), 150); };
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">W</div>
        <span className="font-bold text-slate-900">Wellspire</span>
      </div>
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Sparkles className="h-3 w-3" /> Live demo — no login needed
      </div>
      <h2 className="text-2xl font-bold text-slate-900">Choose a role to explore</h2>
      <p className="mt-1 text-sm text-slate-500">Every role sees a tailored view. Connect Supabase to enable real logins.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {DEMO_ROLES.map(({ key, label, desc, icon: Icon }) => (
          <button key={key} onClick={() => go(key)} disabled={!!busy}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-300 hover:shadow-soft disabled:opacity-60">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-600 group-hover:bg-brand-600 group-hover:text-white transition">
              {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-800">{label}</span>
              <span className="block text-xs text-slate-400">{desc}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">By continuing you agree to the demo terms. Sample data only.</p>
    </div>
  );
}

function SupabaseAuth() {
  const { signIn, signUp, error } = useAuth();
  const [tab, setTab] = useState('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(null);
  const [localErr, setLocalErr] = useState(null);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setNotice(null); setLocalErr(null);
    try {
      if (tab === 'signin') await signIn(email, password);
      else { await signUp(email, password, fullName); setNotice('Account created. Check your email to confirm, then sign in.'); setTab('signin'); }
    } catch (err) { setLocalErr(err.message); } finally { setBusy(false); }
  }

  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-2 lg:hidden">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 font-bold text-white">W</div>
        <span className="font-bold text-slate-900">Wellspire</span>
      </div>
      <h2 className="text-2xl font-bold text-slate-900">{tab === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="mt-1 text-sm text-slate-500">{tab === 'signin' ? 'Sign in to your school workspace.' : 'The first account becomes the administrator.'}</p>

      <div className="mt-6 inline-flex rounded-xl bg-slate-100 p-1">
        {['signin', 'signup'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {t === 'signin' ? 'Sign in' : 'Sign up'}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="mt-5 space-y-4">
        {tab === 'signup' && (
          <div>
            <label className="label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Principal" required />
          </div>
        )}
        <div>
          <label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@school.edu" required />
        </div>
        <div>
          <label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} />
        </div>
        {(localErr || error) && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{localErr || error}</p>}
        {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{tab === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </div>
  );
}
