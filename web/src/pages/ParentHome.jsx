import React, { useEffect, useMemo, useState } from 'react';
import {
  Wallet, CalendarDays, ClipboardCheck, BookOpen, Bell, CheckCircle2, Clock,
  ChevronRight, Loader2, GraduationCap,
} from 'lucide-react';
import api from '../lib/api.js';
import { inr, dateFmt, initials, colorFor, DAYS } from '../lib/format.js';
import { Card, Spinner, ErrorNote, Badge, EmptyState, useAsync } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';

const isoToday = ((new Date().getDay() + 6) % 7) + 1; // 1=Mon..7=Sun
const SUBJECT_ICON = { Mathematics: '➗', English: '📖', Science: '🔬', 'Social Studies': '🌍', 'Computer Science': '💻', 'Physical Education': '⚽' };

export default function ParentHome() {
  const { profile } = useAuth();
  const children = useAsync(() => api.get('/students'), []);
  const [childId, setChildId] = useState(null);

  useEffect(() => {
    if (!childId && children.data?.data?.length) setChildId(children.data.data[0].id);
  }, [children.data, childId]);

  if (children.loading) return <Spinner label="Loading your children…" />;
  if (children.error) return <ErrorNote error={children.error} />;
  const kids = children.data?.data || [];
  if (!kids.length) return <Card><EmptyState title="No students linked yet" hint="Ask the school office to link your ward to your account." icon={GraduationCap} /></Card>;

  return (
    <div className="space-y-5">
      {kids.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {kids.map((k) => (
            <button key={k.id} onClick={() => setChildId(k.id)}
              className={`flex items-center gap-2.5 rounded-full border px-3 py-1.5 pl-1.5 transition ${childId === k.id ? 'border-brand-500 bg-brand-50' : 'border-slate-200 bg-white hover:border-brand-300'}`}>
              <span className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" style={{ background: colorFor(k.full_name) }}>{initials(k.full_name)}</span>
              <span className="pr-1 text-left leading-tight">
                <span className="block text-sm font-semibold text-slate-800">{k.full_name.split(' ')[0]}</span>
                <span className="block text-[11px] text-slate-400">{k.class_name || '—'}</span>
              </span>
            </button>
          ))}
        </div>
      )}
      {childId && <ChildDashboard childId={childId} parentName={profile?.full_name} />}
    </div>
  );
}

function ChildDashboard({ childId, parentName }) {
  const { loading, data, error } = useAsync(() => api.get(`/students/${childId}`), [childId]);
  const child = data?.data;
  const tt = useAsync(() => (child?.class_id ? api.get('/timetable', { class_id: child.class_id }) : Promise.resolve({ data: [] })), [child?.class_id]);
  const notices = useAsync(() => api.get('/announcements'), []);

  const attn = useMemo(() => {
    const recs = (child?.attendance || []).filter((r) => r.status !== 'holiday');
    const present = recs.filter((r) => r.status === 'present' || r.status === 'late').length;
    const pct = recs.length ? Math.round((present / recs.length) * 100) : 100;
    return { pct, recs: (child?.attendance || []).slice(0, 12) };
  }, [child]);

  const fees = useMemo(() => {
    const invs = child?.invoices || [];
    const outstanding = invs.filter((i) => ['pending', 'partially_paid', 'overdue'].includes(i.status))
      .reduce((s, i) => s + (Number(i.amount) - Number(i.amount_paid || 0)), 0);
    const billed = invs.reduce((s, i) => s + Number(i.amount || 0), 0);
    const paid = invs.reduce((s, i) => s + Number(i.amount_paid || 0), 0);
    const nextDue = invs.filter((i) => i.status !== 'paid').sort((a, b) => new Date(a.due_date) - new Date(b.due_date))[0];
    return { outstanding, billed, paid, pct: billed ? Math.round((paid / billed) * 100) : 100, nextDue };
  }, [child]);

  const today = useMemo(() => {
    const slots = (tt.data?.data || []).filter((s) => s.day_of_week === isoToday).sort((a, b) => a.period - b.period);
    const nowHM = new Date().toTimeString().slice(0, 5);
    const next = slots.find((s) => (s.end_time || '23:59') >= nowHM) || slots[0];
    return { slots, next };
  }, [tt.data]);

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return <ErrorNote error={error} />;
  if (!child) return null;

  const C = 2 * Math.PI * 42;
  const off = C * (1 - attn.pct / 100);
  const activeLoans = (child.loans || []).filter((l) => ['issued', 'overdue'].includes(l.status));

  return (
    <div className="space-y-5">
      {/* Hero child card */}
      <div className="relative overflow-hidden rounded-3xl p-6 text-white shadow-soft"
        style={{ background: 'radial-gradient(120% 140% at 90% 0%, #17653c, #0c3a22 65%)' }}>
        <div className="pointer-events-none absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px,#d9a92f 1px,transparent 0)', backgroundSize: '24px 24px', maskImage: 'radial-gradient(80% 90% at 85% 0,#000,transparent 72%)' }} />
        <div className="relative flex flex-wrap items-center gap-6">
          <div className="relative h-[108px] w-[108px] shrink-0">
            <svg width="108" height="108" viewBox="0 0 108 108">
              <circle cx="54" cy="54" r="42" fill="none" stroke="rgba(255,255,255,.16)" strokeWidth="9" />
              <circle cx="54" cy="54" r="42" fill="none" stroke="#e7c56b" strokeWidth="9" strokeLinecap="round"
                strokeDasharray={C} strokeDashoffset={off} transform="rotate(-90 54 54)" />
            </svg>
            <div className="absolute inset-0 grid place-items-center text-center">
              <div><div className="text-2xl font-bold leading-none">{attn.pct}%</div><div className="text-[10px] text-emerald-200/80">attendance</div></div>
            </div>
          </div>
          <div className="min-w-[200px] flex-1">
            <p className="text-sm text-emerald-200/85">Welcome back{parentName ? `, ${parentName.split(' ')[0]}` : ''} 👋</p>
            <h1 className="mt-0.5 font-serif text-3xl font-bold" style={{ fontFamily: 'Iowan Old Style, Georgia, serif' }}>{child.full_name}</h1>
            <p className="mt-1 text-sm text-emerald-100/80">{child.class_name || '—'} · Roll {child.roll_no || '—'} · Adm {child.admission_no}</p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-[520px]:w-full">
            <MiniStat k="Fees due" v={fees.outstanding > 0 ? inr(fees.outstanding) : 'Cleared ✓'} />
            <MiniStat k="Next class" v={today.next ? today.next.subject_name?.split(' ')[0] : '—'} sub={today.next?.start_time} />
            <MiniStat k="Books out" v={String(activeLoans.length)} />
          </div>
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {/* Fees */}
        <Card className="p-5">
          <CardHead icon={Wallet} tint="amber" title="Fees" />
          {fees.outstanding > 0 ? (
            <>
              <p className="font-serif text-3xl text-slate-900">{inr(fees.outstanding)}</p>
              <p className="text-xs text-slate-400">{fees.nextDue ? `due by ${dateFmt(fees.nextDue.due_date)}` : ''}</p>
            </>
          ) : (
            <><p className="font-serif text-2xl text-emerald-600">All cleared ✓</p><p className="text-xs text-slate-400">No pending dues — thank you!</p></>
          )}
          <div className="mt-3 h-2 w-full overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-amber-500" style={{ width: `${fees.pct}%` }} /></div>
          <div className="mt-2 flex justify-between text-xs text-slate-500"><span>Paid {inr(fees.paid)} of {inr(fees.billed)}</span><span>{fees.pct}%</span></div>
          {fees.outstanding > 0 && <button className="btn-primary mt-4 w-full">Pay {inr(fees.outstanding)}</button>}
        </Card>

        {/* Today's timetable */}
        <Card className="p-5">
          <CardHead icon={CalendarDays} tint="sky" title={`Today · ${DAYS[isoToday] || ''}`} />
          {tt.loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> :
            !today.slots.length ? <p className="text-sm text-slate-400">No classes scheduled today — enjoy the day! 🌤️</p> :
            <div className="space-y-1.5">
              {today.slots.map((s) => {
                const now = today.next && s.id === today.next.id;
                return (
                  <div key={s.id} className={`flex items-center gap-3 rounded-xl p-2 ${now ? 'bg-brand-50' : ''}`}>
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-base">{SUBJECT_ICON[s.subject_name] || '📘'}</span>
                    <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800">{s.subject_name || 'Class'}</p><p className="truncate text-[11px] text-slate-400">{s.teacher_name || '—'}</p></div>
                    {now ? <span className="rounded-full bg-brand-600 px-2 py-0.5 text-[9px] font-bold text-white">NOW</span>
                      : <span className="text-xs font-semibold text-slate-400">{s.start_time}</span>}
                  </div>
                );
              })}
            </div>}
        </Card>

        {/* Attendance */}
        <Card className="p-5">
          <CardHead icon={ClipboardCheck} tint="emerald" title="Attendance" right="last 12 days" />
          {!attn.recs.length ? <p className="text-sm text-slate-400">No records yet this term.</p> :
            <div className="flex flex-wrap gap-1.5">
              {attn.recs.map((r, i) => {
                const m = { present: ['bg-emerald-500', 'P'], absent: ['bg-rose-500', 'A'], late: ['bg-amber-500', 'L'], excused: ['bg-slate-300', 'E'], holiday: ['bg-slate-200 text-slate-500', 'H'] }[r.status] || ['bg-slate-200', '·'];
                return <span key={i} title={`${dateFmt(r.date)} · ${r.status}`} className={`grid h-7 w-7 place-items-center rounded-lg text-[10px] font-bold text-white ${m[0]}`}>{m[1]}</span>;
              })}
            </div>}
          <div className="mt-3 flex justify-between text-xs"><span className="text-slate-500">Present this term</span><span className="font-semibold text-emerald-600">{attn.pct}%</span></div>
        </Card>

        {/* Library */}
        <Card className="p-5">
          <CardHead icon={BookOpen} tint="brand" title="Library" />
          {!activeLoans.length ? <p className="text-sm text-slate-400">No books issued right now.</p> :
            <div className="divide-y divide-slate-50">
              {activeLoans.map((l) => (
                <div key={l.id} className="flex items-center gap-3 py-2">
                  <span className={`h-2 w-2 rounded-full ${l.status === 'overdue' ? 'bg-rose-500' : 'bg-amber-500'}`} />
                  <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium text-slate-800">{l.book_title || 'Book'}</p></div>
                  <Badge color={l.status === 'overdue' ? 'rose' : 'amber'}>{l.status === 'overdue' ? 'Overdue' : `Due ${dateFmt(l.due_date)}`}</Badge>
                </div>
              ))}
            </div>}
        </Card>

        {/* Notices */}
        <Card className="p-5 md:col-span-2">
          <CardHead icon={Bell} tint="brand" title="School notices" />
          {notices.loading ? <Loader2 className="h-4 w-4 animate-spin text-slate-300" /> :
            !(notices.data?.data || []).length ? <p className="text-sm text-slate-400">No notices right now.</p> :
            <div className="divide-y divide-slate-50">
              {(notices.data.data).slice(0, 5).map((n) => (
                <div key={n.id} className="flex items-start gap-3 py-3">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{n.title}{n.pinned && <span className="ml-2 align-middle"><Badge color="gold">Pinned</Badge></span>}</p>
                    {n.body && <p className="mt-0.5 text-xs text-slate-500">{n.body}</p>}
                  </div>
                  <span className="whitespace-nowrap text-[11px] font-medium text-slate-400">{dateFmt(n.published_at)}</span>
                </div>
              ))}
            </div>}
        </Card>
      </div>
    </div>
  );
}

function MiniStat({ k, v, sub }) {
  return (
    <div className="rounded-2xl bg-white/8 p-3 ring-1 ring-white/10" style={{ background: 'rgba(255,255,255,.07)' }}>
      <p className="text-[10px] uppercase tracking-wide text-emerald-200/70">{k}</p>
      <p className="mt-1 text-base font-bold leading-tight">{v} {sub && <span className="text-xs font-semibold text-amber-200">{sub}</span>}</p>
    </div>
  );
}

const TINTS = {
  amber: 'bg-amber-50 text-amber-600', sky: 'bg-sky-50 text-sky-600', emerald: 'bg-emerald-50 text-emerald-600', brand: 'bg-brand-50 text-brand-600',
};
function CardHead({ icon: Icon, tint, title, right }) {
  return (
    <div className="mb-3 flex items-center gap-2.5">
      <span className={`grid h-9 w-9 place-items-center rounded-xl ${TINTS[tint] || TINTS.brand}`}><Icon className="h-4 w-4" /></span>
      <h3 className="font-semibold text-slate-900">{title}</h3>
      {right && <span className="ml-auto text-xs text-slate-400">{right}</span>}
    </div>
  );
}
