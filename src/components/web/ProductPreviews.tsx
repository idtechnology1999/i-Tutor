import React, { useEffect, useRef, useState } from 'react';
import {
  BadgeCheck,
  Calculator,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  Lightbulb,
  ListOrdered,
  MessageSquareText,
  SendHorizontal,
} from 'lucide-react';

/* -----------------------------------------------------------------------------
   Landing-page previews of the real product. Both are interactive demos with
   local state only — nothing here talks to the exam engine or the tutor.
   -------------------------------------------------------------------------- */

const useInView = <T extends HTMLElement>(threshold = 0.35) => {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);
  return { ref, inView };
};

/* ================================================================ CBT screen */

const SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry'];

const QUESTIONS = [
  {
    n: 17,
    source: 'UTME 2021',
    stem: 'If log₁₀2 = 0.3010, evaluate log₁₀8.',
    options: ['0.6020', '0.9030', '1.2040', '0.0903'],
  },
  {
    n: 18,
    source: 'UTME 2019',
    stem: 'Find the value of x for which 2x − 7 = 3(x − 4).',
    options: ['−5', '1', '5', '19'],
  },
  {
    n: 19,
    source: 'UTME 2022',
    stem: 'The mean of 4, 7, x and 9 is 6. Find x.',
    options: ['3', '4', '5', '6'],
  },
];

const TOTAL = 40;
// Questions 1–16 already done in this demo, with two flagged along the way.
const PRE_ANSWERED = new Set(Array.from({ length: 16 }, (_, i) => i + 1).filter((n) => n !== 9));
const PRE_FLAGGED = new Set([8, 14]);

const fmt = (s: number) =>
  [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60]
    .map((v) => String(v).padStart(2, '0'))
    .join(':');

export const CbtPreview: React.FC = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.2);
  const [seconds, setSeconds] = useState(41 * 60 + 12);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [flags, setFlags] = useState<Set<number>>(new Set(PRE_FLAGGED));

  // The clock only runs while the preview is on screen.
  useEffect(() => {
    if (!inView) return;
    const id = window.setInterval(() => setSeconds((s) => (s > 0 ? s - 1 : 0)), 1000);
    return () => window.clearInterval(id);
  }, [inView]);

  const q = QUESTIONS[index];
  const picked = answers[q.n];
  const flagged = flags.has(q.n);

  const toggleFlag = () =>
    setFlags((prev) => {
      const next = new Set(prev);
      if (next.has(q.n)) next.delete(q.n);
      else next.add(q.n);
      return next;
    });

  const cellState = (n: number) => {
    if (n === q.n) return 'is-current';
    if (flags.has(n)) return 'is-flag';
    if (PRE_ANSWERED.has(n) || answers[n] !== undefined) return 'is-done';
    return '';
  };

  const answeredCount = PRE_ANSWERED.size + Object.keys(answers).length;

  return (
    <div className="pv-cbt" ref={ref}>
      <div className="pv-cbt__bar">
        <div className="pv-cbt__tabs" role="tablist" aria-label="Subjects">
          {SUBJECTS.map((s) => (
            <span key={s} role="tab" aria-selected={s === 'Mathematics'} className={s === 'Mathematics' ? 'is-active' : ''}>
              {s}
            </span>
          ))}
        </div>
        <div className="pv-cbt__right">
          <span className={`pv-cbt__timer${seconds < 600 ? ' is-low' : ''}`} aria-label="Time left">
            <Clock3 size={15} aria-hidden />
            {fmt(seconds)}
          </span>
          <button type="button" className="pv-cbt__submit">
            Submit
          </button>
        </div>
      </div>

      <div className="pv-cbt__body">
        <div className="pv-cbt__main">
          <div className="pv-cbt__meta">
            <span>
              Question <b>{q.n}</b> of {TOTAL}
            </span>
            <span className="lp-badge lp-badge--green">
              <BadgeCheck size={13} aria-hidden />
              Verified · {q.source}
            </span>
          </div>

          <p className="pv-cbt__stem" key={q.n}>
            {q.stem}
          </p>

          <div className="pv-cbt__options" role="radiogroup" aria-label="Options" key={`o${q.n}`}>
            {q.options.map((opt, i) => (
              <button
                key={opt}
                type="button"
                role="radio"
                aria-checked={picked === i}
                className={`pv-opt${picked === i ? ' is-picked' : ''}`}
                style={{ ['--i' as string]: i }}
                onClick={() => setAnswers((a) => ({ ...a, [q.n]: i }))}
              >
                <span className="pv-opt__key">{String.fromCharCode(65 + i)}</span>
                {opt}
              </button>
            ))}
          </div>

          <div className="pv-cbt__nav">
            <button
              type="button"
              className="pv-btn"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={index === 0}
            >
              <ChevronLeft size={16} aria-hidden /> Previous
            </button>
            <button
              type="button"
              className={`pv-btn pv-btn--flag${flagged ? ' is-on' : ''}`}
              onClick={toggleFlag}
              aria-pressed={flagged}
            >
              <Flag size={15} aria-hidden /> {flagged ? 'Flagged' : 'Flag'}
            </button>
            <button
              type="button"
              className="pv-btn pv-btn--next"
              onClick={() => setIndex((i) => Math.min(QUESTIONS.length - 1, i + 1))}
              disabled={index === QUESTIONS.length - 1}
            >
              Next <ChevronRight size={16} aria-hidden />
            </button>
          </div>
        </div>

        <aside className="pv-cbt__side" aria-label="Question navigator">
          <div className="pv-cbt__side-head">
            <ListOrdered size={15} aria-hidden />
            <span>
              {answeredCount} of {TOTAL} answered
            </span>
          </div>
          <div className="pv-cbt__grid">
            {Array.from({ length: TOTAL }, (_, i) => i + 1).map((n) => {
              const target = QUESTIONS.findIndex((x) => x.n === n);
              return (
                <button
                  key={n}
                  type="button"
                  className={cellState(n)}
                  onClick={() => target >= 0 && setIndex(target)}
                  tabIndex={target >= 0 ? 0 : -1}
                  aria-label={`Question ${n}`}
                >
                  {n}
                </button>
              );
            })}
          </div>
          <ul className="pv-cbt__legend">
            <li>
              <i className="is-done" /> Answered
            </li>
            <li>
              <i className="is-flag" /> Flagged
            </li>
            <li>
              <i /> Not yet
            </li>
          </ul>
          <button type="button" className="pv-btn pv-btn--calc">
            <Calculator size={15} aria-hidden /> Calculator
          </button>
        </aside>
      </div>
    </div>
  );
};

/* ============================================================== Tutor chat */

type Line =
  | { who: 'you' | 'tutor'; text: string }
  | { who: 'chips'; chips: string[] };

const SCRIPT: Line[] = [
  { who: 'you', text: 'I picked C, 5.0 m/s². Why is it wrong?' },
  { who: 'tutor', text: 'Let’s check it together. The car starts from rest — so what is its initial speed, u?' },
  { who: 'you', text: 'u = 0' },
  { who: 'tutor', text: 'Exactly. Now which equation links distance, time and acceleration when u = 0?' },
  { who: 'chips', chips: ['s = ½at²', 'v = u + at', 'Give me a hint'] },
];

export const TutorPreview: React.FC = () => {
  const { ref, inView } = useInView<HTMLDivElement>(0.45);
  const [shown, setShown] = useState(0);
  const [typing, setTyping] = useState(false);

  // Play the conversation once, one line at a time, with a typing beat before
  // each tutor reply.
  useEffect(() => {
    if (!inView || shown >= SCRIPT.length) return;
    const next = SCRIPT[shown];
    const isTutor = next.who === 'tutor';
    const wait = shown === 0 ? 400 : isTutor ? 1500 : 900;
    if (isTutor) {
      const t1 = window.setTimeout(() => setTyping(true), 350);
      const t2 = window.setTimeout(() => {
        setTyping(false);
        setShown((s) => s + 1);
      }, wait);
      return () => {
        window.clearTimeout(t1);
        window.clearTimeout(t2);
      };
    }
    const t = window.setTimeout(() => setShown((s) => s + 1), wait);
    return () => window.clearTimeout(t);
  }, [inView, shown]);

  return (
    <div className="pv-chat" ref={ref}>
      <div className="pv-chat__head">
        <span className="pv-chat__avatar">
          <MessageSquareText size={16} aria-hidden />
        </span>
        <div>
          <strong>i-Teacher tutor</strong>
          <span>Physics · Kinematics</span>
        </div>
        <div className="pv-chat__modes" aria-label="Tutor mode">
          <span>Explain</span>
          <span className="is-active">
            <Lightbulb size={12} aria-hidden /> Hint
          </span>
          <span>Step-by-step</span>
        </div>
      </div>

      <div className="pv-chat__quote">
        <span className="lp-badge lp-badge--green">
          <BadgeCheck size={12} aria-hidden /> UTME 2019 · Q14
        </span>
        <p>A car accelerates uniformly from rest and covers 100 m in 10 s. What is its acceleration?</p>
      </div>

      <div className="pv-chat__log" aria-live="polite">
        {SCRIPT.slice(0, shown).map((line, i) =>
          line.who === 'chips' ? (
            <div className="pv-chat__chips" key={i}>
              {line.chips.map((c) => (
                <button type="button" key={c}>
                  {c}
                </button>
              ))}
            </div>
          ) : (
            <p key={i} className={`pv-msg pv-msg--${line.who}`}>
              {line.text}
            </p>
          ),
        )}
        {typing && (
          <p className="pv-msg pv-msg--tutor pv-msg--typing" aria-label="Tutor is typing">
            <i />
            <i />
            <i />
          </p>
        )}
      </div>

      <div className="pv-chat__input">
        <span>Type your answer…</span>
        <span className="pv-chat__send">
          <SendHorizontal size={16} aria-hidden />
        </span>
      </div>
    </div>
  );
};
