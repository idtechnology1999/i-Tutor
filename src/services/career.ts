import { api, isLive } from './api';

/* The course finder: a student's answers go to the AI on the server (routes/career.ts),
   which suggests courses from the site's own course list and says why. */

export interface CareerMatch {
  title: string;
  summary: string;
  strengths: string[];
  matches: Array<{ course: string; why: string; careers: string[]; subjects: string; fit: number }>;
  nextStep: string;
}

/** null in demo mode (no backend, so no AI). */
export function findCourses(answers: Array<{ question: string; answer: string }>, courses: string[]): Promise<CareerMatch> | null {
  if (!isLive) return null;
  return api<CareerMatch>('/api/career/match', { method: 'POST', body: { answers, courses }, timeout: 90_000 });
}
