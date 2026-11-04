import { API_BASE, isLive } from '../services/api';

/* Errors in students' browsers are sent to the server (POST /api/client-error),
   which emails the admin (backend lib/alerts.ts). Each message is sent once
   per page visit, at most 5 per visit, and noise from browser extensions or
   a dropped connection is ignored. */

const sent = new Set<string>();
const NOISE = /ResizeObserver loop|Script error\.?$|chrome-extension:|moz-extension:|Failed to fetch|NetworkError|Load failed|AbortError/i;

function report(message: string, stack = '') {
  if (!isLive || !message || NOISE.test(message) || NOISE.test(stack) || sent.has(message) || sent.size >= 5) return;
  sent.add(message);
  const body = JSON.stringify({ message: message.slice(0, 500), stack: stack.slice(0, 3000), url: location.href.slice(0, 500) });
  // keepalive: still delivered if the page is closing.
  void fetch(`${API_BASE}/api/client-error`, { method: 'POST', headers: { 'content-type': 'application/json' }, body, keepalive: true }).catch(() => undefined);
}

export function reportErrors() {
  window.addEventListener('error', (e) => report(e.message, e.error instanceof Error ? (e.error.stack ?? '') : ''));
  window.addEventListener('unhandledrejection', (e) => {
    const r: unknown = e.reason;
    report(r instanceof Error ? r.message : String(r), r instanceof Error ? (r.stack ?? '') : '');
  });
}
