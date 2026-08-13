import React, { useState } from 'react';
import {
  Brain, HeartPulse, Sparkles, Leaf, Cpu, Bus, ShieldCheck, ArrowRight, Loader2,
  GraduationCap, Wallet, Users, ClipboardCheck, BookOpen,
} from 'lucide-react';
import { useAuth } from '../lib/auth.jsx';

const PILLARS = [
  { icon: Brain, k: 'Mind', v: 'Motivated & innovative' },
  { icon: HeartPulse, k: 'Body', v: 'Discipline & teamwork' },
  { icon: Sparkles, k: 'Spirit', v: 'Compassion & character' },
];

const TRUST = [
  { icon: Leaf, t: '10-acre biophilic campus' },
  { icon: Cpu, t: 'AI & Robotics lab' },
  { icon: Bus, t: 'GPS-enabled transport' },
];

const DEMO_ROLES = [
  { key: 'parent', label: 'Parent', desc: 'My child', icon: Users },
  { key: 'admin', label: 'Administrator', desc: 'Full access', icon: ShieldCheck },
  { key: 'principal', label: 'Principal', desc: 'Oversight', icon: GraduationCap },
  { key: 'teacher', label: 'Teacher', desc: 'Classes & attendance', icon: ClipboardCheck },
  { key: 'accountant', label: 'Accountant', desc: 'Fees & finance', icon: Wallet },
  { key: 'librarian', label: 'Librarian', desc: 'Library desk', icon: BookOpen },
];

export default function Login() {
  const { mode } = useAuth();
  return (
    <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
      <Hero />
      <div className="flex items-center justify-center bg-slate-50 px-6 py-12">
        <div className="w-full max-w-md">{mode === 'supabase' ? <SupabaseAuth /> : <DemoAuth />}</div>
      </div>
    </div>
  );
}

function Hero() {
  return (
    <div className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12 text-white"
      style={{ background: 'radial-gradient(130% 130% at 85% 0%, #17653c 0%, #0c3a22 55%, #082518 100%)' }}>
      <div className="pointer-events-none absolute inset-0 opacity-[0.18]"
        style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, #d9a92f 1px, transparent 0)', backgroundSize: '30px 30px',
          maskImage: 'radial-gradient(90% 80% at 80% 10%, #000 35%, transparent 75%)' }} />
      <div className="pointer-events-none absolute -right-24 top-1/3 h-96 w-96 rounded-full" style={{ background: 'radial-gradient(circle,rgba(217,169,47,.28),transparent 62%)', filter: 'blur(50px)' }} />

      <div className="relative flex items-center gap-3">
        <Crest />
        <div className="leading-tight">
          <p className="font-bold">Wellspire International School</p>
          <p className="text-xs text-emerald-200/80">Hyderabad · Inspiring Lifelong Learning</p>
        </div>
      </div>

      <div className="relative max-w-lg">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-amber-200 ring-1 ring-white/20">
          <Leaf className="h-3.5 w-3.5" /> Rooted in values. Ready for the world.
        </div>
        <h1 className="font-serif text-4xl font-bold leading-[1.08] xl:text-5xl" style={{ fontFamily: 'Iowan Old Style, Palatino, Georgia, serif' }}>
          Education that inspires — not pressurises.
        </h1>
        <p className="mt-5 text-emerald-100/85">
          One secure portal for the whole Wellspire community — where families, teachers and leaders stay connected to every child's journey.
        </p>

        <div className="mt-9 grid grid-cols-3 gap-3">
          {PILLARS.map(({ icon: Icon, k, v }) => (
            <div key={k} className="rounded-2xl bg-white/5 p-4 ring-1 ring-white/10">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-300/15 text-amber-200"><Icon className="h-4 w-4" /></span>
              <p className="mt-3 font-semibold">{k}</p>
              <p className="text-[11px] text-emerald-200/70">{v}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-xs text-emerald-200/75">
        {TRUST.map(({ icon: Icon, t }) => (
          <span key={t} className="flex items-center gap-1.5"><Icon className="h-4 w-4" /> {t}</span>
        ))}
      </div>
    </div>
  );
}

function Crest() {
  return (
    <div className="relative grid h-11 w-11 place-items-center rounded-2xl text-lg font-bold shadow-lg"
      style={{ background: 'linear-gradient(150deg,#2c9e5f,#12422b)', fontFamily: 'Iowan Old Style, Georgia, serif' }}>
      W<span className="absolute inset-[3px] rounded-xl" style={{ border: '1px solid rgba(217,169,47,.55)' }} />
    </div>
  );
}

function BrandMark() {
  return (
    <div className="mb-7 flex items-center gap-3 lg:hidden">
      <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-800 font-bold text-white">W</div>
      <div className="leading-tight">
        <p className="font-bold text-slate-900">Wellspire International</p>
        <p className="text-[11px] text-slate-400">Inspiring Lifelong Learning</p>
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
      <BrandMark />
      <div className="mb-2 inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-700">
        <Sparkles className="h-3 w-3" /> Live demo — pick a role to enter
      </div>
      <h2 className="font-serif text-2xl font-bold text-slate-900">Welcome to the portal</h2>
      <p className="mt-1 text-sm text-slate-500">Each role sees a tailored experience. Connect Supabase to enable real logins.</p>

      <div className="mt-6 grid grid-cols-2 gap-3">
        {DEMO_ROLES.map(({ key, label, desc, icon: Icon }) => (
          <button key={key} onClick={() => go(key)} disabled={!!busy}
            className="group flex flex-col items-start gap-2 rounded-2xl border border-slate-200 bg-white p-4 text-left transition hover:border-brand-400 hover:shadow-soft disabled:opacity-60">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-50 text-brand-700 transition group-hover:bg-brand-600 group-hover:text-white">
              {busy === key ? <Loader2 className="h-4 w-4 animate-spin" /> : <Icon className="h-4 w-4" />}
            </span>
            <span>
              <span className="block text-sm font-semibold text-slate-800">{label}</span>
              <span className="block text-xs text-slate-400">{desc}</span>
            </span>
          </button>
        ))}
      </div>
      <p className="mt-6 text-center text-xs text-slate-400">Sample data only · no real student information</p>
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
      <BrandMark />
      <h2 className="font-serif text-2xl font-bold text-slate-900">{tab === 'signin' ? 'Welcome back' : 'Create your account'}</h2>
      <p className="mt-1 text-sm text-slate-500">{tab === 'signin' ? 'Sign in to the Wellspire portal.' : 'The first account becomes the administrator.'}</p>

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
          <div><label className="label">Full name</label>
            <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Principal" required /></div>
        )}
        <div><label className="label">Email</label>
          <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@wellspireinternational.com" required /></div>
        <div><label className="label">Password</label>
          <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" required minLength={6} /></div>
        {(localErr || error) && <p className="rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700">{localErr || error}</p>}
        {notice && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{notice}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <>{tab === 'signin' ? 'Sign in' : 'Create account'} <ArrowRight className="h-4 w-4" /></>}
        </button>
      </form>
    </div>
  );
}
