import React from 'react';
import { Bus, MapPin, Gauge, Phone, Navigation, Route as RouteIcon } from 'lucide-react';
import api from '../lib/api.js';
import { Card, PageHeader, Spinner, ErrorNote, Badge, EmptyState, useAsync } from '../components/ui.jsx';
import { dateFmt } from '../lib/format.js';

export default function Transport() {
  const live = useAsync(() => api.get('/transport/live'), []);
  const routes = useAsync(() => api.get('/transport/routes'), []);

  if (live.loading) return <Spinner label="Locating vehicles…" />;
  if (live.error) return <ErrorNote error={live.error} />;
  const vehicles = live.data?.data || [];
  const located = vehicles.filter((v) => v.lat != null && v.lng != null);

  return (
    <div>
      <PageHeader title="Transport" subtitle="Live fleet tracking, routes and stops — shared with parents." />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-4 lg:col-span-2">
          <div className="mb-3 flex items-center gap-2">
            <Navigation className="h-4 w-4 text-brand-600" />
            <h3 className="font-semibold text-slate-900">Live map</h3>
            <Badge className="ml-auto" color="emerald">{located.filter((v) => v.moving).length} moving</Badge>
          </div>
          <FleetMap vehicles={located} />
          <p className="mt-3 text-xs text-slate-400">Positions come from each vehicle's GPS device (the driver app posts to <code>/api/transport/pings</code>). Parents see their child's bus in the parent portal.</p>
        </Card>

        <Card className="p-4">
          <h3 className="mb-3 font-semibold text-slate-900">Vehicles</h3>
          <div className="space-y-2">
            {vehicles.map((v) => (
              <div key={v.id} className="rounded-xl border border-slate-100 p-3">
                <div className="flex items-center gap-2">
                  <span className={`grid h-8 w-8 place-items-center rounded-lg ${v.moving ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}><Bus className="h-4 w-4" /></span>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-slate-800">{v.code} <span className="font-normal text-slate-400">· {v.registration_no}</span></p>
                    <p className="truncate text-xs text-slate-400">{v.route_name || 'Unassigned'}</p>
                  </div>
                  <Badge color={v.moving ? 'emerald' : 'slate'}>{v.moving ? 'Moving' : 'Idle'}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Gauge className="h-3 w-3" /> {v.speed_kmph ?? 0} km/h</span>
                  <span className="flex items-center gap-1"><Phone className="h-3 w-3" /> {v.driver_name} · {v.driver_phone}</span>
                  {v.recorded_at && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {new Date(v.recorded_at).toLocaleTimeString()}</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      <Card className="mt-4">
        <div className="flex items-center gap-2 border-b border-slate-100 px-4 py-3">
          <RouteIcon className="h-4 w-4 text-brand-600" /><h3 className="font-semibold text-slate-900">Routes</h3>
        </div>
        {routes.loading ? <Spinner /> : !(routes.data?.data || []).length ? <EmptyState title="No routes yet" /> : (
          <div className="divide-y divide-slate-50">
            {routes.data.data.map((r) => (
              <div key={r.id} className="flex items-center gap-3 px-4 py-3">
                <span className="grid h-9 w-9 place-items-center rounded-lg bg-brand-50 text-brand-700"><RouteIcon className="h-4 w-4" /></span>
                <div className="flex-1"><p className="text-sm font-medium text-slate-800">{r.name}</p><p className="text-xs text-slate-400 capitalize">{r.shift} shift</p></div>
                <Badge color={r.active === false ? 'slate' : 'emerald'}>{r.active === false ? 'Inactive' : 'Active'}</Badge>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

function FleetMap({ vehicles }) {
  if (!vehicles.length) return <div className="grid h-72 place-items-center rounded-xl bg-slate-50 text-sm text-slate-400">No live positions yet.</div>;
  const lats = vehicles.map((v) => v.lat), lngs = vehicles.map((v) => v.lng);
  let minLat = Math.min(...lats), maxLat = Math.max(...lats), minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const padLat = (maxLat - minLat || 0.01) * 0.35, padLng = (maxLng - minLng || 0.01) * 0.35;
  minLat -= padLat; maxLat += padLat; minLng -= padLng; maxLng += padLng;
  const px = (lng) => ((lng - minLng) / (maxLng - minLng)) * 100;
  const py = (lat) => (1 - (lat - minLat) / (maxLat - minLat)) * 100;

  return (
    <div className="relative h-72 overflow-hidden rounded-xl border border-slate-100"
      style={{ background: 'linear-gradient(180deg,#eef4ef,#e6eef0)', backgroundImage: 'linear-gradient(#dbe6de 1px,transparent 1px),linear-gradient(90deg,#dbe6de 1px,transparent 1px)', backgroundSize: '28px 28px' }}>
      {vehicles.map((v) => (
        <div key={v.id} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${px(v.lng)}%`, top: `${py(v.lat)}%` }}>
          <div className={`flex items-center gap-1 rounded-full px-2 py-1 text-[10px] font-bold text-white shadow ${v.moving ? 'bg-emerald-600' : 'bg-slate-500'}`}>
            <Bus className="h-3 w-3" /> {v.code}
          </div>
          {v.moving && <span className="absolute -inset-2 -z-10 animate-ping rounded-full bg-emerald-400/40" />}
        </div>
      ))}
    </div>
  );
}
