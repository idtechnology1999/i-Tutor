import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  LayoutGrid,
  MessageSquareText,
  RotateCcw,
  X,
} from 'lucide-react';
import type { DiagnosticQuestion, UserProfile } from '../../types';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';

interface Props {
  profile: UserProfile;
  onExit: () => void;
  onOpenTutor?: () => void;
}

type Subject = DiagnosticQuestion['subject'];
const SUBJECTS: Subject[] = ['English', 'Mathematics', 'Physics', 'Chemistry'];
const EXAM_SECONDS = 2 * 60 * 60;

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const CBTExamView: React.FC<Props> = ({ profile, onExit, onOpenTutor }) => {
  const [activeSubject, setActiveSubject] = useState<Subject>('Physics');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(EXAM_SECONDS);
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('0');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openReview, setOpenReview] = useState<number | null>(null);

  const tabsRef = useRef<HTMLElement>(null);

  // Keep the chosen subject tab visible when the strip scrolls on phones.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>('.is-on');
    tab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeSubject]);

  const subjectQuestions = DIAGNOSTIC_QUESTIONS.filter((q) => q.subject === activeSubject);
  const activeQuestion = subjectQuestions[currentQIndex] || DIAGNOSTIC_QUESTIONS[0];
  const total = DIAGNOSTIC_QUESTIONS.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  // The paper is over when the candidate submits or the clock hits zero.
  const finished = isSubmitted || timeLeft <= 0;

  useEffect(() => {
    if (finished) return;
    const timer = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [finished]);

  const goTo = useCallback(
    (index: number) => {
      setCurrentQIndex(Math.max(0, Math.min(subjectQuestions.length - 1, index)));
      setPaletteOpen(false);
    },
    [subjectQuestions.length],
  );

  const switchSubject = (subject: Subject) => {
    setActiveSubject(subject);
    setCurrentQIndex(0);
  };

  const handleSelectOption = useCallback(
    (label: string) => setAnswers((prev) => ({ ...prev, [activeQuestion.id]: label })),
    [activeQuestion.id],
  );

  const toggleFlag = useCallback(
    () => setFlagged((prev) => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] })),
    [activeQuestion.id],
  );

  // Keyboard: A–D or 1–4 to answer, N / P to move, F to flag.
  useEffect(() => {
    if (finished || confirm) return;
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea') || event.metaKey || event.ctrlKey) return;
      const key = event.key.toLowerCase();
      const pick = 'abcd'.indexOf(key) >= 0 ? 'abcd'.indexOf(key) : '1234'.indexOf(key);
      if (pick >= 0 && activeQuestion.options[pick]) handleSelectOption(activeQuestion.options[pick].label);
      else if (key === 'n' || key === 'arrowright') goTo(currentQIndex + 1);
      else if (key === 'p' || key === 'arrowleft') goTo(currentQIndex - 1);
      else if (key === 'f') toggleFlag();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [finished, confirm, activeQuestion, currentQIndex, goTo, handleSelectOption, toggleFlag]);

  const handleCalcClick = (val: string) => {
    if (val === 'C') {
      setCalcInput('0');
    } else if (val === '=') {
      try {
        // Safe basic arithmetic evaluation
        const sanitized = calcInput.replace(/[^0-9+\-*/.]/g, '');
        // eslint-disable-next-line no-eval
        const res = Function(`'use strict'; return (${sanitized})`)();
        setCalcInput(String(res));
      } catch {
        setCalcInput('Error');
      }
    } else {
      setCalcInput((prev) => (prev === '0' || prev === 'Error' ? val : prev + val));
    }
  };

  const restart = () => {
    setAnswers({});
    setFlagged({});
    setTimeLeft(EXAM_SECONDS);
    setActiveSubject('Physics');
    setCurrentQIndex(0);
    setOpenReview(null);
    setIsSubmitted(false);
  };

  /* ================================================================ Results */
  if (finished) {
    const correctCount = DIAGNOSTIC_QUESTIONS.filter((q) => answers[q.id] === q.correctAnswer).length;
    const scorePct = Math.round((correctCount / total) * 100);
    const estimate = Math.round(160 + (scorePct / 100) * 200);

    return (
      <div className="ui-page exam-result">
        <section className="ui-card exam-result__hero">
          <span className="exam-result__badge">
            <Check size={28} aria-hidden />
          </span>
          <h1>Exam finished</h1>
          <p>Here’s how you did, {profile.fullName.split(' ')[0]}.</p>

          <div className="exam-result__stats">
            <div>
              <strong>
                {correctCount}/{total}
              </strong>
              <span>Correct</span>
            </div>
            <div>
              <strong>{scorePct}%</strong>
              <span>Score</span>
            </div>
            <div className="is-key">
              <strong>{estimate}</strong>
              <span>Likely JAMB score</span>
            </div>
          </div>

          <div className="exam-result__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={onExit}>
              Back to home
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--lg" onClick={restart}>
              <RotateCcw size={18} aria-hidden /> Try again
            </button>
          </div>
        </section>

        <section className="ui-card exam-review">
          <h2>Check your answers</h2>
          <p className="exam-review__sub">Tap a question to see the right answer and why.</p>
          <ol>
            {DIAGNOSTIC_QUESTIONS.map((q, i) => {
              const yours = answers[q.id];
              const right = yours === q.correctAnswer;
              const open = openReview === q.id;
              const correctText = q.options.find((o) => o.label === q.correctAnswer)?.text;
              const yourText = q.options.find((o) => o.label === yours)?.text;
              return (
                <li key={q.id} className={`exam-review__item ${right ? 'is-right' : 'is-wrong'}${open ? ' is-open' : ''}`}>
                  <button type="button" onClick={() => setOpenReview(open ? null : q.id)} aria-expanded={open}>
                    <span className="exam-review__mark" aria-hidden>
                      {right ? <Check size={14} /> : <X size={14} />}
                    </span>
                    <span className="exam-review__q">
                      <small>
                        {i + 1}. {q.subject}
                      </small>
                      {q.question}
                    </span>
                    <ChevronDown size={18} className="exam-review__chev" aria-hidden />
                  </button>
                  {open && (
                    <div className="exam-review__body">
                      <p>
                        <b>Your answer:</b> {yours ? `${yours}. ${yourText}` : 'Not answered'}
                      </p>
                      {!right && (
                        <p>
                          <b>Right answer:</b> {q.correctAnswer}. {correctText}
                        </p>
                      )}
                      <p className="exam-review__why">{q.explanation}</p>
                      {onOpenTutor && (
                        <button type="button" className="ui-link" onClick={onOpenTutor}>
                          <MessageSquareText size={16} aria-hidden /> Still confused? Ask the tutor
                        </button>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    );
  }

  /* ================================================================== Exam */
  const isFlagged = Boolean(flagged[activeQuestion.id]);
  const lowTime = timeLeft < 5 * 60;

  const palette = (
    <>
      <div className="exam-palette__head">
        <strong>{activeSubject}</strong>
        <span>
          {subjectQuestions.filter((q) => answers[q.id]).length} of {subjectQuestions.length} answered
        </span>
      </div>
      <div className="exam-palette__grid">
        {subjectQuestions.map((q, idx) => {
          const state =
            idx === currentQIndex ? 'is-current' : flagged[q.id] ? 'is-flag' : answers[q.id] ? 'is-done' : '';
          return (
            <button key={q.id} type="button" className={state} onClick={() => goTo(idx)} aria-label={`Question ${idx + 1}`}>
              {idx + 1}
            </button>
          );
        })}
      </div>
      <ul className="exam-palette__legend">
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
    </>
  );

  return (
    <div className="exam">
      {/* ----------------------------------------------------------- Top bar */}
      <header className="exam__bar">
        <button type="button" className="exam__exit" onClick={() => setConfirm('exit')}>
          <X size={18} aria-hidden />
          <span>Exit</span>
        </button>
        <div className="exam__title">
          <strong>Practice exam</strong>
          <span>{profile.fullName}</span>
        </div>
        <div className="exam__bar-right">
          <span className={`exam__timer${lowTime ? ' is-low' : ''}`} role="timer" aria-label="Time left">
            <Clock3 size={16} aria-hidden />
            {formatTime(timeLeft)}
          </span>
          <button
            type="button"
            className={`exam__icon-btn${showCalculator ? ' is-on' : ''}`}
            onClick={() => setShowCalculator((v) => !v)}
            aria-label="Calculator"
            aria-pressed={showCalculator}
          >
            <Calculator size={18} aria-hidden />
          </button>
          <button type="button" className="exam__submit" onClick={() => setConfirm('submit')}>
            Submit
          </button>
        </div>
      </header>

      {/* ------------------------------------------------------ Subject tabs */}
      <nav className="exam__tabs" aria-label="Subjects" ref={tabsRef}>
        {SUBJECTS.map((subject) => {
          const qs = DIAGNOSTIC_QUESTIONS.filter((q) => q.subject === subject);
          const done = qs.filter((q) => answers[q.id]).length;
          return (
            <button
              key={subject}
              type="button"
              className={activeSubject === subject ? 'is-on' : ''}
              onClick={() => switchSubject(subject)}
              aria-current={activeSubject === subject ? 'true' : undefined}
            >
              {subject}
              <small>
                {done}/{qs.length}
              </small>
            </button>
          );
        })}
      </nav>

      <div className="exam__layout">
        {/* ------------------------------------------------------ Question */}
        <main className="exam__card">
          <div className="exam__meta">
            <span>
              Question <b>{currentQIndex + 1}</b> of {subjectQuestions.length}
            </span>
            <button
              type="button"
              className={`exam__flag${isFlagged ? ' is-on' : ''}`}
              onClick={toggleFlag}
              aria-pressed={isFlagged}
            >
              <Flag size={16} aria-hidden />
              {isFlagged ? 'Flagged' : 'Flag'}
            </button>
          </div>

          <p className="exam__topic">{activeQuestion.topic}</p>
          <h2 className="exam__question" key={activeQuestion.id}>
            {activeQuestion.question}
          </h2>

          <div className="exam__options" role="radiogroup" aria-label="Answer options" key={`o${activeQuestion.id}`}>
            {activeQuestion.options.map((opt, i) => {
              const isSelected = answers[activeQuestion.id] === opt.label;
              return (
                <button
                  key={opt.label}
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={`exam__option${isSelected ? ' is-picked' : ''}`}
                  style={{ ['--i' as string]: i }}
                  onClick={() => handleSelectOption(opt.label)}
                >
                  <span className="exam__key">{opt.label}</span>
                  <span>{opt.text}</span>
                  {isSelected && <Check size={18} className="exam__picked" aria-hidden />}
                </button>
              );
            })}
          </div>

          <div className="exam__nav">
            <button
              type="button"
              className="ui-btn ui-btn--ghost"
              disabled={currentQIndex === 0}
              onClick={() => goTo(currentQIndex - 1)}
            >
              <ChevronLeft size={18} aria-hidden /> Previous
            </button>
            <button type="button" className="ui-btn ui-btn--ghost exam__grid-btn" onClick={() => setPaletteOpen(true)}>
              <LayoutGrid size={18} aria-hidden /> {currentQIndex + 1}/{subjectQuestions.length}
            </button>
            {currentQIndex < subjectQuestions.length - 1 ? (
              <button type="button" className="ui-btn ui-btn--primary" onClick={() => goTo(currentQIndex + 1)}>
                Next <ChevronRight size={18} aria-hidden />
              </button>
            ) : (
              <button
                type="button"
                className="ui-btn ui-btn--primary"
                onClick={() => {
                  const nextSubject = SUBJECTS[(SUBJECTS.indexOf(activeSubject) + 1) % SUBJECTS.length];
                  switchSubject(nextSubject);
                }}
              >
                Next subject <ChevronRight size={18} aria-hidden />
              </button>
            )}
          </div>
          <p className="exam__keys">Tip: press A–D to answer, N for next, P for previous, F to flag.</p>
        </main>

        {/* ------------------------------------------------ Side (desktop) */}
        <aside className="exam__side">
          <div className="ui-card exam-palette">{palette}</div>
        </aside>
      </div>

      {/* --------------------------------------------- Palette sheet (phone) */}
      {paletteOpen && (
        <div className="ui-overlay" onClick={() => setPaletteOpen(false)}>
          <div className="ui-sheet exam-palette" onClick={(e) => e.stopPropagation()} role="dialog" aria-label="All questions">
            <div className="ui-sheet__grab" aria-hidden />
            {palette}
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--block" onClick={() => setPaletteOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------- Calculator */}
      {showCalculator && (
        <div className="exam-calc" role="dialog" aria-label="Calculator">
          <div className="exam-calc__head">
            <strong>Calculator</strong>
            <button type="button" onClick={() => setShowCalculator(false)} aria-label="Close calculator">
              <X size={18} aria-hidden />
            </button>
          </div>
          <output className="exam-calc__screen">{calcInput}</output>
          <div className="exam-calc__keys">
            {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => (
              <button
                key={btn}
                type="button"
                className={btn === '=' ? 'is-eq' : btn === 'C' ? 'is-clear' : /[0-9]/.test(btn) ? '' : 'is-op'}
                onClick={() => handleCalcClick(btn)}
              >
                {btn === '*' ? '×' : btn === '/' ? '÷' : btn === '-' ? '−' : btn}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* -------------------------------------------------------- Confirm */}
      {confirm && (
        <div className="ui-overlay ui-overlay--center" onClick={() => setConfirm(null)}>
          <div className="ui-dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {confirm === 'submit' ? (
              <>
                <h2>Submit your exam?</h2>
                <p>
                  You answered <b>{answeredCount}</b> of {total} questions.
                  {total - answeredCount > 0 && ` ${total - answeredCount} still unanswered.`}
                  {flaggedCount > 0 && ` ${flaggedCount} flagged to check.`}
                </p>
                <div className="ui-dialog__actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setConfirm(null)}>
                    Keep working
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary"
                    onClick={() => {
                      setConfirm(null);
                      setIsSubmitted(true);
                    }}
                  >
                    Yes, submit
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Leave the exam?</h2>
                <p>Your answers in this practice exam will not be saved.</p>
                <div className="ui-dialog__actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setConfirm(null)}>
                    Stay
                  </button>
                  <button type="button" className="ui-btn ui-btn--danger" onClick={onExit}>
                    Leave exam
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
