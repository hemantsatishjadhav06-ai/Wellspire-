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
import Transport from './pages/Transport.jsx';
import SuperAdmin from './pages/SuperAdmin.jsx';
import AIAgents from './pages/AIAgents.jsx';
import DataHub from './pages/DataHub.jsx';
import GetStarted from './pages/GetStarted.jsx';
import MobileApp from './pages/MobileApp.jsx';
import Learn from './pages/Learn.jsx';
import Tests from './pages/Tests.jsx';
import { Staff, Leave, Leads, Campaigns, Hostel, Labs, Infirmary, Facilities, Appointments } from './pages/modules.jsx';

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
        {/* Role-accurate home: parents get the family view, students land on Learn. */}
        <Route path="/" element={role === 'parent' ? <ParentHome /> : role === 'student' ? <Navigate to="/learn" replace /> : <Dashboard />} />
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
        <Route path="/transport" element={<Transport />} />
        <Route path="/hostel" element={<Hostel />} />
        <Route path="/labs" element={<Labs />} />
        <Route path="/infirmary" element={<Infirmary />} />
        <Route path="/facilities" element={<Facilities />} />
        <Route path="/appointments" element={<Appointments />} />
        <Route path="/leads" element={<Leads />} />
        <Route path="/marketing" element={<Campaigns />} />
        <Route path="/hr" element={<Staff />} />
        <Route path="/leave" element={<Leave />} />
        <Route path="/agents" element={<AIAgents />} />
        <Route path="/platform" element={<SuperAdmin />} />
        <Route path="/data" element={<DataHub />} />
        <Route path="/get-started" element={<GetStarted />} />
        <Route path="/mobile" element={<MobileApp />} />
        <Route path="/learn" element={<Learn />} />
        <Route path="/tests" element={<Tests />} />
        <Route path="/settings" element={<Settings mode={mode} />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}
