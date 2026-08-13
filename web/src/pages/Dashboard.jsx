import React from 'react';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  PieChart, Pie, Cell,
} from 'recharts';
import {
  Users, GraduationCap, Wallet, AlertTriangle, TrendingUp, BookOpen, Boxes, School,
} from 'lucide-react';
import api from '../lib/api.js';
import { inr, num, dateFmt } from '../lib/format.js';
import { Card, Spinner, ErrorNote, Badge, useAsync, EmptyState } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';

const STAT_ICONS = { students: Users, teachers: GraduationCap, fees: Wallet, classes: School };

function StatCard({ icon: Icon, label, value, tint, sub }) {
  return (
    <Card className="p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-2 text-3xl font-bold text-slate-900">{value}</p>
          {sub && <p className="mt-1 text-xs text-slate-400">{sub}</p>}
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl ${tint}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function Dashboard() {
  const { profile } = useAuth();
  const { loading, data, error } = useAsync(() => api.get('/dashboard'), []);
  const firstName = (profile?.full_name || '').split(' ')[0];

  if (loading) return <Spinner label="Loading dashboard…" />;
  if (error) return <ErrorNote error={error} />;

  const s = data.stats;
  const collectionData = [
    { name: 'Wk 1', collected: Math.round(s.collected_fees * 0.15), billed: Math.round(s.billed_fees * 0.2) },
    { name: 'Wk 2', collected: Math.round(s.collected_fees * 0.4), billed: Math.round(s.billed_fees * 0.45) },
    { name: 'Wk 3', collected: Math.round(s.collected_fees * 0.7), billed: Math.round(s.billed_fees * 0.75) },
    { name: 'Wk 4', collected: s.collected_fees, billed: s.billed_fees },
  ];
  const donut = [
    { name: 'Collected', value: s.collected_fees, color: '#22c55e' },
    { name: 'Outstanding', value: s.outstanding_fees, color: '#f59e0b' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Good day{firstName ? `, ${firstName}` : ''} 👋</h1>
        <p className="text-sm text-slate-500 mt-1">Here's what's happening at Wellspire International School today.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard icon={Users} label="Active students" value={num(s.active_students)} tint="bg-brand-100 text-brand-700" sub={`${s.classes} classes`} />
        <StatCard icon={GraduationCap} label="Teachers" value={num(s.active_teachers)} tint="bg-sky-100 text-sky-700" sub={`${s.guardians} guardians`} />
        <StatCard icon={Wallet} label="Outstanding fees" value={inr(s.outstanding_fees)} tint="bg-amber-100 text-amber-700" sub={`${s.overdue_invoices} overdue invoices`} />
        <StatCard icon={TrendingUp} label="Collection rate" value={`${s.collection_rate}%`} tint="bg-emerald-100 text-emerald-700" sub={`${inr(s.collected_fees)} collected`} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">Fee collection trend</h3>
            <Badge color="emerald">{s.collection_rate}% collected</Badge>
          </div>
          <ResponsiveContainer width="100%" height={260}>
            <AreaChart data={collectionData} margin={{ left: -12, right: 8, top: 8 }}>
              <defs>
                <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1c7f49" stopOpacity={0.35} />
                  <stop offset="95%" stopColor="#1c7f49" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eef2f7" />
              <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `₹${Math.round(v / 1000)}k`} />
              <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
              <Area type="monotone" dataKey="billed" stroke="#cbd5e1" fill="none" strokeWidth={2} strokeDasharray="4 4" name="Billed" />
              <Area type="monotone" dataKey="collected" stroke="#1c7f49" fill="url(#g1)" strokeWidth={2.5} name="Collected" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <h3 className="mb-4 font-semibold text-slate-900">Fees breakdown</h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie data={donut} dataKey="value" innerRadius={55} outerRadius={80} paddingAngle={3} stroke="none">
                {donut.map((d) => <Cell key={d.name} fill={d.color} />)}
              </Pie>
              <Tooltip formatter={(v) => inr(v)} contentStyle={{ borderRadius: 12, border: '1px solid #e2e8f0', fontSize: 13 }} />
            </PieChart>
          </ResponsiveContainer>
          <div className="mt-2 space-y-2">
            {donut.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-2 text-slate-600">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ background: d.color }} /> {d.name}
                </span>
                <span className="font-semibold text-slate-800">{inr(d.value)}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Alerts */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <AlertList
          title="Overdue fees"
          icon={Wallet}
          tint="text-rose-600"
          items={data.alerts.overdue_fees}
          render={(i) => (
            <>
              <div>
                <p className="font-medium text-slate-800">{i.student}</p>
                <p className="text-xs text-slate-400">{i.invoice_no} · due {dateFmt(i.due_date)}</p>
              </div>
              <Badge color="rose">{inr(i.outstanding)}</Badge>
            </>
          )}
        />
        <AlertList
          title="Low stock"
          icon={Boxes}
          tint="text-amber-600"
          items={data.alerts.low_stock}
          render={(i) => (
            <>
              <div>
                <p className="font-medium text-slate-800">{i.name}</p>
                <p className="text-xs text-slate-400">reorder at {i.reorder_level} {i.unit}</p>
              </div>
              <Badge color="amber">{num(i.quantity)} {i.unit}</Badge>
            </>
          )}
        />
        <AlertList
          title="Overdue books"
          icon={BookOpen}
          tint="text-sky-600"
          items={data.alerts.overdue_loans}
          render={(i) => (
            <>
              <div>
                <p className="font-medium text-slate-800">{i.borrower || 'Borrower'}</p>
                <p className="text-xs text-slate-400">due {dateFmt(i.due_date)}</p>
              </div>
              <Badge color="sky">Overdue</Badge>
            </>
          )}
        />
      </div>
    </div>
  );
}

function AlertList({ title, icon: Icon, tint, items, render }) {
  return (
    <Card className="p-5">
      <div className="mb-3 flex items-center gap-2">
        <Icon className={`h-4 w-4 ${tint}`} />
        <h3 className="font-semibold text-slate-900">{title}</h3>
        <span className="ml-auto text-xs text-slate-400">{items?.length || 0}</span>
      </div>
      {!items?.length ? (
        <EmptyState title="All clear" hint="Nothing needs attention here." icon={AlertTriangle} />
      ) : (
        <ul className="space-y-2">
          {items.map((i, idx) => (
            <li key={idx} className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-3 py-2.5">
              {render(i)}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
