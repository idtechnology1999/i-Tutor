import React, { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Heart, Star, X } from 'lucide-react';
import { getMyReview, sendReview } from '../../services/reviews';

/* "Rate i-Tutor": a pop-up over the exam result, a moment after the score
   shows. A centred card on computers, a sheet that slides up on phones.
   Asked once: hidden when the student has already sent a review, or closed it
   ("Not now", ✕, Esc or tapping outside) in the last 14 days. Reviews wait
   for an admin's approval before they appear on the website. */

const LATER_KEY = 'itutor-review-later';
const LATER_MS = 14 * 24 * 3600 * 1000;
/** Let the student take in their score before asking. */
const DELAY_MS = 1500;
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const askedRecently = () => {
  try {
    return Date.now() - Number(window.localStorage.getItem(LATER_KEY) ?? 0) < LATER_MS;
  } catch {
    return false;
  }
};

export const RateUsCard: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);
  const panel = useRef<HTMLDivElement>(null);

  // Only for students who haven't reviewed (or put it off) yet.
  useEffect(() => {
    if (askedRecently()) return;
    let live = true;
    let timer = 0;
    getMyReview()
      .then((mine) => {
        if (live && !mine) timer = window.setTimeout(() => setOpen(true), DELAY_MS);
      })
      .catch(() => undefined);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, []);

  /** Plays the closing animation, then removes the pop-up. */
  const close = (remember: boolean) => {
    if (remember) {
      try {
        window.localStorage.setItem(LATER_KEY, String(Date.now()));
      } catch {
        /* fine: it just asks again next time */
      }
    }
    setClosing(true);
    window.setTimeout(() => setOpen(false), 220);
  };

  // While open: Esc closes, the page behind doesn't scroll, focus starts inside.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && close(!sent);
    window.addEventListener('keydown', onKey);
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    panel.current?.querySelector<HTMLElement>('button[role="radio"]')?.focus();
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
    // close reads the latest state; re-binding on `busy`/`sent` keeps it current.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, busy, sent]);

  if (!open) return null;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) return setError('Tap the stars to rate us.');
    if (text.trim().length < 10) return setError('Write a few words about i-Tutor (10 letters or more).');
    setBusy(true);
    setError('');
    sendReview(rating, text.trim())
      .then(() => setSent(true))
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  const shown = hover || rating;

  return createPortal(
    <div className={`rate-modal${closing ? ' is-closing' : ''}`} onMouseDown={(e) => e.target === e.currentTarget && !busy && close(!sent)}>
      <div className="rate-modal__panel" ref={panel} role="dialog" aria-modal="true" aria-labelledby="rate-us-title">
        <button type="button" className="rate-modal__close" onClick={() => close(!sent)} aria-label="Close" disabled={busy}>
          <X size={20} aria-hidden />
        </button>

        {sent ? (
          <div className="rate-modal__thanks" aria-live="polite">
            <span className="rate-modal__badge is-thanks">
              <Heart size={28} aria-hidden />
            </span>
            <h2 id="rate-us-title">Thank you!</h2>
            <p>Your review helps other students find i-Tutor. It will appear on our website after a quick check.</p>
            <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={() => close(false)}>
              Back to my result
            </button>
          </div>
        ) : (
          <form onSubmit={submit}>
            <span className="rate-modal__badge">
              <Star size={26} aria-hidden />
            </span>
            <h2 id="rate-us-title">Enjoying i-Tutor?</h2>
            <p className="rate-modal__lead">Rate us and tell other students what i-Tutor did for you. It takes 30 seconds.</p>

            <div className="rate-us__stars" role="radiogroup" aria-label="Your rating" onMouseLeave={() => setHover(0)}>
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? 's' : ''}: ${WORDS[n]}`}
                  className={n <= shown ? 'is-on' : ''}
                  onMouseEnter={() => setHover(n)}
                  onClick={() => {
                    setRating(n);
                    setError('');
                  }}
                >
                  <Star size={34} aria-hidden />
                </button>
              ))}
            </div>
            <p className="rate-modal__word" aria-hidden>
              {WORDS[shown] || 'Tap a star'}
            </p>

            <textarea
              className="rate-us__text"
              value={text}
              maxLength={400}
              rows={3}
              onChange={(e) => setText(e.target.value)}
              placeholder="What do you like about i-Tutor? e.g. The explanations helped me understand concord."
              aria-label="Your review"
            />
            <div className="rate-modal__count">{text.length}/400</div>
            {error && <p className="rate-us__error">{error}</p>}

            <div className="rate-modal__actions">
              <button type="button" className="ui-btn ui-btn--ghost" onClick={() => close(true)} disabled={busy}>
                Not now
              </button>
              <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
                {busy ? 'Sending…' : 'Send review'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>,
    document.body,
  );
};
