import React, { useEffect, useRef, useState } from 'react';
import { QuestionFigure } from './QuestionFigure';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, GraduationCap, RotateCcw, X } from 'lucide-react';
import type { DiagnosticQuestion } from '../../types';
import type { TutorPersona } from '../../data/tutors';
import { useTutorThreads } from '../../lib/useTutorThreads';
import { TutorAvatar, TutorThread } from './TutorThread';

/* After an exam: the result, then the student's tutor goes through the paper
   with them one question at a time — the missed ones first — and explains
   any of them step by step with the AI on request (it uses the AI allowance;
   saved explanations are free). */

type Filter = 'missed' | 'right' | 'skipped' | 'all';

interface Props {
  title: string;
  questions: DiagnosticQuestion[];
  subjects: string[];
  answers: Record<number, string>;
  firstName: string;
  timeUp: boolean;
  /** Out of 400, for a full UTME mock. */
  estimate?: number;
  tutor?: TutorPersona;
  onExit: () => void;
  onRetake: () => void;
  onUpgrade?: () => void;
  /** Button words: the exam leaves for the dashboard, past questions go back to the questions. */
  backLabel?: string;
  retakeLabel?: string;
  /** The small heading over the title. */
  eyebrow?: string;
}

const ScoreRing: React.FC<{ pct: number }> = ({ pct }) => {
  const r = 52;
  const length = 2 * Math.PI * r;
  const tone = pct >= 70 ? 'is-good' : pct >= 50 ? 'is-mid' : 'is-low';
  return (
    <span className={`xr-score ${tone}`}>
      <svg viewBox="0 0 120 120" aria-hidden>
        <circle className="xr-score__track" cx="60" cy="60" r={r} />
        <circle className="xr-score__bar" cx="60" cy="60" r={r} strokeDasharray={length} strokeDashoffset={length * (1 - pct / 100)} />
      </svg>
      <span className="xr-score__inner">
        <b>{pct}%</b>
        <small>score</small>
      </span>
    </span>
  );
};

export const ExamReview: React.FC<Props> = ({
  title,
  questions,
  subjects,
  answers,
  firstName,
  timeUp,
  estimate,
  tutor,
  onExit,
  onRetake,
  onUpgrade,
  backLabel = 'Back to dashboard',
  retakeLabel = 'New set of questions',
  eyebrow,
}) => {
  const isRight = (q: DiagnosticQuestion) => answers[q.id] === q.correctAnswer;
  const isSkipped = (q: DiagnosticQuestion) => !answers[q.id];
  const right = questions.filter(isRight);
  const skipped = questions.filter(isSkipped);
  const missed = questions.filter((q) => !isRight(q) && !isSkipped(q));
  const pct = questions.length ? Math.round((right.length / questions.length) * 100) : 0;
  const teacher = tutor?.name ?? 'your AI tutor';

  const [filter, setFilter] = useState<Filter | null>(null);
  const [at, setAt] = useState(0);
  const threads = useTutorThreads({ tutor, firstName });
  const cardRef = useRef<HTMLElement>(null);

  const lists: Record<Filter, DiagnosticQuestion[]> = {
    missed: [...missed, ...skipped],
    right,
    skipped,
    all: questions,
  };
  const list = filter ? lists[filter] : [];
  const q = list[Math.min(at, Math.max(list.length - 1, 0))];
  const pos = Math.min(at, Math.max(list.length - 1, 0));

  // Each new question comes into view at the top of the card.
  useEffect(() => {
    if (filter) cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [filter, pos]);

  const begin = (f: Filter) => {
    setFilter(f);
    setAt(0);
  };

  const optionText = (item: DiagnosticQuestion, label?: string) => item.options.find((o) => o.label === label)?.text ?? '';

  /** What the tutor says about this question before explaining. */
  const opener = (item: DiagnosticQuestion) => {
    const yours = answers[item.id];
    if (!yours) return `You didn’t answer this one. The answer is ${item.correctAnswer}. Let’s see how to get there.`;
    if (yours === item.correctAnswer) return `You got this one right with ${yours}. Let’s make sure the method sticks.`;
    return `You picked ${yours}, but the answer is ${item.correctAnswer}. Let’s see where it went wrong.`;
  };

  // "You got 1 right, missed 1 and skipped 7."
  const parts = [`got ${right.length} right`, ...(missed.length ? [`missed ${missed.length}`] : []), ...(skipped.length ? [`skipped ${skipped.length}`] : [])];
  const tally = parts.length > 1 ? `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}` : parts[0];
  const intro =
    missed.length + skipped.length === 0
      ? `Brilliant, ${firstName}! You got all ${questions.length} right. Want to go through them anyway to lock in the methods?`
      : `Hi ${firstName}, I’m ${teacher}. You ${tally}. Let’s go through the ones you missed first, one at a time. Tap “Explain step by step” on any of them and I’ll work it through with you.`;

  const tabs: { id: Filter; label: string; n: number }[] = [
    { id: 'missed', label: 'Missed', n: missed.length + skipped.length },
    { id: 'right', label: 'Right', n: right.length },
    { id: 'skipped', label: 'Skipped', n: skipped.length },
    { id: 'all', label: 'All', n: questions.length },
  ];

  return (
    <div className="ui-page xr">
      {/* The site menu is hidden on /exam: this bar is the way out, and stays in view while scrolling. */}
      <nav className="xr-bar" aria-label="Leave the review">
        <button type="button" className="xr-bar__back" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden /> {backLabel}
        </button>
        <span className="xr-bar__title">{title}</span>
        <button type="button" className="xr-bar__again" onClick={onRetake}>
          <RotateCcw size={16} aria-hidden /> <span>{retakeLabel}</span>
        </button>
      </nav>

      {/* ------------------------------------------------------------ Result */}
      <section className="ui-card xr-hero">
        <ScoreRing pct={pct} />
        <div className="xr-hero__text">
          <p className="xr-hero__eyebrow">{eyebrow ?? (timeUp ? 'Time up' : 'Exam submitted')}</p>
          <h1>{title}</h1>
          <div className="xr-hero__stats">
            <span className="is-right">
              <Check size={16} aria-hidden /> <b>{right.length}</b> right
            </span>
            <span className="is-wrong">
              <X size={16} aria-hidden /> <b>{missed.length}</b> missed
            </span>
            <span className="is-skip">
              <b>{skipped.length}</b> skipped
            </span>
            {estimate !== undefined && (
              <span className="is-key">
                <b>{estimate}</b> / 400
              </span>
            )}
          </div>
          {subjects.length > 1 && (
            <ul className="xr-subjects">
              {subjects.map((s) => {
                const qs = questions.filter((x) => x.subject === s);
                const got = qs.filter(isRight).length;
                const share = qs.length ? got / qs.length : 0;
                return (
                  <li key={s}>
                    <span>{s}</span>
                    <i aria-hidden>
                      <em style={{ width: `${share * 100}%` }} />
                    </i>
                    <b>
                      {got}/{qs.length}
                    </b>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>

      {/* ------------------------------------------------------------- Tutor */}
      <section className="ui-card xr-tutor">
        <span className={`tutor-avatar${tutor ? ` tutor-avatar--${tutor.id}` : ''}`} aria-hidden>
          {tutor ? tutor.name.charAt(0) : <GraduationCap size={20} />}
        </span>
        <div className="xr-tutor__body">
          <p>{intro}</p>
          {!filter && (
            <div className="xr-tutor__actions">
              {missed.length + skipped.length > 0 ? (
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => begin('missed')}>
                  Start with what I missed ({missed.length + skipped.length})
                </button>
              ) : (
                <button type="button" className="ui-btn ui-btn--primary" onClick={() => begin('all')}>
                  Go through all {questions.length}
                </button>
              )}
              {missed.length + skipped.length > 0 && (
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => begin('all')}>
                  Go through all {questions.length}
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ---------------------------------------------------- One at a time */}
      {filter && (
        <section className="ui-card xr-card" ref={cardRef} aria-live="polite">
          <nav className="xr-tabs" aria-label="Which questions">
            {tabs.map((t) => (
              <button key={t.id} type="button" className={filter === t.id ? 'is-on' : ''} onClick={() => begin(t.id)} disabled={!t.n}>
                {t.label} <small>{t.n}</small>
              </button>
            ))}
          </nav>

          {!q ? (
            <p className="xr-empty">Nothing here.</p>
          ) : (
            <>
              <div className="xr-card__head">
                <span className={`xr-mark ${isRight(q) ? 'is-right' : isSkipped(q) ? 'is-skip' : 'is-wrong'}`}>
                  {isRight(q) ? <Check size={16} aria-hidden /> : isSkipped(q) ? '–' : <X size={16} aria-hidden />}
                </span>
                <span>
                  {q.subject}
                  {q.topic && q.topic !== 'General' ? ` · ${q.topic}` : ''}
                </span>
                <span className="xr-card__count">
                  {pos + 1} of {list.length}
                </span>
              </div>
              <div className="xr-progress" aria-hidden>
                <i style={{ width: `${((pos + 1) / list.length) * 100}%` }} />
              </div>

              <p className="xr-question">
                {q.question}
                {q.source && <span className="q-source"> ({q.source})</span>}
              </p>
              <QuestionFigure image={q.image} alt={q.imageAlt} />
              <ul className="xr-options">
                {q.options.map((o) => {
                  const mine = answers[q.id] === o.label;
                  const key = o.label === q.correctAnswer;
                  return (
                    <li key={o.label} className={key ? 'is-key' : mine ? 'is-mine' : ''}>
                      <b>{o.label}</b>
                      <span>{o.text}</span>
                      {key && (
                        <em>
                          <Check size={15} aria-hidden /> Answer
                        </em>
                      )}
                      {mine && !key && (
                        <em>
                          <X size={15} aria-hidden /> Your pick
                        </em>
                      )}
                      {mine && key && <em className="is-yours">Your pick</em>}
                    </li>
                  );
                })}
              </ul>

              <div className="xr-say">
                <TutorAvatar tutor={tutor} />
                <p>{opener(q)}</p>
              </div>

              {q.explanation && (
                <div className="xr-why">
                  <strong>Why it’s {q.correctAnswer}</strong>
                  <p>{q.explanation}</p>
                  {answers[q.id] && !isRight(q) && optionText(q, answers[q.id]) && (
                    <p className="xr-why__mine">
                      You chose “{optionText(q, answers[q.id])}”. The right option is “{optionText(q, q.correctAnswer)}”.
                    </p>
                  )}
                </div>
              )}

              <TutorThread
                item={q}
                yourAnswer={answers[q.id]}
                threads={threads}
                tutor={tutor}
                firstName={firstName}
                onUpgrade={onUpgrade}
                onSkip={() => pos < list.length - 1 && setAt(pos + 1)}
              />

              <div className="xr-nav">
                <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setAt(pos - 1)} disabled={pos === 0}>
                  <ChevronLeft size={18} aria-hidden /> Previous
                </button>
                {pos < list.length - 1 ? (
                  <button type="button" className="ui-btn ui-btn--primary" onClick={() => setAt(pos + 1)}>
                    Next question <ChevronRight size={18} aria-hidden />
                  </button>
                ) : (
                  <p className="xr-done">
                    That’s all {list.length} {filter === 'all' ? '' : `${tabs.find((t) => t.id === filter)?.label.toLowerCase()} `}
                    question{list.length === 1 ? '' : 's'}. Well done for going through them!
                  </p>
                )}
              </div>
            </>
          )}
        </section>
      )}

      <div className="xr-actions">
        <button type="button" className="ui-btn ui-btn--ghost" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden /> {backLabel}
        </button>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={onRetake}>
          <RotateCcw size={18} aria-hidden /> {retakeLabel}
        </button>
      </div>
    </div>
  );
};
