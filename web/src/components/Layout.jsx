import React, { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, GraduationCap, School, CalendarDays, ClipboardCheck,
  Wallet, BookOpen, Boxes, Bot, Zap, Settings, Menu, X, Bell, ChevronDown,
  LogOut, Search, Repeat,
} from 'lucide-react';
import { Badge } from './ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import { initials, colorFor } from '../lib/format.js';
import api from '../lib/api.js';

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'principal', 'teacher', 'accountant', 'librarian', 'parent'] },
  { to: '/students', label: 'Students', icon: Users, roles: ['admin', 'principal', 'teacher'] },
  { to: '/teachers', label: 'Teachers', icon: GraduationCap, roles: ['admin', 'principal'] },
  { to: '/classes', label: 'Classes', icon: School, roles: ['admin', 'principal', 'teacher'] },
  { to: '/timetable', label: 'Timetable', icon: CalendarDays, roles: ['admin', 'principal', 'teacher', 'parent'] },
  { to: '/attendance', label: 'Attendance', icon: ClipboardCheck, roles: ['admin', 'principal', 'teacher'] },
  { to: '/fees', label: 'Fees', icon: Wallet, roles: ['admin', 'principal', 'accountant', 'parent'] },
  { to: '/library', label: 'Library', icon: BookOpen, roles: ['admin', 'principal', 'librarian', 'teacher'] },
  { to: '/inventory', label: 'Inventory', icon: Boxes, roles: ['admin', 'principal'] },
  { to: '/automations', label: 'Automations', icon: Zap, roles: ['admin', 'principal'] },
  { to: '/assistant', label: 'AI Copilot', icon: Bot, roles: ['admin', 'principal', 'teacher', 'accountant'] },
  { to: '/settings', label: 'Settings', icon: Settings, roles: ['admin', 'principal'] },
];

const ROLES = ['admin', 'principal', 'teacher', 'accountant', 'librarian', 'parent'];

export default function Layout({ children, mode }) {
  const [open, setOpen] = useState(false);
  const { role, profile, setRole, signOut } = useAuth();
  const location = useLocation();
  const items = NAV.filter((n) => n.roles.includes(role));
  const current = NAV.find((n) => n.to === location.pathname);

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
            <NavLink key={to} to={to} end={to === '/'} onClick={() => setOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive ? 'bg-brand-600 text-white shadow-soft' : 'hover:bg-slate-800 hover:text-white'}`}>
              <Icon className="h-[18px] w-[18px]" /> {label}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 w-full border-t border-slate-800 p-4 text-[11px] text-slate-500">
          {mode === 'demo' ? '● Demo data · connect Supabase' : '● Live · Supabase'}
        </div>
      </aside>

      {open && <div className="fixed inset-0 z-30 bg-slate-900/40 lg:hidden" onClick={() => setOpen(false)} />}

      {/* Main */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-slate-200 bg-white/80 px-4 backdrop-blur lg:px-8">
          <button className="lg:hidden" onClick={() => setOpen(true)}><Menu className="h-5 w-5 text-slate-600" /></button>
          <div className="hidden text-sm font-semibold text-slate-700 sm:block">{current?.label || 'Wellspire'}</div>

          <div className="ml-auto flex items-center gap-2">
            {mode === 'demo' && <Badge color="amber" className="hidden sm:inline-flex">Demo mode</Badge>}
            <NotificationBell />
            {mode === 'demo' && <RoleSwitcher role={role} setRole={setRole} />}
            <UserMenu profile={profile} role={role} signOut={signOut} />
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}

function NotificationBell() {
  const [unread, setUnread] = useState(0);
  useEffect(() => {
    let alive = true;
    api.get('/notifications', { limit: 20 }).then((r) => alive && setUnread(r.unread || 0)).catch(() => {});
    return () => { alive = false; };
  }, []);
  return (
    <button className="relative rounded-full p-2 hover:bg-slate-100">
      <Bell className="h-5 w-5 text-slate-500" />
      {unread > 0 && <span className="absolute right-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">{unread}</span>}
    </button>
  );
}

function RoleSwitcher({ role, setRole }) {
  return (
    <div className="hidden items-center gap-1.5 rounded-xl border border-slate-200 bg-white pl-2 pr-1 sm:flex" title="Preview any role (demo)">
      <Repeat className="h-3.5 w-3.5 text-slate-400" />
      <select value={role} onChange={(e) => setRole(e.target.value)}
        className="cursor-pointer appearance-none bg-transparent py-2 pr-5 text-sm font-medium capitalize text-slate-700 focus:outline-none">
        {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
      </select>
      <ChevronDown className="pointer-events-none -ml-5 h-4 w-4 text-slate-400" />
    </div>
  );
}

function UserMenu({ profile, role, signOut }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const onClick = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);
  const name = profile?.full_name || 'User';
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-2 rounded-xl p-1 pr-2 hover:bg-slate-100">
        <div className="grid h-8 w-8 place-items-center rounded-full text-xs font-bold text-white" style={{ background: colorFor(name) }}>{initials(name)}</div>
        <div className="hidden text-left leading-tight sm:block">
          <p className="text-sm font-semibold text-slate-800">{name}</p>
          <p className="text-[11px] capitalize text-slate-400">{role}</p>
        </div>
        <ChevronDown className="h-4 w-4 text-slate-400" />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-xl animate-fade-in">
          <div className="border-b border-slate-100 px-4 py-3">
            <p className="text-sm font-semibold text-slate-800">{name}</p>
            <p className="text-xs text-slate-400">{profile?.email || 'demo@wellspire.school'}</p>
            <Badge color="brand" className="mt-2 capitalize">{role}</Badge>
          </div>
          <button onClick={signOut} className="flex w-full items-center gap-2 px-4 py-3 text-sm text-slate-600 hover:bg-slate-50">
            <LogOut className="h-4 w-4" /> Sign out
          </button>
        </div>
      )}
    </div>
  );
}
