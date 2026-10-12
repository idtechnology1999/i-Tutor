import { api, isLive } from './api';
import type { Institution } from '../types';

/* Cut-off marks and subject requirements for one school + course, researched
   live by the AI on the server (see backend routes/admissions.ts). */

export interface AdmissionCheck {
  /** False when the AI couldn't search the web: no cut-off marks, usual requirements only. */
  live: boolean;
  offered: boolean | null;
  session: string;
  jambMinimum: number | null;
  schoolCutoff: number | null;
  courseCutoff: string;
  utmeSubjects: string[];
  olevel: string;
  notes: string;
  sources: Array<{ title: string; url: string }>;
  checkedAt: string;
}

// One answer per school + course for this visit; the server caches for longer.
const seen = new Map<string, Promise<AdmissionCheck>>();

/** null in demo mode (no backend, so no AI). */
export function checkAdmission(school: string, kind: Institution['kind'], course: string): Promise<AdmissionCheck> | null {
  if (!isLive) return null;
  const key = `${school}|${course}`.toLowerCase();
  let pending = seen.get(key);
  if (!pending) {
    pending = api<AdmissionCheck>('/api/admissions/check', { method: 'POST', body: { school, kind, course }, timeout: 60_000 });
    // A failed check can be retried.
    pending.catch(() => seen.delete(key));
    seen.set(key, pending);
  }
  return pending;
}
