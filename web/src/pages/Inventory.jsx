import React, { useState } from 'react';
import { Plus, Boxes, ArrowDownUp, Search } from 'lucide-react';
import api from '../lib/api.js';
import { num, inr } from '../lib/format.js';
import {
  Card, PageHeader, Table, Spinner, ErrorNote, EmptyState, Badge, Modal, Field, Input, Select, useAsync,
} from '../components/ui.jsx';

export default function Inventory() {
  const [search, setSearch] = useState('');
  const [addOpen, setAddOpen] = useState(false);
  const [moveItem, setMoveItem] = useState(null);
  const categories = useAsync(() => api.get('/inventory/categories'), []);
  const { loading, data, error, reload } = useAsync(() => api.get('/inventory/items', { search }), [search]);

  const lowStock = (data?.data || []).filter((i) => i.low_stock).length;

  return (
    <div>
      <PageHeader title="Inventory" subtitle="Assets, stock levels and reorder alerts."
        actions={<button className="btn-primary" onClick={() => setAddOpen(true)}><Plus className="h-4 w-4" /> Add item</button>} />

      {lowStock > 0 && (
        <div className="mb-4 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800 ring-1 ring-inset ring-amber-600/20">
          ⚠️ {lowStock} item(s) at or below reorder level — consider restocking.
        </div>
      )}

      <div className="mb-4 flex gap-2">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input className="input pl-9" placeholder="Search items…" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <Card>
        {loading ? <Spinner /> : error ? <div className="p-4"><ErrorNote error={error} /></div> : (
          <Table head={['Item', 'Category', 'Quantity', 'Reorder', 'Unit cost', 'Location', '']}
                 empty={!data.data.length && <EmptyState title="No items" icon={Boxes} />}>
            {data.data.map((i) => (
              <tr key={i.id} className="hover:bg-slate-50/60">
                <td className="td">
                  <p className="font-medium text-slate-800">{i.name}</p>
                  <p className="text-xs text-slate-400 font-mono">{i.sku || '—'}</p>
                </td>
                <td className="td">{i.category_name || '—'}</td>
                <td className="td">
                  <span className={`font-semibold ${i.low_stock ? 'text-amber-600' : 'text-slate-700'}`}>{num(i.quantity)} {i.unit}</span>
                </td>
                <td className="td">{num(i.reorder_level)}</td>
                <td className="td">{i.unit_cost ? inr(i.unit_cost) : '—'}</td>
                <td className="td">{i.location || '—'}</td>
                <td className="td text-right">
                  {i.low_stock && <Badge color="amber" className="mr-2">Low</Badge>}
                  <button className="btn-outline !py-1 !text-xs" onClick={() => setMoveItem(i)}><ArrowDownUp className="h-3 w-3" /> Move</button>
                </td>
              </tr>
            ))}
          </Table>
        )}
      </Card>

      <AddItem open={addOpen} onClose={() => setAddOpen(false)} onSaved={reload} categories={categories.data?.data || []} />
      <MoveStock item={moveItem} onClose={() => setMoveItem(null)} onSaved={reload} />
    </div>
  );
}

function AddItem({ open, onClose, onSaved, categories }) {
  const [form, setForm] = useState({ unit: 'unit', quantity: 0, reorder_level: 0 });
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/inventory/items', {
        ...form, quantity: Number(form.quantity) || 0, reorder_level: Number(form.reorder_level) || 0,
        unit_cost: form.unit_cost ? Number(form.unit_cost) : undefined,
      });
      onSaved?.(); onClose(); setForm({ unit: 'unit', quantity: 0, reorder_level: 0 });
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }
  return (
    <Modal open={open} onClose={onClose} title="Add inventory item" wide
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={saving || !form.name}>{saving ? 'Saving…' : 'Save'}</button></>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Name *"><Input value={form.name || ''} onChange={set('name')} /></Field>
        <Field label="Category">
          <Select value={form.category_id || ''} onChange={set('category_id')}>
            <option value="">Uncategorised</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </Field>
        <Field label="SKU"><Input value={form.sku || ''} onChange={set('sku')} /></Field>
        <Field label="Unit"><Input value={form.unit || ''} onChange={set('unit')} /></Field>
        <Field label="Quantity"><Input type="number" value={form.quantity} onChange={set('quantity')} /></Field>
        <Field label="Reorder level"><Input type="number" value={form.reorder_level} onChange={set('reorder_level')} /></Field>
        <Field label="Unit cost (₹)"><Input type="number" value={form.unit_cost || ''} onChange={set('unit_cost')} /></Field>
        <Field label="Location"><Input value={form.location || ''} onChange={set('location')} /></Field>
      </div>
    </Modal>
  );
}

function MoveStock({ item, onClose, onSaved }) {
  const [type, setType] = useState('inbound');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState(null);
  async function submit() {
    setSaving(true); setErr(null);
    try {
      await api.post('/inventory/transactions', { item_id: item.id, type, quantity: Number(quantity), note });
      onSaved?.(); onClose(); setQuantity(''); setNote('');
    } catch (e) { setErr(e); } finally { setSaving(false); }
  }
  return (
    <Modal open={!!item} onClose={onClose} title={`Stock movement · ${item?.name || ''}`}
      footer={<><button className="btn-outline" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={submit} disabled={saving || !quantity}>{saving ? 'Saving…' : 'Record'}</button></>}>
      {err && <div className="mb-3"><ErrorNote error={err} /></div>}
      <div className="space-y-4">
        <p className="text-sm text-slate-500">Current: <span className="font-semibold text-slate-800">{item ? `${num(item.quantity)} ${item.unit}` : ''}</span></p>
        <Field label="Movement type">
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="inbound">Inbound (add)</option>
            <option value="outbound">Outbound (remove)</option>
            <option value="adjustment">Adjustment (set to)</option>
            <option value="damaged">Damaged (remove)</option>
            <option value="returned">Returned (add)</option>
          </Select>
        </Field>
        <Field label="Quantity"><Input type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} /></Field>
        <Field label="Note"><Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Purchase order #123" /></Field>
      </div>
    </Modal>
  );
}
