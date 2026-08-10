import React, { useEffect, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import api from './lib/api.js';

import Dashboard from './pages/Dashboard.jsx';
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
  const [role, setRole] = useState(() => localStorage.getItem('wellspire.role') || 'admin');
  const [mode, setMode] = useState('demo');

  useEffect(() => localStorage.setItem('wellspire.role', role), [role]);
  useEffect(() => {
    api.get('/status').then((s) => setMode(s.mode)).catch(() => {});
  }, []);

  return (
    <Layout role={role} setRole={setRole} mode={mode}>
      <Routes>
        <Route path="/" element={<Dashboard />} />
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
