import React, { useEffect, useState } from 'react';
import { BellRing, Check, X } from 'lucide-react';
import { pushState, turnOnPush } from '../../services/push';
import type { PushState } from '../../services/push';

/* "Turn on reminders" card. Shown only where the browser can show
   notifications and the student hasn't answered yet; it disappears once
   they're on (after a short thank-you) or if they close it. */

const DISMISS_KEY = 'itutor-push-dismissed';

const dismissed = () => {
  try {
    return window.localStorage.getItem(DISMISS_KEY) === '1';
  } catch {
    return false;
  }
};

interface Props {
  title: string;
  text: string;
  /** The code screen keeps it until answered; elsewhere it can be closed for good. */
  closable?: boolean;
  /** Called after the student allows notifications. */
  onEnabled?: () => void;
}

export const PushPrompt: React.FC<Props> = ({ title, text, closable = false, onEnabled }) => {
  const [state, setState] = useState<PushState | 'loading' | 'working' | 'done'>('loading');
  const [closed, setClosed] = useState(() => closable && dismissed());
  const [error, setError] = useState('');

  useEffect(() => {
    let live = true;
    void pushState().then((s) => live && setState(s));
    return () => {
      live = false;
    };
  }, []);

  if (closed || state === 'loading' || state === 'unsupported' || state === 'on') return null;

  const turnOn = () => {
    setState('working');
    setError('');
    turnOnPush()
      .then((s) => {
        if (s === 'on') {
          setState('done');
          onEnabled?.();
        } else setState(s);
      })
      .catch(() => {
        setState('off');
        setError('That didn’t work. Check your connection and try again.');
      });
  };

  const close = () => {
    setClosed(true);
    try {
      window.localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* storage blocked: it shows again next visit */
    }
  };

  return (
    <div className={`push-prompt${state === 'done' ? ' is-done' : ''}`} role="region" aria-label="Notifications">
      <span className="push-prompt__icon" aria-hidden>
        {state === 'done' ? <Check size={20} /> : <BellRing size={20} />}
      </span>
      <div className="push-prompt__body">
        {state === 'done' ? (
          <>
            <strong>Reminders are on</strong>
            <p>We’ll send a short pop-up to this device when it helps. You can turn them off in your profile.</p>
          </>
        ) : state === 'blocked' ? (
          <>
            <strong>Notifications are blocked</strong>
            <p>To get reminders, allow notifications for i-Tutor in your browser’s site settings (the lock icon next to the address).</p>
          </>
        ) : (
          <>
            <strong>{title}</strong>
            <p>{text}</p>
            {error ? <p className="push-prompt__error" role="alert">{error}</p> : null}
          </>
        )}
      </div>
      {state === 'off' || state === 'working' ? (
        <button type="button" className="push-prompt__go" onClick={turnOn} disabled={state === 'working'}>
          {state === 'working' ? 'Turning on…' : 'Turn on'}
        </button>
      ) : null}
      {closable && state !== 'done' ? (
        <button type="button" className="push-prompt__close" onClick={close} aria-label="Not now">
          <X size={16} aria-hidden />
        </button>
      ) : null}
    </div>
  );
};
