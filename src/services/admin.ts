import { api, demoDelay, isLive } from './api';
import { cms } from '../lib/cms';
import { planLocally } from '../lib/auto-agent';
import type { AutoContext, AutoPlan, Audience } from '../lib/auto-agent';

/* Admin-only calls. The signed-in admin's session cookie travels with every
   request (api() sends credentials); the backend checks it on each endpoint. The
   question import and admin check live in lib/question-import.ts. */


/** i-Auto: turn the admin's request into a plan. The admin still presses Run. */
export interface AutoTurn {
  role: 'admin' | 'auto';
  text: string;
}

export async function planAuto(message: string, ctx: AutoContext, history: AutoTurn[] = []): Promise<AutoPlan> {
  if (!isLive) {
    await demoDelay(650);
    return planLocally(message, ctx);
  }
  return api<AutoPlan>('/api/admin/auto', {
    method: 'POST',
    body: { message, history: history.slice(-10) },
    timeout: 60_000,
  });
}

/** Queues an email to a group of students. Demo mode only logs it. */
export async function sendStudentEmail(audience: Audience, subject: string, body: string) {
  if (!isLive) {
    cms.log(`Email “${subject}” queued for ${audience.toLowerCase()}.`);
    return { queued: 0 };
  }
  const data = await api<{ queued: number }>('/api/admin/email', {
    method: 'POST',
    body: { audience, subject, body },
  });
  cms.log(`Email “${subject}” queued for ${audience.toLowerCase()} (${data.queued} students).`);
  return data;
}

/* ------------------------------------------------------------------ Users */

export interface AdminUser {
  id: string;
  fullName: string;
  phoneOrEmail: string;
  verified: boolean;
  plan: 'free' | 'premium';
  planExpiresAt: string | null;
  exams: string[];
  targetCourse: string;
  targetInstitution: string;
  lastActiveAt: string;
  createdAt: string;
}

export interface UserList {
  total: number;
  verified: number;
  premium: number;
  users: AdminUser[];
}

/** Registered students (live only: demo mode has no real accounts). */
export async function listUsers(q = ''): Promise<UserList> {
  if (!isLive) return { total: 0, verified: 0, premium: 0, users: [] };
  return api<UserList>(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ''}`);
}

/* ------------------------------------------------------------------- Team */

export interface TeamMember {
  id: string;
  fullName: string;
  role: string;
  /** A small square photo as a data URL, or "". */
  image: string;
  order: number;
}

export type TeamInput = Omit<TeamMember, 'id'>;

// Demo mode keeps the team in this browser.
const TEAM_KEY = 'itutor-team';
const demoTeam = (): TeamMember[] => {
  try {
    return JSON.parse(window.localStorage.getItem(TEAM_KEY) ?? '[]') as TeamMember[];
  } catch {
    return [];
  }
};
const saveDemoTeam = (team: TeamMember[]) => {
  try {
    window.localStorage.setItem(TEAM_KEY, JSON.stringify(team));
  } catch {
    /* storage full or blocked */
  }
};
const byOrder = (a: TeamMember, b: TeamMember) => a.order - b.order;

export async function listTeam(): Promise<TeamMember[]> {
  if (!isLive) return demoTeam().sort(byOrder);
  return api<TeamMember[]>('/api/admin/team');
}

export async function saveTeamMember(input: TeamInput, id?: string): Promise<TeamMember> {
  if (!isLive) {
    const team = demoTeam();
    const member = { ...input, id: id ?? `team-${Date.now()}` };
    saveDemoTeam(id ? team.map((m) => (m.id === id ? member : m)) : [...team, member]);
    return member;
  }
  return api<TeamMember>(id ? `/api/admin/team/${id}` : '/api/admin/team', {
    method: id ? 'PUT' : 'POST',
    body: input,
  });
}

export async function deleteTeamMember(id: string) {
  if (!isLive) {
    saveDemoTeam(demoTeam().filter((m) => m.id !== id));
    return;
  }
  await api(`/api/admin/team/${id}`, { method: 'DELETE' });
}
