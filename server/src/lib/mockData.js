// In-memory sample dataset used when Supabase isn't configured (DEMO mode).
// Mirrors supabase/migrations/0004_seed.sql so the deployed app looks alive
// immediately. Writes during a session persist in these arrays until restart.
import config from '../config.js';
import { buildLearnData } from './learnData.js';

const SCHOOL = config.defaultSchoolId;
const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays = 0) => new Date(Date.now() + offsetDays * day).toISOString();
const date = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

export function buildMockData() {
  const att = (sid, cls, statuses) =>
    statuses.map((s, i) => ({ id: `att-${sid}-${i}`, school_id: SCHOOL, student_id: sid, class_id: cls, date: date(-(i + 1)), status: s }));
  const attendanceRecords = [
    ...att('stu-1', 'cls-5a', ['present', 'present', 'late', 'present', 'present', 'present', 'absent', 'present', 'present', 'present']),
    ...att('stu-2', 'cls-5a', ['present', 'present', 'present', 'present', 'absent', 'present', 'present', 'present', 'present', 'present']),
    ...att('stu-3', 'cls-5a', ['present', 'present', 'present', 'present', 'present', 'present', 'present', 'late', 'present', 'present']),
    ...att('stu-6', 'cls-6a', ['present', 'present', 'present', 'present', 'present', 'holiday', 'present', 'present', 'present', 'present']),
  ];
  return {
    schools: [
      {
        id: SCHOOL,
        name: 'Wellspire International School',
        code: 'WELLSPIRE',
        address: 'Near ORR Exit 6, Kandlakoya, Muneerabad Road, Hyderabad, Telangana 501401',
        phone: '+91 99883 34844',
        email: 'info@wellspireinternational.com',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        settings: { tagline: 'Inspiring Lifelong Learning', motto: 'Educating the Mind. Body. Spirit.' },
        board_type: 'cambridge', plan: 'enterprise', brand_color: '#233F88', website_enabled: true, is_active: true,
        created_at: iso(-400),
        updated_at: iso(-1),
      },
      { id: 'sch-green', name: 'Greenfield Public School', code: 'GREENFIELD', address: 'Banjara Hills, Hyderabad', phone: '+91 40 4000 1000', email: 'office@greenfield.edu', timezone: 'Asia/Kolkata', currency: 'INR', settings: {}, board_type: 'state', plan: 'standard', brand_color: '#0e7490', website_enabled: true, is_active: true, created_at: iso(-300), updated_at: iso(-2) },
      { id: 'sch-oak', name: 'Oakridge World Academy', code: 'OAKRIDGE', address: 'Gachibowli, Hyderabad', phone: '+91 40 4000 2000', email: 'info@oakridge.edu', timezone: 'Asia/Kolkata', currency: 'INR', settings: {}, board_type: 'ib', plan: 'enterprise', brand_color: '#7c3aed', website_enabled: true, is_active: true, created_at: iso(-250), updated_at: iso(-3) },
    ],

    academic_years: [
      { id: 'ay-2025', school_id: SCHOOL, name: '2025-2026', start_date: '2025-06-01', end_date: '2026-04-30', is_current: true },
    ],

    subjects: [
      { id: 'sub-math', school_id: SCHOOL, name: 'Mathematics', code: 'MATH', color: '#6366f1' },
      { id: 'sub-eng', school_id: SCHOOL, name: 'English', code: 'ENG', color: '#0ea5e9' },
      { id: 'sub-sci', school_id: SCHOOL, name: 'Science', code: 'SCI', color: '#22c55e' },
      { id: 'sub-sst', school_id: SCHOOL, name: 'Social Studies', code: 'SST', color: '#f59e0b' },
      { id: 'sub-cs', school_id: SCHOOL, name: 'Computer Science', code: 'CS', color: '#8b5cf6' },
      { id: 'sub-pe', school_id: SCHOOL, name: 'Physical Education', code: 'PE', color: '#ef4444' },
    ],

    teachers: [
      { id: 'tch-1', school_id: SCHOOL, employee_code: 'T-001', full_name: 'Priya Sharma', email: 'priya.sharma@wellspire.school', phone: '+91 98200 10001', qualification: 'M.Sc Mathematics', subjects: ['sub-math'], is_active: true },
      { id: 'tch-2', school_id: SCHOOL, employee_code: 'T-002', full_name: 'Rahul Menon', email: 'rahul.menon@wellspire.school', phone: '+91 98200 10002', qualification: 'M.A English', subjects: ['sub-eng'], is_active: true },
      { id: 'tch-3', school_id: SCHOOL, employee_code: 'T-003', full_name: 'Anjali Verma', email: 'anjali.verma@wellspire.school', phone: '+91 98200 10003', qualification: 'M.Sc Physics', subjects: ['sub-sci'], is_active: true },
      { id: 'tch-4', school_id: SCHOOL, employee_code: 'T-004', full_name: 'Imran Khan', email: 'imran.khan@wellspire.school', phone: '+91 98200 10004', qualification: 'M.A History', subjects: ['sub-sst'], is_active: true },
      { id: 'tch-5', school_id: SCHOOL, employee_code: 'T-005', full_name: 'Sneha Rao', email: 'sneha.rao@wellspire.school', phone: '+91 98200 10005', qualification: 'B.Tech CS', subjects: ['sub-cs'], is_active: true },
    ],

    classes: [
      { id: 'cls-5a', school_id: SCHOOL, academic_year_id: 'ay-2025', grade: '5', section: 'A', name: 'Grade 5 - A', room: 'R-201', class_teacher_id: 'tch-1', capacity: 35 },
      { id: 'cls-5b', school_id: SCHOOL, academic_year_id: 'ay-2025', grade: '5', section: 'B', name: 'Grade 5 - B', room: 'R-202', class_teacher_id: 'tch-2', capacity: 35 },
      { id: 'cls-6a', school_id: SCHOOL, academic_year_id: 'ay-2025', grade: '6', section: 'A', name: 'Grade 6 - A', room: 'R-301', class_teacher_id: 'tch-3', capacity: 35 },
    ],

    students: [
      { id: 'stu-1', school_id: SCHOOL, admission_no: 'ADM-2025-001', roll_no: '1', full_name: 'Aarav Gupta', gender: 'male', date_of_birth: '2015-03-14', class_id: 'cls-5a', is_active: true },
      { id: 'stu-2', school_id: SCHOOL, admission_no: 'ADM-2025-002', roll_no: '2', full_name: 'Diya Nair', gender: 'female', date_of_birth: '2015-07-22', class_id: 'cls-5a', is_active: true },
      { id: 'stu-3', school_id: SCHOOL, admission_no: 'ADM-2025-003', roll_no: '3', full_name: 'Kabir Singh', gender: 'male', date_of_birth: '2015-01-09', class_id: 'cls-5a', is_active: true },
      { id: 'stu-4', school_id: SCHOOL, admission_no: 'ADM-2025-004', roll_no: '1', full_name: 'Isha Patel', gender: 'female', date_of_birth: '2015-11-30', class_id: 'cls-5b', is_active: true },
      { id: 'stu-5', school_id: SCHOOL, admission_no: 'ADM-2025-005', roll_no: '2', full_name: 'Vivaan Joshi', gender: 'male', date_of_birth: '2015-05-18', class_id: 'cls-5b', is_active: true },
      { id: 'stu-6', school_id: SCHOOL, admission_no: 'ADM-2025-006', roll_no: '1', full_name: 'Ananya Reddy', gender: 'female', date_of_birth: '2014-09-25', class_id: 'cls-6a', is_active: true },
      { id: 'stu-7', school_id: SCHOOL, admission_no: 'ADM-2025-007', roll_no: '2', full_name: 'Arjun Iyer', gender: 'male', date_of_birth: '2014-12-02', class_id: 'cls-6a', is_active: true },
    ],

    guardians: [
      { id: 'grd-1', school_id: SCHOOL, full_name: 'Rohan Gupta', email: 'rohan.gupta@example.com', phone: '+91 99000 20001', occupation: 'Engineer' },
      { id: 'grd-2', school_id: SCHOOL, full_name: 'Meera Nair', email: 'meera.nair@example.com', phone: '+91 99000 20002', occupation: 'Doctor' },
      { id: 'grd-3', school_id: SCHOOL, full_name: 'Harpreet Singh', email: 'harpreet.singh@example.com', phone: '+91 99000 20003', occupation: 'Businessman' },
      { id: 'grd-4', school_id: SCHOOL, full_name: 'Nisha Patel', email: 'nisha.patel@example.com', phone: '+91 99000 20004', occupation: 'Architect' },
    ],

    student_guardians: [
      { student_id: 'stu-1', guardian_id: 'grd-1', relationship: 'father', is_primary: true },
      { student_id: 'stu-2', guardian_id: 'grd-2', relationship: 'mother', is_primary: true },
      { student_id: 'stu-3', guardian_id: 'grd-3', relationship: 'father', is_primary: true },
      { student_id: 'stu-4', guardian_id: 'grd-4', relationship: 'mother', is_primary: true },
    ],

    timetable_slots: [
      { id: 'tt-1', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-math', teacher_id: 'tch-1', day_of_week: 1, period: 1, start_time: '08:00', end_time: '08:50', room: 'R-201' },
      { id: 'tt-2', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-eng', teacher_id: 'tch-2', day_of_week: 1, period: 2, start_time: '08:50', end_time: '09:40', room: 'R-201' },
      { id: 'tt-3', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-sci', teacher_id: 'tch-3', day_of_week: 1, period: 3, start_time: '09:40', end_time: '10:30', room: 'R-201' },
      { id: 'tt-4', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-eng', teacher_id: 'tch-2', day_of_week: 2, period: 1, start_time: '08:00', end_time: '08:50', room: 'R-201' },
      { id: 'tt-5', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-math', teacher_id: 'tch-1', day_of_week: 2, period: 2, start_time: '08:50', end_time: '09:40', room: 'R-201' },
      { id: 'tt-6', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-cs', teacher_id: 'tch-5', day_of_week: 3, period: 1, start_time: '08:00', end_time: '08:50', room: 'R-201' },
      { id: 'tt-7', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-sst', teacher_id: 'tch-4', day_of_week: 3, period: 2, start_time: '08:50', end_time: '09:40', room: 'R-201' },
      { id: 'tt-8', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-sci', teacher_id: 'tch-3', day_of_week: 4, period: 1, start_time: '08:00', end_time: '08:50', room: 'R-201' },
      { id: 'tt-9', school_id: SCHOOL, class_id: 'cls-5a', subject_id: 'sub-math', teacher_id: 'tch-1', day_of_week: 5, period: 1, start_time: '08:00', end_time: '08:50', room: 'R-201' },
    ],

    timetable_jobs: [],
    attendance: attendanceRecords,

    fee_structures: [
      { id: 'fs-1', school_id: SCHOOL, academic_year_id: 'ay-2025', name: 'Term 1 Tuition', category: 'tuition', amount: 25000, frequency: 'term' },
      { id: 'fs-2', school_id: SCHOOL, academic_year_id: 'ay-2025', name: 'Transport Fee', category: 'transport', amount: 6000, frequency: 'term' },
    ],

    fee_invoices: [
      { id: 'inv-1', school_id: SCHOOL, student_id: 'stu-1', fee_structure_id: 'fs-1', invoice_no: 'INV-2025-0001', title: 'Term 1 Tuition', amount: 25000, amount_paid: 25000, due_date: date(-20), status: 'paid', reminder_count: 0, last_reminded_at: null },
      { id: 'inv-2', school_id: SCHOOL, student_id: 'stu-2', fee_structure_id: 'fs-1', invoice_no: 'INV-2025-0002', title: 'Term 1 Tuition', amount: 25000, amount_paid: 10000, due_date: date(-5), status: 'overdue', reminder_count: 1, last_reminded_at: iso(-2) },
      { id: 'inv-3', school_id: SCHOOL, student_id: 'stu-3', fee_structure_id: 'fs-1', invoice_no: 'INV-2025-0003', title: 'Term 1 Tuition', amount: 25000, amount_paid: 0, due_date: date(3), status: 'pending', reminder_count: 0, last_reminded_at: null },
      { id: 'inv-4', school_id: SCHOOL, student_id: 'stu-4', fee_structure_id: 'fs-1', invoice_no: 'INV-2025-0004', title: 'Term 1 Tuition', amount: 25000, amount_paid: 0, due_date: date(-2), status: 'overdue', reminder_count: 0, last_reminded_at: null },
      { id: 'inv-5', school_id: SCHOOL, student_id: 'stu-5', fee_structure_id: 'fs-1', invoice_no: 'INV-2025-0005', title: 'Term 1 Tuition', amount: 25000, amount_paid: 0, due_date: date(6), status: 'pending', reminder_count: 0, last_reminded_at: null },
    ],

    fee_payments: [
      { id: 'pay-1', school_id: SCHOOL, invoice_id: 'inv-1', amount: 25000, method: 'upi', paid_at: iso(-20) },
      { id: 'pay-2', school_id: SCHOOL, invoice_id: 'inv-2', amount: 10000, method: 'cash', paid_at: iso(-10) },
    ],

    library_books: [
      { id: 'bk-1', school_id: SCHOOL, title: 'The Jungle Book', author: 'Rudyard Kipling', isbn: '9780141325293', category: 'fiction', shelf: 'A-1', total_copies: 5, available_copies: 4 },
      { id: 'bk-2', school_id: SCHOOL, title: 'A Brief History of Time', author: 'Stephen Hawking', isbn: '9780553380163', category: 'science', shelf: 'C-3', total_copies: 3, available_copies: 3 },
      { id: 'bk-3', school_id: SCHOOL, title: 'Wings of Fire', author: 'A.P.J. Abdul Kalam', isbn: '9788173711466', category: 'biography', shelf: 'B-2', total_copies: 4, available_copies: 3 },
      { id: 'bk-4', school_id: SCHOOL, title: 'Introduction to Algorithms', author: 'Cormen et al.', isbn: '9780262033848', category: 'reference', shelf: 'D-1', total_copies: 2, available_copies: 2 },
    ],

    library_loans: [
      { id: 'ln-1', school_id: SCHOOL, book_id: 'bk-1', student_id: 'stu-1', borrower_name: 'Aarav Gupta', issued_at: date(-20), due_date: date(-6), status: 'overdue', fine_amount: 0 },
      { id: 'ln-2', school_id: SCHOOL, book_id: 'bk-3', student_id: 'stu-6', borrower_name: 'Ananya Reddy', issued_at: date(-3), due_date: date(11), status: 'issued', fine_amount: 0 },
    ],

    inventory_categories: [
      { id: 'cat-1', school_id: SCHOOL, name: 'Stationery' },
      { id: 'cat-2', school_id: SCHOOL, name: 'Electronics' },
      { id: 'cat-3', school_id: SCHOOL, name: 'Sports' },
    ],

    inventory_items: [
      { id: 'itm-1', school_id: SCHOOL, category_id: 'cat-1', name: 'A4 Paper Ream', sku: 'STN-001', unit: 'ream', quantity: 8, reorder_level: 20, location: 'Store Room 1', unit_cost: 280, supplier: 'Paper Co.' },
      { id: 'itm-2', school_id: SCHOOL, category_id: 'cat-1', name: 'Whiteboard Marker', sku: 'STN-002', unit: 'box', quantity: 45, reorder_level: 15, location: 'Store Room 1', unit_cost: 450, supplier: 'OfficeMart' },
      { id: 'itm-3', school_id: SCHOOL, category_id: 'cat-2', name: 'Projector', sku: 'ELE-001', unit: 'unit', quantity: 6, reorder_level: 3, location: 'AV Store', unit_cost: 42000, supplier: 'TechWorld' },
      { id: 'itm-4', school_id: SCHOOL, category_id: 'cat-3', name: 'Football', sku: 'SPT-001', unit: 'unit', quantity: 4, reorder_level: 10, location: 'Sports Room', unit_cost: 900, supplier: 'SportsHub' },
    ],

    inventory_transactions: [],

    notifications: [
      { id: 'ntf-1', school_id: SCHOOL, kind: 'announcement', channel: 'in_app', title: 'Welcome to 2025-26', body: 'Classes begin June 1st.', status: 'sent', scheduled_for: iso(-30), sent_at: iso(-30), created_at: iso(-30) },
    ],

    announcements: [
      { id: 'ann-1', school_id: SCHOOL, title: 'Welcome to the 2025-26 session', body: 'Classes begin June 1st. Please ensure fee payments and book issuance are completed in the first week.', pinned: true, published_at: iso(-30), created_at: iso(-30) },
    ],

    audit_logs: [],

    // ---------------------------------------------------------------------
    // Platform modules (per-school SaaS)
    // ---------------------------------------------------------------------
    transport_vehicles: [
      { id: 'veh-1', school_id: SCHOOL, code: 'BUS-01', registration_no: 'TS09 AB 1234', model: 'Tata Starbus', capacity: 40, driver_name: 'Ramesh Yadav', driver_phone: '+91 90000 11111', attendant_name: 'Sunita', active: true },
      { id: 'veh-2', school_id: SCHOOL, code: 'BUS-02', registration_no: 'TS09 CD 5678', model: 'Force Traveller', capacity: 26, driver_name: 'Iqbal Khan', driver_phone: '+91 90000 22222', attendant_name: 'Radha', active: true },
      { id: 'veh-3', school_id: SCHOOL, code: 'VAN-01', registration_no: 'TS09 EF 9012', model: 'Mahindra Supro', capacity: 14, driver_name: 'Naveen', driver_phone: '+91 90000 33333', attendant_name: 'Latha', active: true },
    ],
    transport_routes: [
      { id: 'rt-1', school_id: SCHOOL, name: 'Route A · Kondapur–Campus', vehicle_id: 'veh-1', shift: 'morning', active: true },
      { id: 'rt-2', school_id: SCHOOL, name: 'Route B · Miyapur–Campus', vehicle_id: 'veh-2', shift: 'morning', active: true },
    ],
    transport_stops: [
      { id: 'st-1', school_id: SCHOOL, route_id: 'rt-1', name: 'Kondapur Circle', seq: 1, pickup_time: '07:10', lat: 17.4615, lng: 78.3637 },
      { id: 'st-2', school_id: SCHOOL, route_id: 'rt-1', name: 'Botanical Garden', seq: 2, pickup_time: '07:20', lat: 17.4622, lng: 78.3712 },
      { id: 'st-3', school_id: SCHOOL, route_id: 'rt-2', name: 'Miyapur X Road', seq: 1, pickup_time: '07:05', lat: 17.4967, lng: 78.3585 },
    ],
    transport_assignments: [
      { student_id: 'stu-1', route_id: 'rt-1', stop_id: 'st-1' },
      { student_id: 'stu-2', route_id: 'rt-1', stop_id: 'st-2' },
      { student_id: 'stu-4', route_id: 'rt-2', stop_id: 'st-3' },
    ],
    transport_pings: [
      { id: 'pg-1', school_id: SCHOOL, vehicle_id: 'veh-1', lat: 17.4700, lng: 78.3800, speed_kmph: 32, recorded_at: iso(0) },
      { id: 'pg-2', school_id: SCHOOL, vehicle_id: 'veh-2', lat: 17.4890, lng: 78.3910, speed_kmph: 24, recorded_at: iso(0) },
      { id: 'pg-3', school_id: SCHOOL, vehicle_id: 'veh-3', lat: 17.4550, lng: 78.3700, speed_kmph: 0, recorded_at: iso(0) },
    ],

    hostels: [
      { id: 'hos-1', school_id: SCHOOL, name: 'Nalanda Boys Hostel', kind: 'boys', warden_name: 'Mr. Prakash', warden_phone: '+91 90000 44444', lat: 17.4602, lng: 78.3650 },
      { id: 'hos-2', school_id: SCHOOL, name: 'Ganga Girls Hostel', kind: 'girls', warden_name: 'Ms. Kavitha', warden_phone: '+91 90000 55555', lat: 17.4608, lng: 78.3661 },
    ],
    hostel_rooms: [
      { id: 'hr-1', school_id: SCHOOL, hostel_id: 'hos-1', room_no: 'A-101', floor: '1', capacity: 4, occupied: 3 },
      { id: 'hr-2', school_id: SCHOOL, hostel_id: 'hos-1', room_no: 'A-102', floor: '1', capacity: 4, occupied: 4 },
      { id: 'hr-3', school_id: SCHOOL, hostel_id: 'hos-2', room_no: 'B-201', floor: '2', capacity: 3, occupied: 2 },
    ],
    hostel_allocations: [
      { id: 'ha-1', school_id: SCHOOL, student_id: 'stu-3', room_id: 'hr-1', allocated_on: date(-120) },
      { id: 'ha-2', school_id: SCHOOL, student_id: 'stu-5', room_id: 'hr-1', allocated_on: date(-90) },
    ],

    labs: [
      { id: 'lab-1', school_id: SCHOOL, name: 'Chemistry Lab', type: 'chemistry', room: 'S-101', in_charge: 'Dr. Anjali Verma', capacity: 30 },
      { id: 'lab-2', school_id: SCHOOL, name: 'Biology Lab', type: 'biology', room: 'S-102', in_charge: 'Mr. Suresh', capacity: 30 },
      { id: 'lab-3', school_id: SCHOOL, name: 'AI & Robotics Lab', type: 'robotics', room: 'T-201', in_charge: 'Ms. Sneha Rao', capacity: 24 },
    ],
    lab_equipment: [
      { id: 'le-1', school_id: SCHOOL, lab_id: 'lab-1', name: 'Bunsen burner', quantity: 20, unit: 'unit', reorder_level: 10, status: 'ok' },
      { id: 'le-2', school_id: SCHOOL, lab_id: 'lab-1', name: 'Litmus paper', quantity: 4, unit: 'box', reorder_level: 6, status: 'low' },
      { id: 'le-3', school_id: SCHOOL, lab_id: 'lab-2', name: 'Microscope', quantity: 15, unit: 'unit', reorder_level: 8, status: 'ok' },
      { id: 'le-4', school_id: SCHOOL, lab_id: 'lab-3', name: 'Arduino kit', quantity: 12, unit: 'kit', reorder_level: 10, status: 'ok' },
    ],
    lab_bookings: [
      { id: 'lb-1', school_id: SCHOOL, lab_id: 'lab-1', class_id: 'cls-6a', teacher_id: 'tch-3', date: date(0), period: 4, purpose: 'Acids & bases practical' },
    ],

    medical_records: [
      { id: 'mr-1', school_id: SCHOOL, student_id: 'stu-1', blood_group: 'O+', allergies: 'Peanuts', conditions: 'None', emergency_contact: '+91 99000 20001' },
      { id: 'mr-2', school_id: SCHOOL, student_id: 'stu-4', blood_group: 'B+', allergies: 'None', conditions: 'Asthma (mild)', emergency_contact: '+91 99000 20004' },
    ],
    infirmary_visits: [
      { id: 'iv-1', school_id: SCHOOL, student_id: 'stu-2', visited_at: iso(-1), symptoms: 'Headache', treatment: 'Rest + paracetamol', nurse: 'Sr. Mary', parent_notified: true },
      { id: 'iv-2', school_id: SCHOOL, student_id: 'stu-5', visited_at: iso(0), symptoms: 'Minor cut', treatment: 'Dressing', nurse: 'Sr. Mary', parent_notified: false },
    ],

    appointments: [
      { id: 'ap-1', school_id: SCHOOL, requester_name: 'Rohan Gupta', requester_email: 'rohan.gupta@example.com', with_role: 'principal', purpose: 'Discuss admission for sibling', scheduled_at: iso(1), status: 'scheduled', meet_link: 'https://meet.google.com/abc-defg-hij' },
      { id: 'ap-2', school_id: SCHOOL, requester_name: 'Nisha Patel', requester_phone: '+91 99000 20004', with_role: 'accountant', purpose: 'Fee installment plan', status: 'requested' },
    ],

    departments: [
      { id: 'dep-1', school_id: SCHOOL, name: 'Academics' }, { id: 'dep-2', school_id: SCHOOL, name: 'Administration' },
      { id: 'dep-3', school_id: SCHOOL, name: 'Transport' }, { id: 'dep-4', school_id: SCHOOL, name: 'Support Staff' },
    ],
    staff: [
      { id: 'stf-1', school_id: SCHOOL, full_name: 'Priya Sharma', role: 'Teacher', department: 'Academics', email: 'priya.sharma@wellspire.school', phone: '+91 98200 10001', employment_type: 'full_time', salary: 55000, date_of_join: '2019-06-10', active: true },
      { id: 'stf-2', school_id: SCHOOL, full_name: 'Ramesh Yadav', role: 'Driver', department: 'Transport', phone: '+91 90000 11111', employment_type: 'full_time', salary: 22000, date_of_join: '2021-04-01', active: true },
      { id: 'stf-3', school_id: SCHOOL, full_name: 'Lakshmi Devi', role: 'Housekeeping', department: 'Support Staff', phone: '+91 90000 66666', employment_type: 'full_time', salary: 15000, date_of_join: '2022-01-15', active: true },
      { id: 'stf-4', school_id: SCHOOL, full_name: 'Sr. Mary Thomas', role: 'School Nurse', department: 'Administration', phone: '+91 90000 77777', employment_type: 'full_time', salary: 32000, date_of_join: '2020-07-01', active: true },
    ],
    leave_requests: [
      { id: 'lr-1', school_id: SCHOOL, staff_name: 'Priya Sharma', type: 'casual', from_date: date(3), to_date: date(4), reason: 'Family function', status: 'pending' },
      { id: 'lr-2', school_id: SCHOOL, staff_name: 'Ramesh Yadav', type: 'sick', from_date: date(-2), to_date: date(-1), reason: 'Fever', status: 'approved' },
    ],

    leads: [
      { id: 'ld-1', school_id: SCHOOL, parent_name: 'Arjun Rao', child_name: 'Ira Rao', grade: 'Nursery', phone: '+91 98111 00001', email: 'arjun@example.com', source: 'website', stage: 'new', owner: 'Front Desk', next_action_at: iso(1), notes: 'Enquired via website form' },
      { id: 'ld-2', school_id: SCHOOL, parent_name: 'Fatima Sheikh', child_name: 'Zoya', grade: 'Grade 1', phone: '+91 98111 00002', source: 'referral', stage: 'toured', owner: 'Admissions', notes: 'Visited campus, positive' },
      { id: 'ld-3', school_id: SCHOOL, parent_name: 'David Miller', child_name: 'Ethan', grade: 'Grade 3', phone: '+91 98111 00003', source: 'instagram', stage: 'applied', owner: 'Admissions' },
    ],
    campaigns: [
      { id: 'cmp-1', school_id: SCHOOL, name: 'Admissions 2026 — Facebook', channel: 'facebook', status: 'active', budget: 50000, leads_generated: 42, spend: 31000, starts_on: date(-20), ends_on: date(20) },
      { id: 'cmp-2', school_id: SCHOOL, name: 'Open House — Instagram', channel: 'instagram', status: 'active', budget: 25000, leads_generated: 18, spend: 12000, starts_on: date(-10), ends_on: date(10) },
    ],

    facility_logs: [
      { id: 'fl-1', school_id: SCHOOL, facility: 'washroom', location: 'Block A · Ground floor', status: 'clean', cleaned_by: 'Lakshmi Devi', photo_url: null, note: 'Restocked supplies', logged_at: iso(0) },
      { id: 'fl-2', school_id: SCHOOL, facility: 'washroom', location: 'Block B · 1st floor', status: 'needs_attention', cleaned_by: 'Lakshmi Devi', photo_url: null, note: 'Reported low water', logged_at: iso(0) },
      { id: 'fl-3', school_id: SCHOOL, facility: 'classroom', location: 'R-201', status: 'clean', cleaned_by: 'Ravi', photo_url: null, logged_at: iso(-1) },
    ],

    ai_agents: [
      { id: 'ag-1', school_id: SCHOOL, key: 'marketing', name: 'Marketing Copywriter', category: 'Growth', description: 'Drafts admissions ads, posts and emails in the school voice.', enabled: true },
      { id: 'ag-2', school_id: SCHOOL, key: 'sales', name: 'Admissions / Sales Assistant', category: 'Growth', description: 'Qualifies leads and suggests the next best action.', enabled: true },
      { id: 'ag-3', school_id: SCHOOL, key: 'hr', name: 'HR Assistant', category: 'Operations', description: 'Drafts JDs, offer letters and policy answers.', enabled: true },
      { id: 'ag-4', school_id: SCHOOL, key: 'teacher_fit', name: 'Teacher Compatibility', category: 'People', description: 'Matches teachers to classes by subject, load and fit.', enabled: true },
      { id: 'ag-5', school_id: SCHOOL, key: 'timetable', name: 'Timetable Architect', category: 'Operations', description: 'Generates conflict-free timetables (see Timetable module).', enabled: true },
      { id: 'ag-6', school_id: SCHOOL, key: 'principal', name: 'Principal Copilot', category: 'Leadership', description: 'Summarises the school day and flags what needs attention.', enabled: true },
    ],
    ai_runs: [],

    // ---------------------------------------------------------------------
    // Student learning: CBSE syllabus, study material & interactive tests
    // ---------------------------------------------------------------------
    ...buildLearnData(),
  };
}

export default buildMockData;
