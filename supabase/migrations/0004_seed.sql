-- ============================================================================
-- Wellspire SMS — Seed data (safe to run once on a fresh project)
-- Migration 0004: a realistic starter dataset so the app is alive immediately.
-- Uses deterministic UUIDs + ON CONFLICT so it is idempotent.
-- ============================================================================

-- School ---------------------------------------------------------------------
insert into schools (id, name, code, address, phone, email, timezone, currency)
values ('11111111-1111-1111-1111-111111111111',
        'Wellspire International School', 'WELLSPIRE',
        '12 Learning Avenue, Pune, MH 411001', '+91 20 1234 5678',
        'office@wellspire.school', 'Asia/Kolkata', 'INR')
on conflict (id) do nothing;

-- Academic year --------------------------------------------------------------
insert into academic_years (id, school_id, name, start_date, end_date, is_current)
values ('22222222-2222-2222-2222-222222222001',
        '11111111-1111-1111-1111-111111111111',
        '2025-2026', '2025-06-01', '2026-04-30', true)
on conflict (id) do nothing;

-- Subjects -------------------------------------------------------------------
insert into subjects (id, school_id, name, code, color) values
 ('33333333-3333-3333-3333-333333333001','11111111-1111-1111-1111-111111111111','Mathematics','MATH','#6366f1'),
 ('33333333-3333-3333-3333-333333333002','11111111-1111-1111-1111-111111111111','English','ENG','#0ea5e9'),
 ('33333333-3333-3333-3333-333333333003','11111111-1111-1111-1111-111111111111','Science','SCI','#22c55e'),
 ('33333333-3333-3333-3333-333333333004','11111111-1111-1111-1111-111111111111','Social Studies','SST','#f59e0b'),
 ('33333333-3333-3333-3333-333333333005','11111111-1111-1111-1111-111111111111','Computer Science','CS','#8b5cf6'),
 ('33333333-3333-3333-3333-333333333006','11111111-1111-1111-1111-111111111111','Physical Education','PE','#ef4444')
on conflict (id) do nothing;

-- Teachers -------------------------------------------------------------------
insert into teachers (id, school_id, employee_code, full_name, email, phone, qualification, date_of_join, subjects) values
 ('44444444-4444-4444-4444-444444444001','11111111-1111-1111-1111-111111111111','T-001','Priya Sharma','priya.sharma@wellspire.school','+91 98200 10001','M.Sc Mathematics','2019-06-10','{33333333-3333-3333-3333-333333333001}'),
 ('44444444-4444-4444-4444-444444444002','11111111-1111-1111-1111-111111111111','T-002','Rahul Menon','rahul.menon@wellspire.school','+91 98200 10002','M.A English','2020-06-15','{33333333-3333-3333-3333-333333333002}'),
 ('44444444-4444-4444-4444-444444444003','11111111-1111-1111-1111-111111111111','T-003','Anjali Verma','anjali.verma@wellspire.school','+91 98200 10003','M.Sc Physics','2018-06-12','{33333333-3333-3333-3333-333333333003}'),
 ('44444444-4444-4444-4444-444444444004','11111111-1111-1111-1111-111111111111','T-004','Imran Khan','imran.khan@wellspire.school','+91 98200 10004','M.A History','2021-06-20','{33333333-3333-3333-3333-333333333004}'),
 ('44444444-4444-4444-4444-444444444005','11111111-1111-1111-1111-111111111111','T-005','Sneha Rao','sneha.rao@wellspire.school','+91 98200 10005','B.Tech Computer Science','2022-06-05','{33333333-3333-3333-3333-333333333005}')
on conflict (id) do nothing;

-- Classes --------------------------------------------------------------------
insert into classes (id, school_id, academic_year_id, grade, section, room, class_teacher_id, capacity) values
 ('55555555-5555-5555-5555-555555555001','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222001','5','A','R-201','44444444-4444-4444-4444-444444444001',35),
 ('55555555-5555-5555-5555-555555555002','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222001','5','B','R-202','44444444-4444-4444-4444-444444444002',35),
 ('55555555-5555-5555-5555-555555555003','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222001','6','A','R-301','44444444-4444-4444-4444-444444444003',35)
on conflict (id) do nothing;

-- Students -------------------------------------------------------------------
insert into students (id, school_id, admission_no, roll_no, full_name, gender, date_of_birth, class_id) values
 ('66666666-6666-6666-6666-666666666001','11111111-1111-1111-1111-111111111111','ADM-2025-001','1','Aarav Gupta','male','2015-03-14','55555555-5555-5555-5555-555555555001'),
 ('66666666-6666-6666-6666-666666666002','11111111-1111-1111-1111-111111111111','ADM-2025-002','2','Diya Nair','female','2015-07-22','55555555-5555-5555-5555-555555555001'),
 ('66666666-6666-6666-6666-666666666003','11111111-1111-1111-1111-111111111111','ADM-2025-003','3','Kabir Singh','male','2015-01-09','55555555-5555-5555-5555-555555555001'),
 ('66666666-6666-6666-6666-666666666004','11111111-1111-1111-1111-111111111111','ADM-2025-004','1','Isha Patel','female','2015-11-30','55555555-5555-5555-5555-555555555002'),
 ('66666666-6666-6666-6666-666666666005','11111111-1111-1111-1111-111111111111','ADM-2025-005','2','Vivaan Joshi','male','2015-05-18','55555555-5555-5555-5555-555555555002'),
 ('66666666-6666-6666-6666-666666666006','11111111-1111-1111-1111-111111111111','ADM-2025-006','1','Ananya Reddy','female','2014-09-25','55555555-5555-5555-5555-555555555003'),
 ('66666666-6666-6666-6666-666666666007','11111111-1111-1111-1111-111111111111','ADM-2025-007','2','Arjun Iyer','male','2014-12-02','55555555-5555-5555-5555-555555555003')
on conflict (id) do nothing;

-- Guardians ------------------------------------------------------------------
insert into guardians (id, school_id, full_name, email, phone, occupation) values
 ('77777777-7777-7777-7777-777777777001','11111111-1111-1111-1111-111111111111','Rohan Gupta','rohan.gupta@example.com','+91 99000 20001','Engineer'),
 ('77777777-7777-7777-7777-777777777002','11111111-1111-1111-1111-111111111111','Meera Nair','meera.nair@example.com','+91 99000 20002','Doctor'),
 ('77777777-7777-7777-7777-777777777003','11111111-1111-1111-1111-111111111111','Harpreet Singh','harpreet.singh@example.com','+91 99000 20003','Businessman'),
 ('77777777-7777-7777-7777-777777777004','11111111-1111-1111-1111-111111111111','Nisha Patel','nisha.patel@example.com','+91 99000 20004','Architect')
on conflict (id) do nothing;

insert into student_guardians (student_id, guardian_id, relationship, is_primary) values
 ('66666666-6666-6666-6666-666666666001','77777777-7777-7777-7777-777777777001','father',true),
 ('66666666-6666-6666-6666-666666666002','77777777-7777-7777-7777-777777777002','mother',true),
 ('66666666-6666-6666-6666-666666666003','77777777-7777-7777-7777-777777777003','father',true),
 ('66666666-6666-6666-6666-666666666004','77777777-7777-7777-7777-777777777004','mother',true)
on conflict do nothing;

-- Timetable (Grade 5-A, Mon–Fri, 6 periods) ----------------------------------
-- period times: P1 08:00, P2 08:50, P3 09:40, P4 10:50, P5 11:40, P6 12:30
insert into timetable_slots (school_id, class_id, subject_id, teacher_id, day_of_week, period, start_time, end_time, room)
select '11111111-1111-1111-1111-111111111111',
       '55555555-5555-5555-5555-555555555001',
       s.subject_id::uuid, s.teacher_id::uuid, s.dow, s.period,
       s.start_time::time, s.end_time::time, 'R-201'
from (values
  (1,1,'33333333-3333-3333-3333-333333333001','44444444-4444-4444-4444-444444444001','08:00','08:50'),
  (1,2,'33333333-3333-3333-3333-333333333002','44444444-4444-4444-4444-444444444002','08:50','09:40'),
  (1,3,'33333333-3333-3333-3333-333333333003','44444444-4444-4444-4444-444444444003','09:40','10:30'),
  (2,1,'33333333-3333-3333-3333-333333333002','44444444-4444-4444-4444-444444444002','08:00','08:50'),
  (2,2,'33333333-3333-3333-3333-333333333001','44444444-4444-4444-4444-444444444001','08:50','09:40'),
  (3,1,'33333333-3333-3333-3333-333333333005','44444444-4444-4444-4444-444444444005','08:00','08:50'),
  (3,2,'33333333-3333-3333-3333-333333333004','44444444-4444-4444-4444-444444444004','08:50','09:40'),
  (4,1,'33333333-3333-3333-3333-333333333003','44444444-4444-4444-4444-444444444003','08:00','08:50'),
  (5,1,'33333333-3333-3333-3333-333333333001','44444444-4444-4444-4444-444444444001','08:00','08:50')
) as s(dow, period, subject_id, teacher_id, start_time, end_time)
on conflict (class_id, day_of_week, period) do nothing;

-- Fee structures + invoices --------------------------------------------------
insert into fee_structures (id, school_id, academic_year_id, name, category, amount, frequency) values
 ('88888888-8888-8888-8888-888888888001','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222001','Term 1 Tuition','tuition',25000,'term'),
 ('88888888-8888-8888-8888-888888888002','11111111-1111-1111-1111-111111111111','22222222-2222-2222-2222-222222222001','Transport Fee','transport',6000,'term')
on conflict (id) do nothing;

-- One tuition invoice per student; amount_paid + status are derived from the
-- fee_payments below via the recompute trigger, so leave them at their defaults.
insert into fee_invoices (id, school_id, student_id, fee_structure_id, invoice_no, title, amount, due_date)
values
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001','11111111-1111-1111-1111-111111111111','66666666-6666-6666-6666-666666666001','88888888-8888-8888-8888-888888888001','INV-2025-0001','Term 1 Tuition',25000, current_date - 20),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002','11111111-1111-1111-1111-111111111111','66666666-6666-6666-6666-666666666002','88888888-8888-8888-8888-888888888001','INV-2025-0002','Term 1 Tuition',25000, current_date - 5),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0003','11111111-1111-1111-1111-111111111111','66666666-6666-6666-6666-666666666003','88888888-8888-8888-8888-888888888001','INV-2025-0003','Term 1 Tuition',25000, current_date + 3),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0004','11111111-1111-1111-1111-111111111111','66666666-6666-6666-6666-666666666004','88888888-8888-8888-8888-888888888001','INV-2025-0004','Term 1 Tuition',25000, current_date - 2),
 ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0005','11111111-1111-1111-1111-111111111111','66666666-6666-6666-6666-666666666005','88888888-8888-8888-8888-888888888001','INV-2025-0005','Term 1 Tuition',25000, current_date + 6)
on conflict (school_id, invoice_no) do nothing;

-- Payments drive amount_paid + status through the recompute trigger.
--   INV-0001 fully paid → 'paid';  INV-0002 part-paid + past due → 'overdue'.
insert into fee_payments (school_id, invoice_id, amount, method, paid_at) values
 ('11111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0001',25000,'upi',  now() - interval '20 days'),
 ('11111111-1111-1111-1111-111111111111','bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbb0002',10000,'cash', now() - interval '10 days')
on conflict do nothing;

-- Ensure any past-due unpaid invoices are flagged overdue.
select mark_overdue_invoices();

-- Library --------------------------------------------------------------------
insert into library_books (id, school_id, title, author, isbn, category, shelf, total_copies, available_copies) values
 ('99999999-9999-9999-9999-999999999001','11111111-1111-1111-1111-111111111111','The Jungle Book','Rudyard Kipling','9780141325293','fiction','A-1',5,5),
 ('99999999-9999-9999-9999-999999999002','11111111-1111-1111-1111-111111111111','A Brief History of Time','Stephen Hawking','9780553380163','science','C-3',3,3),
 ('99999999-9999-9999-9999-999999999003','11111111-1111-1111-1111-111111111111','Wings of Fire','A.P.J. Abdul Kalam','9788173711466','biography','B-2',4,4),
 ('99999999-9999-9999-9999-999999999004','11111111-1111-1111-1111-111111111111','Introduction to Algorithms','Cormen et al.','9780262033848','reference','D-1',2,2)
on conflict (id) do nothing;

insert into library_loans (school_id, book_id, student_id, borrower_name, issued_at, due_date, status) values
 ('11111111-1111-1111-1111-111111111111','99999999-9999-9999-9999-999999999001','66666666-6666-6666-6666-666666666001','Aarav Gupta', current_date - 20, current_date - 6,'overdue'),
 ('11111111-1111-1111-1111-111111111111','99999999-9999-9999-9999-999999999003','66666666-6666-6666-6666-666666666006','Ananya Reddy', current_date - 3, current_date + 11,'issued')
on conflict do nothing;

-- Inventory ------------------------------------------------------------------
insert into inventory_categories (id, school_id, name) values
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001','11111111-1111-1111-1111-111111111111','Stationery'),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002','11111111-1111-1111-1111-111111111111','Electronics'),
 ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003','11111111-1111-1111-1111-111111111111','Sports')
on conflict (id) do nothing;

insert into inventory_items (school_id, category_id, name, sku, unit, quantity, reorder_level, location, unit_cost, supplier) values
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001','A4 Paper Ream','STN-001','ream',8,20,'Store Room 1',280,'Paper Co.'),
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0001','Whiteboard Marker','STN-002','box',45,15,'Store Room 1',450,'OfficeMart'),
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0002','Projector','ELE-001','unit',6,3,'AV Store',42000,'TechWorld'),
 ('11111111-1111-1111-1111-111111111111','aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaa0003','Football','SPT-001','unit',4,10,'Sports Room',900,'SportsHub')
on conflict do nothing;

-- Announcement ---------------------------------------------------------------
insert into announcements (school_id, title, body, pinned)
values ('11111111-1111-1111-1111-111111111111','Welcome to the 2025-26 session',
        'Classes begin June 1st. Please ensure fee payments and book issuance are completed in the first week.', true)
on conflict do nothing;
