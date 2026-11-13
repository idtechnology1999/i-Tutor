import React, { useEffect, useState } from 'react';
import { QuestionFigure } from './QuestionFigure';
import { BadgeCheck, Check, ChevronLeft, ChevronRight, ClipboardCheck, MessageSquareText, RotateCcw, Search, Sparkles, X } from 'lucide-react';
import { EXAM_FULL_NAME, EXAM_LABEL, EXAM_TYPES, needsSchool, useCms } from '../../lib/cms';
import { isLiveExam } from '../../lib/exams';
import { defaultExam } from '../../lib/student-exams';
import { SCHOOLS } from '../../lib/schools';
import type { ExamType } from '../../lib/cms';
import type { SolveRequest, TutorPersona } from '../../data/tutors';
import { useTutorThreads } from '../../lib/useTutorThreads';
import { slugify } from '../../lib/router';
import { TutorThread } from './TutorThread';
import { ExamReview } from './ExamReview';

/* Past questions, laid out like the CBT room (/exam): one question at a time,
   subject buttons along the top and a numbered grid. Two ways to check:
   - During: picking an answer shows straight away whether it's right, and the
     tutor explains it right under the question (TutorThread).
   - After: pick answers freely, then Submit & review for the tutor-led review
     used after a practice exam (ExamReview). */

type CheckMode = 'during' | 'after';
const MODE_KEY = 'itutor-pq-check';
const savedMode = (): CheckMode => {
  try {
    // After is the default, like a real exam; During only when the student chose it.
    return window.localStorage.getItem(MODE_KEY) === 'during' ? 'during' : 'after';
  } catch {
    return 'after';
  }
};

interface Props {
  onOpenTutor?: () => void;
  /** Open on this exam (and Post-UTME school), e.g. from the Post-UTME page. */
  initialExam?: ExamType;
  initialSchool?: string;
  /** Open on this subject and year (from a paper's address; names may be slugs like "english"). */
  initialSubject?: string;
  initialYear?: number;
  /** The exams the student registered for; only these can be picked. */
  exams?: ExamType[];
  /** The student's own subjects for an exam (null: show every subject). */
  subjectsFor?: (exam: ExamType) => string[] | null;
  /** "Solve with my tutor" (Premium) on a question. */
  onSolve?: (req: SolveRequest) => void;
  solveLabel?: string;
  /** Label for the Ask button on every question ("Ask AI" / "Ask Tobi"). */
  askLabel?: string;
  /** Premium: the student's own tutor, who explains on the page. */
  tutor?: TutorPersona;
  firstName?: string;
  /** Out of AI credits: go and get more. */
  onUpgrade?: () => void;
}

// Always offered, even before questions exist, so the layout stays familiar.
const CORE_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics'];

export const SyllabusView: React.FC<Props> = ({
  initialExam,
  initialSchool,
  initialSubject,
  initialYear,
  exams,
  subjectsFor,
  solveLabel,
  askLabel,
  tutor,
  firstName = 'there',
  onUpgrade,
}) => {
  // Only the student's own exams (JAMB first); everything if none chosen yet.
  // Only exams switched on in Admin → Settings → Exams.
  const examTabs = (exams?.length ? EXAM_TYPES.filter((t) => exams.includes(t)) : EXAM_TYPES).filter(isLiveExam);
  const [exam, setExam] = useState<ExamType>(
    initialExam && (examTabs as readonly string[]).includes(initialExam) ? initialExam : (examTabs[0] ?? defaultExam()),
  );
  const [school, setSchool] = useState(initialSchool ?? '');
  const { questions } = useCms();
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    if (initialSubject) return initialSubject;
    if (!initialSchool) return 'English';
    const first = questions.find((q) => q.status === 'published' && q.examType === initialExam && q.school === initialSchool);
    return first?.subject ?? 'English';
  });
  const [year, setYear] = useState<number | null>(initialYear ?? null);
  const [searchQuery, setSearchQuery] = useState('');
  const [index, setIndex] = useState(0);
  // The option the student tried for each question (During).
  const [tried, setTried] = useState<Record<number, string>>({});
  // After: answers kept to themselves until Submit & review.
  const [mode, setMode] = useState<CheckMode>(savedMode);
  const [picks, setPicks] = useState<Record<number, string>>({});
  const [reviewing, setReviewing] = useState(false);
  const threads = useTutorThreads({ tutor, firstName });
  const after = mode === 'after';

  const published = questions.filter((q) => q.status === 'published');
  const bySchool = needsSchool(exam);
  // A school from an address is a slug ("unilag"): match it to the school's real name.
  const realSchool =
    published.find((q) => q.examType === exam && q.school === school)?.school ??
    published.find((q) => q.examType === exam && q.school && slugify(q.school) === slugify(school))?.school ??
    school;
  // Once matched, the real name is what the school picker shows.
  useEffect(() => {
    if (realSchool !== school) setSchool(realSchool);
  }, [realSchool, school]);
  const inExam = published.filter((q) => q.examType === exam && (!bySchool || !school || q.school === realSchool));
  // Exam, then (Post-UTME) school, then year: the year applies to every subject.
  const years = [...new Set(inExam.map((q) => q.year).filter((y): y is number => y !== null))].sort((a, b) => b - a);
  // Always one year at a time (the latest unless one is picked), so one paper
  // is never mixed with another. Exams with no years yet show what there is.
  const shownYear = year !== null && years.includes(year) ? year : (years[0] ?? null);
  const inYear = shownYear === null ? inExam : inExam.filter((q) => q.year === shownYear);
  // Only what the student registered for; exams without their own list show everything.
  const subjects = subjectsFor?.(exam) ?? [...new Set([...CORE_SUBJECTS, ...inExam.map((q) => q.subject)])];
  // A subject from an address is a slug ("english"): match it by slug too.
  const subject = subjects.includes(selectedSubject)
    ? selectedSubject
    : (subjects.find((s) => slugify(s) === slugify(selectedSubject)) ?? subjects[0] ?? '');
  const inSubject = inYear.filter((q) => q.subject === subject);
  const query = searchQuery.trim().toLowerCase();
  const list = inSubject.filter((q) => !query || q.question.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query));
  const at = Math.min(index, Math.max(list.length - 1, 0));
  const q = list[at];
  const examName = bySchool && school ? `${realSchool} ${EXAM_LABEL[exam]}` : EXAM_LABEL[exam];
  const paperName = `${examName}${shownYear ? ` ${shownYear}` : ''}`;

  const triedIds = Object.keys(tried).map(Number);
  const rightCount = triedIds.filter((id) => published.find((x) => x.id === id)?.correctAnswer === tried[id]).length;

  // Any change of what's listed starts again at question 1.
  const restart = () => setIndex(0);
  const pickExam = (t: ExamType) => {
    setExam(t);
    setYear(null);
    restart();
  };
  // The chosen year stays when switching subject: "WAEC 2023" for every subject.
  const pickSubject = (s: string) => {
    setSelectedSubject(s);
    restart();
  };
  const answer = (label: string) => {
    if (!q) return;
    // After: any option, changeable until Submit & review. During: one try, then the result.
    if (after) setPicks((x) => ({ ...x, [q.id]: label }));
    else if (tried[q.id] === undefined) setTried((t) => ({ ...t, [q.id]: label }));
  };
  const tryAgain = () => {
    if (!q) return;
    threads.reset(q.id);
    setTried((t) => {
      const next = { ...t };
      delete next[q.id];
      return next;
    });
  };
  const switchMode = (m: CheckMode) => {
    setMode(m);
    setReviewing(false);
    try {
      window.localStorage.setItem(MODE_KEY, m);
    } catch {
      /* not remembered when storage is blocked */
    }
  };
  const go = (i: number) => setIndex(Math.max(0, Math.min(list.length - 1, i)));

  // Same keys as the CBT room: A–D answer, N next, P previous.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target instanceof Element ? e.target : null;
      if (e.ctrlKey || e.metaKey || e.altKey || el?.closest('input, textarea, select, [contenteditable="true"]')) return;
      const k = e.key.toLowerCase();
      if (k === 'n') go(at + 1);
      else if (k === 'p') go(at - 1);
      else if (q && q.options.some((o) => o.label.toLowerCase() === k)) answer(k.toUpperCase());
      else return;
      e.preventDefault();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  /** The tutor explains this question here, under it (not in the side panel). */
  const solve = () => q && threads.thread(q.id).length === 0 && threads.explain(q, tried[q.id]);

  const pick = q ? (after ? picks[q.id] : tried[q.id]) : undefined;
  // After: nothing is marked until the review.
  const answered = !after && pick !== undefined;
  const pickedHere = list.filter((x) => picks[x.id]).length;

  if (reviewing) {
    return (
      <ExamReview
        title={`${paperName} ${subject} past questions`}
        questions={list}
        subjects={[subject]}
        answers={picks}
        firstName={firstName}
        timeUp={false}
        tutor={tutor}
        eyebrow="Your answers"
        backLabel="Back to questions"
        retakeLabel="Try these again"
        onExit={() => setReviewing(false)}
        onRetake={() => {
          setPicks((x) => {
            const next = { ...x };
            for (const item of list) delete next[item.id];
            return next;
          });
          setReviewing(false);
          restart();
        }}
        onUpgrade={onUpgrade}
      />
    );
  }
  const right = q ? pick === q.correctAnswer : false;

  return (
    <div className="jamb pq-cbt">
      {/* Exam, year, score and subjects stay in view while scrolling through a question. */}
      <div className="pq-cbt__sticky">
        <header className="jamb__top pq-cbt__top">
          <div className="jamb__brand">
            <strong>{paperName} past questions</strong>
            <span>i-Tutor CBT · {after ? 'check your answers at the end' : 'see each answer as you go'}, no timer</span>
          </div>
          <div className="pq-cbt__picks">
            {examTabs.length > 1 && (
              <label className="pq-cbt__exam">
                <small>1 · Exam</small>
                <select value={exam} onChange={(e) => pickExam(e.target.value as ExamType)} aria-label="Exam">
                  {examTabs.map((t) => (
                    <option key={t} value={t} title={EXAM_FULL_NAME[t]}>
                      {EXAM_LABEL[t]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            {bySchool && (
              <label className="pq-cbt__exam">
                <small>{examTabs.length > 1 ? '2 · ' : ''}School</small>
                <select
                  value={school}
                  onChange={(e) => {
                    setSchool(e.target.value);
                    setYear(null);
                    restart();
                  }}
                  aria-label="School"
                >
                  <option value="">All schools</option>
                  {SCHOOLS.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.id}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <label className="pq-cbt__exam">
              <small>
                {examTabs.length > 1 ? `${bySchool ? 3 : 2} · ` : ''}Year
              </small>
              <select
                value={shownYear ?? ''}
                onChange={(e) => {
                  setYear(Number(e.target.value));
                  restart();
                }}
                aria-label="Year"
                disabled={!years.length}
              >
                {!years.length && <option value="">No years yet</option>}
                {years.map((y) => (
                  <option key={y} value={y}>
                    {y}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="jamb__time pq-cbt__score" aria-label={after ? 'Answered' : 'Your score'}>
            <small>{after ? 'Answered' : 'Score'}</small>
            <strong>{after ? `${pickedHere}/${list.length}` : `${rightCount}/${triedIds.length}`}</strong>
          </div>
        </header>

        <nav className="jamb__subjects pq-cbt__bar" aria-label="Subjects">
          {subjects.map((s) => {
            const qs = inYear.filter((x) => x.subject === s);
            return (
              <button key={s} type="button" className={s === subject ? 'is-on' : ''} onClick={() => pickSubject(s)} aria-current={s === subject ? 'true' : undefined}>
                {s}
                <small>
                  {qs.filter((x) => (after ? picks[x.id] : tried[x.id]) !== undefined).length}/{qs.length}
                </small>
              </button>
            );
          })}
          <span className="jamb__tools pq-cbt__tools">
            <span className="pq-cbt__mode" role="group" aria-label="When to check answers">
              <small>Check answers</small>
              <button type="button" className={!after ? 'is-on' : ''} aria-pressed={!after} onClick={() => switchMode('during')}>
                During
              </button>
              <button type="button" className={after ? 'is-on' : ''} aria-pressed={after} onClick={() => switchMode('after')}>
                After
              </button>
            </span>
            <label className="pq-cbt__search">
              <Search size={16} aria-hidden />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  restart();
                }}
                placeholder={`Search ${subject}`}
                aria-label={`Search ${paperName} ${subject} questions`}
              />
            </label>
          </span>
        </nav>
      </div>

      <main className="jamb__body">
        {!q ? (
          <section className="jamb__question pq-cbt__empty">
            <strong>No questions here yet</strong>
            <p>
              {query
                ? `Nothing in ${paperName} ${subject} matches “${searchQuery}”. Try another word.`
                : `${paperName} ${subject} questions are coming soon. Try another subject${years.length > 1 ? ', another year' : ''}${examTabs.length > 1 ? ' or exam' : ''}.`}
            </p>
          </section>
        ) : (
          <section className="jamb__question" aria-labelledby="pq-q">
            <div className="jamb__qhead">
              <h2 id="pq-q">
                {subject} · Question {at + 1} of {list.length}
                <span className="pq-cbt__meta">
                  <BadgeCheck size={14} aria-hidden /> Verified
                  {q.year ? ` · ${q.school ? `${q.school} ` : ''}${EXAM_LABEL[q.examType]} ${q.year}` : ''}
                  {q.topic ? ` · ${q.topic}` : ''}
                </span>
              </h2>
              {/* After: no help mid-way, the tutor comes in the review. */}
              {!after && (
                <button type="button" className="jamb__hint" onClick={solve}>
                  <MessageSquareText size={15} aria-hidden /> {askLabel ?? 'Ask AI'}
                </button>
              )}
            </div>
            <p className="jamb__text" key={q.id}>
              {q.question}
            </p>
            <QuestionFigure image={q.image} alt={q.imageAlt} />
            <div className="jamb__options" role="radiogroup" aria-labelledby="pq-q">
              {q.options.map((o) => {
                const isPick = pick === o.label;
                const isKey = o.label === q.correctAnswer;
                const state = !answered ? '' : isKey ? ' is-right' : isPick ? ' is-wrong' : ' is-dim';
                return (
                  <label key={o.label} className={`jamb__option pq-cbt__option${state}${after && isPick ? ' is-on' : ''}`}>
                    <input type="radio" name={`pq${q.id}`} checked={isPick} disabled={answered} onChange={() => answer(o.label)} />
                    <b>{o.label}.</b>
                    <span>{o.text}</span>
                    {answered && isKey && <Check size={18} className="pq-cbt__mark" aria-hidden />}
                    {answered && isPick && !isKey && <X size={18} className="pq-cbt__mark" aria-hidden />}
                  </label>
                );
              })}
            </div>

            {answered && (
              <div className={`pq__result pq-cbt__result ${right ? 'is-right' : 'is-wrong'}`} role="status">
                <strong>{right ? 'Correct!' : `Not quite. The answer is ${q.correctAnswer}.`}</strong>
                {q.explanation && <p>{q.explanation}</p>}
                <div className="pq__result-actions">
                  <button type="button" className="ui-link" onClick={tryAgain}>
                    <RotateCcw size={16} aria-hidden /> Try again
                  </button>
                  {threads.thread(q.id).length === 0 && (
                    <button type="button" className="ui-link" onClick={solve}>
                      <Sparkles size={16} aria-hidden /> {solveLabel ?? 'Explain step by step'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* The tutor's conversation, right here under the question. */}
            {!after && threads.thread(q.id).length > 0 && (
              <div className="pq-cbt__tutor">
                <TutorThread
                  item={q}
                  yourAnswer={tried[q.id]}
                  threads={threads}
                  tutor={tutor}
                  firstName={firstName}
                  hideStart
                  onUpgrade={onUpgrade}
                  onSkip={() => go(at + 1)}
                />
              </div>
            )}
          </section>
        )}

        {list.length > 0 && (
          <>
            <div className="jamb__nav">
              <button type="button" className="jamb__btn" onClick={() => go(at - 1)} disabled={at === 0}>
                <ChevronLeft size={18} aria-hidden /> Previous
              </button>
              <button type="button" className="jamb__btn" onClick={() => go(at + 1)} disabled={at >= list.length - 1}>
                Next <ChevronRight size={18} aria-hidden />
              </button>
              {after && (
                <button type="button" className="jamb__btn pq-cbt__submit" onClick={() => setReviewing(true)} disabled={!pickedHere}>
                  <ClipboardCheck size={18} aria-hidden /> Submit &amp; review ({pickedHere}/{list.length})
                </button>
              )}
            </div>

            <div className="jamb__grid" role="group" aria-label={`${subject} questions`}>
              {list.map((x, i) => {
                const t = after ? picks[x.id] : tried[x.id];
                // After: only "answered", never right or wrong, until the review.
                const mark = t === undefined ? '' : after ? ' is-done' : t === x.correctAnswer ? ' is-right' : ' is-wrong';
                return (
                  <button
                    key={x.id}
                    type="button"
                    className={`${i === at ? 'is-current' : ''}${mark}`}
                    onClick={() => go(i)}
                    aria-label={`Question ${i + 1}${mark === ' is-right' ? ', right' : mark === ' is-wrong' ? ', wrong' : mark ? ', answered' : ''}`}
                  >
                    {i + 1}
                  </button>
                );
              })}
            </div>
            <p className="jamb__keys">Keys: A–D to answer · N next · P previous</p>
          </>
        )}
      </main>
    </div>
  );
};
