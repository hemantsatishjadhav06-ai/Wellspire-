import React, { useEffect, useState } from 'react';
import {
  BookOpen, FileText, PlayCircle, ClipboardList, GraduationCap, ExternalLink,
  Clock, Sparkles, Loader2,
} from 'lucide-react';
import { Badge, PageHeader, EmptyState, ErrorNote } from '../components/ui.jsx';
import api from '../lib/api.js';

// Full class strings (Tailwind can't see interpolated class names, so we map
// each tone to a complete literal string it can pick up during the content scan).
const TONE = {
  indigo: 'bg-indigo-50 text-indigo-700',
  emerald: 'bg-emerald-50 text-emerald-700',
  sky: 'bg-sky-50 text-sky-700',
  amber: 'bg-amber-50 text-amber-700',
  rose: 'bg-rose-50 text-rose-700',
  violet: 'bg-violet-50 text-violet-700',
  teal: 'bg-teal-50 text-teal-700',
  slate: 'bg-slate-100 text-slate-600',
  brand: 'bg-brand-50 text-brand-700',
};
const SUBJECT_TONE = {
  Mathematics: 'indigo', Science: 'emerald', English: 'sky', 'Social Science': 'amber',
  EVS: 'teal', Hindi: 'rose', 'Computer Science': 'violet',
};
const MAT_META = {
  notes: { icon: FileText, tone: 'sky', badge: 'sky', label: 'Notes' },
  video: { icon: PlayCircle, tone: 'rose', badge: 'rose', label: 'Video' },
  worksheet: { icon: ClipboardList, tone: 'amber', badge: 'amber', label: 'Worksheet' },
  pdf: { icon: FileText, tone: 'slate', badge: 'slate', label: 'PDF' },
  link: { icon: ExternalLink, tone: 'violet', badge: 'violet', label: 'Link' },
};

export default function Learn() {
  const [catalog, setCatalog] = useState(null);
  const [grade, setGrade] = useState('');
  const [subject, setSubject] = useState('');
  const [syllabus, setSyllabus] = useState([]);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  useEffect(() => {
    api.get('/learn/catalog').then((c) => {
      setCatalog(c);
      setGrade(c.grades[0] || '');
    }).catch((e) => setErr(e.message));
  }, []);

  useEffect(() => {
    if (!catalog || !grade) return;
    const subs = catalog.subjectsByGrade[grade] || [];
    setSubject((s) => (subs.includes(s) ? s : subs[0] || ''));
  }, [grade, catalog]);

  useEffect(() => {
    if (!grade || !subject) return;
    setLoading(true); setErr(null);
    Promise.all([
      api.get('/syllabus', { grade, subject }),
      api.get('/study-materials', { grade, subject }),
    ]).then(([s, m]) => {
      setSyllabus(s.data || []);
      setMaterials(m.data || []);
    }).catch((e) => setErr(e.message)).finally(() => setLoading(false));
  }, [grade, subject]);

  if (err && !catalog) return <ErrorNote error={err} />;
  if (!catalog) return <div className="grid h-64 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>;

  const subjects = catalog.subjectsByGrade[grade] || [];
  const tone = TONE[SUBJECT_TONE[subject]] || TONE.brand;

  return (
    <div className="space-y-6">
      <PageHeader title="Learn · CBSE Curriculum"
        subtitle="Chapter-wise syllabus and study material, aligned to the NCERT / CBSE textbooks." />

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Grade</span>
        {catalog.grades.map((g) => (
          <button key={g} onClick={() => setGrade(g)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-semibold transition ${
              grade === g ? 'bg-brand-600 text-white shadow-soft' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-brand-300'}`}>
            Class {g}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-bold uppercase tracking-wider text-slate-400">Subject</span>
        {subjects.map((s) => (
          <button key={s} onClick={() => setSubject(s)}
            className={`rounded-xl px-3.5 py-1.5 text-sm font-medium transition ${
              subject === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:ring-slate-300'}`}>
            {s}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="grid h-48 place-items-center"><Loader2 className="h-6 w-6 animate-spin text-brand-500" /></div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="mb-3 flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-800">{subject} · Syllabus</h2>
              <Badge color="brand">CBSE</Badge>
              <span className="text-sm text-slate-400">{syllabus.length} chapters</span>
            </div>
            {syllabus.length === 0 ? (
              <EmptyState title="No chapters yet" hint="Pick another grade or subject." />
            ) : (
              <ol className="space-y-3">
                {syllabus.map((ch) => (
                  <li key={ch.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-bold ${tone}`}>
                        {ch.chapter_no}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold text-slate-800">{ch.title}</p>
                          <Badge color="slate">{ch.term}</Badge>
                        </div>
                        {ch.topics?.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {ch.topics.map((t) => (
                              <span key={t} className="rounded-lg bg-slate-50 px-2 py-0.5 text-xs text-slate-500 ring-1 ring-slate-100">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div>
            <div className="mb-3 flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-brand-600" />
              <h2 className="text-lg font-bold text-slate-800">Study material</h2>
              <span className="text-sm text-slate-400">{materials.length}</span>
            </div>
            {materials.length === 0 ? (
              <EmptyState title="No material yet" hint="Study resources will appear here." />
            ) : (
              <div className="space-y-3">
                {materials.map((m) => {
                  const meta = MAT_META[m.type] || MAT_META.link;
                  const Icon = meta.icon;
                  return (
                    <a key={m.id} href={m.url} target="_blank" rel="noreferrer"
                      className="group flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm transition hover:border-brand-300 hover:shadow-soft">
                      <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${TONE[meta.tone]}`}>
                        <Icon className="h-5 w-5" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <Badge color={meta.badge}>{meta.label}</Badge>
                          {m.minutes ? <span className="flex items-center gap-1 text-xs text-slate-400"><Clock className="h-3 w-3" />{m.minutes} min</span> : null}
                        </div>
                        <p className="mt-1 font-semibold text-slate-800 group-hover:text-brand-700">{m.title}</p>
                        <p className="mt-0.5 text-sm text-slate-500">{m.description}</p>
                      </div>
                      <ExternalLink className="mt-1 h-4 w-4 shrink-0 text-slate-300 group-hover:text-brand-500" />
                    </a>
                  );
                })}
              </div>
            )}

            <div className="mt-5 flex items-start gap-3 rounded-2xl bg-gradient-to-br from-brand-50 to-emerald-50 p-4 ring-1 ring-brand-100">
              <Sparkles className="mt-0.5 h-5 w-5 text-brand-600" />
              <div>
                <p className="text-sm font-semibold text-slate-800">Ready to test yourself?</p>
                <p className="text-sm text-slate-500">Head to <span className="font-medium text-brand-700">Tests</span> for interactive, auto-graded quizzes on these chapters.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
