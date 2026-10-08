import { api, demoDelay, isLive } from './api';
import { adminKey } from '../lib/question-import';
import { cms } from '../lib/cms';
import { planLocally } from '../lib/auto-agent';
import type { AutoContext, AutoPlan, Audience } from '../lib/auto-agent';

/* Admin-only calls. Every request carries the admin key header; the backend
   must check it (or, better, a real admin login) on each endpoint. The
   question import and admin check live in lib/question-import.ts. */

const adminHeaders = () => ({ 'x-admin-key': adminKey.get() });

/** i-Auto: turn the admin's request into a plan. The admin still presses Run. */
export async function planAuto(message: string, ctx: AutoContext): Promise<AutoPlan> {
  if (!isLive) {
    await demoDelay(650);
    return planLocally(message, ctx);
  }
  return api<AutoPlan>('/api/admin/auto', {
    method: 'POST',
    headers: adminHeaders(),
    body: { message },
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
    headers: adminHeaders(),
    body: { audience, subject, body },
  });
  cms.log(`Email “${subject}” queued for ${audience.toLowerCase()} (${data.queued} students).`);
  return data;
}
