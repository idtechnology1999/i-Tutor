import React, { useEffect, useRef, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { CREDIT_COST, FREE_PROMPTS, KIND_LABEL, PLAN_CREDITS, creditLevel } from '../../services/credits';
import type { Credits } from '../../services/credits';

/* The AI allowance as a ring: what's left out of the total. Green while
   there's plenty, orange under a quarter, red under a tenth. The small ring
   (tutor and classroom headers) opens the breakdown when tapped; the card is
   the dashboard's. */

const tone = (c: Credits) => {
  const level = creditLevel(c);
  return level === 'ok' ? 'is-ok' : level === 'warn' ? 'is-warn' : 'is-low';
};

const date = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) : '');

const Ring: React.FC<{ c: Credits; size: number; stroke: number; children?: React.ReactNode }> = ({ c, size, stroke, children }) => {
  const r = (size - stroke) / 2;
  const length = 2 * Math.PI * r;
  const share = c.total ? Math.min(1, c.left / c.total) : 0;
  return (
    <span className={`credit-ring ${tone(c)}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
        <circle className="credit-ring__track" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
        <circle
          className="credit-ring__bar"
          cx={size / 2}
          cy={size / 2}
          r={r}
          strokeWidth={stroke}
          strokeDasharray={length}
          strokeDashoffset={length * (1 - share)}
        />
      </svg>
      <span className="credit-ring__inner">{children}</span>
    </span>
  );
};

/** One line saying where things stand. */
const creditSummary = (c: Credits) =>
  c.plan === 'premium'
    ? `${c.left} of ${c.total} AI credits left${c.renewsAt ? ` · renews ${date(c.renewsAt)}` : ''}`
    : `${c.left} of ${FREE_PROMPTS} free AI prompts left`;

const Breakdown: React.FC<{ c: Credits }> = ({ c }) =>
  c.plan === 'premium' && c.breakdown.length ? (
    <ul className="credit-pop__list">
      {c.breakdown
        .filter((b) => b.uses > 0)
        .map((b) => (
          <li key={b.kind}>
            <span>{KIND_LABEL[b.kind] ?? b.kind}</span>
            <b>
              {b.uses} · {b.credits} credit{b.credits === 1 ? '' : 's'}
            </b>
          </li>
        ))}
    </ul>
  ) : null;

const Prices = () => (
  <p className="credit-pop__prices">
    Chat or explanation {CREDIT_COST.chat} · board explanation {CREDIT_COST.board} · lesson {CREDIT_COST.lesson} · saved answers and voice free
  </p>
);

/** What to do next, if anything. */
const Action: React.FC<{ c: Credits; onUpgrade?: () => void }> = ({ c, onUpgrade }) => {
  if (!onUpgrade) return null;
  if (c.plan === 'free')
    return (
      <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={onUpgrade}>
        Get {PLAN_CREDITS} AI credits a month · ₦2,500
      </button>
    );
  if (c.left / (c.total || 1) <= 0.25)
    return (
      <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={onUpgrade}>
        Renew now · {PLAN_CREDITS} more credits
      </button>
    );
  return null;
};

/** Small ring for headers; tap for the details. */
export const CreditRing: React.FC<{ credits: Credits | null; onUpgrade?: () => void }> = ({ credits, onUpgrade }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!open) return;
    const close = (e: MouseEvent | KeyboardEvent) => {
      if (e instanceof KeyboardEvent ? e.key === 'Escape' : !ref.current?.contains(e.target as Node)) setOpen(false);
    };
    window.addEventListener('mousedown', close);
    window.addEventListener('keydown', close);
    return () => {
      window.removeEventListener('mousedown', close);
      window.removeEventListener('keydown', close);
    };
  }, [open]);
  if (!credits) return null;
  return (
    <div className="credit-mini" ref={ref}>
      <button type="button" className="credit-mini__btn" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-label={creditSummary(credits)} title={creditSummary(credits)}>
        <Ring c={credits} size={38} stroke={4}>
          <b>{credits.left}</b>
        </Ring>
      </button>
      {open && (
        <div className="credit-pop" role="dialog" aria-label="Your AI allowance">
          <strong>{creditSummary(credits)}</strong>
          {credits.plan === 'free' && <p>Free prompts don’t renew. Premium gives you {PLAN_CREDITS} every month.</p>}
          {credits.left === 0 && credits.plan === 'premium' && <p>Practice and past questions stay unlimited. Only the AI tutor waits for your credits.</p>}
          <Breakdown c={credits} />
          <Prices />
          <Action
            c={credits}
            onUpgrade={
              onUpgrade &&
              (() => {
                setOpen(false);
                onUpgrade();
              })
            }
          />
        </div>
      )}
    </div>
  );
};

/** The dashboard's card: the big ring, the renewal date and where the credits went. */
export const CreditCard: React.FC<{ credits: Credits | null; onUpgrade?: () => void }> = ({ credits, onUpgrade }) => {
  if (!credits) return null;
  const premium = credits.plan === 'premium';
  return (
    <section className="ui-card credit-card" aria-label="Your AI allowance">
      <Ring c={credits} size={132} stroke={11}>
        <b>{credits.left}</b>
        <small>of {credits.total}</small>
      </Ring>
      <div className="credit-card__text">
        <p className="credit-card__eyebrow">
          <Sparkles size={15} aria-hidden /> {premium ? 'AI credits this month' : 'Free AI prompts'}
        </p>
        <h3>{premium ? `${credits.left} credits left` : `${credits.left} of ${FREE_PROMPTS} free prompts left`}</h3>
        <p className="credit-card__note">
          {premium
            ? `Renews on ${date(credits.renewsAt)} with ${PLAN_CREDITS} new credits. Unused credits don’t carry over.`
            : `These don’t renew. Premium gives you ${PLAN_CREDITS} AI credits every month for ₦2,500.`}
        </p>
        <Breakdown c={credits} />
        <Prices />
        <Action c={credits} onUpgrade={onUpgrade} />
      </div>
    </section>
  );
};
