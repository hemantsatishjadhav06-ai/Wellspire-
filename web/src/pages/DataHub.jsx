import React, { useState } from 'react';
import { Download, FileSpreadsheet, HardDriveUpload, CloudUpload, Search, CheckCircle2, Loader2, FolderSync } from 'lucide-react';
import api from '../lib/api.js';
import { Card, PageHeader, Spinner, ErrorNote, Badge, useAsync } from '../components/ui.jsx';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

export default function DataHub() {
  const sets = useAsync(() => api.get('/export'), []);
  const drive = useAsync(() => api.get('/drive/status'), []);
  const [syncing, setSyncing] = useState('');
  const [msg, setMsg] = useState(null);
  const [driveQ, setDriveQ] = useState('');
  const [driveFiles, setDriveFiles] = useState(null);

  async function sync(key) {
    setSyncing(key); setMsg(null);
    try {
      const r = await api.post(`/drive/sync/${key}`);
      setMsg(r.configured ? { ok: true, text: `Synced ${r.label} → Google Drive`, link: r.uploaded?.link } : { ok: false, text: r.message });
    } catch (e) { setMsg({ ok: false, text: e.message }); } finally { setSyncing(''); }
  }
  async function syncAll() {
    setSyncing('all'); setMsg(null);
    try { const r = await api.post('/drive/sync-all'); setMsg(r.configured ? { ok: true, text: `Synced ${r.synced} data sets to Drive` } : { ok: false, text: r.message }); }
    catch (e) { setMsg({ ok: false, text: e.message }); } finally { setSyncing(''); }
  }
  async function driveSearch() {
    const r = await api.get('/drive/search', { q: driveQ }).catch(() => null);
    setDriveFiles(r?.files || []);
  }

  if (sets.loading) return <Spinner label="Loading data hub…" />;
  if (sets.error) return <ErrorNote error={sets.error} />;
  const datasets = sets.data?.datasets || [];
  const driveOn = drive.data?.configured;

  return (
    <div>
      <PageHeader title="Data & Integrations" subtitle="Excel export/import and Google Drive sync — for every module." />

      {msg && (
        <div className={`mb-4 flex items-center gap-2 rounded-xl px-4 py-3 text-sm ring-1 ring-inset ${msg.ok ? 'bg-emerald-50 text-emerald-800 ring-emerald-600/20' : 'bg-amber-50 text-amber-800 ring-amber-600/20'}`}>
          {msg.ok ? <CheckCircle2 className="h-4 w-4" /> : null} {msg.text}
          {msg.link && <a className="ml-1 font-semibold underline" href={msg.link} target="_blank" rel="noreferrer">Open</a>}
        </div>
      )}

      <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><FileSpreadsheet className="h-5 w-5 text-emerald-600" /><h3 className="font-semibold text-slate-900">Excel</h3></div>
          <p className="text-sm text-slate-500">Every module exports to a formatted <code>.xlsx</code>. Import the same file back to bulk-add rows (headers are matched by column name).</p>
          <div className="mt-3 flex gap-2">
            <a className="btn-outline" href={`${API_BASE}/export/students.xlsx`}><Download className="h-4 w-4" /> Sample: students.xlsx</a>
          </div>
        </Card>
        <Card className="p-5">
          <div className="mb-3 flex items-center gap-2"><CloudUpload className="h-5 w-5 text-brand-600" /><h3 className="font-semibold text-slate-900">Google Drive</h3>
            <Badge className="ml-auto" color={driveOn ? 'emerald' : 'amber'}>{driveOn ? 'Connected' : 'Not connected'}</Badge></div>
          {driveOn ? (
            <>
              <p className="text-sm text-slate-500">One click pushes fresh Excel files of every module into your Drive folder.</p>
              <button className="btn-primary mt-3" onClick={syncAll} disabled={!!syncing}>{syncing === 'all' ? <Loader2 className="h-4 w-4 animate-spin" /> : <FolderSync className="h-4 w-4" />} Sync all to Drive</button>
              <div className="mt-4 flex gap-2">
                <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input className="input pl-9" placeholder="Search Drive files by keyword…" value={driveQ} onChange={(e) => setDriveQ(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && driveSearch()} /></div>
                <button className="btn-outline" onClick={driveSearch}>Search</button>
              </div>
              {driveFiles && (
                <div className="mt-2 divide-y divide-slate-50">
                  {!driveFiles.length ? <p className="py-2 text-sm text-slate-400">No files found.</p> :
                    driveFiles.map((f) => <a key={f.id} href={f.webViewLink} target="_blank" rel="noreferrer" className="block py-2 text-sm text-brand-700 hover:underline">{f.name}</a>)}
                </div>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-500">
              Connect a Google service account to enable one-click sync: set <code>GOOGLE_SERVICE_ACCOUNT_JSON</code> and <code>GOOGLE_DRIVE_FOLDER_ID</code>
              (share the folder with the service-account email). Until then, use the per-module <strong>Sync</strong> button to get the Excel download.
            </p>
          )}
        </Card>
      </div>

      <Card>
        <div className="border-b border-slate-100 px-4 py-3"><h3 className="font-semibold text-slate-900">All data sets ({datasets.length})</h3></div>
        <div className="grid grid-cols-1 gap-px bg-slate-100 sm:grid-cols-2 lg:grid-cols-3">
          {datasets.map((d) => (
            <div key={d.key} className="flex items-center gap-3 bg-white p-4">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600"><FileSpreadsheet className="h-5 w-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800">{d.label}</p>
                <p className="truncate text-xs text-slate-400">{d.columns.length} columns</p>
              </div>
              <a className="btn-ghost !p-2" title="Download Excel" href={`${API_BASE}/export/${d.key}.xlsx`}><Download className="h-4 w-4" /></a>
              <button className="btn-ghost !p-2" title="Sync to Drive" onClick={() => sync(d.key)} disabled={!!syncing}>
                {syncing === d.key ? <Loader2 className="h-4 w-4 animate-spin" /> : <HardDriveUpload className="h-4 w-4" />}
              </button>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
