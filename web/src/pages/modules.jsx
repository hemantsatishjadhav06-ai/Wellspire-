import React from 'react';
import ResourcePage from '../components/ResourcePage.jsx';
import { Badge } from '../components/ui.jsx';
import { inr, dateFmt } from '../lib/format.js';

const pill = (map) => (v) => <Badge color={map[v] || 'slate'}>{String(v || '—').replace(/_/g, ' ')}</Badge>;
const stageColor = { new: 'sky', contacted: 'violet', toured: 'amber', applied: 'brand', enrolled: 'emerald', lost: 'rose' };
const leaveColor = { pending: 'amber', approved: 'emerald', rejected: 'rose', cancelled: 'slate' };
const apptColor = { requested: 'amber', scheduled: 'sky', completed: 'emerald', cancelled: 'slate', no_show: 'rose' };
const facColor = { clean: 'emerald', needs_attention: 'amber', dirty: 'rose', closed: 'slate' };
const cmpColor = { active: 'emerald', draft: 'slate', paused: 'amber', ended: 'slate' };

// ---- HR ----
export function Staff() {
  return <ResourcePage title="Staff" subtitle="All employees — teaching and non-teaching."
    endpoint="/staff" exportKey="staff" searchKey="full_name" addLabel="Add staff"
    columns={[
      { key: 'full_name', label: 'Name', render: (r) => <span className="font-medium text-slate-800">{r.full_name}</span> },
      { key: 'role', label: 'Role' }, { key: 'department', label: 'Department' },
      { key: 'phone', label: 'Phone' },
      { key: 'salary', label: 'Salary', render: (r) => (r.salary ? inr(r.salary) : '—') },
      { key: 'active', label: 'Status', render: (r) => <Badge color={r.active === false ? 'slate' : 'emerald'}>{r.active === false ? 'Inactive' : 'Active'}</Badge> },
    ]}
    fields={[
      { key: 'full_name', label: 'Full name', required: true }, { key: 'role', label: 'Role' },
      { key: 'department', label: 'Department', options: ['Academics', 'Administration', 'Transport', 'Support Staff', 'Finance'] },
      { key: 'email', label: 'Email' }, { key: 'phone', label: 'Phone' },
      { key: 'employment_type', label: 'Type', options: ['full_time', 'part_time', 'contract'] },
      { key: 'salary', label: 'Salary (₹)', type: 'number' }, { key: 'date_of_join', label: 'Joined', type: 'date' },
    ]} />;
}
export function Leave() {
  return <ResourcePage title="Leave requests" subtitle="Staff leave approvals." endpoint="/leave" exportKey="leave" searchKey="staff_name" addLabel="New request"
    columns={[
      { key: 'staff_name', label: 'Staff', render: (r) => <span className="font-medium text-slate-800">{r.staff_name}</span> },
      { key: 'type', label: 'Type' },
      { key: 'from_date', label: 'From', render: (r) => dateFmt(r.from_date) }, { key: 'to_date', label: 'To', render: (r) => dateFmt(r.to_date) },
      { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status', render: (r) => pill(leaveColor)(r.status) },
    ]}
    fields={[
      { key: 'staff_name', label: 'Staff name', required: true },
      { key: 'type', label: 'Type', options: ['casual', 'sick', 'earned', 'unpaid'] },
      { key: 'from_date', label: 'From', type: 'date' }, { key: 'to_date', label: 'To', type: 'date' },
      { key: 'reason', label: 'Reason' }, { key: 'status', label: 'Status', options: ['pending', 'approved', 'rejected'] },
    ]} />;
}

// ---- CRM / Marketing ----
export function Leads() {
  return <ResourcePage title="Admissions leads" subtitle="Enquiries pipeline (CRM)." endpoint="/leads" exportKey="leads" searchKey="parent_name" addLabel="Add lead"
    columns={[
      { key: 'parent_name', label: 'Parent', render: (r) => <div><p className="font-medium text-slate-800">{r.parent_name}</p><p className="text-xs text-slate-400">{r.child_name} · {r.grade}</p></div> },
      { key: 'phone', label: 'Phone' }, { key: 'source', label: 'Source' },
      { key: 'owner', label: 'Owner' }, { key: 'stage', label: 'Stage', render: (r) => pill(stageColor)(r.stage) },
    ]}
    fields={[
      { key: 'parent_name', label: 'Parent name', required: true }, { key: 'child_name', label: 'Child name' },
      { key: 'grade', label: 'Grade', options: ['Nursery', 'LKG', 'UKG', 'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6', 'Grade 7'] },
      { key: 'phone', label: 'Phone' }, { key: 'email', label: 'Email' },
      { key: 'source', label: 'Source', options: ['website', 'referral', 'instagram', 'facebook', 'walk_in', 'call'] },
      { key: 'stage', label: 'Stage', options: ['new', 'contacted', 'toured', 'applied', 'enrolled', 'lost'] },
      { key: 'owner', label: 'Owner' },
    ]} />;
}
export function Campaigns() {
  return <ResourcePage title="Marketing campaigns" subtitle="Reach and spend across channels." endpoint="/campaigns" exportKey="campaigns" searchKey="name" addLabel="New campaign"
    columns={[
      { key: 'name', label: 'Campaign', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
      { key: 'channel', label: 'Channel' }, { key: 'status', label: 'Status', render: (r) => pill(cmpColor)(r.status) },
      { key: 'leads_generated', label: 'Leads' },
      { key: 'spend', label: 'Spend', render: (r) => inr(r.spend) },
      { key: 'roi', label: 'Cost / lead', render: (r) => (r.leads_generated ? inr(Math.round((r.spend || 0) / r.leads_generated)) : '—') },
    ]}
    fields={[
      { key: 'name', label: 'Campaign name', required: true },
      { key: 'channel', label: 'Channel', options: ['facebook', 'instagram', 'google', 'whatsapp', 'email', 'offline'] },
      { key: 'status', label: 'Status', options: ['draft', 'active', 'paused', 'ended'] },
      { key: 'budget', label: 'Budget (₹)', type: 'number' }, { key: 'spend', label: 'Spend (₹)', type: 'number' },
      { key: 'leads_generated', label: 'Leads', type: 'number' },
    ]} />;
}

// ---- Hostel / Labs / Infirmary / Facilities / Appointments ----
export function Hostel() {
  return <ResourcePage title="Hostel rooms" subtitle="Blocks, rooms and occupancy." endpoint="/hostel/rooms" exportKey="hostel_rooms" searchKey="room_no" addLabel="Add room"
    columns={[
      { key: 'room_no', label: 'Room', render: (r) => <span className="font-medium text-slate-800">{r.room_no}</span> },
      { key: 'floor', label: 'Floor' }, { key: 'capacity', label: 'Capacity' }, { key: 'occupied', label: 'Occupied' },
      { key: 'free', label: 'Availability', render: (r) => { const free = (r.capacity || 0) - (r.occupied || 0); return <Badge color={free > 0 ? 'emerald' : 'rose'}>{free > 0 ? `${free} free` : 'Full'}</Badge>; } },
    ]}
    fields={[
      { key: 'room_no', label: 'Room no', required: true }, { key: 'floor', label: 'Floor' },
      { key: 'capacity', label: 'Capacity', type: 'number' }, { key: 'occupied', label: 'Occupied', type: 'number' },
    ]} />;
}
export function Labs() {
  return <ResourcePage title="Laboratories" subtitle="Chemistry, biology, physics, robotics and more." endpoint="/labs" exportKey="labs" searchKey="name" addLabel="Add lab"
    columns={[
      { key: 'name', label: 'Lab', render: (r) => <span className="font-medium text-slate-800">{r.name}</span> },
      { key: 'type', label: 'Type', render: (r) => <Badge color="brand">{r.type}</Badge> },
      { key: 'room', label: 'Room' }, { key: 'in_charge', label: 'In-charge' }, { key: 'capacity', label: 'Capacity' },
    ]}
    fields={[
      { key: 'name', label: 'Lab name', required: true },
      { key: 'type', label: 'Type', options: ['chemistry', 'biology', 'physics', 'computer', 'robotics', 'language', 'general'] },
      { key: 'room', label: 'Room' }, { key: 'in_charge', label: 'In-charge' }, { key: 'capacity', label: 'Capacity', type: 'number' },
    ]} />;
}
export function Infirmary() {
  return <ResourcePage title="Infirmary" subtitle="Clinic visits and student health." endpoint="/infirmary" exportKey="infirmary" addLabel="Log visit"
    columns={[
      { key: 'visited_at', label: 'When', render: (r) => dateFmt(r.visited_at) },
      { key: 'symptoms', label: 'Symptoms', render: (r) => <span className="font-medium text-slate-800">{r.symptoms}</span> },
      { key: 'treatment', label: 'Treatment' }, { key: 'nurse', label: 'Nurse' },
      { key: 'parent_notified', label: 'Parent', render: (r) => <Badge color={r.parent_notified ? 'emerald' : 'amber'}>{r.parent_notified ? 'Notified' : 'Pending'}</Badge> },
    ]}
    fields={[
      { key: 'symptoms', label: 'Symptoms', required: true }, { key: 'treatment', label: 'Treatment' },
      { key: 'nurse', label: 'Nurse' },
    ]} />;
}
export function Facilities() {
  return <ResourcePage title="Facilities & cleaning" subtitle="Washroom & campus cleaning logs (housekeeping)." endpoint="/facilities" exportKey="facilities" searchKey="location" addLabel="Log update"
    columns={[
      { key: 'facility', label: 'Facility', render: (r) => <Badge color="brand">{r.facility}</Badge> },
      { key: 'location', label: 'Location', render: (r) => <span className="font-medium text-slate-800">{r.location}</span> },
      { key: 'cleaned_by', label: 'By' },
      { key: 'logged_at', label: 'When', render: (r) => dateFmt(r.logged_at) },
      { key: 'status', label: 'Status', render: (r) => pill(facColor)(r.status) },
      { key: 'photo', label: 'Photo', render: (r) => (r.photo_url ? <a className="text-brand-600 text-xs font-semibold" href={r.photo_url} target="_blank" rel="noreferrer">View</a> : <span className="text-xs text-slate-300">—</span>) },
    ]}
    fields={[
      { key: 'facility', label: 'Facility', options: ['washroom', 'classroom', 'corridor', 'ground', 'cafeteria', 'lab', 'hostel', 'other'] },
      { key: 'location', label: 'Location', required: true },
      { key: 'status', label: 'Status', options: ['clean', 'needs_attention', 'dirty', 'closed'] },
      { key: 'cleaned_by', label: 'Cleaned by' }, { key: 'photo_url', label: 'Photo URL (camera)' }, { key: 'note', label: 'Note' },
    ]} />;
}
export function Appointments() {
  return <ResourcePage title="Appointments" subtitle="Front-desk & principal meetings — with Google Meet." endpoint="/appointments" exportKey="appointments" searchKey="requester_name" addLabel="New appointment"
    columns={[
      { key: 'requester_name', label: 'Requester', render: (r) => <div><p className="font-medium text-slate-800">{r.requester_name}</p><p className="text-xs text-slate-400">{r.requester_email || r.requester_phone || ''}</p></div> },
      { key: 'with_role', label: 'With' }, { key: 'purpose', label: 'Purpose' },
      { key: 'scheduled_at', label: 'When', render: (r) => (r.scheduled_at ? dateFmt(r.scheduled_at) : 'TBD') },
      { key: 'status', label: 'Status', render: (r) => pill(apptColor)(r.status) },
      { key: 'meet', label: 'Meet', render: (r) => (r.meet_link ? <a className="btn-outline !py-1 !text-xs" href={r.meet_link} target="_blank" rel="noreferrer">Join</a> : <span className="text-xs text-slate-300">—</span>) },
    ]}
    fields={[
      { key: 'requester_name', label: 'Requester', required: true }, { key: 'requester_email', label: 'Email' }, { key: 'requester_phone', label: 'Phone' },
      { key: 'with_role', label: 'With', options: ['principal', 'vice_principal', 'accountant', 'admissions', 'front_desk'] },
      { key: 'purpose', label: 'Purpose' }, { key: 'scheduled_at', label: 'When', type: 'date' }, { key: 'meet_link', label: 'Google Meet link' },
      { key: 'status', label: 'Status', options: ['requested', 'scheduled', 'completed', 'cancelled'] },
    ]} />;
}
