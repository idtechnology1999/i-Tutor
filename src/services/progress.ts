import { useEffect, useSyncExternalStore } from 'react';
import { api, isLive } from './api';
import { masteryOf, readProgress } from '../lib/progress';

/* A student's progress, saved on their account so it follows them to any
   phone (backend routes/progress.ts): every finished exam is sent to the
   server, which works out scores, weak topics, the streak and the predicted
   JAMB score. Signed out or in demo mode, the results kept in this browser
   (lib/progress.ts) stand in. Attempts that couldn't be sent (no network)
   wait in this browser and go with the next one. */

export interface SubjectSummary {
  subject: string;
  scores: number[];
  answered: number;
  accuracy: number | null;
  weakTopic: string;
  topics: Array<{ topic: string; correct: number; total: number }>;
  at: string;
}

export interface Prediction {
  exam: 'UTME';
  score: number | null;
  low: number;
  high: number;
  perSubject: Array<{ subject: string; score: number | null; answered: number }>;
  needMore: string[];
}

export interface ProgressSummary {
  subjects: SubjectSummary[];
  streak: { current: number; best: number; today: boolean; days: string[] };
  prediction: Prediction | null;
  recent: Array<{ title: string; exam: string; at: string; correct: number; total: number }>;
  totalAnswered: number;
  remindersOn?: boolean;
  /** True when this came from the account, false when from this browser only. */
  synced: boolean;
}

export interface AttemptAnswer {
  /** Question id. */
  q: number;
  /** Subject. */
  s: string;
  /** Topic. */
  t: string;
  ok: boolean;
}

/** Practice in this browser only (signed out / demo), in the same shape. */
function localSummary(): ProgressSummary {
  const local = readProgress();
  return {
    subjects: Object.entries(local).map(([subject, p]) => ({
      subject,
      scores: p.scores,
      answered: p.answered,
      accuracy: masteryOf(p),
      weakTopic: p.weakTopic,
      topics: [],
      at: p.at,
    })),
    streak: { current: 0, best: 0, today: false, days: [] },
    prediction: null,
    recent: [],
    totalAnswered: Object.values(local).reduce((n, p) => n + p.answered, 0),
    synced: false,
  };
}

/* ------------------------------------------------------------------ Store */

let state: ProgressSummary | null = null;
let loading = false;
const listeners = new Set<() => void>();
const emit = (next: ProgressSummary) => {
  state = next;
  for (const l of listeners) l();
};

const PENDING = 'itutor-pending-attempts';
type Pending = { exam: string; title: string; answers: AttemptAnswer[] };
const readPending = (): Pending[] => {
  try {
    return JSON.parse(window.localStorage.getItem(PENDING) ?? '[]') as Pending[];
  } catch {
    return [];
  }
};
const writePending = (list: Pending[]) => {
  try {
    if (list.length) window.localStorage.setItem(PENDING, JSON.stringify(list.slice(-20)));
    else window.localStorage.removeItem(PENDING);
  } catch {
    /* not kept when storage is blocked */
  }
};

/** Sends attempts saved while offline. */
async function flushPending() {
  const list = readPending();
  if (!list.length) return;
  const left: Pending[] = [];
  for (const p of list) {
    try {
      await api('/api/progress/attempt', { method: 'POST', body: p });
    } catch {
      left.push(p);
    }
  }
  writePending(left);
}

/** Loads progress from the account (or this browser when that isn't possible). */
export async function refreshProgress(): Promise<ProgressSummary> {
  if (!isLive) {
    emit(localSummary());
    return state!;
  }
  if (loading && state) return state;
  loading = true;
  try {
    await flushPending();
    const s = await api<Omit<ProgressSummary, 'synced'>>('/api/progress');
    emit({ ...s, synced: true });
  } catch {
    // Signed out, or no connection: what this browser knows.
    emit(localSummary());
  } finally {
    loading = false;
  }
  return state!;
}

/** One finished exam: saved to the account (or kept to send later). */
export async function saveAttempt(exam: string, title: string, answers: AttemptAnswer[]) {
  if (!isLive || !answers.length) {
    emit(localSummary());
    return;
  }
  const body = { exam, title: title.slice(0, 120), answers: answers.slice(0, 400) };
  try {
    const s = await api<Omit<ProgressSummary, 'synced'>>('/api/progress/attempt', { method: 'POST', body });
    emit({ ...s, synced: true, remindersOn: state?.remindersOn });
  } catch {
    writePending([...readPending(), body]);
    emit(localSummary());
  }
}

/** The daily "you haven't practised today" reminder. */
export async function setReminders(on: boolean) {
  if (!isLive) return;
  await api('/api/progress/reminders', { method: 'PATCH', body: { on } });
  if (state) emit({ ...state, remindersOn: on });
}

/** The student's progress (null until loaded); loads it the first time. */
export function useProgress(): ProgressSummary | null {
  const value = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => state,
  );
  useEffect(() => {
    if (!state) void refreshProgress();
  }, []);
  return value;
}
