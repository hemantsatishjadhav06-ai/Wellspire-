import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Trophy, Timer, CheckCircle2, XCircle, ChevronLeft, ChevronRight, RotateCcw,
  Play, Loader2, Medal, Sparkles, ListChecks, ArrowLeft,
} from 'lucide-react';
import { Badge, PageHeader, EmptyState, ErrorNote } from '../components/ui.jsx';
import { useAuth } from '../lib/auth.jsx';
import api from '../lib/api.js';

const DIFF = { easy: 'emerald', medium: 'amber', hard: 'rose' };
const SUBJECT_TONE = {
  Mathematics: 'bg-indigo-50 text-indigo-700', Science: 'bg-emerald-50 text-emerald-700',
  English: 'bg-sky-50 text-sky-700', 'Social Science': 'bg-amber-50 text-amber-700',
  EVS: 'bg-teal-50 text-teal-700',
};
const BADGE_MEDAL = {
  gold: { emoji: '🥇', label: 'Gold', ring: 'ring-yellow-300 bg-yellow-50 text-yellow-700' },
  silver: { emoji: '🥈', label: 'Silver', ring: 'ring-slate-300 bg-slate-50 text-slate-700' },
  bronze: { emoji: '🥉', label: 'Bronze', ring: 'ring-amber-300 bg-amber-50 text-amber-700' },
  none: { emoji: '📗', label: 'Keep practising', ring: 'ring-slate-200 bg-slate-50 text-slate-600' },
};

const fmtTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

export default function Tests() {
  const { profile } = useAuth();
  const [view, setView] = useState('hub'); // hub | taking | result
  const [quizzes, setQuizzes] = useState(null);
  const [grade, setGrade] = useState('');
  const [err, setErr] = useState(null);

  // active quiz state
  const [quiz, setQuiz] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [cur, setCur] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [busy, setBusy] = useState(false);
  const submittedRef = useRef(false);

  useEffect(() => {
    api.get('/quizzes').then((r) => setQuizzes(r.data || [])).catch((e) => setErr(e.message));
  }, []);

  const grades = useMemo(() => [...new Set((quizzes || []).map((q) => q.grade))].sort(), [quizzes]);
  const shown = (quizzes || []).filter((q) => !grade || q.grade === grade);

  async function startQuiz(id) {
    setBusy(true); setErr(null);
    try {
      const full = await api.get(`/quizzes/${id}`);
      setQuiz(full);
      setAnswers(new Array(full.questions.length).fill(null));
      setCur(0);
      setTimeLeft(full.duration_sec || 300);
      setResult(null);
      submittedRef.current = false;
      setView('taking');
    } catch (e) { setErr(e.message); } finally { setBusy(false); }
  }

  // Countdown; auto-submit at zero.
  useEffect(() => {
    if (view !== 'taking') return;
    if (timeLeft <= 0) { submit(); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [view, timeLeft]);

  async function submit() {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setBusy(true);
    try {
      const used = (quiz.duration_sec || 300) - timeLeft;
      const res = await api.post(`/quizzes/${quiz.id}/submit`, {
        answers, duration_sec: Math.max(0, used), student_name: profile?.full_name || undefined,
      });
      setResult(res);
      setView('result');
      api.get(`/quizzes/${quiz.id}/leaderboard`).then((r) => setLeaderboard(r.data || [])).catch(() => {});
    } catch (e) { setErr(e.message); submittedRef.current = false; } finally { setBusy(false); }
  }

  if (err && !quizzes) return <ErrorNote error={err} />;
  if (!quizzes) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>;

  if (view === 'taking' && quiz) {
    return <TakingView {...{ quiz, answers, setAnswers, cur, setCur, timeLeft, submit, busy }} />;
  }
  if (view === 'result' && result) {
    return <ResultView {...{ quiz, result, leaderboard, onRetake: () => startQuiz(quiz.id), onBack: () => setView('hub') }} />;
  }

  // ---- Hub ----
  return (
    <div className="space-y-6">
      <PageHeader title="Tests · Practice & Compete"
        subtitle="Interactive, auto-graded quizzes with instant feedback, badges and a leaderboard." />

      {grades.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Grade</span>
          <button onClick={() => setGrade('')}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${!grade ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>All</button>
          {grades.map((g) => (
            <button key={g} onClick={() => setGrade(g)}
              className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${grade === g ? 'bg-brand-600 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200'}`}>Class {g}</button>
          ))}
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState title="No tests yet" hint="Quizzes will appear here." />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((q) => (
            <div key={q.id} className="flex flex-col rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:shadow-soft">
              <div className="flex items-center justify-between">
                <span className={`rounded-lg px-2 py-0.5 text-xs font-semibold ${SUBJECT_TONE[q.subject] || 'bg-slate-100 text-slate-600'}`}>{q.subject}</span>
                <Badge color={DIFF[q.difficulty] || 'slate'}>{q.difficulty}</Badge>
              </div>
              <h3 className="mt-3 text-lg font-bold text-slate-800">{q.title}</h3>
              <p className="mt-1 flex-1 text-sm text-slate-500">{q.description}</p>
              <div className="mt-4 flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1"><ListChecks className="h-4 w-4" />{q.question_count} questions</span>
                <span className="flex items-center gap-1"><Timer className="h-4 w-4" />{Math.round((q.duration_sec || 300) / 60)} min</span>
                <span>Class {q.grade}</span>
              </div>
              <button onClick={() => startQuiz(q.id)} disabled={busy}
                className="btn-primary mt-4 w-full justify-center disabled:opacity-60">
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Play className="h-4 w-4" /> Start test</>}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TakingView({ quiz, answers, setAnswers, cur, setCur, timeLeft, submit, busy }) {
  const q = quiz.questions[cur];
  const answered = answers.filter((a) => a !== null).length;
  const low = timeLeft <= 15;
  const pick = (i) => setAnswers((prev) => prev.map((a, idx) => (idx === cur ? i : a)));

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* header: progress + timer */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-800">{quiz.title}</h1>
          <p className="text-sm text-slate-400">{quiz.subject} · Class {quiz.grade}</p>
        </div>
        <div className={`flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-bold tabular-nums ${low ? 'bg-rose-50 text-rose-600 animate-pulse' : 'bg-slate-100 text-slate-700'}`}>
          <Timer className="h-4 w-4" /> {fmtTime(timeLeft)}
        </div>
      </div>

      {/* progress bar */}
      <div>
        <div className="mb-1 flex justify-between text-xs text-slate-400">
          <span>Question {cur + 1} of {quiz.questions.length}</span>
          <span>{answered} answered</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-brand-500 transition-all" style={{ width: `${((cur + 1) / quiz.questions.length) * 100}%` }} />
        </div>
      </div>

      {/* question */}
      <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm">
        <p className="text-lg font-semibold text-slate-800">{q.prompt}</p>
        <div className="mt-4 space-y-2.5">
          {q.options.map((opt, i) => {
            const active = answers[cur] === i;
            return (
              <button key={i} onClick={() => pick(i)}
                className={`flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                  active ? 'border-brand-500 bg-brand-50 font-semibold text-brand-800 ring-1 ring-brand-500'
                         : 'border-slate-200 bg-white text-slate-700 hover:border-brand-300 hover:bg-slate-50'}`}>
                <span className={`grid h-6 w-6 shrink-0 place-items-center rounded-full text-xs font-bold ${active ? 'bg-brand-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                  {String.fromCharCode(65 + i)}
                </span>
                {opt}
              </button>
            );
          })}
        </div>
      </div>

      {/* question navigator dots */}
      <div className="flex flex-wrap gap-1.5">
        {quiz.questions.map((_, i) => (
          <button key={i} onClick={() => setCur(i)}
            className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
              i === cur ? 'bg-slate-900 text-white' : answers[i] !== null ? 'bg-brand-100 text-brand-700' : 'bg-slate-100 text-slate-400'}`}>
            {i + 1}
          </button>
        ))}
      </div>

      {/* controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => setCur((c) => Math.max(0, c - 1))} disabled={cur === 0}
          className="btn-outline disabled:opacity-40"><ChevronLeft className="h-4 w-4" /> Prev</button>
        {cur < quiz.questions.length - 1 ? (
          <button onClick={() => setCur((c) => Math.min(quiz.questions.length - 1, c + 1))} className="btn-primary">Next <ChevronRight className="h-4 w-4" /></button>
        ) : (
          <button onClick={submit} disabled={busy} className="btn-primary bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60">
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><CheckCircle2 className="h-4 w-4" /> Submit test</>}
          </button>
        )}
      </div>
    </div>
  );
}

function ResultView({ quiz, result, leaderboard, onRetake, onBack }) {
  const medal = BADGE_MEDAL[result.badge] || BADGE_MEDAL.none;
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <button onClick={onBack} className="flex items-center gap-1 text-sm font-medium text-slate-500 hover:text-slate-800"><ArrowLeft className="h-4 w-4" /> All tests</button>

      {/* score hero */}
      <div className="animate-fade-in rounded-3xl border border-slate-100 bg-gradient-to-br from-white to-brand-50 p-8 text-center shadow-sm">
        <div className={`mx-auto mb-3 grid h-20 w-20 place-items-center rounded-full text-4xl ring-4 ${medal.ring}`}>{medal.emoji}</div>
        <p className="text-sm font-semibold uppercase tracking-wider text-slate-400">{quiz.title}</p>
        <p className="mt-1 text-5xl font-black text-slate-900">{result.percent}%</p>
        <p className="mt-1 text-slate-500">You scored <span className="font-bold text-slate-800">{result.score}</span> / {result.total} · <span className="font-semibold">{medal.label}</span></p>
        <div className="mt-5 flex justify-center gap-3">
          <button onClick={onRetake} className="btn-outline"><RotateCcw className="h-4 w-4" /> Retake</button>
          <button onClick={onBack} className="btn-primary"><Sparkles className="h-4 w-4" /> More tests</button>
        </div>
      </div>

      {/* review */}
      <div>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800"><ListChecks className="h-5 w-5 text-brand-600" /> Review & explanations</h2>
        <div className="space-y-3">
          {result.review.map((r, i) => (
            <div key={r.id} className={`rounded-2xl border p-4 ${r.correct ? 'border-emerald-100 bg-emerald-50/40' : 'border-rose-100 bg-rose-50/40'}`}>
              <div className="flex items-start gap-2">
                {r.correct ? <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" /> : <XCircle className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />}
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-800">{i + 1}. {r.prompt}</p>
                  <div className="mt-2 space-y-1 text-sm">
                    {r.options.map((opt, oi) => {
                      const isCorrect = oi === r.correct_index;
                      const isChosen = oi === r.chosen;
                      return (
                        <p key={oi} className={`rounded-lg px-2.5 py-1 ${
                          isCorrect ? 'bg-emerald-100 font-semibold text-emerald-800'
                          : isChosen ? 'bg-rose-100 text-rose-800 line-through' : 'text-slate-500'}`}>
                          {String.fromCharCode(65 + oi)}. {opt}
                          {isCorrect ? ' ✓' : isChosen ? ' ✗ (your answer)' : ''}
                        </p>
                      );
                    })}
                  </div>
                  {r.explanation && <p className="mt-2 rounded-lg bg-white/70 px-3 py-2 text-sm text-slate-600"><span className="font-semibold text-slate-700">Why: </span>{r.explanation}</p>}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* leaderboard */}
      {leaderboard.length > 0 && (
        <div>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800"><Trophy className="h-5 w-5 text-amber-500" /> Leaderboard</h2>
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm">
            {leaderboard.map((r) => (
              <div key={r.rank} className="flex items-center gap-3 border-b border-slate-50 px-4 py-2.5 last:border-0">
                <span className={`grid h-7 w-7 place-items-center rounded-full text-xs font-bold ${r.rank <= 3 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>{r.rank}</span>
                <span className="flex-1 font-medium text-slate-700">{r.student_name}</span>
                {r.badge && r.badge !== 'none' && <Medal className="h-4 w-4 text-amber-500" />}
                <span className="font-bold text-slate-800">{r.percent}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
