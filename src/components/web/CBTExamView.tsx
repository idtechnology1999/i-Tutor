import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  Atom,
  Calculator,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flag,
  GraduationCap,
  Leaf,
  BookOpen,
  FlaskConical,
  Languages,
  Layers,
  LayoutGrid,
  ListChecks,
  MessageSquareText,
  Play,
  RotateCcw,
  Sigma,
  Timer,
  X,
} from 'lucide-react';
import type { DiagnosticQuestion, UserProfile } from '../../types';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';
import { ExamCalculator } from './ExamCalculator';
import { CMS_SUBJECTS, toExamQuestion, useCms } from '../../lib/cms';

interface Props {
  profile: UserProfile;
  onExit: () => void;
  onOpenTutor?: () => void;
  /** Subject the student tapped to get here, pre-selected in the setup. */
  presetSubject?: DiagnosticQuestion['subject'];
  /** Course mock: the four JAMB subjects for a course. */
  presetCourse?: { name: string; subjects: string[]; exam?: string };
}

type Subject = string;
/** 'all', 'course', or a subject name. */
type Choice = string;
const CORE_SUBJECTS: Subject[] = ['English', 'Mathematics', 'Physics', 'Chemistry'];
// Display order: JAMB's usual subject order, unknown subjects last.
const orderOf = (s: string) => {
  const i = (CMS_SUBJECTS as readonly string[]).indexOf(s);
  return i < 0 ? 99 : i;
};
const bySubjectOrder = (a: string, b: string) => orderOf(a) - orderOf(b) || a.localeCompare(b);

const SUBJECT_LOOK: Record<string, { note: string; icon: typeof Layers }> = {
  English: { note: 'Use of English', icon: Languages },
  Mathematics: { note: 'Algebra, calculus…', icon: Sigma },
  Physics: { note: 'Motion, waves…', icon: Atom },
  Chemistry: { note: 'Organic, moles…', icon: FlaskConical },
  Biology: { note: 'Cells, genetics…', icon: Leaf },
};
const COUNT_STEPS = [5, 10, 20, 40, 60];
const SECONDS_PER_QUESTION = 60;

const poolFor = (bank: DiagnosticQuestion[], choice: Choice, courseSubjects: string[] = []) =>
  choice === 'all'
    ? bank
    : choice === 'course'
      ? bank.filter((q) => courseSubjects.includes(q.subject))
      : bank.filter((q) => q.subject === choice);

// Sensible counts for the pool size, always ending with "all of them".
const countOptions = (available: number) => {
  const steps = COUNT_STEPS.filter((n) => n < available);
  return [...steps, available];
};

const formatTime = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return h > 0
    ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
    : `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

const minutesLabel = (count: number) => {
  const mins = Math.round((count * SECONDS_PER_QUESTION) / 60);
  if (mins < 60) return `${mins} min`;
  const rest = mins % 60;
  return rest ? `${Math.floor(mins / 60)} hr ${rest} min` : `${mins / 60} hr`;
};

export const CBTExamView: React.FC<Props> = ({ profile, onExit, onOpenTutor, presetSubject, presetCourse }) => {
  // Published questions from the CMS, in the four CBT subjects.
  const { questions: cmsQuestions } = useCms();
  const bank = cmsQuestions
    .filter((q) => q.status === 'published' && q.examType === (presetCourse?.exam ?? 'UTME'))
    .map(toExamQuestion);
  const courseSubjects = presetCourse?.subjects ?? [];

  // Setup: nothing runs until the student has chosen and pressed Start.
  const [config, setConfig] = useState<null | { choice: Choice; count: number }>(null);
  const startChoice: Choice = presetCourse ? 'course' : (presetSubject ?? 'all');
  const [pickChoice, setPickChoice] = useState<Choice>(startChoice);
  const [pickCount, setPickCount] = useState(() => poolFor(bank, startChoice, courseSubjects).length);

  const [activeSubject, setActiveSubject] = useState<Subject>('English');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [showCalculator, setShowCalculator] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [openReview, setOpenReview] = useState<number | null>(null);

  const tabsRef = useRef<HTMLElement>(null);

  const examQuestions = config ? poolFor(bank, config.choice, courseSubjects).slice(0, config.count) : [];
  const examSubjects = [...new Set(examQuestions.map((q) => q.subject))].sort(bySubjectOrder);

  // Keep the chosen subject tab visible when the strip scrolls on phones.
  useEffect(() => {
    const tab = tabsRef.current?.querySelector<HTMLElement>('.is-on');
    tab?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [activeSubject]);

  const subjectQuestions = examQuestions.filter((q) => q.subject === activeSubject);
  const activeQuestion = subjectQuestions[currentQIndex] || examQuestions[0] || DIAGNOSTIC_QUESTIONS[0];
  const total = examQuestions.length;
  const answeredCount = Object.keys(answers).length;
  const flaggedCount = Object.values(flagged).filter(Boolean).length;

  // The paper is over when the candidate submits or the clock hits zero.
  const running = config !== null;
  const finished = running && (isSubmitted || timeLeft <= 0);

  useEffect(() => {
    if (!running || finished) return;
    const timer = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, finished]);

  const startExam = () => {
    const pool = poolFor(bank, pickChoice, courseSubjects);
    const count = Math.min(pickCount, pool.length);
    const chosen = pool.slice(0, count);
    const first = [...new Set(chosen.map((q) => q.subject))].sort(bySubjectOrder)[0] ?? 'English';
    setAnswers({});
    setFlagged({});
    setCurrentQIndex(0);
    setActiveSubject(first);
    setTimeLeft(count * SECONDS_PER_QUESTION);
    setIsSubmitted(false);
    setOpenReview(null);
    setConfig({ choice: pickChoice, count });
  };

  const goTo = (index: number) => {
    setCurrentQIndex(Math.max(0, Math.min(subjectQuestions.length - 1, index)));
    setPaletteOpen(false);
  };

  const switchSubject = (subject: Subject) => {
    setActiveSubject(subject);
    setCurrentQIndex(0);
  };

  const handleSelectOption = (label: string) =>
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: label }));

  const toggleFlag = () =>
    setFlagged((prev) => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }));

  // Keyboard: A–D or 1–4 to answer, N / P to move, F to flag. The listener is
  // attached once and always calls the latest handler through a ref.
  const onKeyRef = useRef<(event: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    onKeyRef.current = (event) => {
      if (!running || finished || confirm) return;
      const target = event.target as HTMLElement;
      if (target.closest('input, textarea, .calc') || event.metaKey || event.ctrlKey) return;
      const key = event.key.toLowerCase();
      const pick = 'abcd'.indexOf(key) >= 0 ? 'abcd'.indexOf(key) : '1234'.indexOf(key);
      if (pick >= 0 && activeQuestion.options[pick]) handleSelectOption(activeQuestion.options[pick].label);
      else if (key === 'n' || key === 'arrowright') goTo(currentQIndex + 1);
      else if (key === 'p' || key === 'arrowleft') goTo(currentQIndex - 1);
      else if (key === 'f') toggleFlag();
    };
  });
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => onKeyRef.current(event);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // "Try again" goes back to the setup so the student can change their mind.
  const restart = () => {
    setConfig(null);
    setIsSubmitted(false);
    setOpenReview(null);
  };

  /* ================================================================== Setup */
  if (!running) {
    const pool = poolFor(bank, pickChoice, courseSubjects);
    const options = countOptions(pool.length);
    const count = Math.min(pickCount, pool.length);
    // Subjects: the core four always, plus any others that have JAMB questions.
    const subjectIds = [...new Set([...CORE_SUBJECTS, ...bank.map((q) => q.subject)])].sort(bySubjectOrder);
    const choices: Array<{ id: Choice; label: string; note: string; icon: typeof Layers }> = [
      ...(presetCourse
        ? [{ id: 'course', label: presetCourse.name, note: presetCourse.subjects.join(', '), icon: GraduationCap }]
        : []),
      { id: 'all', label: 'All subjects', note: 'Full mixed mock', icon: Layers },
      ...subjectIds.map((sid) => ({
        id: sid,
        label: sid,
        note: SUBJECT_LOOK[sid]?.note ?? 'JAMB past questions',
        icon: SUBJECT_LOOK[sid]?.icon ?? BookOpen,
      })),
    ];
    const chosen = choices.find((c) => c.id === pickChoice) ?? choices[0];
    const ChosenIcon = chosen.icon;

    return (
      <div className="xs">
        <header className="xs__bar">
          <button type="button" className="xs__back" onClick={onExit}>
            <ArrowLeft size={18} aria-hidden /> Home
          </button>
          <span className="xs__bar-title">Practice exam</span>
          <span className="xs__bar-spacer" aria-hidden />
        </header>

        <div className="xs__wrap">
          <section className="xs__intro">
            <p className="xs__eyebrow">
              <Timer size={16} aria-hidden /> Timed like the real CBT
            </p>
            <h1>{presetCourse ? `${presetCourse.name} practice` : 'Set up your exam'}</h1>
            <p className="xs__lead">
              Choose a subject and how many questions you want. The timer only starts when you
              press <b>Start exam</b>.
            </p>
          </section>

          <div className="xs__grid">
            <div className="xs__steps">
              {/* Step 1 */}
              <section className="xs__step">
                <h2>
                  <span className="xs__num">1</span> Choose a subject
                </h2>
                <div className="xs__subjects" role="radiogroup" aria-label="Subject">
                  {choices.map((c, i) => {
                    const Icon = c.icon;
                    const on = pickChoice === c.id;
                    const n = poolFor(bank, c.id, courseSubjects).length;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        role="radio"
                        aria-checked={on}
                        className={`xs__subject${on ? ' is-on' : ''}${c.id === 'all' || c.id === 'course' ? ' xs__subject--all' : ''}`}
                        style={{ ['--i' as string]: i }}
                        onClick={() => {
                          setPickChoice(c.id);
                          setPickCount(n);
                        }}
                      >
                        <span className="xs__subject-icon">
                          <Icon size={22} aria-hidden />
                        </span>
                        <span className="xs__subject-text">
                          <strong>{c.label}</strong>
                          <small>{c.note}</small>
                        </span>
                        <span className="xs__subject-count">
                          {n} {n === 1 ? 'question' : 'questions'}
                        </span>
                        <span className="xs__tick" aria-hidden>
                          <Check size={14} />
                        </span>
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 2 */}
              <section className="xs__step">
                <h2>
                  <span className="xs__num">2</span> How many questions?
                </h2>
                <div className="xs__counts" role="radiogroup" aria-label="Number of questions">
                  {options.map((n) => (
                    <button
                      key={n}
                      type="button"
                      role="radio"
                      aria-checked={count === n}
                      className={count === n ? 'is-on' : ''}
                      onClick={() => setPickCount(n)}
                    >
                      <strong>{n}</strong>
                      <small>{n === pool.length && options.length > 1 ? 'all' : minutesLabel(n)}</small>
                    </button>
                  ))}
                </div>
                <p className="xs__hint">
                  {count === 0
                    ? 'No questions for this subject yet — pick another subject.'
                    : 'You get about 1 minute per question, like the real exam.'}
                </p>
              </section>

              {/* Step 3 */}
              <section className="xs__step">
                <h2>
                  <span className="xs__num">3</span> Good to know
                </h2>
                <ul className="xs__rules">
                  <li>
                    <span>
                      <Check size={16} aria-hidden />
                    </span>
                    Tap an answer to choose it. You can change it any time.
                  </li>
                  <li>
                    <span>
                      <Flag size={16} aria-hidden />
                    </span>
                    Not sure? Flag the question and come back later.
                  </li>
                  <li>
                    <span>
                      <Calculator size={16} aria-hidden />
                    </span>
                    A calculator is there if you need it.
                  </li>
                  <li>
                    <span>
                      <Clock3 size={16} aria-hidden />
                    </span>
                    When time runs out, your answers are submitted for you.
                  </li>
                </ul>
              </section>
            </div>

            {/* Summary: side panel on desktop, pinned bar on phones */}
            <aside className="xs__summary" aria-label="Your exam">
              <div className="xs__summary-card">
                <span className="xs__summary-icon">
                  <ChosenIcon size={26} aria-hidden />
                </span>
                <p className="xs__summary-label">Your exam</p>
                <h3>{chosen.label}</h3>
                <dl className="xs__facts">
                  <div>
                    <dt>
                      <ListChecks size={16} aria-hidden /> Questions
                    </dt>
                    <dd>{count}</dd>
                  </div>
                  <div>
                    <dt>
                      <Timer size={16} aria-hidden /> Time
                    </dt>
                    <dd>{minutesLabel(count)}</dd>
                  </div>
                </dl>
                <button type="button" className="xs__start" onClick={startExam} disabled={count === 0}>
                  <Play size={18} aria-hidden /> Start exam
                </button>
                <p className="xs__fine">Answers and explanations are shown after you submit.</p>
              </div>
            </aside>
          </div>
        </div>

        <div className="xs__dock">
          <div>
            <strong>{chosen.label}</strong>
            <span>
              {count} {count === 1 ? 'question' : 'questions'} · {minutesLabel(count)}
            </span>
          </div>
          <button type="button" className="xs__start" onClick={startExam} disabled={count === 0}>
            <Play size={18} aria-hidden /> Start
          </button>
        </div>
      </div>
    );
  }

  /* ================================================================ Results */
  if (finished) {
    const correctCount = examQuestions.filter((q) => answers[q.id] === q.correctAnswer).length;
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
            {examQuestions.map((q, i) => {
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
  // Warn in the last fifth of the paper (never more than the final 5 minutes).
  const lowTime = timeLeft < Math.min(5 * 60, (config?.count ?? 0) * SECONDS_PER_QUESTION * 0.2);

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
        {examSubjects.map((subject) => {
          const qs = examQuestions.filter((q) => q.subject === subject);
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
                  const nextSubject = examSubjects[(examSubjects.indexOf(activeSubject) + 1) % examSubjects.length];
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
      {showCalculator && <ExamCalculator onClose={() => setShowCalculator(false)} />}

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
