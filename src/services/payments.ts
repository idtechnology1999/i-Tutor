import { api, demoDelay, isLive } from './api';

/* Premium payments through Paystack.

   Live flow (card details never touch i-Tutor's code — PCI rules):
     1. POST /api/payments/initialize { plan, method } -> { authorizationUrl, reference }
     2. The browser goes to Paystack's checkout page (card, transfer or USSD).
     3. Paystack sends the student back to /upgrade?reference=…
     4. GET /api/payments/verify?reference=… -> { status: 'success', plan, expiresAt }
        The backend also listens to Paystack's webhook and is the only thing
        that decides who is Premium.

   Demo mode keeps the current test-mode screens (fake card form, ~2s wait). */

export type PlanId = 'monthly' | 'quarter';

/** Demo: simulates the payment and returns a reference. Live: redirects to Paystack. */
export async function payForPlan(plan: PlanId, method: string): Promise<{ reference: string }> {
  if (!isLive) {
    await demoDelay(2200);
    return { reference: `ITUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}` };
  }
  const data = await api<{ authorizationUrl: string; reference: string }>('/api/payments/initialize', {
    method: 'POST',
    body: { plan, method },
  });
  window.location.assign(data.authorizationUrl);
  return { reference: data.reference };
}

/** After Paystack sends the student back: confirm with the server. */
export async function verifyPayment(reference: string) {
  return api<{ status: 'success' | 'failed' | 'pending'; plan: PlanId; expiresAt: string }>(
    `/api/payments/verify?reference=${encodeURIComponent(reference)}`,
  );
}
