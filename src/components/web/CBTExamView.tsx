import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Calculator, Check, ChevronDown, ChevronLeft, ChevronRight, MessageSquareText, RotateCcw, X } from 'lucide-react';
import type { DiagnosticQuestion, UserProfile } from '../../types';
import { ExamCalculator } from './ExamCalculator';
import { CMS_SUBJECTS, PRACTICE, toExamQuestion, useCms, useQuestionsReady } from '../../lib/cms';
import type { CmsQuestion } from '../../lib/cms';
import { recordResult } from '../../lib/progress';
import type { SolveRequest } from '../../data/tutors';

/* The CBT, laid out like JAMB's: candidate bar with the clock, one button per
   subject, radio-button options, a numbered question grid, and Previous /
   Next / Submit. It starts as soon as it opens — no setup screen.
   - Practise a subject: that subject's practice-bank questions (JAMB past
     questions if the practice bank has none yet).
   - Practice exam (no subject): a full UTME mock — English (60) and the
     student's three subjects (40 each) — from past and practice questions.
   - Course / Post-UTME: the subjects and exam the student picked there. */

interface Props {
  profile: UserProfile;
  onExit: () => void;
  onOpenTutor?: () => void;
  /** Practise one subject. */
  presetSubject?: DiagnosticQuestion['subject'];
  /** Course or Post-UTME practice: its subjects, exam and school. */
  presetCourse?: { name: string; subjects: string[]; exam?: string; school?: string };
  /** "Solve with my tutor" (Premium) in the answer review. */
  onSolve?: (req: SolveRequest) => void;
  solveLabel?: string;
  askLabel?: string;
}

/** JAMB: English has 60 questions, every other subject 40, all in 2 hours (40 seconds each). */
const perSubject = (subject: string) => (subject === 'English' ? 60 : 40);
const SECONDS_EACH = 40;
const MOCK_SECONDS = 2 * 60 * 60;

const bankName = (s: string) => (s === 'English Language' || s === 'Use of English' ? 'English' : s);
const order = (s: string) => {
  const i = (CMS_SUBJECTS as readonly string[]).indexOf(s);
  return i < 0 ? 99 : i;
};

function shuffle<T>(items: T[]): T[] {
  const a = [...items];
  for (let i = a.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Paper {
  title: string;
  subjects: string[];
  questions: DiagnosticQuestion[];
  seconds: number;
  /** Shown above the questions, e.g. when past questions stand in for practice ones. */
  note: string;
  /** Learning aids (Ask AI) are offered in practice, not in a mock. */
  practice: boolean;
}

function buildPaper(
  bank: CmsQuestion[],
  profile: UserProfile,
  presetSubject?: string,
  presetCourse?: Props['presetCourse'],
): Paper {
  const live = bank.filter((q) => q.status === 'published');
  const take = (subject: string, pool: CmsQuestion[]) => shuffle(pool.filter((q) => q.subject === subject)).slice(0, perSubject(subject));

  if (presetCourse) {
    const exam = presetCourse.exam ?? 'UTME';
    const pool = live.filter((q) => q.examType === exam && (!presetCourse.school || q.school === presetCourse.school));
    const subjects = [...new Set(presetCourse.subjects.map(bankName))].sort((a, b) => order(a) - order(b));
    const questions = subjects.flatMap((s) => take(s, pool)).map(toExamQuestion);
    return { title: presetCourse.name, subjects, questions, seconds: questions.length * SECONDS_EACH, note: '', practice: false };
  }

  if (presetSubject) {
    const subject = bankName(presetSubject);
    const practice = take(subject, live.filter((q) => q.examType === PRACTICE));
    const usePast = practice.length === 0;
    const chosen = usePast ? take(subject, live.filter((q) => q.examType === 'UTME')) : practice;
    const questions = chosen.map(toExamQuestion);
    return {
      title: `${subject} practice`,
      subjects: [subject],
      questions,
      seconds: questions.length * SECONDS_EACH,
      note: usePast && questions.length ? `There are no ${subject} practice questions yet, so these are JAMB past questions.` : '',
      practice: true,
    };
  }

  // Full UTME mock: English plus the student's three subjects.
  const chosen = profile.selectedSubjects.map(bankName).filter((s) => s !== 'English');
  const subjects = ['English', ...chosen.slice(0, 3)];
  const pool = live.filter((q) => q.examType === 'UTME' || q.examType === PRACTICE);
  // Past questions first, topped up from the practice bank.
  const questions = subjects
    .flatMap((s) => {
      const past = shuffle(pool.filter((q) => q.subject === s && q.examType === 'UTME'));
      const extra = shuffle(pool.filter((q) => q.subject === s && q.examType === PRACTICE));
      return [...past, ...extra].slice(0, perSubject(s));
    })
    .map(toExamQuestion);
  return {
    title: 'UTME mock exam',
    subjects: subjects.filter((s) => questions.some((q) => q.subject === s)),
    questions,
    seconds: Math.min(MOCK_SECONDS, questions.length * SECONDS_EACH),
    note: '',
    practice: false,
  };
}

const clock = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

export const CBTExamView: React.FC<Props> = ({ profile, onExit, onOpenTutor, presetSubject, presetCourse, onSolve, solveLabel, askLabel }) => {
  const { questions: bank } = useCms();
  const ready = useQuestionsReady();
  // The paper is drawn once, when the bank is ready, so it doesn't reshuffle mid-exam.
  const [paper, setPaper] = useState<Paper | null>(null);
  const [subject, setSubject] = useState('');
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitted, setSubmitted] = useState(false);
  const [confirm, setConfirm] = useState<null | 'submit' | 'exit'>(null);
  const [showCalculator, setShowCalculator] = useState(false);
  const [openReview, setOpenReview] = useState<number | null>(null);

  const start = () => {
    const next = buildPaper(bank, profile, presetSubject, presetCourse);
    setPaper(next);
    setSubject(next.subjects[0] ?? '');
    setIndex(0);
    setAnswers({});
    setTimeLeft(next.seconds);
    setSubmitted(false);
    setConfirm(null);
    setOpenReview(null);
  };

  useEffect(() => {
    if (ready && !paper) start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawn once per visit
  }, [ready]);

  const total = paper?.questions.length ?? 0;
  const running = Boolean(paper && total > 0);
  const finished = running && (submitted || timeLeft <= 0);

  useEffect(() => {
    if (!running || finished) return;
    const timer = window.setInterval(() => setTimeLeft((t) => Math.max(0, t - 1)), 1000);
    return () => window.clearInterval(timer);
  }, [running, finished]);

  // Save the result once, for the dashboard.
  const recorded = useRef(false);
  useEffect(() => {
    if (!finished || !paper || recorded.current) return;
    recorded.current = true;
    recordResult(
      paper.subjects.map((s) => {
        const qs = paper.questions.filter((q) => q.subject === s);
        return {
          subject: s,
          correct: qs.filter((q) => answers[q.id] === q.correctAnswer).length,
          total: qs.length,
          missedTopics: qs.filter((q) => answers[q.id] !== q.correctAnswer).map((q) => q.topic),
        };
      }),
    );
  }, [finished, paper, answers]);

  const subjectQs = paper?.questions.filter((q) => q.subject === subject) ?? [];
  const question = subjectQs[index];
  const answered = Object.keys(answers).length;

  const goTo = (i: number) => setIndex(Math.max(0, Math.min(subjectQs.length - 1, i)));
  const choose = (label: string) => question && setAnswers((prev) => ({ ...prev, [question.id]: label }));
  const switchSubject = (s: string) => {
    setSubject(s);
    setIndex(0);
  };

  // JAMB's keys: A–D to answer, N next, P previous, S submit.
  const onKey = useRef<(e: KeyboardEvent) => void>(() => undefined);
  useEffect(() => {
    onKey.current = (e) => {
      if (!running || finished || confirm || !question) return;
      const target = e.target as HTMLElement;
      if (target.closest('input, textarea, .calc') || e.metaKey || e.ctrlKey || e.altKey) return;
      const key = e.key.toLowerCase();
      const pick = 'abcde'.indexOf(key);
      if (pick >= 0 && question.options[pick]) choose(question.options[pick].label);
      else if (key === 'n' || key === 'arrowright') goTo(index + 1);
      else if (key === 'p' || key === 'arrowleft') goTo(index - 1);
      else if (key === 's') setConfirm('submit');
    };
  });
  useEffect(() => {
    const handler = (e: KeyboardEvent) => onKey.current(e);
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  /* --------------------------------------------------------- Loading / empty */
  if (!paper) {
    return (
      <div className="jamb-empty" aria-busy="true">
        <p>Loading questions…</p>
      </div>
    );
  }

  if (!total) {
    const what = presetCourse?.name ?? (presetSubject ? bankName(presetSubject) : 'your subjects');
    return (
      <div className="jamb-empty">
        <h1>No questions for {what} yet</h1>
        <p>Questions appear here as soon as they’re published. Try another subject, or check back soon.</p>
        <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={onExit}>
          <ArrowLeft size={18} aria-hidden /> Back to dashboard
        </button>
      </div>
    );
  }

  /* ----------------------------------------------------------------- Results */
  if (finished) {
    const correct = paper.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
    const pct = Math.round((correct / total) * 100);
    const estimate = Math.round((pct / 100) * 400);
    return (
      <div className="ui-page exam-result">
        <section className="ui-card exam-result__hero">
          <span className="exam-result__badge">
            <Check size={28} aria-hidden />
          </span>
          <h1>{timeLeft <= 0 && !submitted ? 'Time up' : 'Exam submitted'}</h1>
          <p>
            {paper.title} · {profile.fullName.split(' ')[0]}
          </p>
          <div className="exam-result__stats">
            <div>
              <strong>
                {correct}/{total}
              </strong>
              <span>Correct</span>
            </div>
            <div>
              <strong>{pct}%</strong>
              <span>Score</span>
            </div>
            {!paper.practice && paper.subjects.length === 4 && (
              <div className="is-key">
                <strong>{estimate}</strong>
                <span>Out of 400</span>
              </div>
            )}
          </div>
          {paper.subjects.length > 1 && (
            <ul className="jamb-breakdown">
              {paper.subjects.map((s) => {
                const qs = paper.questions.filter((q) => q.subject === s);
                const right = qs.filter((q) => answers[q.id] === q.correctAnswer).length;
                return (
                  <li key={s}>
                    <span>{s}</span>
                    <b>
                      {right}/{qs.length}
                    </b>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="exam-result__actions">
            <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={onExit}>
              Back to dashboard
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--ghost ui-btn--lg"
              onClick={() => {
                recorded.current = false;
                start();
              }}
            >
              <RotateCcw size={18} aria-hidden /> New set of questions
            </button>
          </div>
        </section>

        <section className="ui-card exam-review">
          <h2>Check your answers</h2>
          <p className="exam-review__sub">Tap a question to see the right answer and why.</p>
          <ol>
            {paper.questions.map((q, i) => {
              const yours = answers[q.id];
              const right = yours === q.correctAnswer;
              const open = openReview === q.id;
              const text = (label?: string) => q.options.find((o) => o.label === label)?.text;
              return (
                <li key={q.id} className={`exam-review__item ${right ? 'is-right' : 'is-wrong'}${open ? ' is-open' : ''}`}>
                  <button type="button" onClick={() => setOpenReview(open ? null : q.id)} aria-expanded={open}>
                    <span className="exam-review__mark" aria-hidden>
                      {right ? <Check size={14} /> : <X size={14} />}
                    </span>
                    <span className="exam-review__q">
                      <small>
                        {i + 1}. {q.subject}
                        {q.topic && q.topic !== 'General' ? ` · ${q.topic}` : ''}
                      </small>
                      {q.question}
                    </span>
                    <ChevronDown size={18} className="exam-review__chev" aria-hidden />
                  </button>
                  {open && (
                    <div className="exam-review__body">
                      <p>
                        <b>Your answer:</b> {yours ? `${yours}. ${text(yours)}` : 'Not answered'}
                      </p>
                      {!right && (
                        <p>
                          <b>Right answer:</b> {q.correctAnswer}. {text(q.correctAnswer)}
                        </p>
                      )}
                      {q.explanation && <p className="exam-review__why">{q.explanation}</p>}
                      {onSolve ? (
                        <button
                          type="button"
                          className="ui-link"
                          onClick={() =>
                            onSolve({
                              subject: q.subject,
                              question: q.question,
                              options: q.options,
                              correctAnswer: q.correctAnswer,
                              explanation: q.explanation,
                              yourAnswer: yours,
                            })
                          }
                        >
                          <MessageSquareText size={16} aria-hidden /> {solveLabel ?? 'Solve with my tutor'}
                        </button>
                      ) : (
                        onOpenTutor && (
                          <button type="button" className="ui-link" onClick={onOpenTutor}>
                            <MessageSquareText size={16} aria-hidden /> Still confused? Ask the tutor
                          </button>
                        )
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

  /* -------------------------------------------------------------------- Exam */
  const lowTime = timeLeft <= Math.min(5 * 60, paper.seconds * 0.1);
  const last = index === subjectQs.length - 1;
  const nextSubject = paper.subjects[paper.subjects.indexOf(subject) + 1];

  return (
    <div className="jamb">
      <header className="jamb__top">
        <div className="jamb__brand">
          <strong>{paper.title}</strong>
          <span>i-Tutor CBT</span>
        </div>
        <div className="jamb__candidate">
          <span className="jamb__photo" aria-hidden>
            {profile.fullName.charAt(0).toUpperCase() || 'C'}
          </span>
          <span>
            <strong>{profile.fullName || 'Candidate'}</strong>
            <small>
              {answered} of {total} answered
            </small>
          </span>
        </div>
        <div className={`jamb__time${lowTime ? ' is-low' : ''}`} role="timer" aria-label="Time left">
          <small>Time left</small>
          <strong>{clock(timeLeft)}</strong>
        </div>
      </header>

      <nav className="jamb__subjects" aria-label="Subjects">
        {paper.subjects.map((s) => {
          const qs = paper.questions.filter((q) => q.subject === s);
          return (
            <button key={s} type="button" className={s === subject ? 'is-on' : ''} onClick={() => switchSubject(s)} aria-current={s === subject ? 'true' : undefined}>
              {s}
              <small>
                {qs.filter((q) => answers[q.id]).length}/{qs.length}
              </small>
            </button>
          );
        })}
        <span className="jamb__tools">
          <button type="button" className={showCalculator ? 'is-on' : ''} onClick={() => setShowCalculator((v) => !v)} aria-pressed={showCalculator}>
            <Calculator size={16} aria-hidden /> Calculator
          </button>
          <button type="button" onClick={() => setConfirm('exit')}>
            <X size={16} aria-hidden /> Exit
          </button>
        </span>
      </nav>

      <main className="jamb__body">
        {paper.note && <p className="jamb__note">{paper.note}</p>}
        {question && (
          <section className="jamb__question" aria-labelledby="jamb-q">
            <div className="jamb__qhead">
              <h2 id="jamb-q">
                {subject} · Question {index + 1} of {subjectQs.length}
              </h2>
              {paper.practice && onSolve && (
                <button
                  type="button"
                  className="jamb__hint"
                  onClick={() =>
                    onSolve({
                      subject: question.subject,
                      question: question.question,
                      options: question.options,
                      correctAnswer: question.correctAnswer,
                      explanation: question.explanation,
                      topic: question.topic,
                      mode: 'hint',
                    })
                  }
                >
                  <MessageSquareText size={15} aria-hidden /> {askLabel ?? 'Ask AI'}
                </button>
              )}
            </div>
            <p className="jamb__text" key={question.id}>
              {question.question}
            </p>
            <div className="jamb__options" role="radiogroup" aria-labelledby="jamb-q">
              {question.options.map((o) => {
                const on = answers[question.id] === o.label;
                return (
                  <label key={o.label} className={`jamb__option${on ? ' is-on' : ''}`}>
                    <input type="radio" name={`q${question.id}`} checked={on} onChange={() => choose(o.label)} />
                    <b>{o.label}.</b>
                    <span>{o.text}</span>
                  </label>
                );
              })}
            </div>
          </section>
        )}

        <div className="jamb__nav">
          <button type="button" className="jamb__btn" onClick={() => goTo(index - 1)} disabled={index === 0}>
            <ChevronLeft size={18} aria-hidden /> Previous
          </button>
          {!last ? (
            <button type="button" className="jamb__btn" onClick={() => goTo(index + 1)}>
              Next <ChevronRight size={18} aria-hidden />
            </button>
          ) : nextSubject ? (
            <button type="button" className="jamb__btn" onClick={() => switchSubject(nextSubject)}>
              {nextSubject} <ChevronRight size={18} aria-hidden />
            </button>
          ) : null}
          <button type="button" className="jamb__btn jamb__btn--submit" onClick={() => setConfirm('submit')}>
            Submit
          </button>
        </div>

        <div className="jamb__grid" role="group" aria-label={`${subject} questions`}>
          {subjectQs.map((q, i) => (
            <button
              key={q.id}
              type="button"
              className={`${i === index ? 'is-current' : ''}${answers[q.id] ? ' is-done' : ''}`}
              onClick={() => goTo(i)}
              aria-label={`Question ${i + 1}${answers[q.id] ? ', answered' : ''}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="jamb__keys">Keys: A–D to answer · N next · P previous · S submit</p>
      </main>

      {showCalculator && <ExamCalculator onClose={() => setShowCalculator(false)} />}

      {confirm && (
        <div className="ui-overlay ui-overlay--center" onClick={() => setConfirm(null)}>
          <div className="ui-dialog" role="alertdialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
            {confirm === 'submit' ? (
              <>
                <h2>Submit your exam?</h2>
                <p>
                  You answered <b>{answered}</b> of {total} questions.
                  {total - answered > 0 && ` ${total - answered} not answered.`} You can’t change your answers after you submit.
                </p>
                <div className="ui-dialog__actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setConfirm(null)}>
                    Go back
                  </button>
                  <button
                    type="button"
                    className="ui-btn ui-btn--primary"
                    onClick={() => {
                      setConfirm(null);
                      setSubmitted(true);
                    }}
                  >
                    Yes, submit
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2>Leave the exam?</h2>
                <p>Your answers won’t be saved.</p>
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
