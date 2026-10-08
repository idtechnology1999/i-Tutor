import { useSyncExternalStore } from 'react';
import type { DiagnosticQuestion } from '../types';
import { DIAGNOSTIC_QUESTIONS } from '../data/nigerian-curriculum';
import { NEWS } from '../data/news';
import type { NewsItem } from '../data/news';

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
] as const;
export type CmsSubject = (typeof CMS_SUBJECTS)[number];

export const EXAM_TYPES = ['UTME', 'Post-UTME', 'WAEC', 'NECO'] as const;
export type ExamType = (typeof EXAM_TYPES)[number];

export type Status = 'draft' | 'published';

export interface CmsQuestion {
  id: number;
  subject: CmsSubject;
  examType: ExamType;
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

export interface Activity {
  at: string;
  text: string;
}

interface CmsState {
  version: 1;
  questions: CmsQuestion[];
  news: CmsNews[];
  activity: Activity[];
}

const KEY = 'itutor-cms-v1';
const now = () => new Date().toISOString();

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
  activity: [{ at: now(), text: 'Content store created with the starter questions and news.' }],
});

const load = (): CmsState => {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as CmsState;
      if (parsed.version === 1 && Array.isArray(parsed.questions)) return parsed;
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
  subject: q.subject as DiagnosticQuestion['subject'],
  topic: q.topic || 'General',
  question: q.question,
  options: q.options,
  correctAnswer: q.correctAnswer,
  explanation: q.explanation,
});

export const EXAM_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry'];

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

  exportJson: () => JSON.stringify(state, null, 2),

  importJson(raw: string) {
    const parsed = JSON.parse(raw) as CmsState;
    if (parsed.version !== 1 || !Array.isArray(parsed.questions) || !Array.isArray(parsed.news)) {
      throw new Error('This file is not an i-Tutor backup.');
    }
    commit(parsed, 'Restored content from a backup file.');
  },

  reset() {
    commit(seed(), 'Reset to the starter content.');
  },
};
