import React, { useState } from 'react';
import { Building2, Plus, Users, GraduationCap, Bus, TrendingUp, ExternalLink, Globe } from 'lucide-react';
import api from '../lib/api.js';
import { num } from '../lib/format.js';
import { Card, PageHeader, Spinner, ErrorNote, Badge, Modal, Field, Input, Select, useAsync } from '../components/ui.jsx';

const BOARD = { state: 'sky', cbse: 'brand', icse: 'violet', ib: 'emerald', cambridge: 'gold', other: 'slate' };

export default function SuperAdmin() {
  const [open, setOpen] = useState(false);
  const { loading, data, error, reload } = useAsync(() => api.get('/platform/overview'), []);

  if (loading) return <Spinner label="Loading platform…" />;
  if (error) return <ErrorNote error={error} />;
  const t = data.totals;

  return (
    <div>
      <PageHeader title="Platform · Schools" subtitle="Manage every school on the Wellspire platform."
        actions={<button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add school</button>} />

      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-5">
        <Stat icon={Building2} label="Schools" value={num(t.schools)} tint="bg-brand-100 text-brand-700" />
        <Stat icon={GraduationCap} label="Students" value={num(t.students)} tint="bg-sky-100 text-sky-700" />
        <Stat icon={Users} label="Staff" value={num(t.staff)} tint="bg-violet-100 text-violet-700" />
        <Stat icon={Bus} label="Vehicles" value={num(t.vehicles)} tint="bg-amber-100 text-amber-700" />
        <Stat icon={TrendingUp} label="Open leads" value={num(t.open_leads)} tint="bg-emerald-100 text-emerald-700" />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
        {data.schools.map((s) => (
          <Card key={s.id} className="p-5">
            <div className="flex items-start gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-xl text-white" style={{ background: s.brand_color || '#233F88' }}><Building2 className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-slate-900">{s.name}</p>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  <Badge color={BOARD[s.board_type] || 'slate'}>{(s.board_type || '').toUpperCase()}</Badge>
                  <Badge color="slate">{s.plan}</Badge>
                  <Badge color={s.is_active ? 'emerald' : 'rose'}>{s.is_active ? 'Active' : 'Suspended'}</Badge>
                </div>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2">
              <a className="btn-outline flex-1 !py-1.5 !text-xs" href="/website" target="_blank" rel="noreferrer"><Globe className="h-3.5 w-3.5" /> Website</a>
              <span className="text-xs text-slate-400">{s.website_enabled ? 'Live' : 'Off'}</span>
            </div>
          </Card>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400">
        Each school is fully isolated by <code>school_id</code>. New schools get their own students, staff, transport, hostel, fees, website and AI agents — one deployment, many schools.
      </p>

      <AddSchool open={open} onClose={() => setOpen(false)} onSaved={reload} />
    </div>
  );
}

function Stat({ icon: Icon, label, value, tint }) {
  return (
    <Card className="p-4">
      <div className={`mb-2 grid h-9 w-9 place-items-center rounded-lg ${tint}`}><Icon className="h-4 w-4" /></div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-500">{label}</p>
    </Card>
  );
}

function AddSchool({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ board_type: 'cbse', plan: 'standard', brand_color: '#233F88' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit() {
    setSaving(true); setErr(null);
    try { await api.post('/schools', { ...form, code: (form.name || 'SCHOOL').toUpperCase().replace(/[^A-Z]/g, '').slice(0, 10) || 'SCHOOL', is_active: true, website_enabled: true }); onSaved?.(); onClose(); setForm({ board_type: 'cbse', plan: 'standard', brand_color: '#233F88' }); }
    catch (e) { setErr(e); } finally { setSaving(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add a school to the platform" wide
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={saving || !form.name}>{saving ? 'Creating…' : 'Create school'}</button></>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="School name *"><Input value={form.name || ''} onChange={set('name')} placeholder="e.g. Sunrise Academy" /></Field>
        <Field label="Board">
          <Select value={form.board_type} onChange={set('board_type')}>{['state', 'cbse', 'icse', 'ib', 'cambridge', 'other'].map((b) => <option key={b} value={b}>{b.toUpperCase()}</option>)}</Select>
        </Field>
        <Field label="Plan"><Select value={form.plan} onChange={set('plan')}>{['standard', 'pro', 'enterprise'].map((p) => <option key={p} value={p}>{p}</option>)}</Select></Field>
        <Field label="Brand colour"><Input type="text" value={form.brand_color} onChange={set('brand_color')} placeholder="#233F88" /></Field>
        <Field label="City"><Input value={form.address || ''} onChange={set('address')} placeholder="City" /></Field>
        <Field label="Email"><Input value={form.email || ''} onChange={set('email')} /></Field>
      </div>
    </Modal>
  );
}
