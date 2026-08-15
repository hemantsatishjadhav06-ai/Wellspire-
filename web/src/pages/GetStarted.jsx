import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  Sparkles, GraduationCap, Building2, Wallet, Users, Server,
  Database, Bot, Mail, CloudUpload, ArrowRight, Rocket,
} from 'lucide-react';
import { Card, PageHeader, Badge } from '../components/ui.jsx';

// The whole platform, grouped the way the sidebar is — each area links straight
// to the modules that live under it.
const AREAS = [
  {
    key: 'academics',
    icon: GraduationCap,
    title: 'Academics',
    desc: 'The classroom, end to end.',
    links: [
      { to: '/students', label: 'Students' },
      { to: '/teachers', label: 'Teachers' },
      { to: '/classes', label: 'Classes' },
      { to: '/timetable', label: 'Timetable' },
      { to: '/attendance', label: 'Attendance' },
    ],
  },
  {
    key: 'operations',
    icon: Building2,
    title: 'Operations',
    desc: 'Everything that keeps campus running.',
    links: [
      { to: '/transport', label: 'Transport' },
      { to: '/hostel', label: 'Hostel' },
      { to: '/labs', label: 'Labs' },
      { to: '/infirmary', label: 'Infirmary' },
      { to: '/library', label: 'Library' },
      { to: '/inventory', label: 'Inventory' },
      { to: '/facilities', label: 'Facilities' },
      { to: '/appointments', label: 'Appointments' },
    ],
  },
  {
    key: 'finance',
    icon: Wallet,
    title: 'Finance & Growth',
    desc: 'Fees in, admissions up.',
    links: [
      { to: '/fees', label: 'Fees' },
      { to: '/leads', label: 'Admissions CRM' },
      { to: '/marketing', label: 'Marketing' },
    ],
  },
  {
    key: 'people',
    icon: Users,
    title: 'People',
    desc: 'Your staff and their time.',
    links: [
      { to: '/hr', label: 'HR' },
      { to: '/leave', label: 'Leave' },
    ],
  },
  {
    key: 'intelligence',
    icon: Sparkles,
    title: 'Intelligence',
    desc: 'AI that does the busywork.',
    links: [
      { to: '/assistant', label: 'AI copilot' },
      { to: '/agents', label: 'AI agents' },
      { to: '/automations', label: 'Automations' },
    ],
  },
  {
    key: 'platform',
    icon: Server,
    title: 'Platform',
    desc: 'Run one school or a hundred.',
    links: [
      { to: '/platform', label: 'Schools' },
      { to: '/data', label: 'Data & Excel' },
      { to: '/settings', label: 'Settings' },
    ],
  },
];

// The four integrations that turn the demo into a production deployment.
const CHECKLIST = [
  {
    icon: Database,
    name: 'Supabase',
    tint: 'bg-emerald-50 text-emerald-700',
    tag: 'Persistent data',
    how: 'Set SUPABASE_URL and SUPABASE_SERVICE_KEY to move off demo data onto your own Postgres.',
  },
  {
    icon: Bot,
    name: 'OpenRouter',
    tint: 'bg-brand-50 text-brand-700',
    tag: 'AI',
    how: 'Add OPENROUTER_API_KEY to switch the copilot and agents from preview to live.',
  },
  {
    icon: Mail,
    name: 'SMTP',
    tint: 'bg-sky-50 text-sky-700',
    tag: 'Email',
    how: 'Configure SMTP_HOST, SMTP_USER and SMTP_PASS to send real notices and receipts.',
  },
  {
    icon: CloudUpload,
    name: 'Google Drive',
    tint: 'bg-amber-50 text-amber-700',
    tag: 'Excel sync',
    how: 'Connect a Drive service account to push formatted Excel exports of every module.',
  },
];

export default function GetStarted() {
  return (
    <div>
      <PageHeader title="Get started" subtitle="A quick tour of Wellspire School OS and how to take it live." />

      {/* Brand hero band */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-20 right-24 h-48 w-48 rounded-full bg-white/5" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Sparkles className="h-3.5 w-3.5" /> School OS
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight">Welcome to Wellspire School OS</h2>
          <p className="mt-2 text-brand-50/90">
            One place to run academics, operations, finance and people — with an AI copilot woven through every module.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <NavLink to="/" className="btn bg-white text-brand-700 hover:bg-brand-50">
              <Rocket className="h-4 w-4" /> Open dashboard
            </NavLink>
            <NavLink to="/agents" className="btn bg-white/15 text-white hover:bg-white/25">
              Meet the AI agents <ArrowRight className="h-4 w-4" />
            </NavLink>
          </div>
        </div>
      </div>

      {/* Everything in one place */}
      <div className="mb-3 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">Everything in one place</h2>
          <p className="text-sm text-slate-500">Six areas, every module a click away.</p>
        </div>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {AREAS.map((area) => {
          const Icon = area.icon;
          return (
            <Card key={area.key} className="p-5">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-brand-50 text-brand-700">
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="font-semibold text-slate-900">{area.title}</h3>
                  <p className="text-xs text-slate-500">{area.desc}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-1.5">
                {area.links.map((l) => (
                  <NavLink
                    key={l.to}
                    to={l.to}
                    className="rounded-lg border border-slate-200 px-2.5 py-1 text-xs font-medium text-slate-600 transition-colors hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
                  >
                    {l.label}
                  </NavLink>
                ))}
              </div>
            </Card>
          );
        })}
      </div>

      {/* Go live checklist */}
      <div className="mt-8">
        <h2 className="text-lg font-semibold text-slate-900">Go live checklist</h2>
        <p className="mb-3 text-sm text-slate-500">
          Wellspire runs on demo data out of the box. Add these four to make it yours — each is optional and independent.
        </p>
        <Card className="divide-y divide-slate-100 p-0">
          {CHECKLIST.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.name} className="flex items-start gap-4 px-5 py-4">
                <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${item.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-slate-900">{item.name}</p>
                    <Badge color="slate">{item.tag}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{item.how}</p>
                </div>
              </div>
            );
          })}
        </Card>
        <p className="mt-3 text-xs text-slate-400">
          Manage every connection from <NavLink to="/settings" className="font-semibold text-brand-600 hover:text-brand-700">Settings</NavLink>.
        </p>
      </div>
    </div>
  );
}
