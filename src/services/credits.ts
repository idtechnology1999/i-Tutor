import { useSyncExternalStore } from 'react';
import { ApiError, api, isLive } from './api';

/* The student's AI allowance (the progress ring). The server decides and
   enforces it (backend lib/quota.ts); this keeps a copy for display and
   refreshes it after every AI request. In demo mode the allowance lives in
   this browser instead.
   - Free: 5 AI prompts for life.
   - Premium: 300 credits a month; bigger jobs cost more. */

export const FREE_PROMPTS = 5;
export const PLAN_CREDITS = 300;

/** Keep in step with CREDIT_COST in the backend's lib/quota.ts. */
export const CREDIT_COST = { chat: 1, explain: 1, hint: 1, board: 2, lesson: 3 } as const;
export type AiKind = keyof typeof CREDIT_COST;

export const KIND_LABEL: Record<string, string> = {
  chat: 'Tutor chat',
  explain: 'Question explanations',
  hint: 'Exam hints',
  board: 'Board explanations',
  lesson: 'Classroom lessons',
};

export interface Credits {
  plan: 'free' | 'premium';
  left: number;
  total: number;
  /** Premium: when the paid period (and its credits) ends. */
  renewsAt: string | null;
  breakdown: { kind: string; uses: number; credits: number }[];
}

let state: Credits | null = null;
const listeners = new Set<() => void>();
const emit = (next: Credits) => {
  state = next;
  listeners.forEach((l) => l());
};
const subscribe = (l: () => void) => {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
};

/* ------------------------------------------------------------- Demo mode */

const DEMO_KEY = 'itutor-credits-demo';
let demoPremium = false;

interface Demo {
  freeUsed: number;
  left: number;
  renewsAt: string;
  used: Record<string, { uses: number; credits: number }>;
}

const readDemo = (): Demo => {
  const fresh: Demo = { freeUsed: 0, left: PLAN_CREDITS, renewsAt: new Date(Date.now() + 30 * 864e5).toISOString(), used: {} };
  try {
    return { ...fresh, ...(JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? '{}') as Partial<Demo>) };
  } catch {
    return fresh;
  }
};
const writeDemo = (d: Demo) => {
  try {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(d));
  } catch {
    /* storage blocked: the allowance resets on reload */
  }
};
const demoState = (): Credits => {
  const d = readDemo();
  return demoPremium
    ? {
        plan: 'premium',
        left: d.left,
        total: PLAN_CREDITS,
        renewsAt: d.renewsAt,
        breakdown: Object.entries(d.used).map(([kind, v]) => ({ kind, ...v })),
      }
    : { plan: 'free', left: Math.max(0, FREE_PROMPTS - d.freeUsed), total: FREE_PROMPTS, renewsAt: null, breakdown: [] };
};

/* ---------------------------------------------------------------- Public */

/** Re-reads the allowance (after an AI request, a payment or signing in). */
export async function refreshCredits() {
  if (!isLive) return emit(demoState());
  try {
    emit(await api<Credits>('/api/me/credits'));
  } catch {
    /* signed out or offline: keep showing what we had */
  }
}

/** Called when the plan changes, so the ring shows the right allowance. */
export function setCreditsPlan(premium: boolean) {
  demoPremium = premium;
  void refreshCredits();
}

/** A payment went through: show the new credits (300 a month, 900 a quarter).
    Demo mode adds them here, the way the server does after a real payment. */
export function creditsPaid(months: number) {
  if (!isLive) {
    const d = readDemo();
    const credits = PLAN_CREDITS * months;
    // Renewing early adds to what's left; after the plan ends it starts afresh.
    const from = demoPremium ? Math.max(Date.now(), new Date(d.renewsAt).getTime()) : Date.now();
    writeDemo({
      ...d,
      left: demoPremium ? d.left + credits : credits,
      renewsAt: new Date(from + months * 30 * 864e5).toISOString(),
      used: demoPremium ? d.used : {},
    });
    demoPremium = true;
  }
  void refreshCredits();
}

/** What a job costs this student: a credit price on Premium, one prompt on Free. */
export const costOf = (kind: AiKind, credits: Credits | null = state) => (credits?.plan === 'premium' ? CREDIT_COST[kind] : 1);

/** Whether there's enough left (unknown counts as yes: the server has the final say). */
export const canUse = (kind: AiKind, credits: Credits | null = state) => !credits || credits.left >= costOf(kind, credits);

export const OUT_OF_FREE = `You’ve used your ${FREE_PROMPTS} free AI prompts. Subscribe to Premium for ${PLAN_CREDITS} AI credits a month.`;
export const OUT_OF_CREDITS = `You’ve used this month’s AI credits. Renew now for ${PLAN_CREDITS} more, or wait for your next renewal.`;

/** The server (or demo mode) said the allowance is used up. */
export const isOutOfCredits = (error: unknown) => error instanceof ApiError && error.status === 402;

/** Runs one AI job against the allowance. */
export async function spendAi<T>(kind: AiKind, work: () => Promise<T>): Promise<T> {
  if (isLive) {
    try {
      return await work();
    } finally {
      void refreshCredits();
    }
  }
  const d = readDemo();
  const cost = demoPremium ? CREDIT_COST[kind] : 1;
  if (demoPremium ? d.left < cost : d.freeUsed >= FREE_PROMPTS) {
    throw new ApiError(402, demoPremium ? OUT_OF_CREDITS : OUT_OF_FREE);
  }
  if (demoPremium) {
    const u = d.used[kind] ?? { uses: 0, credits: 0 };
    writeDemo({ ...d, left: d.left - cost, used: { ...d.used, [kind]: { uses: u.uses + 1, credits: u.credits + cost } } });
  } else writeDemo({ ...d, freeUsed: d.freeUsed + 1 });
  emit(demoState());
  try {
    return await work();
  } catch (error) {
    // A failed job gives its allowance back, as on the server.
    const now = readDemo();
    if (demoPremium) writeDemo({ ...now, left: now.left + cost });
    else writeDemo({ ...now, freeUsed: Math.max(0, now.freeUsed - 1) });
    emit(demoState());
    throw error;
  }
}

/** The allowance, kept up to date. */
export const useCredits = () => useSyncExternalStore(subscribe, () => state, () => state);
