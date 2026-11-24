import { api, isLive } from './api';

/* Browser notifications (pop-ups like a WhatsApp message, even when the site
   is closed). The browser asks the student "Allow notifications?" once; when
   they allow, this browser is registered with the server, which then sends
   reminders (backend lib/push.ts). public/sw.js shows them.

   iPhones only get them after i-Tutor is added to the home screen. */

/** One-off token from sign-up/login, so a browser can turn notifications on
    before the account is verified. Kept for this tab only. */
const TOKEN_KEY = 'itutor-push-token';

export function setPendingPushToken(token: string | undefined) {
  try {
    if (token) window.sessionStorage.setItem(TOKEN_KEY, token);
    else window.sessionStorage.removeItem(TOKEN_KEY);
  } catch {
    /* storage blocked: notifications can still be turned on after verifying */
  }
}

const pendingToken = () => {
  try {
    return window.sessionStorage.getItem(TOKEN_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

/** True when this browser can show notifications at all. */
export const pushSupported = () =>
  isLive &&
  typeof window !== 'undefined' &&
  'serviceWorker' in navigator &&
  'PushManager' in window &&
  'Notification' in window;

export type PushState = 'unsupported' | 'blocked' | 'on' | 'off';

async function registration() {
  return navigator.serviceWorker.register('/sw.js');
}

/** Whether this browser gets i-Tutor notifications now. */
export async function pushState(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  if (Notification.permission === 'denied') return 'blocked';
  if (Notification.permission !== 'granted') return 'off';
  try {
    const reg = await navigator.serviceWorker.getRegistration('/sw.js');
    return (await reg?.pushManager.getSubscription()) ? 'on' : 'off';
  } catch {
    return 'off';
  }
}

const toKey = (base64: string) => {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4)).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(padded);
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
};

/** Asks "Allow notifications?" (must follow a tap) and registers this browser.
    Returns the new state; 'blocked' when the student said no. */
export async function turnOnPush(): Promise<PushState> {
  if (!pushSupported()) return 'unsupported';
  const permission = await Notification.requestPermission();
  if (permission !== 'granted') return permission === 'denied' ? 'blocked' : 'off';
  const reg = await registration();
  await navigator.serviceWorker.ready;
  let sub = await reg.pushManager.getSubscription();
  if (!sub) {
    const { publicKey } = await api<{ publicKey: string }>('/api/push/key');
    sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: toKey(publicKey) });
  }
  await api('/api/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON(), pushToken: pendingToken() } });
  return 'on';
}

/** Re-sends this browser's registration after signing in (a browser that
    allowed notifications before verifying stays linked to the account). */
let refreshed = false;
export async function refreshPush() {
  if (refreshed) return;
  refreshed = true;
  if ((await pushState()) !== 'on') return;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  if (sub) await api('/api/push/subscribe', { method: 'POST', body: { subscription: sub.toJSON() } }).catch(() => undefined);
}

export async function turnOffPush() {
  if (!pushSupported()) return;
  const reg = await navigator.serviceWorker.getRegistration('/sw.js');
  const sub = await reg?.pushManager.getSubscription();
  if (!sub) return;
  await api('/api/push/unsubscribe', { method: 'POST', body: { endpoint: sub.endpoint } }).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}
