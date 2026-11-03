import React from 'react';
import { ChevronsRight, GraduationCap, Repeat, Sparkles, ThumbsUp, X } from 'lucide-react';
import type { DiagnosticQuestion } from '../../types';
import type { TutorPersona } from '../../data/tutors';
import type { TutorThreads } from '../../lib/useTutorThreads';
import { TutorReply } from './TutorReply';

/* The tutor's conversation under one question (logic in lib/useTutorThreads):
   "Explain step by step", the explanation, then "Did that make sense?" with
   Yes / No, explain more simply / a similar question / Skip. Styles in
   styles/exam-review.css (xr-*). */

type Item = Pick<DiagnosticQuestion, 'id' | 'subject' | 'topic' | 'question' | 'options' | 'correctAnswer' | 'explanation'>;

interface Props {
  item: Item;
  /** What the student picked, if anything (the tutor explains from there). */
  yourAnswer?: string;
  threads: TutorThreads;
  tutor?: TutorPersona;
  firstName: string;
  /** Hide the "Explain step by step" button (e.g. the parent shows its own). */
  hideStart?: boolean;
  onUpgrade?: () => void;
  /** After Skip: move on to the next question. */
  onSkip?: () => void;
}

export const TutorAvatar: React.FC<{ tutor?: TutorPersona; size?: number }> = ({ tutor, size = 16 }) => (
  <span className={`tutor-avatar${tutor ? ` tutor-avatar--${tutor.id}` : ''}`} aria-hidden>
    {tutor ? tutor.name.charAt(0) : <GraduationCap size={size} />}
  </span>
);

export const TutorThread: React.FC<Props> = ({ item, yourAnswer, threads, tutor, firstName, hideStart, onUpgrade, onSkip }) => {
  const thread = threads.thread(item.id);
  const last = thread[thread.length - 1];
  const busy = last?.kind === 'loading';
  const hasAi = thread.some((x) => x.kind === 'ai');
  // "Did that make sense?" after every explanation and every answered practice question.
  const asking =
    !threads.settled(item.id) && !busy && (last?.kind === 'ai' || (last?.kind === 'similar' && !!last.picked) || (last?.kind === 'error' && hasAi));
  const skip = () => {
    threads.skip(item);
    onSkip?.();
  };

  return (
    <>
      {!hasAi && !busy && !hideStart && (
        <button type="button" className="ui-btn ui-btn--primary xr-explain" onClick={() => threads.explain(item, yourAnswer)}>
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
                <TutorAvatar tutor={tutor} />
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
                        onClick={() => threads.pickSimilar(item.id, i, o.label)}
                      >
                        <b>{o.label}</b> {o.text}
                      </button>
                    );
                  })}
                </div>
                {!picked && (
                  <button type="button" className="xr-sim__skip" onClick={skip}>
                    Skip this one <ChevronsRight size={15} aria-hidden />
                  </button>
                )}
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
            <button type="button" className="xr-check__yes" onClick={() => threads.understood(item)}>
              <ThumbsUp size={16} aria-hidden /> Yes, I understand
            </button>
            <button type="button" className="xr-check__no" onClick={() => threads.simpler(item, yourAnswer)}>
              <X size={16} aria-hidden /> No, explain it more simply
            </button>
            <button type="button" className="xr-check__more" onClick={() => threads.similar(item, yourAnswer)}>
              <Repeat size={16} aria-hidden /> Give me a similar question
            </button>
            <button type="button" className="xr-check__skip" onClick={skip}>
              <ChevronsRight size={16} aria-hidden /> Skip
            </button>
          </div>
        </div>
      )}
      {threads.settled(item.id) && hasAi && !busy && (
        <div className="xr-check xr-check--done">
          <button type="button" className="xr-check__more" onClick={() => threads.similar(item, yourAnswer)}>
            <Repeat size={16} aria-hidden /> Try a similar question
          </button>
        </div>
      )}
    </>
  );
};
