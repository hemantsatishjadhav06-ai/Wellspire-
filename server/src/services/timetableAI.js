// AI timetable generation.
//
// Given classes, subjects, teachers and constraints, produce a conflict-free
// weekly timetable. When OpenRouter is configured we ask the model to plan the
// grid; we then ALWAYS run a deterministic validator/repair pass so the output
// is guaranteed to have no teacher double-booking. Without OpenRouter, the
// deterministic generator alone produces a valid schedule.
import openrouter from '../lib/openrouter.js';
import logger from '../lib/logger.js';

const DAYS = [1, 2, 3, 4, 5]; // Mon–Fri
const PERIOD_TIMES = [
  ['08:00', '08:50'], ['08:50', '09:40'], ['09:40', '10:30'],
  ['10:50', '11:40'], ['11:40', '12:30'], ['12:30', '13:20'],
];

/**
 * @param {object} input
 * @param {Array} input.classes    [{id,name,room}]
 * @param {Array} input.subjects   [{id,name}]
 * @param {Array} input.teachers   [{id,full_name,subjects:[subjectId]}]
 * @param {object} [input.constraints] { periodsPerDay, weeklyLoad: {subjectId: count} }
 * @returns {Promise<{slots:Array, source:string, notes?:string}>}
 */
export async function generateTimetable(input) {
  const periodsPerDay = clamp(input?.constraints?.periodsPerDay || 5, 1, 6);

  if (openrouter.configured) {
    try {
      const aiGrid = await askModel(input, periodsPerDay);
      const slots = validateAndRepair(aiGrid, input, periodsPerDay);
      return { slots, source: 'openrouter+validator', notes: 'AI-planned, conflict-validated.' };
    } catch (err) {
      logger.warn(`Timetable AI failed, using deterministic generator: ${err.message}`);
    }
  }
  const slots = deterministicGenerate(input, periodsPerDay);
  return { slots, source: 'deterministic', notes: 'Generated locally (no AI key or AI unavailable).' };
}

async function askModel(input, periodsPerDay) {
  const sys =
    'You are a school timetabling engine. Produce a weekly timetable as strict JSON. ' +
    'Rules: no teacher may be in two classes in the same day+period; only assign a subject to a ' +
    'teacher who can teach it; spread each subject across the week. ' +
    'Return JSON: {"slots":[{"class_id","subject_id","teacher_id","day_of_week","period"}]}. ' +
    `day_of_week is 1-5 (Mon-Fri), period is 1-${periodsPerDay}.`;
  const user = JSON.stringify({
    classes: input.classes?.map((c) => ({ id: c.id, name: c.name })),
    subjects: input.subjects?.map((s) => ({ id: s.id, name: s.name })),
    teachers: input.teachers?.map((t) => ({ id: t.id, name: t.full_name, subjects: t.subjects })),
    constraints: { ...input.constraints, periodsPerDay },
  });
  const json = await openrouter.chatJSON(
    [{ role: 'system', content: sys }, { role: 'user', content: user }],
    { temperature: 0.2 }
  );
  if (!json?.slots) throw new Error('Model returned no slots');
  return json.slots;
}

// Guarantee a valid schedule: drop conflicting AI slots, then fill gaps.
function validateAndRepair(aiSlots, input, periodsPerDay) {
  const teacherForSubject = buildTeacherIndex(input);
  const busy = new Set(); // `${teacherId}:${day}:${period}`
  const filled = new Set(); // `${classId}:${day}:${period}`
  const out = [];

  for (const s of aiSlots || []) {
    if (!input.classes?.some((c) => c.id === s.class_id)) continue;
    if (s.day_of_week < 1 || s.day_of_week > 5) continue;
    if (s.period < 1 || s.period > periodsPerDay) continue;
    const cellKey = `${s.class_id}:${s.day_of_week}:${s.period}`;
    if (filled.has(cellKey)) continue;
    let teacherId = s.teacher_id;
    // ensure the teacher can teach this subject
    if (!teacherCanTeach(teacherId, s.subject_id, input)) {
      teacherId = pickTeacher(s.subject_id, teacherForSubject, busy, s.day_of_week, s.period);
    }
    if (!teacherId) continue;
    const tKey = `${teacherId}:${s.day_of_week}:${s.period}`;
    if (busy.has(tKey)) continue;
    busy.add(tKey);
    filled.add(cellKey);
    out.push(makeSlot(s.class_id, s.subject_id, teacherId, s.day_of_week, s.period, input));
  }

  // Fill any empty cells deterministically
  fillGaps(out, filled, busy, input, periodsPerDay, teacherForSubject);
  return out;
}

function deterministicGenerate(input, periodsPerDay) {
  const teacherForSubject = buildTeacherIndex(input);
  const busy = new Set();
  const filled = new Set();
  const out = [];
  fillGaps(out, filled, busy, input, periodsPerDay, teacherForSubject);
  return out;
}

// Round-robin subjects into each class's empty cells while respecting teacher availability.
function fillGaps(out, filled, busy, input, periodsPerDay, teacherForSubject) {
  const subjects = input.subjects || [];
  for (const cls of input.classes || []) {
    let subjIdx = 0;
    for (const day of DAYS) {
      for (let period = 1; period <= periodsPerDay; period++) {
        const cellKey = `${cls.id}:${day}:${period}`;
        if (filled.has(cellKey)) continue;
        // try subjects in rotation until we find an available teacher
        for (let attempt = 0; attempt < subjects.length; attempt++) {
          const subject = subjects[(subjIdx + attempt) % subjects.length];
          const teacherId = pickTeacher(subject.id, teacherForSubject, busy, day, period);
          if (teacherId) {
            busy.add(`${teacherId}:${day}:${period}`);
            filled.add(cellKey);
            out.push(makeSlot(cls.id, subject.id, teacherId, day, period, input));
            subjIdx = (subjIdx + attempt + 1) % Math.max(subjects.length, 1);
            break;
          }
        }
      }
    }
  }
}

function buildTeacherIndex(input) {
  const idx = {}; // subjectId -> [teacherId]
  for (const t of input.teachers || []) {
    for (const sid of t.subjects || []) {
      (idx[sid] ||= []).push(t.id);
    }
  }
  return idx;
}

function teacherCanTeach(teacherId, subjectId, input) {
  const t = (input.teachers || []).find((x) => x.id === teacherId);
  return Boolean(t && (t.subjects || []).includes(subjectId));
}

function pickTeacher(subjectId, teacherForSubject, busy, day, period) {
  const candidates = teacherForSubject[subjectId] || [];
  for (const tid of candidates) {
    if (!busy.has(`${tid}:${day}:${period}`)) return tid;
  }
  return null;
}

function makeSlot(class_id, subject_id, teacher_id, day_of_week, period, input) {
  const [start, end] = PERIOD_TIMES[period - 1] || ['08:00', '08:50'];
  const cls = (input.classes || []).find((c) => c.id === class_id);
  return {
    class_id,
    subject_id,
    teacher_id,
    day_of_week,
    period,
    start_time: start,
    end_time: end,
    room: cls?.room || null,
  };
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

export default { generateTimetable };
