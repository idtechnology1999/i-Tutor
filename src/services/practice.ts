import { useEffect, useState } from 'react';
import { api, isLive } from './api';
import { PRACTICE, cms, localQuestions } from '../lib/cms';
import type { CmsQuestion, CmsSubject, ExamType, QuestionDraft } from '../lib/cms';
import type { SyllabusChoice } from '../data/waec-syllabus';

/* The practice bank (Admin → Practice questions) and students' practice sets.
   Live, the server does the work (backend routes/practice.ts and
   routes/admin/practice.ts): the bank is paged, never loaded whole, and each
   practice set is a fresh random draw. Demo mode does the same with the
   questions held in this browser. */

export type RealExam = Exclude<ExamType, typeof PRACTICE>;
export type Source = 'practice' | 'past' | 'mix';

export interface PracticeSettings {
  exam: RealExam;
  source: Source;
  /** With 'mix': % of each set from past questions. */
  pastShare: number;
  size: number;
  syllabus: SyllabusChoice;
}

/** 'all' every practice question, '' the "All exams" ones, or one exam's. */
export type Target = 'all' | '' | RealExam;

export interface PracticePage {
  rows: CmsQuestion[];
  total: number;
  published: number;
  page: number;
  pages: number;
  topics: Array<{ topic: string; total: number; published: number }>;
}

const REAL: RealExam[] = ['UTME', 'WAEC', 'NECO', 'GCE', 'NABTEB', 'Post-UTME'];
const defaults = (exam: RealExam): PracticeSettings => ({
  exam,
  source: 'mix',
  pastShare: 30,
  size: 40,
  syllabus: exam === 'UTME' || exam === 'Post-UTME' ? 'jamb' : 'waec',
});

/* ------------------------------------------------------------- Demo store */

const DEMO_SETTINGS = 'itutor-practice-settings';
const demoSettings = (): PracticeSettings[] => {
  let saved: Partial<Record<RealExam, PracticeSettings>> = {};
  try {
    saved = JSON.parse(window.localStorage.getItem(DEMO_SETTINGS) ?? '{}') as typeof saved;
  } catch {
    /* defaults */
  }
  return REAL.map((e) => ({ ...defaults(e), ...saved[e], exam: e }));
};

const inTarget = (q: CmsQuestion, t: Target) => q.examType === PRACTICE && (t === 'all' || (q.target ?? '') === t);

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
}

/** n random questions, taken topic by topic in turn (as the server does). */
function spread(pool: CmsQuestion[], n: number): CmsQuestion[] {
  const byTopic = new Map<string, CmsQuestion[]>();
  for (const q of shuffle(pool)) byTopic.set(q.topic.toLowerCase(), [...(byTopic.get(q.topic.toLowerCase()) ?? []), q]);
  const queues = [...byTopic.values()];
  const out: CmsQuestion[] = [];
  while (out.length < n && queues.some((q) => q.length)) {
    for (const q of queues) {
      const next = q.shift();
      if (next) out.push(next);
      if (out.length === n) break;
    }
  }
  return out;
}

/* ---------------------------------------------------------------- Settings */

export async function getPracticeSettings(): Promise<PracticeSettings[]> {
  if (!isLive) return demoSettings();
  return api<PracticeSettings[]>('/api/admin/practice/settings');
}

export async function savePracticeSettings(s: PracticeSettings): Promise<PracticeSettings> {
  if (!isLive) {
    const all = Object.fromEntries(demoSettings().map((x) => [x.exam, x]));
    all[s.exam] = s;
    try {
      window.localStorage.setItem(DEMO_SETTINGS, JSON.stringify(all));
    } catch {
      /* not kept when storage is blocked */
    }
    return s;
  }
  const { exam, ...body } = s;
  return api<PracticeSettings>(`/api/admin/practice/settings/${encodeURIComponent(exam)}`, { method: 'PUT', body });
}

/* ------------------------------------------------------------ Admin: bank */

export async function listPractice(q: {
  target: Target;
  subject: CmsSubject;
  /** One topic, or every topic outside `syllabus` ("Other"). */
  topic?: string;
  notTopics?: string[];
  q?: string;
  status?: 'draft' | 'published';
  page: number;
  size?: number;
}): Promise<PracticePage> {
  const size = q.size ?? 50;
  if (!isLive) {
    const base = localQuestions().filter((x) => inTarget(x, q.target) && x.subject === q.subject);
    const term = q.q?.trim().toLowerCase();
    const matched = base.filter(
      (x) =>
        (q.topic !== undefined ? x.topic === q.topic : q.notTopics ? !q.notTopics.includes(x.topic) : true) &&
        (!q.status || x.status === q.status) &&
        (!term || `${x.question} ${x.topic}`.toLowerCase().includes(term)),
    );
    const per = new Map<string, { topic: string; total: number; published: number }>();
    for (const x of base) {
      const row = per.get(x.topic) ?? { topic: x.topic, total: 0, published: 0 };
      row.total += 1;
      if (x.status === 'published') row.published += 1;
      per.set(x.topic, row);
    }
    return {
      rows: matched.slice((q.page - 1) * size, q.page * size),
      total: matched.length,
      published: matched.filter((x) => x.status === 'published').length,
      page: q.page,
      pages: Math.max(1, Math.ceil(matched.length / size)),
      topics: [...per.values()],
    };
  }
  const params = new URLSearchParams({ target: q.target, subject: q.subject, page: String(q.page), size: String(size) });
  if (q.topic !== undefined) params.set('topic', q.topic);
  else if (q.notTopics?.length) params.set('notTopics', q.notTopics.join('|'));
  if (q.q?.trim()) params.set('q', q.q.trim());
  if (q.status) params.set('status', q.status);
  return api<PracticePage>(`/api/admin/practice/questions?${params}`);
}

export interface SubjectCount {
  subject: string;
  /** Practice-bank questions. */
  total: number;
  published: number;
  /** For one exam: its published past questions, which sets can mix in. */
  past?: number;
}

/** Totals per subject, for the subject picker. */
export async function practiceSummary(target: Target): Promise<SubjectCount[]> {
  if (!isLive) {
    const per = new Map<string, Required<SubjectCount>>();
    const rowOf = (subject: string) => {
      const row = per.get(subject) ?? { subject, total: 0, published: 0, past: 0 };
      per.set(subject, row);
      return row;
    };
    for (const x of localQuestions().filter((q) => inTarget(q, target))) {
      const row = rowOf(x.subject);
      row.total += 1;
      if (x.status === 'published') row.published += 1;
    }
    if (target !== 'all' && target !== '')
      for (const x of localQuestions()) if (x.examType === target && x.status === 'published') rowOf(x.subject).past += 1;
    return [...per.values()];
  }
  return api(`/api/admin/practice/summary?target=${encodeURIComponent(target)}`);
}

/* Changes: awaited here (live), so the page reloads once the server has them. */

export async function addPractice(drafts: QuestionDraft[], label: string): Promise<void> {
  if (!drafts.length) return;
  if (!isLive) {
    cms.addQuestions(drafts, label);
    return;
  }
  await api('/api/admin/questions', { method: 'POST', body: drafts, timeout: 60_000 });
}

export async function updatePractice(id: number, patch: Partial<QuestionDraft>): Promise<void> {
  if (!isLive) return cms.updateQuestion(id, patch);
  await api(`/api/admin/questions/${id}`, { method: 'PATCH', body: patch });
}

export async function setPracticeStatus(ids: number[], status: 'draft' | 'published'): Promise<void> {
  if (!ids.length) return;
  if (!isLive) return cms.setStatus(ids, status);
  await api('/api/admin/questions/status', { method: 'POST', body: { ids, status } });
}

export async function deletePractice(ids: number[]): Promise<void> {
  if (!ids.length) return;
  if (!isLive) return cms.deleteQuestions(ids);
  await api('/api/admin/questions', { method: 'DELETE', body: { ids } });
}

/* --------------------------------------------------------- Student: a set */

export interface PracticeSet {
  questions: CmsQuestion[];
  practice: number;
  past: number;
}

/** A fresh random practice set for one exam and subject (never the same twice). `from` overrides the exam's setting. */
export async function getPracticeSet(exam: RealExam, subject: string, size?: number, from?: Source): Promise<PracticeSet> {
  if (!isLive) {
    const saved = demoSettings().find((x) => x.exam === exam) ?? defaults(exam);
    const s = from ? { ...saved, source: from } : saved;
    const total = size ?? s.size;
    const live = localQuestions().filter((q) => q.status === 'published' && q.subject === subject);
    const practicePool = live.filter((q) => q.examType === PRACTICE && (!q.target || q.target === exam));
    const pastPool = live.filter((q) => q.examType === exam);
    const wantPast = s.source === 'past' ? total : s.source === 'practice' ? 0 : Math.round((total * s.pastShare) / 100);
    let past = spread(pastPool, wantPast);
    let practice = spread(practicePool, total - past.length);
    // Whichever side ran short, the other fills the gap.
    if (past.length + practice.length < total) past = [...past, ...spread(pastPool.filter((q) => !past.includes(q)), total - past.length - practice.length)];
    if (past.length + practice.length < total)
      practice = [...practice, ...spread(practicePool.filter((q) => !practice.includes(q)), total - past.length - practice.length)];
    return { questions: shuffle([...practice, ...past]), practice: practice.length, past: past.length };
  }
  const params = new URLSearchParams({ exam, subject, ...(size ? { size: String(size) } : {}), ...(from ? { from } : {}) });
  return api<PracticeSet>(`/api/practice/set?${params}`);
}


/* ------------------------------------------- Student: what's ready to practise */

export interface ExamCount {
  subject: string;
  past: number;
  practice: number;
}

/** Published questions per subject an exam's practice can draw on (past + its own and shared practice). */
export async function getExamCounts(exam: RealExam): Promise<ExamCount[]> {
  if (!isLive) {
    const per = new Map<string, ExamCount>();
    for (const q of localQuestions()) {
      if (q.status !== 'published') continue;
      const practice = q.examType === PRACTICE && (!q.target || q.target === exam);
      if (!practice && q.examType !== exam) continue;
      const row = per.get(q.subject) ?? { subject: q.subject, past: 0, practice: 0 };
      if (practice) row.practice += 1;
      else row.past += 1;
      per.set(q.subject, row);
    }
    return [...per.values()];
  }
  return api<ExamCount[]>(`/api/practice/counts?exam=${encodeURIComponent(exam)}`);
}

/** getExamCounts as a React hook: a count lookup by subject (0 until loaded). */
export function useExamCounts(exam: RealExam): (subject: string) => number {
  const [rows, setRows] = useState<ExamCount[]>([]);
  useEffect(() => {
    let live = true;
    getExamCounts(exam)
      .then((r) => live && setRows(r))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [exam]);
  return (subject) => {
    const row = rows.find((r) => r.subject === subject);
    return row ? row.past + row.practice : 0;
  };
}
