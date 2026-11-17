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

/* "Help me write": the student taps what they liked (or, for 1–2 stars, what
   could be better) and a well-written sentence is added to their review. The
   tone follows their own stars and they can edit every word, so a review is
   always the student's own opinion; it never writes praise they didn't give. */
const LIKES: Array<{ id: string; label: string; text: Record<'great' | 'good' | 'ok', string> }> = [
  {
    id: 'explain',
    label: 'Clear explanations',
    text: {
      great: 'The explanations are so clear. They helped me finally understand topics I used to struggle with.',
      good: 'The explanations are clear and helped me understand my mistakes.',
      ok: 'The explanations are helpful.',
    },
  },
  {
    id: 'cbt',
    label: 'Feels like the real CBT',
    text: {
      great: 'The mock exam feels exactly like the real JAMB CBT, so I’m much less nervous for exam day.',
      good: 'The mock exam feels close to the real CBT, which is great practice.',
      ok: 'The CBT practice is useful.',
    },
  },
  {
    id: 'past',
    label: 'Real past questions',
    text: {
      great: 'Having real JAMB past questions with the correct answers is amazing for my revision.',
      good: 'The real past questions with answers are very useful.',
      ok: 'The past questions help with revision.',
    },
  },
  {
    id: 'tutor',
    label: 'The AI tutor',
    text: {
      great: 'The AI tutor explains things step by step, like having a teacher with me at any time.',
      good: 'The AI tutor is helpful when I get stuck.',
      ok: 'The AI tutor can be helpful.',
    },
  },
  {
    id: 'easy',
    label: 'Easy to use',
    text: {
      great: 'Everything is simple and easy to use, even on my phone.',
      good: 'The site is easy to use.',
      ok: 'It is fairly easy to use.',
    },
  },
  {
    id: 'score',
    label: 'Helped my score',
    text: {
      great: 'My scores have gone up since I started practising on i-Tutor.',
      good: 'My practice scores are improving.',
      ok: 'I can see some progress in my practice.',
    },
  },
];
const BETTER: Array<{ id: string; label: string; text: string }> = [
  { id: 'more', label: 'More questions', text: 'I would like more questions, especially for recent years.' },
  { id: 'explain', label: 'Clearer explanations', text: 'Some explanations could be clearer.' },
  { id: 'speed', label: 'Faster pages', text: 'Some pages could load faster.' },
  { id: 'price', label: 'Lower price', text: 'Premium could be more affordable for students.' },
  { id: 'bugs', label: 'Something didn’t work', text: 'Something didn’t work properly for me.' },
];
const toneFor = (stars: number) => (stars >= 5 ? 'great' : stars === 4 ? 'good' : 'ok');

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
  /** Chips the student tapped in "Help me write". */
  const [picked, setPicked] = useState<string[]>([]);
  const panel = useRef<HTMLDivElement>(null);

  /** Adds (or removes) a chip's sentence; the text stays the student's to edit. */
  const toggleChip = (id: string, sentence: string) => {
    const on = picked.includes(id);
    setPicked(on ? picked.filter((p) => p !== id) : [...picked, id]);
    setText((t) => {
      if (on) return t.replace(sentence, '').replace(/\s{2,}/g, ' ').trim();
      const next = t.trim() ? `${t.trim()} ${sentence}` : sentence;
      return next.slice(0, 400);
    });
    setError('');
  };

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
                    // A different tone (or praise vs. suggestions): start the helper's choices afresh.
                    if ((n <= 2) !== (rating <= 2) || toneFor(n) !== toneFor(rating)) {
                      setPicked([]);
                      if (picked.length) setText('');
                    }
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

            {rating > 0 && (
              <div className="rate-help">
                <p className="rate-help__title">{rating <= 2 ? 'What could be better? Tap to add' : 'Help me write: tap what you liked'}</p>
                <div className="rate-help__chips">
                  {rating <= 2
                    ? BETTER.map((c) => (
                        <button key={c.id} type="button" className={picked.includes(c.id) ? 'is-on' : ''} aria-pressed={picked.includes(c.id)} onClick={() => toggleChip(c.id, c.text)}>
                          {c.label}
                        </button>
                      ))
                    : LIKES.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={picked.includes(c.id) ? 'is-on' : ''}
                          aria-pressed={picked.includes(c.id)}
                          onClick={() => toggleChip(c.id, c.text[toneFor(rating)])}
                        >
                          {c.label}
                        </button>
                      ))}
                </div>
              </div>
            )}

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
