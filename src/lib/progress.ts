/* A student's practice results per subject, for the dashboard's "My subjects".
   Kept in this browser: the last few scores per subject and the topic they
   miss most. Wrapped in try/catch so blocked storage never breaks the exam. */

const KEY = 'itutor-progress-v1';

export interface SubjectProgress {
  /** Most recent scores, newest first, as percentages. */
  scores: number[];
  /** Topic with the most wrong answers in the latest attempt ('' if none). */
  weakTopic: string;
  answered: number;
  at: string;
}

type Progress = Record<string, SubjectProgress>;

export function readProgress(): Progress {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? '{}') as Progress;
  } catch {
    return {};
  }
}

/** One finished exam: per subject, how many were right and which topics were missed. */
export function recordResult(results: Array<{ subject: string; correct: number; total: number; missedTopics: string[] }>) {
  const all = readProgress();
  for (const r of results) {
    if (!r.total) continue;
    const missed = new Map<string, number>();
    for (const t of r.missedTopics) if (t && t !== 'General') missed.set(t, (missed.get(t) ?? 0) + 1);
    const weakTopic = [...missed.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? '';
    const prev = all[r.subject];
    all[r.subject] = {
      scores: [Math.round((r.correct / r.total) * 100), ...(prev?.scores ?? [])].slice(0, 5),
      weakTopic,
      answered: (prev?.answered ?? 0) + r.total,
      at: new Date().toISOString(),
    };
  }
  try {
    window.localStorage.setItem(KEY, JSON.stringify(all));
  } catch {
    /* not saved when storage is blocked */
  }
}

/** The figure shown on the dashboard: the average of the last few scores. */
export const masteryOf = (p?: SubjectProgress) =>
  p?.scores.length ? Math.round(p.scores.reduce((a, b) => a + b, 0) / p.scores.length) : null;
