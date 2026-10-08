import React, { useState } from 'react';
import { BadgeCheck, Check, MessageSquareText, RotateCcw, Search, X } from 'lucide-react';
import { EXAM_FULL_NAME, EXAM_LABEL, EXAM_TYPES, SCHOOLS, needsSchool, useCms } from '../../lib/cms';
import type { ExamType } from '../../lib/cms';
import type { SolveRequest } from '../../data/tutors';

interface Props {
  onOpenTutor?: () => void;
  /** Open on this exam (and Post-UTME school), e.g. from the Post-UTME page. */
  initialExam?: ExamType;
  initialSchool?: string;
  /** "Solve with my tutor" (Premium) on a question. */
  onSolve?: (req: SolveRequest) => void;
  solveLabel?: string;
  /** Label for the Ask button on every question ("Ask AI" / "Ask Tobi"). */
  askLabel?: string;
}

// Always offered, even before questions exist, so the layout stays familiar.
const CORE_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics'];

export const SyllabusView: React.FC<Props> = ({ onOpenTutor, initialExam, initialSchool, onSolve, solveLabel, askLabel }) => {
  const [exam, setExam] = useState<ExamType>(initialExam ?? 'UTME');
  const [school, setSchool] = useState(initialSchool ?? '');
  const { questions: allQs } = useCms();
  const [selectedSubject, setSelectedSubject] = useState<string>(() => {
    if (!initialSchool) return 'English';
    const first = allQs.find((q) => q.status === 'published' && q.examType === initialExam && q.school === initialSchool);
    return first?.subject ?? 'English';
  });
  const [year, setYear] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  // The option the student tried for each question.
  const [tried, setTried] = useState<Record<number, string>>({});

  const { questions } = useCms();
  const published = questions.filter((q) => q.status === 'published');
  const bySchool = needsSchool(exam);
  const inExam = published.filter((q) => q.examType === exam && (!bySchool || !school || q.school === school));
  const subjects = [...new Set([...CORE_SUBJECTS, ...inExam.map((q) => q.subject)])];
  const inSubject = inExam.filter((q) => q.subject === selectedSubject);
  const years = [...new Set(inSubject.map((q) => q.year).filter((y): y is number => y !== null))].sort((a, b) => b - a);
  const query = searchQuery.trim().toLowerCase();
  const filteredQuestions = inSubject.filter((q) => {
    if (year !== null && q.year !== year) return false;
    return !query || q.question.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query);
  });
  const examName = bySchool && school ? `${school} ${EXAM_LABEL[exam]}` : EXAM_LABEL[exam];

  return (
    <div className="ui-page pq">
      <header className="pq__head">
        <h1>Past questions</h1>
        <p>Choose the exam and subject, pick an answer, and we’ll show you if it’s right — and why.</p>
      </header>

      <div className="pq__exams" role="tablist" aria-label="Exam">
        {EXAM_TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={exam === t}
            className={exam === t ? 'is-on' : ''}
            onClick={() => {
              setExam(t);
              setYear(null);
            }}
            title={EXAM_FULL_NAME[t]}
          >
            {EXAM_LABEL[t]}
          </button>
        ))}
      </div>

      {bySchool && (
        <select
          className="pq__year pq__school"
          value={school}
          onChange={(e) => {
            setSchool(e.target.value);
            setYear(null);
          }}
          aria-label="School"
        >
          <option value="">All schools</option>
          {SCHOOLS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} ({s.id})
            </option>
          ))}
        </select>
      )}

      <div className="pq__subjects" role="tablist" aria-label="Subjects">
        {subjects.map((s) => (
          <button
            key={s}
            type="button"
            role="tab"
            aria-selected={selectedSubject === s}
            className={selectedSubject === s ? 'is-on' : ''}
            onClick={() => {
              setSelectedSubject(s);
              setYear(null);
            }}
          >
            {s}
            <small>{inExam.filter((q) => q.subject === s).length}</small>
          </button>
        ))}
      </div>

      <div className="pq__filters">
        <label className="pq__search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={`Search ${examName} ${selectedSubject} questions`}
            aria-label={`Search ${examName} ${selectedSubject} questions`}
          />
        </label>
        <select
          className="pq__year"
          value={year ?? ''}
          onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
          aria-label="Year"
        >
          <option value="">All years</option>
          {years.map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      <div className="pq__list">
        {filteredQuestions.length === 0 && (
          <div className="ui-card pq__empty">
            <strong>No questions here yet</strong>
            <p>
              {query
                ? `Nothing in ${examName} ${selectedSubject} matches “${searchQuery}”. Try another word.`
                : `${examName} ${selectedSubject} questions are coming soon. Try another subject or exam.`}
            </p>
          </div>
        )}

        {filteredQuestions.map((q, i) => {
          const pick = tried[q.id];
          const answered = pick !== undefined;
          const right = pick === q.correctAnswer;
          return (
            <article key={q.id} className="ui-card pq__card">
              <div className="pq__meta">
                <span className="ui-chip ui-chip--good">
                  <BadgeCheck size={14} aria-hidden /> Verified
                </span>
                <span>
                  {q.school ? `${q.school} ` : ''}
                  {EXAM_LABEL[q.examType]}
                  {q.year ? ` ${q.year}` : ''} · Question {i + 1}
                  {q.topic ? ` · ${q.topic}` : ''}
                </span>
                {onSolve && (
                  <button
                    type="button"
                    className="ask-ai"
                    onClick={() =>
                      onSolve({
                        subject: q.subject,
                        question: q.question,
                        options: q.options,
                        correctAnswer: q.correctAnswer,
                        explanation: q.explanation,
                        yourAnswer: tried[q.id],
                        topic: q.topic,
                      })
                    }
                  >
                    <MessageSquareText size={15} aria-hidden /> {askLabel ?? 'Ask AI'}
                  </button>
                )}
              </div>

              <h2 className="pq__question">{q.question}</h2>

              <div className="pq__options" role="radiogroup" aria-label="Choose an answer">
                {q.options.map((opt) => {
                  const isPick = pick === opt.label;
                  const isKey = opt.label === q.correctAnswer;
                  const state = !answered ? '' : isKey ? ' is-right' : isPick ? ' is-wrong' : ' is-dim';
                  return (
                    <button
                      key={opt.label}
                      type="button"
                      role="radio"
                      aria-checked={isPick}
                      disabled={answered}
                      className={`pq__option${state}`}
                      onClick={() => setTried((t) => ({ ...t, [q.id]: opt.label }))}
                    >
                      <span className="pq__key">{opt.label}</span>
                      <span>{opt.text}</span>
                      {answered && isKey && <Check size={18} className="pq__icon" aria-hidden />}
                      {answered && isPick && !isKey && <X size={18} className="pq__icon" aria-hidden />}
                    </button>
                  );
                })}
              </div>

              {answered && (
                <div className={`pq__result ${right ? 'is-right' : 'is-wrong'}`} role="status">
                  <strong>{right ? 'Correct!' : `Not quite — the answer is ${q.correctAnswer}.`}</strong>
                  <p>{q.explanation}</p>
                  <div className="pq__result-actions">
                    <button
                      type="button"
                      className="ui-link"
                      onClick={() =>
                        setTried((t) => {
                          const next = { ...t };
                          delete next[q.id];
                          return next;
                        })
                      }
                    >
                      <RotateCcw size={16} aria-hidden /> Try again
                    </button>
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
                            yourAnswer: tried[q.id],
                          })
                        }
                      >
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
            </article>
          );
        })}
      </div>
    </div>
  );
};
