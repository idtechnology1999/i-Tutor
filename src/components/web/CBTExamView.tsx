import React, { useEffect, useRef, useState } from 'react';
import { ArrowLeft, Calculator, ChevronLeft, ChevronRight, MessageSquareText, X } from 'lucide-react';
import type { DiagnosticQuestion, UserProfile } from '../../types';
import { ExamCalculator } from './ExamCalculator';
import { CMS_SUBJECTS, PRACTICE, toExamQuestion, useCms, useQuestionsReady } from '../../lib/cms';
import type { CmsQuestion } from '../../lib/cms';
import { recordResult } from '../../lib/progress';
import type { SolveRequest } from '../../data/tutors';
import { tutorById } from '../../data/tutors';
import { ExamReview } from './ExamReview';
import { getPracticeSet } from '../../services/practice';
import type { RealExam } from '../../services/practice';
import { defaultExam, examsOf } from '../../lib/student-exams';
import { isBySchool, isJambLike } from '../../lib/exams';

/* The CBT, laid out like JAMB's: candidate bar with the clock, one button per
   subject, radio-button options, a numbered question grid, and Previous /
   Next / Submit. It starts as soon as it opens — no setup screen.
   - Practise a subject: a whole practice exam that starts with that subject,
     then the student's other subjects (practice-bank questions, or JAMB past
     questions where the practice bank has none yet).
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
  /** Out of AI credits while reviewing: go and get more. */
  onUpgrade?: () => void;
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
    // The subject the student tapped comes first, then the rest of their
    // subjects (English plus their three), so it's a whole practice exam.
    const first = bankName(presetSubject);
    const theirs = ['English', ...profile.selectedSubjects.map(bankName).filter((s) => s !== 'English').slice(0, 3)];
    const sequence = [first, ...theirs.filter((s) => s !== first)];
    const pastFor: string[] = [];
    const questions = sequence.flatMap((s) => {
      const practice = take(s, live.filter((q) => q.examType === PRACTICE));
      if (practice.length) return practice.map(toExamQuestion);
      // No practice questions yet: JAMB past questions stand in.
      const past = take(s, live.filter((q) => q.examType === 'UTME'));
      if (past.length) pastFor.push(s);
      return past.map(toExamQuestion);
    });
    const subjects = sequence.filter((s) => questions.some((q) => q.subject === s));
    return {
      title: `Practice exam · ${first} first`,
      subjects,
      questions,
      seconds: questions.length * SECONDS_EACH,
      note: !pastFor.length
        ? ''
        : pastFor.length === subjects.length
          ? 'There are no practice questions yet, so these are JAMB past questions.'
          : `There are no ${pastFor.join(' or ')} practice questions yet, so those are JAMB past questions.`,
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
    // All four, even one with nothing here yet: the server may have questions for it (buildMockPaper).
    subjects,
    questions,
    seconds: Math.min(MOCK_SECONDS, questions.length * SECONDS_EACH),
    note: '',
    practice: false,
  };
}

/** The exam a student practises for: JAMB if they're sitting it, otherwise their first exam. */
const practiceExam = (profile: UserProfile): RealExam => {
  const exams = examsOf(profile) as string[];
  return (exams.includes('UTME') ? 'UTME' : (exams.find((e) => !isBySchool(e)) ?? defaultExam())) as RealExam;
};

/**
 * "Practise a subject": a fresh random set for each subject from the server
 * (the mix of practice and past questions, and the set size, are chosen per
 * exam in Admin → Practice questions). The tapped subject comes first.
 */
async function buildPracticePaper(profile: UserProfile, presetSubject: string): Promise<Paper> {
  const exam = practiceExam(profile);
  const first = bankName(presetSubject);
  const theirs = ['English', ...profile.selectedSubjects.map(bankName).filter((s) => s !== 'English').slice(0, 3)];
  const sequence = [first, ...theirs.filter((s) => s !== first)];
  const sets = await Promise.all(sequence.map((s) => getPracticeSet(exam, s)));
  const questions = sets.flatMap((set) => set.questions.map(toExamQuestion));
  return {
    title: `Practice exam · ${first} first`,
    subjects: sequence.filter((s) => questions.some((q) => q.subject === s)),
    questions,
    seconds: questions.length * SECONDS_EACH,
    note: '',
    practice: true,
  };
}

/**
 * Draws each subject of a paper fresh from the server, in the share set for
 * that exam in Admin → Practice questions (e.g. 80% practice bank, 20% past
 * questions); if one side runs short, the other fills the gap. `size` gives
 * the questions per subject (none = the exam's "Questions in a set"). A
 * subject the server can't supply keeps the questions already on this device.
 */
async function drawPaper(paper: Paper, exam: RealExam, size?: (subject: string) => number, maxSeconds = Infinity): Promise<Paper> {
  const sets = await Promise.all(paper.subjects.map((s) => getPracticeSet(exam, s, size?.(s)).catch(() => null)));
  const questions = paper.subjects.flatMap((s, i) => {
    const here = paper.questions.filter((q) => q.subject === s);
    const drawn = sets[i]?.questions ?? [];
    return drawn.length >= here.length ? drawn.map(toExamQuestion) : here;
  });
  const subjects = paper.subjects.filter((s) => questions.some((q) => q.subject === s));
  return { ...paper, subjects, questions, seconds: Math.min(maxSeconds, questions.length * SECONDS_EACH) };
}

const clock = (secs: number) => {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  return `${h ? `${h}:` : ''}${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/* An exam in progress is saved on this device as it goes, so a refresh (or a
   closed tab) comes back to the same questions, answers and place, with the
   clock still counting down to the same end time. */
const SESSION_KEY = 'itutor-exam-session';

interface Session {
  /** Which exam this is (practice subject, course, or the mock). */
  key: string;
  paper: Paper;
  answers: Record<number, string>;
  subject: string;
  index: number;
  /** When the time runs out (ms since 1970): the clock is real time, not "seconds left". */
  deadline: number;
  submitted: boolean;
  /** The result has gone to the dashboard already. */
  recorded: boolean;
}

const readSession = (key: string): Session | null => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(SESSION_KEY) ?? 'null') as Session | null;
    // Another exam, or one long finished: start afresh.
    if (!saved || saved.key !== key || !saved.paper?.questions?.length) return null;
    if (Date.now() - saved.deadline > 24 * 3600 * 1000) return null;
    return saved;
  } catch {
    return null;
  }
};
const writeSession = (session: Session) => {
  try {
    window.localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage full or blocked: the exam still works, it just won't survive a refresh */
  }
};
const clearSession = () => {
  try {
    window.localStorage.removeItem(SESSION_KEY);
  } catch {
    /* nothing saved */
  }
};
const secondsUntil = (deadline: number) => Math.max(0, Math.round((deadline - Date.now()) / 1000));

export const CBTExamView: React.FC<Props> = ({ profile, onExit, presetSubject, presetCourse, onSolve, askLabel, onUpgrade }) => {
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
  const [deadline, setDeadline] = useState(0);
  // Save the result once, for the dashboard.
  const recorded = useRef(false);
  const sessionKey = JSON.stringify([presetSubject ?? '', presetCourse?.name ?? '', presetCourse?.exam ?? '', presetCourse?.school ?? '']);

  const start = async () => {
    setPaper(null);
    let next = buildPaper(bank, profile, presetSubject, presetCourse);
    // Practice sets come fresh from the server; the questions already here stand in if it can't be reached.
    if (presetSubject) next = await buildPracticePaper(profile, presetSubject).catch(() => next);
    // The UTME mock keeps JAMB's format (English 60, others 40).
    else if (!presetCourse) next = await drawPaper(next, 'UTME', perSubject, MOCK_SECONDS);
    // An exam's practice (WAEC, NECO, a course…) follows that exam's settings.
    // A Post-UTME school's paper stays that school's real past questions.
    else if (!presetCourse.school) {
      const exam = (presetCourse.exam ?? 'UTME') as RealExam;
      // JAMB-style exams keep JAMB's format (English 60, others 40).
      next = await drawPaper(next, exam, isJambLike(exam) ? perSubject : undefined);
    }
    const end = Date.now() + next.seconds * 1000;
    setPaper(next);
    setSubject(next.subjects[0] ?? '');
    setIndex(0);
    setAnswers({});
    setDeadline(end);
    setTimeLeft(next.seconds);
    setSubmitted(false);
    setConfirm(null);
    recorded.current = false;
  };

  useEffect(() => {
    if (!ready || paper) return;
    // Back after a refresh: carry on with the same exam.
    const saved = readSession(sessionKey);
    if (saved) {
      setPaper(saved.paper);
      setSubject(saved.subject);
      setIndex(saved.index);
      setAnswers(saved.answers);
      setDeadline(saved.deadline);
      setTimeLeft(secondsUntil(saved.deadline));
      setSubmitted(saved.submitted);
      recorded.current = saved.recorded;
      return;
    }
    void start();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- drawn once per visit
  }, [ready]);

  /** Leaving the exam for good: nothing to come back to. */
  const leave = () => {
    clearSession();
    onExit();
  };

  const total = paper?.questions.length ?? 0;
  const running = Boolean(paper && total > 0);
  const finished = running && (submitted || timeLeft <= 0);

  useEffect(() => {
    if (!running || finished) return;
    // Counts down to the end time, so time away (or a refresh) still counts.
    const timer = window.setInterval(() => setTimeLeft(secondsUntil(deadline)), 1000);
    return () => window.clearInterval(timer);
  }, [running, finished, deadline]);

  // Every change is saved, so a refresh picks up exactly here.
  useEffect(() => {
    if (!paper || !total) return;
    writeSession({ key: sessionKey, paper, answers, subject, index, deadline, submitted: finished, recorded: recorded.current });
  }, [paper, answers, subject, index, deadline, finished, total, sessionKey]);

  // Mid-exam, the browser's or phone's Back button asks first too: an extra
  // /exam entry in the history means Back lands here, and the question appears.
  useEffect(() => {
    if (!running || finished) return;
    window.history.pushState({ examGuard: true }, '', window.location.href);
    const onBack = () => {
      window.history.pushState({ examGuard: true }, '', window.location.href);
      setConfirm('exit');
    };
    window.addEventListener('popstate', onBack);
    return () => window.removeEventListener('popstate', onBack);
  }, [running, finished]);

  // Mid-exam, the browser asks before a refresh or closing the tab.
  useEffect(() => {
    if (!running || finished) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [running, finished]);

  useEffect(() => {
    if (!finished || !paper || recorded.current) return;
    recorded.current = true;
    writeSession({ key: sessionKey, paper, answers, subject, index, deadline, submitted: true, recorded: true });
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
  }, [finished, paper, answers, sessionKey, subject, index, deadline]);

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
        <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={leave}>
          <ArrowLeft size={18} aria-hidden /> Back to dashboard
        </button>
      </div>
    );
  }

  /* ----------------------------------------------------------------- Results */
  if (finished) {
    const correct = paper.questions.filter((q) => answers[q.id] === q.correctAnswer).length;
    const full = !paper.practice && paper.subjects.length === 4;
    return (
      <ExamReview
        title={paper.title}
        questions={paper.questions}
        subjects={paper.subjects}
        answers={answers}
        firstName={profile.fullName.split(' ')[0] || 'there'}
        timeUp={timeLeft <= 0 && !submitted}
        estimate={full ? Math.round((correct / total) * 400) : undefined}
        tutor={profile.plan === 'premium' ? tutorById(profile.tutorId) : undefined}
        onExit={leave}
        onRetake={() => void start()}
        onUpgrade={onUpgrade}
      />
    );
  }

  /* -------------------------------------------------------------------- Exam */
  const lowTime = timeLeft <= Math.min(5 * 60, paper.seconds * 0.1);
  const last = index === subjectQs.length - 1;
  const nextSubject = paper.subjects[paper.subjects.indexOf(subject) + 1];

  return (
    <div className="jamb">
      {/* The exam bar and subject tabs stay at the top while the question scrolls. */}
      <div className="jamb__head">
        <header className="jamb__top">
          <div className="jamb__brand jamb__brand--exit">
            {/* The way back, where people look for it; it asks first, like the real CBT. */}
            <button type="button" className="jamb__leave" onClick={() => setConfirm('exit')} aria-label="Exit the exam">
              <ArrowLeft size={18} aria-hidden /> <span>Exit</span>
            </button>
            <div>
              <strong>{paper.title}</strong>
              <span>i-Tutor CBT</span>
            </div>
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
          {/* Up here, away from Previous / Next, so it can't be tapped by mistake. */}
          <button type="button" className="jamb__submit" onClick={() => setConfirm('submit')}>
            Submit
          </button>
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
      </div>

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
          ) : (
            <p className="jamb__end">That’s the last question. When you’re ready, press Submit at the top.</p>
          )}
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
                <h2>Are you sure you want to leave the exam?</h2>
                <p>Your answers so far will be lost, and the exam won’t count.</p>
                <div className="ui-dialog__actions">
                  <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setConfirm(null)}>
                    Stay
                  </button>
                  <button type="button" className="ui-btn ui-btn--danger" onClick={leave}>
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
