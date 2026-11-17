import { useEffect, useState } from 'react';
import { api, isLive } from './api';

/* Premium prices in naira, set in Admin → Settings → Plans & prices
   (backend GET /api/plans). Fetched once per visit and shared; the original
   prices show until they arrive (and in demo mode). */

export interface PlanPrices {
  /** 1 month. */
  monthly: number;
  /** 3 months. */
  quarter: number;
  /** AI credits a 1-month payment gives. */
  monthlyCredits: number;
  /** AI credits a 3-month payment gives (all at once). */
  quarterCredits: number;
  /** AI prompts a free account may use in total. */
  freePrompts: number;
}

export const DEFAULT_PRICES: PlanPrices = { monthly: 2500, quarter: 6500, monthlyCredits: 300, quarterCredits: 900, freePrompts: 5 };

/** ₦2,500 */
export const nairaText = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;

let current: PlanPrices = DEFAULT_PRICES;
let loading: Promise<PlanPrices> | null = null;
const listeners = new Set<(p: PlanPrices) => void>();

export const loadPlanPrices = () =>
  (loading ??= !isLive
    ? Promise.resolve(DEFAULT_PRICES)
    : api<PlanPrices>('/api/plans', { timeout: 8000 })
        .then((p) => {
          current = { ...DEFAULT_PRICES, ...p };
          listeners.forEach((l) => l(current));
          return current;
        })
        .catch(() => current));

/** After the admin saves new prices: every open page shows them at once. */
export const setLocalPlanPrices = (p: PlanPrices) => {
  current = p;
  loading = Promise.resolve(p);
  listeners.forEach((l) => l(p));
};

export function usePlanPrices(): PlanPrices {
  const [prices, setPrices] = useState(current);
  useEffect(() => {
    listeners.add(setPrices);
    void loadPlanPrices().then(setPrices);
    return () => {
      listeners.delete(setPrices);
    };
  }, []);
  return prices;
}

/** The prices known right now (for text built outside a component). */
export const planPricesNow = () => current;

/** Called whenever the plans change (credits.ts keeps its numbers in step). */
export const onPlanPrices = (listener: (p: PlanPrices) => void) => {
  listeners.add(listener);
  listener(current);
};
