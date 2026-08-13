import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import Layout from './components/Layout.jsx';
import Login from './pages/Login.jsx';
import api from './lib/api.js';
import { useAuth } from './lib/auth.jsx';

import Dashboard from './pages/Dashboard.jsx';
import ParentHome from './pages/ParentHome.jsx';
import Students from './pages/Students.jsx';
import Teachers from './pages/Teachers.jsx';
import Classes from './pages/Classes.jsx';
import Timetable from './pages/Timetable.jsx';
import Attendance from './pages/Attendance.jsx';
import Fees from './pages/Fees.jsx';
import Library from './pages/Library.jsx';
import Inventory from './pages/Inventory.jsx';
import Automations from './pages/Automations.jsx';
import Assistant from './pages/Assistant.jsx';
import Settings from './pages/Settings.jsx';

export default function App() {
  const { ready, authenticated, role } = useAuth();
  const [mode, setMode] = useState('demo');

  useEffect(() => {
    if (authenticated) api.get('/status').then((s) => setMode(s.mode)).catch(() => {});
  }, [authenticated]);

  if (!ready) {
    return (
      <div className="grid min-h-screen place-items-center bg-slate-50">
        <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
      </div>
    );
  }

  if (!authenticated) return <Login />;

  return (
    <Layout mode={mode}>
      <Routes>
        <Route path="/" element={role === 'parent' ? <ParentHome /> : <Dashboard />} />
        <Route path="/students" element={<Students />} />
        <Route path="/teachers" element={<Teachers />} />
        <Route path="/classes" element={<Classes />} />
        <Route path="/timetable" element={<Timetable />} />
        <Route path="/attendance" element={<Attendance />} />
        <Route path="/fees" element={<Fees />} />
        <Route path="/library" element={<Library />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="/automations" element={<Automations />} />
        <Route path="/assistant" element={<Assistant />} />
        <Route path="/settings" element={<Settings mode={mode} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
