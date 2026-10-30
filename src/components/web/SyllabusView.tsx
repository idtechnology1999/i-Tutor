import React, { useEffect, useState } from 'react';
import { BadgeCheck, Check, ChevronLeft, ChevronRight, MessageSquareText, RotateCcw, Search, X } from 'lucide-react';
import { EXAM_FULL_NAME, EXAM_LABEL, EXAM_TYPES, SCHOOLS, needsSchool, useCms } from '../../lib/cms';
import type { ExamType } from '../../lib/cms';
import type { SolveRequest } from '../../data/tutors';

/* Past questions, laid out like the CBT room (/exam): one question at a time,
   subject buttons along the top and a numbered grid. Picking an answer shows
   straight away whether it's right, and why. */

interface Props {
  onOpenTutor?: () => void;
  /** Open on this exam (and Post-UTME school), e.g. from the Post-UTME page. */
  initialExam?: ExamType;
  initialSchool?: string;
  /** The exams the student registered for; only these can be picked. */
  exams?: ExamType[];
  /** The student's own subjects for an exam (null: show every subject). */
  subjectsFor?: (exam: ExamType) => string[] | null;
  /** "Solve with my tutor" (Premium) on a question. */
  onSolve?: (req: SolveRequest) => void;
  solveLabel?: string;
  /** Label for the Ask button on every question ("Ask AI" / "Ask Tobi"). */
  askLabel?: string;
}

// Always offered, even before questions exist, so the layout stays familiar.
const CORE_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics'];

export const SyllabusView: React.FC<Props> = ({ onOpenTutor, initialExam, initialSchool, exams, subjectsFor, onSolve, solveLabel, askLabel }) => {
  // Only the student's own exams (JAMB first); everything if none chosen yet.
  const examTabs = exams?.length ? EXAM_TYPES.filter((t) => exams.includes(t)) : EXAM_TYPES;
  const [exam, setExam] = useState<ExamType>(
    initialExam && (examTabs as readonly string[]).includes(initialExam) ? initialExam : (examTabs[0] ?? 'UTME'),
  );
  const [school, setSchool] = useState(initialSchool ?? '');
  const { questions } = useCms();
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    if (!initialSchool) return 'English';
    const first = questions.find((q) => q.status === 'published' && q.examType === initialExam && q.school === initialSchool);
    return first?.subject ?? 'English';
  });
  const [year, setYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [index, setIndex] = useState(0);
  // The option the student tried for each question.
  const [tried, setTried] = useState<Record<number, string>>({});

  const published = questions.filter((q) => q.status === 'published');
  const bySchool = needsSchool(exam);
  const inExam = published.filter((q) => q.examType === exam && (!bySchool || !school || q.school === school));
  // Only what the student registered for; exams without their own list show everything.
  const subjects = subjectsFor?.(exam) ?? [...new Set([...CORE_SUBJECTS, ...inExam.map((q) => q.subject)])];
  const subject = subjects.includes(selectedSubject) ? selectedSubject : (subjects[0] ?? '');
  const inSubject = inExam.filter((q) => q.subject === subject);
  const years = [...new Set(inSubject.map((q) => q.year).filter((y): y is number => y !== null))].sort((a, b) => b - a);
  const query = searchQuery.trim().toLowerCase();
  const list = inSubject.filter((q) => {
    if (year !== null && q.year !== year) return false;
    return !query || q.question.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query);
  });
  const at = Math.min(index, Math.max(list.length - 1, 0));
  const q = list[at];
  const examName = bySchool && school ? `${school} ${EXAM_LABEL[exam]}` : EXAM_LABEL[exam];

  const triedIds = Object.keys(tried).map(Number);
  const rightCount = triedIds.filter((id) => published.find((x) => x.id === id)?.correctAnswer === tried[id]).length;

  // Any change of what's listed starts again at question 1.
  const restart = () => setIndex(0);
  const pickExam = (t: ExamType) => {
    setExam(t);
    setYear(null);
    restart();
  };
  const pickSubject = (s: string) => {
    setSelectedSubject(s);
    setYear(null);
    restart();
  };
  const answer = (label: string) => q && tried[q.id] === undefined && setTried((t) => ({ ...t, [q.id]: label }));
  const tryAgain = () =>
    q &&
    setTried((t) => {
      const next = { ...t };
      delete next[q.id];
      return next;
    });
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

  const solve = () =>
    q &&
    onSolve?.({
      subject: q.subject,
      question: q.question,
      options: q.options,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      yourAnswer: tried[q.id],
      topic: q.topic,
    });

  const pick = q ? tried[q.id] : undefined;
  const answered = pick !== undefined;
  const right = q ? pick === q.correctAnswer : false;

  return (
    <div className="jamb pq-cbt">
      <header className="jamb__top pq-cbt__top">
        <div className="jamb__brand">
          <strong>{examName} past questions</strong>
          <span>i-Tutor CBT · practice mode, no timer</span>
        </div>
        {examTabs.length > 1 && (
          <label className="pq-cbt__exam">
            <small>Exam</small>
            <select value={exam} onChange={(e) => pickExam(e.target.value as ExamType)} aria-label="Exam">
              {examTabs.map((t) => (
                <option key={t} value={t} title={EXAM_FULL_NAME[t]}>
                  {EXAM_LABEL[t]}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="jamb__time pq-cbt__score" aria-label="Your score">
          <small>Score</small>
          <strong>
            {rightCount}/{triedIds.length}
          </strong>
        </div>
      </header>

      <nav className="jamb__subjects pq-cbt__bar" aria-label="Subjects">
        {subjects.map((s) => {
          const qs = inExam.filter((x) => x.subject === s);
          return (
            <button key={s} type="button" className={s === subject ? 'is-on' : ''} onClick={() => pickSubject(s)} aria-current={s === subject ? 'true' : undefined}>
              {s}
              <small>
                {qs.filter((x) => tried[x.id] !== undefined).length}/{qs.length}
              </small>
            </button>
          );
        })}
        <span className="jamb__tools pq-cbt__tools">
          {bySchool && (
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
          )}
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
              aria-label={`Search ${examName} ${subject} questions`}
            />
          </label>
          <select
            value={year ?? ''}
            onChange={(e) => {
              setYear(e.target.value ? Number(e.target.value) : null);
              restart();
            }}
            aria-label="Year"
          >
            <option value="">All years</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </span>
      </nav>

      <main className="jamb__body">
        {!q ? (
          <section className="jamb__question pq-cbt__empty">
            <strong>No questions here yet</strong>
            <p>
              {query
                ? `Nothing in ${examName} ${subject} matches “${searchQuery}”. Try another word.`
                : `${examName} ${subject} questions are coming soon. Try another subject${examTabs.length > 1 ? ' or exam' : ''}.`}
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
              {onSolve && (
                <button type="button" className="jamb__hint" onClick={() => solve()}>
                  <MessageSquareText size={15} aria-hidden /> {askLabel ?? 'Ask AI'}
                </button>
              )}
            </div>
            <p className="jamb__text" key={q.id}>
              {q.question}
            </p>
            <div className="jamb__options" role="radiogroup" aria-labelledby="pq-q">
              {q.options.map((o) => {
                const isPick = pick === o.label;
                const isKey = o.label === q.correctAnswer;
                const state = !answered ? '' : isKey ? ' is-right' : isPick ? ' is-wrong' : ' is-dim';
                return (
                  <label key={o.label} className={`jamb__option pq-cbt__option${state}`}>
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
                  {onSolve ? (
                    <button type="button" className="ui-link" onClick={() => solve()}>
                      <MessageSquareText size={16} aria-hidden /> {solveLabel ?? 'Solve with my tutor'}
                    </button>
                  ) : (
                    onOpenTutor && (
                      <button type="button" className="ui-link" onClick={onOpenTutor}>
                        <MessageSquareText size={16} aria-hidden /> Ask the tutor
                      </button>
                    )
                  )}
                </div>
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
            </div>

            <div className="jamb__grid" role="group" aria-label={`${subject} questions`}>
              {list.map((x, i) => {
                const t = tried[x.id];
                const mark = t === undefined ? '' : t === x.correctAnswer ? ' is-right' : ' is-wrong';
                return (
                  <button
                    key={x.id}
                    type="button"
                    className={`${i === at ? 'is-current' : ''}${mark}`}
                    onClick={() => go(i)}
                    aria-label={`Question ${i + 1}${mark ? (mark === ' is-right' ? ', right' : ', wrong') : ''}`}
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
