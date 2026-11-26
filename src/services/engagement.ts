import { api, isLive } from './api';

let stop: (() => void) | null = null;

export function startEngagementTracking() {
  if (!isLive || stop) return () => {};
  let last = Date.now();
  let ended = false;

  const send = () => {
    const elapsed = Math.round((Date.now() - last) / 1000);
    last = Date.now();
    if (elapsed < 5) return;
    void api('/api/me/engagement', { method: 'POST', body: { seconds: Math.min(60, elapsed) }, timeout: 5000 }).catch(() => undefined);
  };

  const onVisibility = () => {
    if (document.visibilityState === 'hidden') send();
    else last = Date.now();
  };

  const timer = window.setInterval(() => {
    if (document.visibilityState === 'visible') send();
    else last = Date.now();
  }, 60_000);

  document.addEventListener('visibilitychange', onVisibility);

  const finish = () => {
    if (ended) return;
    ended = true;
    window.clearInterval(timer);
    document.removeEventListener('visibilitychange', onVisibility);
    send();
    stop = null;
  };
  stop = finish;
  return finish;
}
