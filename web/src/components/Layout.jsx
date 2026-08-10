import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, School, CalendarDays, ClipboardCheck,
  Wallet, BookOpen, Boxes, Bot, Zap, Settings, Menu, X, Bell, ChevronDown,
} from 'lucide-react';
import { Badge } from './ui.jsx';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'principal', 'teacher', 'accountant', 'librarian'] },
  { to: '/students', label: 'Students', icon: Users, roles: ['admin', 'principal', 'teacher'] },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap, roles: ['admin', 'principal'] },
  { to: '/classes', label: 'Classes', icon: School, roles: ['admin', 'principal', 'teacher'] },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays, roles: ['admin', 'principal', 'teacher'] },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'principal', 'teacher'] },
  { to: '/fees', label: 'Fees', icon: Wallet, roles: ['admin', 'principal', 'accountant', 'parent'] },
  { to: '/library', label: 'Library', icon: BookOpen, roles: ['admin', 'principal', 'librarian', 'teacher'] },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'principal'] },
  { to: '/automations', label: 'Automations', icon: Zap, roles: ['admin', 'principal'] },
  { to: '/assistant', label: 'AI Copilot', icon: Bot, roles: ['admin', 'principal', 'teacher', 'accountant'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'principal'] },
];

const ROLES = ['admin', 'principal', 'teacher', 'accountant', 'librarian', 'parent'];

export default function Layout({ children, role, setRole, mode }) {
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const items = NAV.filter((n) => n.roles.includes(role));

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 transform bg-slate-900 text-slate-300 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center gap-2 px-5">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold">W</div>
          <div className="leading-tight">
            <div className="font-bold text-white">Wellspire</div>
            <div className="text-[11px] text-slate-400">School OS</div>
          </div>
          <button className="ml-auto lg:hidden" onClick={() => setOpen(false)}><X className="h-5 w-5" /></button>
        </div>
        <nav className="mt-2 space-y-1 px-3 pb-24">
          {items.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white shadow-soft' : 'hover:bg-slate-800 hover:text-white'
                }`
              }
            >
              <Icon className="h-[18px] w-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4 text-[11px] text-slate-500">
          {mode === 'demo' ? 'Demo data · connect Supabase' : 'Live · Supabase'}
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5 text-slate-600" /></button>
          <div className="text-sm font-medium text-slate-500">
            {NAV.find((n) => n.to === location.pathname)?.label || 'Wellspire'}
          </div>
          <div className="ml-auto flex items-center gap-3">
            {mode === 'demo' && <Badge color="amber">Demo mode</Badge>}
            <button className="relative rounded-full p-2 hover:bg-slate-100">
              <Bell className="h-5 w-5 text-slate-500" />
              <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
            </button>
            {/* Role switcher (demo convenience) */}
            <div className="relative">
              <label className="sr-only">Role</label>
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white pl-2 pr-1">
                <div className="grid h-7 w-7 place-items-center rounded-lg bg-brand-100 text-xs font-bold text-brand-700">
                  {role[0].toUpperCase()}
                </div>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="cursor-pointer appearance-none bg-transparent py-2 pr-5 text-sm font-medium capitalize text-slate-700 focus:outline-none"
                >
                  {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
                <ChevronDown className="pointer-events-none -ml-5 h-4 w-4 text-slate-400" />
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
