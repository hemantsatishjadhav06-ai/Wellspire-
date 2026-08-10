// In-memory sample dataset used when Supabase isn't configured (DEMO mode).
// Mirrors supabase/migrations/0004_seed.sql so the deployed app looks alive
// immediately. Writes during a session persist in these arrays until restart.
import config from '../config.js';

const SCHOOL = config.defaultSchoolId;
const day = 24 * 60 * 60 * 1000;
const iso = (offsetDays = 0) => new Date(Date.now() + offsetDays * day).toISOString();
const date = (offsetDays = 0) => iso(offsetDays).slice(0, 10);

export function buildMockData() {
  return {
    schools: [
      {
        id: SCHOOL,
        name: 'Wellspire International School',
        code: 'WELLSPIRE',
        address: '12 Learning Avenue, Pune, MH 411001',
        phone: '+91 20 1234 5678',
        email: 'office@wellspire.school',
        timezone: 'Asia/Kolkata',
        currency: 'INR',
        settings: {},
        created_at: iso(-400),
        updated_at: iso(-1),
      },
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
    attendance: [],

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
  };
}

export default buildMockData;
