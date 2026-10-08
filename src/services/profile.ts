import { api, isLive } from './api';
import type { UserProfile } from '../types';

/* The signed-in student's profile: exams, subjects, school, class, plan and
   chosen tutor. In demo mode it lives in memory (plus plan/tutor in browser
   storage); with a backend the server is the source of truth — especially
   for `plan`, which only the server may set after a verified payment. */

/** Loads the signed-in student, or null when nobody is signed in. */
export async function loadProfile(): Promise<UserProfile | null> {
  if (!isLive) return null;
  try {
    return await api<UserProfile>('/api/me');
  } catch {
    return null;
  }
}

/** Saves profile changes. The server ignores `plan` — payments set that. */
export async function saveProfile(patch: Partial<UserProfile>) {
  if (!isLive) return;
  const { plan: _ignored, ...rest } = patch;
  void _ignored;
  if (Object.keys(rest).length) await api('/api/me', { method: 'PATCH', body: rest });
}
