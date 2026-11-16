import React, { useEffect, useState } from 'react';
import { Heart, Star } from 'lucide-react';
import { getMyReview, sendReview } from '../../services/reviews';

/* "Rate i-Tutor", shown under an exam result. Asked once: hidden when the
   student has already sent a review, or tapped "Not now" in the last 14 days.
   Reviews wait for an admin's approval before they appear on the website. */

const LATER_KEY = 'itutor-review-later';
const LATER_MS = 14 * 24 * 3600 * 1000;
const WORDS = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

const askedRecently = () => {
  try {
    return Date.now() - Number(window.localStorage.getItem(LATER_KEY) ?? 0) < LATER_MS;
  } catch {
    return false;
  }
};

export const RateUsCard: React.FC = () => {
  const [show, setShow] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  useEffect(() => {
    if (askedRecently()) return;
    let live = true;
    getMyReview()
      .then((mine) => live && !mine && setShow(true))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, []);

  if (!show) return null;

  const later = () => {
    try {
      window.localStorage.setItem(LATER_KEY, String(Date.now()));
    } catch {
      /* fine: it just asks again next time */
    }
    setShow(false);
  };

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

  if (sent) {
    return (
      <section className="rate-us is-sent" aria-live="polite">
        <Heart size={26} aria-hidden />
        <div>
          <strong>Thank you!</strong>
          <p>Your review helps other students find i-Tutor. It will appear on our website after a quick check.</p>
        </div>
      </section>
    );
  }

  const shown = hover || rating;
  return (
    <form className="rate-us" onSubmit={submit} aria-labelledby="rate-us-title">
      <div className="rate-us__head">
        <h2 id="rate-us-title">Enjoying i-Tutor? Rate us</h2>
        <p>Tell other students what i-Tutor did for you. It takes 30 seconds.</p>
      </div>
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
            onClick={() => setRating(n)}
          >
            <Star size={32} aria-hidden />
          </button>
        ))}
        <span className="rate-us__word">{WORDS[shown]}</span>
      </div>
      <textarea
        className="rate-us__text"
        value={text}
        maxLength={400}
        rows={3}
        onChange={(e) => setText(e.target.value)}
        placeholder="What do you like about i-Tutor? e.g. The explanations helped me understand concord."
        aria-label="Your review"
      />
      {error && <p className="rate-us__error">{error}</p>}
      <div className="rate-us__actions">
        <button type="submit" className="ui-btn ui-btn--primary" disabled={busy}>
          {busy ? 'Sending…' : 'Send review'}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={later} disabled={busy}>
          Not now
        </button>
        <small>{text.length}/400</small>
      </div>
    </form>
  );
};
