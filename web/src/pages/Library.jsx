import React, { useState } from 'react';
import { Plus, BookOpen, Search, ArrowLeftRight } from 'lucide-react';
import api from '../lib/api.js';
import { dateFmt, statusColor } from '../lib/format.js';
import {
  Card, PageHeader, Table, Spinner, ErrorNote, EmptyState, Badge, Modal, Field, Input, Select, useAsync,
} from '../components/ui.jsx';

export default function Library() {
  const [tab, setTab] = useState('books');
  return (
    <div>
      <PageHeader title="Library" subtitle="Catalogue, issue and return management." />
      <div className="mb-4 inline-flex rounded-xl bg-slate-100 p-1">
        {['books', 'loans'].map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`rounded-lg px-4 py-1.5 text-sm font-semibold capitalize ${tab === t ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500'}`}>
            {t}
          </button>
        ))}
      </div>
      {tab === 'books' ? <Books /> : <Loans />}
    </div>
  );
}

function Books() {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const [issueBook, setIssueBook] = useState(null);
  const { loading, data, error, reload } = useAsync(() => api.get('/library/books', { search }), [search]);
  const students = useAsync(() => api.get('/students'), []);

  return (
    <div>
      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search books…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="btn-primary" onClick={() => setOpen(true)}><Plus className="h-4 w-4" /> Add book</button>
      </div>

      <Card>
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : (
          <Table head={['Title', 'Author', 'Category', 'Shelf', 'Available', '']}
                 empty={!data.data.length && <EmptyState title="No books" icon={BookOpen} />}>
            {data.data.map((b) => (
              <tr key={b.id} className="hover:bg-slate-50/60">
                <td className="td font-medium text-slate-800">{b.title}</td>
                <td className="td">{b.author || '—'}</td>
                <td className="td capitalize">{b.category}</td>
                <td className="td">{b.shelf || '—'}</td>
                <td className="td"><Badge color={b.available_copies > 0 ? 'emerald' : 'rose'}>{b.available_copies}/{b.total_copies}</Badge></td>
                <td className="td text-right">
                  <button className="btn-outline !py-1 !text-xs" disabled={b.available_copies <= 0} onClick={() => setIssueBook(b)}>Issue</button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <AddBook open={open} onClose={() => setOpen(false)} onSaved={reload} />
      <IssueBook book={issueBook} onClose={() => setIssueBook(null)} onSaved={reload} students={students.data?.data || []} />
    </div>
  );
}

function Loans() {
  const { loading, data, error, reload } = useAsync(() => api.get('/library/loans'), []);
  async function ret(id) { await api.post(`/library/loans/${id}/return`, {}); reload(); }
  return (
    <Card>
      {loading ? <Spinner /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : (
        <Table head={['Book', 'Borrower', 'Issued', 'Due', 'Status', '']}
               empty={!data.data.length && <EmptyState title="No active loans" icon={ArrowLeftRight} />}>
          {data.data.map((l) => (
            <tr key={l.id} className="hover:bg-slate-50/60">
              <td className="td font-medium text-slate-800">{l.book_title}</td>
              <td className="td">{l.student_name || '—'}</td>
              <td className="td">{dateFmt(l.issued_at)}</td>
              <td className="td">{dateFmt(l.due_date)}</td>
              <td className="td"><Badge color={statusColor(l.status)}>{l.status}</Badge></td>
              <td className="td text-right">
                {['issued', 'overdue'].includes(l.status) && <button className="btn-outline !py-1 !text-xs" onClick={() => ret(l.id)}>Return</button>}
              </td>
            </tr>
          ))}
        </Table>
      )}
    </Card>
  );
}

function AddBook({ open, onClose, onSaved }) {
  const [form, setForm] = useState({ total_copies: 1 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit() {
    setSaving(true); setErr(null);
    try { await api.post('/library/books', { ...form, total_copies: Number(form.total_copies) || 1 }); onSaved?.(); onClose(); setForm({ total_copies: 1 }); }
    catch (e) { setErr(e); } finally { setSaving(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add book"
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={saving || !form.title}>{saving ? 'Saving…' : 'Save'}</button></>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Title *"><Input value={form.title || ''} onChange={set('title')} /></Field>
        <Field label="Author"><Input value={form.author || ''} onChange={set('author')} /></Field>
        <Field label="ISBN"><Input value={form.isbn || ''} onChange={set('isbn')} /></Field>
        <Field label="Category"><Input value={form.category || ''} onChange={set('category')} placeholder="fiction" /></Field>
        <Field label="Shelf"><Input value={form.shelf || ''} onChange={set('shelf')} /></Field>
        <Field label="Copies"><Input type="number" value={form.total_copies} onChange={set('total_copies')} /></Field>
      </div>
    </Modal>
  );
}

function IssueBook({ book, onClose, onSaved, students }) {
  const [form, setForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  async function submit() {
    setSaving(true); setErr(null);
    try {
      const student = students.find((s) => s.id === form.student_id);
      await api.post('/library/loans', { book_id: book.id, student_id: form.student_id || undefined, borrower_name: student?.full_name, due_date: form.due_date || undefined });
      onSaved?.(); onClose(); setForm({});
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }
  return (
    <Modal open={!!book} onClose={onClose} title={`Issue · ${book?.title || ''}`}
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={saving || !form.student_id}>{saving ? 'Issuing…' : 'Issue'}</button></>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="space-y-4">
        <Field label="Borrower (student)">
          <Select value={form.student_id || ''} onChange={(e) => setForm((f) => ({ ...f, student_id: e.target.value }))}>
            <option value="">Select student…</option>
            {students.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </Select>
        </Field>
        <Field label="Due date (default +14 days)"><Input type="date" value={form.due_date || ''} onChange={(e) => setForm((f) => ({ ...f, due_date: e.target.value }))} /></Field>
      </div>
    </Modal>
  );
}
