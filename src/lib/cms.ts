import { useSyncExternalStore } from 'react';
import type { DiagnosticQuestion } from '../types';
import { DIAGNOSTIC_QUESTIONS } from '../data/nigerian-curriculum';
import { NEWS } from '../data/news';
import type { NewsItem } from '../data/news';
import { COURSE_SEED, FACULTY_SET_SEED } from '../data/courses';
import type { CourseExam, FacultySet } from '../data/courses';

export type { FacultySet };
import { NIGERIAN_INSTITUTIONS } from '../data/nigerian-curriculum';

/* -----------------------------------------------------------------------------
   Content store for the admin CMS and the student pages.

   Persists to localStorage, so it works with no backend: what an admin
   publishes shows up for students *in the same browser*. For a live site,
   swap `load`/`save` for calls to a database (Supabase, Vercel Postgres…) —
   every component reads through the hooks below, so nothing else changes.
   -------------------------------------------------------------------------- */

export const CMS_SUBJECTS = [
  'English',
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'Economics',
  'Government',
  'Literature',
  'Geography',
  'Commerce',
  'Accounting',
  'Agricultural Science',
  'Further Mathematics',
  'CRS',
  'IRS',
  'Civic Education',
] as const;
export type CmsSubject = (typeof CMS_SUBJECTS)[number];

/** Exam bodies. Each one is its own past-question collection. */
export const EXAM_TYPES = ['UTME', 'WAEC', 'NECO', 'GCE', 'NABTEB', 'Post-UTME'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

/** What students and admins see. UTME is the JAMB exam. */
export const EXAM_LABEL: Record<ExamType, string> = {
  UTME: 'JAMB',
  WAEC: 'WAEC',
  NECO: 'NECO',
  GCE: 'GCE',
  NABTEB: 'NABTEB',
  'Post-UTME': 'Post-UTME',
};

/** Post-UTME papers belong to a school. Short name is the stored value. */
export const SCHOOLS = NIGERIAN_INSTITUTIONS.map((i) => ({ id: i.shortName, name: i.name }));
export const schoolName = (id?: string) => SCHOOLS.find((s) => s.id === id)?.name ?? id ?? '';
export const needsSchool = (exam: string) => exam === 'Post-UTME';

export const EXAM_FULL_NAME: Record<ExamType, string> = {
  UTME: 'JAMB UTME',
  WAEC: 'WAEC WASSCE (school)',
  NECO: 'NECO SSCE (school)',
  GCE: 'GCE (private candidates)',
  NABTEB: 'NABTEB',
  'Post-UTME': 'University Post-UTME',
};

export type Status = 'draft' | 'published';

export interface CmsQuestion {
  id: number;
  subject: CmsSubject;
  examType: ExamType;
  /** Post-UTME only: the school's short name, e.g. "UNILAG". */
  school?: string;
  year: number | null;
  topic: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  /** Where the answer came from — AI-suggested answers need a human check. */
  answerSource: 'paper' | 'ai' | 'manual';
  source: string;
  status: Status;
  needsReview: boolean;
  reviewNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface CmsNews extends NewsItem {
  status: Status;
}

export interface CmsCourse {
  id: string;
  /** UTME: the course. WAEC/NECO/GCE: the class (Science, Arts, Commercial). */
  name: string;
  /** UTME: the faculty. Empty for school-cert classes. */
  faculty: string;
  /** UTME: four subjects, English first. Others: the class's subjects. */
  subjects: string[];
  note: string;
  exam: CourseExam;
}

export interface Activity {
  at: string;
  text: string;
}

interface CmsState {
  version: 1;
  questions: CmsQuestion[];
  news: CmsNews[];
  courses: CmsCourse[];
  /** JAMB faculty practice sets: one subject combination per faculty. */
  facultySets: FacultySet[];
  activity: Activity[];
}

const KEY = 'itutor-cms-v1';
const now = () => new Date().toISOString();

const seedSets = () => FACULTY_SET_SEED.map((f) => ({ ...f, subjects: [...f.subjects] }));

const seed = (): CmsState => ({
  version: 1,
  questions: DIAGNOSTIC_QUESTIONS.map((q) => ({
    id: q.id,
    subject: q.subject as CmsSubject,
    examType: 'UTME',
    year: null,
    topic: q.topic,
    question: q.question,
    options: q.options,
    correctAnswer: q.correctAnswer,
    explanation: q.explanation,
    answerSource: 'paper',
    source: 'i-Tutor starter bank',
    status: 'published',
    needsReview: false,
    reviewNote: '',
    createdAt: '2026-09-01T09:00:00.000Z',
    updatedAt: '2026-09-01T09:00:00.000Z',
  })),
  news: NEWS.map((n) => ({ ...n, status: 'published' as Status })),
  courses: COURSE_SEED.map((c) => ({ ...c, subjects: [...c.subjects] })),
  facultySets: seedSets(),
  activity: [{ at: now(), text: 'Content store created with the starter questions and news.' }],
});

const load = (): CmsState => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CmsState;
      if (parsed.version === 1 && Array.isArray(parsed.questions)) {
        if (!Array.isArray(parsed.courses)) parsed.courses = COURSE_SEED.map((c) => ({ ...c, subjects: [...c.subjects] }));
        // Older saves: health courses split across "Medicine"/"Pharmacy", and
        // every course was JAMB (no exam field, no WAEC/NECO/GCE classes).
        parsed.courses = parsed.courses.map((c) => ({
          ...c,
          exam: c.exam ?? 'UTME',
          faculty: c.faculty === 'Medicine' || c.faculty === 'Pharmacy' ? 'Medicine & Health' : c.faculty,
        }));
        if (!parsed.courses.some((c) => c.exam !== 'UTME')) {
          parsed.courses.push(...COURSE_SEED.filter((c) => c.exam !== 'UTME').map((c) => ({ ...c, subjects: [...c.subjects] })));
        }
        if (!Array.isArray(parsed.facultySets)) parsed.facultySets = seedSets();
        return parsed;
      }
    }
  } catch {
    /* corrupt or blocked storage — fall back to seed */
  }
  return seed();
};

let state: CmsState = typeof window === 'undefined' ? seed() : load();
const listeners = new Set<() => void>();

const save = () => {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* quota or blocked — keep working in memory */
  }
};

const commit = (next: CmsState, activity?: string) => {
  state = activity
    ? { ...next, activity: [{ at: now(), text: activity }, ...next.activity].slice(0, 40) }
    : next;
  save();
  listeners.forEach((l) => l());
};

// Keep tabs in sync (admin in one tab, student view in another).
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === KEY) {
      state = load();
      listeners.forEach((l) => l());
    }
  });
}

const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => listeners.delete(l);
};

/* ------------------------------------------------------------------ Hooks */

export const useCms = () => useSyncExternalStore(subscribe, () => state);

/** Published questions in the four CBT subjects, shaped for the exam engine. */
export const toExamQuestion = (q: CmsQuestion): DiagnosticQuestion => ({
  id: q.id,
  subject: q.subject,
  topic: q.topic || 'General',
  question: q.question,
  options: q.options,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
});

export const EXAM_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry'];

/* -------------------------------------------------- One paper per year */

/** A paper is one subject + exam + year. Each may only be added once. */
export const paperSize = (
  questions: CmsQuestion[],
  subject: string,
  examType: ExamType,
  year: number | null,
  school = '',
) =>
  year === null
    ? 0
    : questions.filter(
        (q) =>
          q.subject === subject &&
          q.examType === examType &&
          q.year === year &&
          // Post-UTME papers are per school.
          (!needsSchool(examType) || (q.school ?? '') === school),
      ).length;

/** Exam types that already have a paper for this subject and year. */
export const takenExams = (questions: CmsQuestion[], subject: string, year: number | null, school = '') =>
  EXAM_TYPES.filter((t) => paperSize(questions, subject, t, year, school) > 0);

/** Comparable form of a question, so re-pasted copies are recognised. */
export const questionKey = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

/* ---------------------------------------------------------------- Actions */

let idCounter = Date.now();
const nextId = () => (idCounter += 1);

export type QuestionDraft = Omit<CmsQuestion, 'id' | 'createdAt' | 'updatedAt'>;

export const cms = {
  addQuestions(drafts: QuestionDraft[], label: string) {
    const stamp = now();
    const added = drafts.map((d) => ({ ...d, id: nextId(), createdAt: stamp, updatedAt: stamp }));
    commit({ ...state, questions: [...added, ...state.questions] }, label);
    return added.length;
  },

  updateQuestion(id: number, patch: Partial<CmsQuestion>) {
    commit({
      ...state,
      questions: state.questions.map((q) => (q.id === id ? { ...q, ...patch, updatedAt: now() } : q)),
    });
  },

  setStatus(ids: number[], status: Status) {
    const set = new Set(ids);
    commit(
      {
        ...state,
        questions: state.questions.map((q) =>
          set.has(q.id) ? { ...q, status, needsReview: status === 'published' ? false : q.needsReview, updatedAt: now() } : q,
        ),
      },
      `${status === 'published' ? 'Published' : 'Unpublished'} ${ids.length} question${ids.length === 1 ? '' : 's'}.`,
    );
  },

  deleteQuestions(ids: number[]) {
    const set = new Set(ids);
    commit(
      { ...state, questions: state.questions.filter((q) => !set.has(q.id)) },
      `Deleted ${ids.length} question${ids.length === 1 ? '' : 's'}.`,
    );
  },

  saveNews(item: CmsNews) {
    const exists = state.news.some((n) => n.id === item.id);
    const news = exists ? state.news.map((n) => (n.id === item.id ? item : n)) : [item, ...state.news];
    news.sort((a, b) => b.date.localeCompare(a.date));
    commit({ ...state, news }, `${exists ? 'Updated' : 'Added'} news: “${item.title}”.`);
  },

  deleteNews(id: string) {
    const item = state.news.find((n) => n.id === id);
    commit({ ...state, news: state.news.filter((n) => n.id !== id) }, `Deleted news: “${item?.title ?? id}”.`);
  },

  publishNews(ids: string[]) {
    const set = new Set(ids);
    commit(
      { ...state, news: state.news.map((n) => (set.has(n.id) ? { ...n, status: 'published' as Status } : n)) },
      `Published ${ids.length} news article${ids.length === 1 ? '' : 's'}.`,
    );
  },

  /** Record something done outside the content store (e.g. an email sent). */
  log(text: string) {
    commit({ ...state }, text);
  },

  saveCourse(course: CmsCourse) {
    const exists = state.courses.some((c) => c.id === course.id);
    const courses = exists ? state.courses.map((c) => (c.id === course.id ? course : c)) : [...state.courses, course];
    courses.sort((a, b) => a.name.localeCompare(b.name));
    commit({ ...state, courses }, `${exists ? 'Updated' : 'Added'} course: ${course.name}.`);
  },

  deleteCourse(id: string) {
    const course = state.courses.find((c) => c.id === id);
    commit({ ...state, courses: state.courses.filter((c) => c.id !== id) }, `Deleted course: ${course?.name ?? id}.`);
  },

  saveFacultySet(set: FacultySet) {
    const facultySets = state.facultySets.some((f) => f.faculty === set.faculty)
      ? state.facultySets.map((f) => (f.faculty === set.faculty ? set : f))
      : [...state.facultySets, set];
    commit({ ...state, facultySets }, `Updated ${set.faculty} faculty practice: ${set.subjects.join(', ')}.`);
  },

  exportJson: () => JSON.stringify(state, null, 2),

  importJson(raw: string) {
    const parsed = JSON.parse(raw) as CmsState;
    if (parsed.version !== 1 || !Array.isArray(parsed.questions) || !Array.isArray(parsed.news)) {
      throw new Error('This file is not an i-Tutor backup.');
    }
    if (!Array.isArray(parsed.courses)) parsed.courses = COURSE_SEED.map((c) => ({ ...c, subjects: [...c.subjects] }));
    if (!Array.isArray(parsed.facultySets)) parsed.facultySets = seedSets();
    commit(parsed, 'Restored content from a backup file.');
  },

  reset() {
    commit(seed(), 'Reset to the starter content.');
  },
};
