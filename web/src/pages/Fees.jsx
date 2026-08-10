import React, { useState } from 'react';
import { Plus, Bell, Loader2, IndianRupee, CheckCircle2 } from 'lucide-react';
import api from '../lib/api.js';
import { inr, dateFmt, statusColor } from '../lib/format.js';
import {
  Card, PageHeader, Table, Spinner, ErrorNote, EmptyState, Badge, Modal, Field, Input, Select, useAsync,
} from '../components/ui.jsx';

export default function Fees() {
  const [statusFilter, setStatusFilter] = useState('');
  const [payFor, setPayFor] = useState(null);
  const [newInvoice, setNewInvoice] = useState(false);
  const [reminderResult, setReminderResult] = useState(null);
  const [running, setRunning] = useState(false);
  const students = useAsync(() => api.get('/students'), []);
  const { loading, data, error, reload } = useAsync(() => api.get('/fees/invoices', { status: statusFilter || undefined }), [statusFilter]);

  async function runReminders() {
    setRunning(true); setReminderResult(null);
    try {
      const r = await api.post('/fees/reminders/run');
      setReminderResult(r);
      reload();
    } catch (e) { setReminderResult({ error: e.message }); } finally { setRunning(false); }
  }

  const totals = (data?.data || []).reduce((acc, i) => {
    acc.billed += Number(i.amount); acc.paid += Number(i.amount_paid || 0); acc.out += i.outstanding; return acc;
  }, { billed: 0, paid: 0, out: 0 });

  return (
    <div>
      <PageHeader title="Fees" subtitle="Invoices, payments and automated reminders."
        actions={
          <div className="flex items-center gap-2">
            <button className="btn-outline" onClick={runReminders} disabled={running}>
              {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Bell className="h-4 w-4" />} Run reminders
            </button>
            <button className="btn-primary" onClick={() => setNewInvoice(true)}><Plus className="h-4 w-4" /> New invoice</button>
          </div>
        } />

      {reminderResult && (
        <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-50 px-4 py-3 text-sm text-emerald-800 ring-1 ring-inset ring-emerald-600/20">
          <CheckCircle2 className="h-4 w-4" />
          {reminderResult.error ? `Error: ${reminderResult.error}` : `Sent ${reminderResult.count} fee reminder(s) to guardians.`}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryTile label="Billed" value={inr(totals.billed)} tint="text-slate-700" />
        <SummaryTile label="Collected" value={inr(totals.paid)} tint="text-emerald-600" />
        <SummaryTile label="Outstanding" value={inr(totals.out)} tint="text-amber-600" />
      </div>

      <Card className="mb-4 p-3">
        <div className="flex flex-wrap gap-2">
          {['', 'pending', 'partially_paid', 'overdue', 'paid'].map((st) => (
            <button key={st || 'all'} onClick={() => setStatusFilter(st)}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize ${statusFilter === st ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
              {st ? st.replace('_', ' ') : 'All'}
            </button>
          ))}
        </div>
      </Card>

      <Card>
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : (
          <Table head={['Invoice', 'Student', 'Amount', 'Paid', 'Outstanding', 'Due', 'Status', '']}
                 empty={!data.data.length && <EmptyState title="No invoices" icon={IndianRupee} />}>
            {data.data.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/60">
                <td className="td font-mono text-xs">{i.invoice_no}</td>
                <td className="td font-medium text-slate-800">{i.student_name || '—'}</td>
                <td className="td">{inr(i.amount)}</td>
                <td className="td text-emerald-600">{inr(i.amount_paid)}</td>
                <td className="td font-semibold">{inr(i.outstanding)}</td>
                <td className="td">{dateFmt(i.due_date)}</td>
                <td className="td"><Badge color={statusColor(i.status)}>{i.status.replace('_', ' ')}</Badge></td>
                <td className="td text-right">
                  {i.outstanding > 0 && <button className="btn-outline !py-1 !text-xs" onClick={() => setPayFor(i)}>Record payment</button>}
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <RecordPayment invoice={payFor} onClose={() => setPayFor(null)} onSaved={reload} />
      <NewInvoice open={newInvoice} onClose={() => setNewInvoice(false)} onSaved={reload} students={students.data?.data || []} />
    </div>
  );
}

function SummaryTile({ label, value, tint }) {
  return (
    <Card className="p-4">
      <p className="text-sm text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${tint}`}>{value}</p>
    </Card>
  );
}

function RecordPayment({ invoice, onClose, onSaved }) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('upi');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  React.useEffect(() => { if (invoice) setAmount(String(invoice.outstanding)); }, [invoice]);

  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/fees/payments', { invoice_id: invoice.id, amount: Number(amount), method });
      onSaved?.(); onClose();
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }

  return (
    <Modal open={!!invoice} onClose={onClose} title={`Record payment · ${invoice?.invoice_no || ''}`}
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !amount}>{saving ? 'Saving…' : 'Record'}</button>
      </>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      {invoice && (
        <div className="space-y-4">
          <div className="rounded-xl bg-slate-50 p-3 text-sm">
            <div className="flex justify-between"><span className="text-slate-500">Student</span><span className="font-medium">{invoice.student_name}</span></div>
            <div className="flex justify-between"><span className="text-slate-500">Outstanding</span><span className="font-semibold text-amber-600">{inr(invoice.outstanding)}</span></div>
          </div>
          <Field label="Amount"><Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field label="Method">
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {['upi', 'cash', 'card', 'bank_transfer', 'cheque', 'online', 'scholarship'].map((m) => <option key={m} value={m}>{m.replace('_', ' ')}</option>)}
            </Select>
          </Field>
        </div>
      )}
    </Modal>
  );
}

function NewInvoice({ open, onClose, onSaved, students }) {
  const [form, setForm] = useState({ title: 'Term Fee' });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/fees/invoices', {
        student_id: form.student_id, title: form.title, amount: Number(form.amount),
        due_date: form.due_date,
      });
      onSaved?.(); onClose(); setForm({ title: 'Term Fee' });
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }

  return (
    <Modal open={open} onClose={onClose} title="New invoice"
      footer={<>
        <button className="btn-outline" onClick={onClose}>Cancel</button>
        <button className="btn-primary" onClick={submit} disabled={saving || !form.student_id || !form.amount || !form.due_date}>{saving ? 'Saving…' : 'Create'}</button>
      </>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="space-y-4">
        <Field label="Student">
          <Select value={form.student_id || ''} onChange={set('student_id')}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name} ({s.class_name || 'no class'})</option>)}
          </Select>
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Title"><Input value={form.title || ''} onChange={set('title')} /></Field>
          <Field label="Amount (₹)"><Input type="number" value={form.amount || ''} onChange={set('amount')} /></Field>
        </div>
        <Field label="Due date"><Input type="date" value={form.due_date || ''} onChange={set('due_date')} /></Field>
      </div>
    </Modal>
  );
}
