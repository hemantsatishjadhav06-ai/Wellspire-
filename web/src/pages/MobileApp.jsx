import React, { useState } from 'react';
import {
  Smartphone, Download, Share, MoreVertical, Info, CheckCircle2,
  Crown, GraduationCap, Users, BookOpen, Wallet, Library as LibraryIcon,
  Bus, CalendarClock, Store,
} from 'lucide-react';
import { Card, PageHeader, Badge } from '../components/ui.jsx';
import { promptInstall, canInstall } from '../lib/registerPwa.js';

// One card per role, with the features that role actually gets in the app.
const ROLES = [
  {
    icon: Crown,
    title: 'Admin / Principal',
    color: 'brand',
    tint: 'bg-brand-50 text-brand-700',
    features: ['Full dashboards & KPIs', 'Every module, all schools', 'Super-admin controls'],
  },
  {
    icon: GraduationCap,
    title: 'Teacher',
    color: 'sky',
    tint: 'bg-sky-50 text-sky-700',
    features: ['My timetable', 'Mark attendance', 'Enter marks', 'Class students'],
  },
  {
    icon: Users,
    title: 'Parent',
    color: 'violet',
    tint: 'bg-violet-50 text-violet-700',
    features: ['Child dashboard', 'Attendance & fees', 'Timetable', 'Live bus tracking', 'Notices'],
  },
  {
    icon: BookOpen,
    title: 'Student',
    color: 'emerald',
    tint: 'bg-emerald-50 text-emerald-700',
    features: ['Timetable', 'Homework', 'Library'],
  },
  {
    icon: Wallet,
    title: 'Accountant',
    color: 'gold',
    tint: 'bg-yellow-50 text-yellow-700',
    features: ['Fees & collections', 'Invoices', 'Reports'],
  },
  {
    icon: LibraryIcon,
    title: 'Librarian',
    color: 'amber',
    tint: 'bg-amber-50 text-amber-700',
    features: ['Issue & return', 'Catalogue', 'Overdue tracking'],
  },
  {
    icon: Bus,
    title: 'Transport',
    color: 'rose',
    tint: 'bg-rose-50 text-rose-700',
    features: ['Live GPS', 'Routes & stops', 'Trip status'],
  },
  {
    icon: CalendarClock,
    title: 'Front desk',
    color: 'slate',
    tint: 'bg-slate-100 text-slate-600',
    features: ['Appointments', 'Enquiries', 'Visitor log'],
  },
];

export default function MobileApp() {
  // Show manual steps immediately when no native prompt is available (e.g. iOS),
  // and reveal them if the prompt turns out to be unusable on click.
  const [manual, setManual] = useState(() => !canInstall());
  const [status, setStatus] = useState(null);

  async function install() {
    const outcome = await promptInstall();
    if (outcome === 'accepted') {
      setStatus({ ok: true, text: 'Nice — installing Wellspire to your home screen.' });
    } else if (outcome === 'dismissed') {
      setStatus({ ok: false, text: 'Install dismissed. You can tap Install app again anytime.' });
    } else {
      setStatus(null);
      setManual(true);
    }
  }

  return (
    <div>
      <PageHeader title="Get the app" subtitle="Install Wellspire on any phone — no store required." />

      {/* Hero */}
      <div className="relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 p-8 text-white shadow-soft">
        <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10" />
        <div className="pointer-events-none absolute -bottom-24 right-28 h-52 w-52 rounded-full bg-white/5" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide">
            <Smartphone className="h-3.5 w-3.5" /> Progressive Web App
          </span>
          <h2 className="mt-4 text-3xl font-bold leading-tight">Wellspire in your pocket</h2>
          <p className="mt-2 text-brand-50/90">
            Install the app on any phone — same features as the web portal.
          </p>
          <div className="mt-6">
            <button onClick={install} className="btn bg-white text-brand-700 hover:bg-brand-50">
              <Download className="h-4 w-4" /> Install app
            </button>
          </div>
        </div>
      </div>

      {status && (
        <div
          className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${
            status.ok
              ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20'
              : 'bg-amber-50 text-amber-800 ring-amber-600/20'
          }`}
        >
          {status.ok ? <CheckCircle2 className="h-4 w-4" /> : <Info className="h-4 w-4" />} {status.text}
        </div>
      )}

      {manual && (
        <Card className="mb-8 p-5">
          <div className="mb-3 flex items-center gap-2">
            <Info className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold text-slate-900">Add it to your home screen</h3>
          </div>
          <p className="mb-4 text-sm text-slate-500">
            Your browser will not show an automatic prompt here, so add it manually — it takes a few seconds.
          </p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <Share className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold">iPhone & iPad (Safari)</span>
              </div>
              <p className="text-sm text-slate-500">
                Tap <span className="font-medium text-slate-700">Share</span> &rarr;{' '}
                <span className="font-medium text-slate-700">Add to Home Screen</span>.
              </p>
            </div>
            <div className="rounded-xl border border-slate-200 p-4">
              <div className="mb-2 flex items-center gap-2 text-slate-800">
                <MoreVertical className="h-4 w-4 text-brand-600" />
                <span className="text-sm font-semibold">Android (Chrome)</span>
              </div>
              <p className="text-sm text-slate-500">
                Tap the <span className="font-medium text-slate-700">menu</span> &rarr;{' '}
                <span className="font-medium text-slate-700">Install app</span>.
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Built for every role */}
      <div className="mb-3">
        <h2 className="text-lg font-semibold text-slate-900">Built for every role</h2>
        <p className="text-sm text-slate-500">One install, a tailored home screen for whoever signs in.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ROLES.map((role) => {
          const Icon = role.icon;
          return (
            <Card key={role.title} className="p-5">
              <div className="flex items-center gap-3">
                <span className={`grid h-11 w-11 place-items-center rounded-xl ${role.tint}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <h3 className="font-semibold text-slate-900">{role.title}</h3>
              </div>
              <ul className="mt-4 space-y-1.5">
                {role.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm text-slate-600">
                    <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </Card>
          );
        })}
      </div>

      {/* Coming to the stores */}
      <Card className="mt-8 p-6">
        <div className="flex flex-wrap items-start gap-4">
          <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-brand-100 text-brand-700">
            <Store className="h-6 w-6" />
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-semibold text-slate-900">Coming to Play Store &amp; App Store</h3>
              <Badge color="brand">Installable now</Badge>
              <Badge color="slate">Stores soon</Badge>
            </div>
            <p className="mt-2 text-sm text-slate-500">
              Wellspire is a Progressive Web App today, so you can install it straight from the browser and use it
              offline-friendly, full-screen, just like a native app — no waiting on store reviews.
            </p>
            <p className="mt-2 text-sm text-slate-500">
              We are packaging the same app for the stores next: <span className="font-medium text-slate-700">Android</span>{' '}
              via Bubblewrap / TWA, and <span className="font-medium text-slate-700">iOS</span> via PWABuilder / Capacitor.
              Same codebase, same features — just an extra way to install.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
