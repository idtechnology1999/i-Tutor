import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Check, ChevronLeft, ChevronRight, GraduationCap, Repeat, RotateCcw, Sparkles, ThumbsUp, X } from 'lucide-react';
import type { DiagnosticQuestion } from '../../types';
import type { TutorPersona } from '../../data/tutors';
import { explainQuestion, explainSimpler, similarQuestion } from '../../services/tutor';
import type { SimilarQuestion } from '../../services/tutor';
import { isOutOfCredits } from '../../services/credits';
import { TutorReply } from './TutorReply';

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
}

/** One question's conversation with the tutor: explanations, the student's
    answers to "Did that make sense?", and practice questions. */
type Turn =
  | { kind: 'ai'; text: string }
  | { kind: 'tutor'; text: string }
  | { kind: 'student'; text: string }
  | { kind: 'similar'; item: SimilarQuestion; picked?: string }
  | { kind: 'loading'; text: string }
  | { kind: 'error'; text: string; out: boolean };

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

export const ExamReview: React.FC<Props> = ({ title, questions, subjects, answers, firstName, timeUp, estimate, tutor, onExit, onRetake, onUpgrade }) => {
  const isRight = (q: DiagnosticQuestion) => answers[q.id] === q.correctAnswer;
  const isSkipped = (q: DiagnosticQuestion) => !answers[q.id];
  const right = questions.filter(isRight);
  const skipped = questions.filter(isSkipped);
  const missed = questions.filter((q) => !isRight(q) && !isSkipped(q));
  const pct = questions.length ? Math.round((right.length / questions.length) * 100) : 0;
  const teacher = tutor?.name ?? 'your AI tutor';

  const [filter, setFilter] = useState<Filter | null>(null);
  const [at, setAt] = useState(0);
  const [threads, setThreads] = useState<Record<number, Turn[]>>({});
  /** Questions the student said they understand. */
  const [settled, setSettled] = useState<Record<number, boolean>>({});
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

  const request = (item: DiagnosticQuestion) => ({
    subject: item.subject,
    question: item.question,
    options: item.options,
    correctAnswer: item.correctAnswer,
    explanation: item.explanation,
    yourAnswer: answers[item.id],
    topic: item.topic,
  });
  const name = tutor?.name ?? 'Your tutor';

  const add = (id: number, ...turns: Turn[]) => setThreads((t) => ({ ...t, [id]: [...(t[id] ?? []), ...turns] }));
  /** Shows "working…" while the AI answers, then the answer (or what went wrong) in its place. */
  const run = (id: number, working: string, work: Promise<Turn>) => {
    add(id, { kind: 'loading', text: working });
    const settle = (turn: Turn) =>
      setThreads((t) => {
        const list = [...(t[id] ?? [])];
        const i = list.map((x) => x.kind).lastIndexOf('loading');
        if (i >= 0) list[i] = turn;
        return { ...t, [id]: list };
      });
    work.then(settle).catch((err: Error) => settle({ kind: 'error', text: err.message, out: isOutOfCredits(err) }));
  };

  const explain = (item: DiagnosticQuestion) =>
    run(item.id, `${name} is working it through…`, explainQuestion(request(item), tutor?.id).then((text): Turn => ({ kind: 'ai', text })));

  const understood = (item: DiagnosticQuestion) => {
    add(
      item.id,
      { kind: 'student', text: 'Yes, I understand.' },
      { kind: 'tutor', text: `Great, ${firstName}! You’ve got it. Tap “Next question” when you’re ready, or try a similar one to be sure.` },
    );
    setSettled((x) => ({ ...x, [item.id]: true }));
  };

  const simpler = (item: DiagnosticQuestion) => {
    const before = [...(threads[item.id] ?? [])].reverse().find((x) => x.kind === 'ai');
    add(
      item.id,
      { kind: 'student', text: 'No, I don’t understand.' },
      { kind: 'tutor', text: 'No problem, thank you for telling me! I’ll explain it more simply, step by step, so you understand.' },
    );
    setSettled((x) => ({ ...x, [item.id]: false }));
    run(
      item.id,
      `${name} is finding a simpler way…`,
      explainSimpler(request(item), before?.kind === 'ai' ? before.text : '', tutor?.id).then((text): Turn => ({ kind: 'ai', text })),
    );
  };

  const similar = (item: DiagnosticQuestion) => {
    add(
      item.id,
      { kind: 'student', text: 'Give me a similar question.' },
      { kind: 'tutor', text: 'Here’s one like it. Try it yourself first, then I’ll show you the working.' },
    );
    setSettled((x) => ({ ...x, [item.id]: false }));
    run(
      item.id,
      `${name} is writing a question for you…`,
      similarQuestion(request(item), tutor?.id).then((sq): Turn => ({ kind: 'similar', item: sq })),
    );
  };

  const pickSimilar = (id: number, index: number, label: string) =>
    setThreads((t) => ({ ...t, [id]: (t[id] ?? []).map((x, i) => (i === index && x.kind === 'similar' ? { ...x, picked: label } : x)) }));

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

  const thread = q ? (threads[q.id] ?? []) : [];
  const last = thread[thread.length - 1];
  const busy = last?.kind === 'loading';
  const hasAi = thread.some((x) => x.kind === 'ai');
  // "Did that make sense?" after every explanation and every answered practice question.
  const asking =
    !!q && !settled[q.id] && !busy && (last?.kind === 'ai' || (last?.kind === 'similar' && !!last.picked) || (last?.kind === 'error' && hasAi));

  return (
    <div className="ui-page xr">
      {/* ------------------------------------------------------------ Result */}
      <section className="ui-card xr-hero">
        <ScoreRing pct={pct} />
        <div className="xr-hero__text">
          <p className="xr-hero__eyebrow">{timeUp ? 'Time up' : 'Exam submitted'}</p>
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

              <p className="xr-question">{q.question}</p>
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
                <span className={`tutor-avatar${tutor ? ` tutor-avatar--${tutor.id}` : ''}`} aria-hidden>
                  {tutor ? tutor.name.charAt(0) : <GraduationCap size={16} />}
                </span>
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

              {!hasAi && !busy && (
                <button type="button" className="ui-btn ui-btn--primary xr-explain" onClick={() => explain(q)}>
                  <Sparkles size={18} aria-hidden /> Explain step by step with {tutor?.name ?? 'AI'}
                </button>
              )}

              {thread.map((turn, i) => {
                const latest = i === thread.length - 1;
                switch (turn.kind) {
                  case 'ai':
                    return (
                      <div key={i} className="xr-ai">
                        <TutorReply text={turn.text} stepwise={latest} />
                      </div>
                    );
                  case 'tutor':
                    return (
                      <div key={i} className="xr-say">
                        <span className={`tutor-avatar${tutor ? ` tutor-avatar--${tutor.id}` : ''}`} aria-hidden>
                          {tutor ? tutor.name.charAt(0) : <GraduationCap size={16} />}
                        </span>
                        <p>{turn.text}</p>
                      </div>
                    );
                  case 'student':
                    return (
                      <p key={i} className="xr-me">
                        {turn.text}
                      </p>
                    );
                  case 'loading':
                    return (
                      <p key={i} className="xr-thinking" role="status">
                        <i />
                        <i />
                        <i /> {turn.text}
                      </p>
                    );
                  case 'error':
                    return (
                      <div key={i} className="xr-ai-error" role="alert">
                        <p>{turn.text}</p>
                        {turn.out && onUpgrade && (
                          <button type="button" className="ui-btn ui-btn--primary" onClick={onUpgrade}>
                            Get more AI credits
                          </button>
                        )}
                      </div>
                    );
                  case 'similar': {
                    const sq = turn.item;
                    const picked = turn.picked;
                    return (
                      <div key={i} className="xr-sim">
                        <strong className="xr-sim__label">Practice question</strong>
                        <p className="xr-question">{sq.question}</p>
                        <div className="xr-sim__opts" role="group" aria-label="Your answer">
                          {sq.options.map((o) => {
                            const state = !picked ? '' : o.label === sq.answer ? ' is-key' : o.label === picked ? ' is-mine' : ' is-dim';
                            return (
                              <button
                                key={o.label}
                                type="button"
                                className={`xr-sim__opt${state}`}
                                disabled={!!picked}
                                onClick={() => pickSimilar(q.id, i, o.label)}
                              >
                                <b>{o.label}</b> {o.text}
                              </button>
                            );
                          })}
                        </div>
                        {picked && (
                          <>
                            <p className={`xr-sim__result ${picked === sq.answer ? 'is-right' : 'is-wrong'}`}>
                              {picked === sq.answer ? `Correct, ${firstName}! Well done.` : `Not quite. The answer is ${sq.answer}. Here’s the working:`}
                            </p>
                            <div className="xr-ai">
                              <TutorReply text={sq.why} stepwise={latest} />
                            </div>
                          </>
                        )}
                      </div>
                    );
                  }
                }
              })}

              {asking && (
                <div className="xr-check">
                  <strong>Did that make sense?</strong>
                  <div className="xr-check__btns">
                    <button type="button" className="xr-check__yes" onClick={() => understood(q)}>
                      <ThumbsUp size={16} aria-hidden /> Yes, I understand
                    </button>
                    <button type="button" className="xr-check__no" onClick={() => simpler(q)}>
                      <X size={16} aria-hidden /> No, explain it more simply
                    </button>
                    <button type="button" className="xr-check__more" onClick={() => similar(q)}>
                      <Repeat size={16} aria-hidden /> Give me a similar question
                    </button>
                  </div>
                </div>
              )}
              {settled[q.id] && !busy && (
                <div className="xr-check xr-check--done">
                  <button type="button" className="xr-check__more" onClick={() => similar(q)}>
                    <Repeat size={16} aria-hidden /> Try a similar question
                  </button>
                </div>
              )}

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
          <ArrowLeft size={18} aria-hidden /> Back to dashboard
        </button>
        <button type="button" className="ui-btn ui-btn--ghost" onClick={onRetake}>
          <RotateCcw size={18} aria-hidden /> New set of questions
        </button>
      </div>
    </div>
  );
};
