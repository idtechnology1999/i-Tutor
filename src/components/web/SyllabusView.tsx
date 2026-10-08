import React, { useState } from 'react';
import { BadgeCheck, Check, MessageSquareText, RotateCcw, Search, X } from 'lucide-react';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';

interface Props {
  onOpenTutor?: () => void;
}

const SUBJECTS = [
  { name: 'Physics', count: 420 },
  { name: 'Chemistry', count: 380 },
  { name: 'Mathematics', count: 460 },
  { name: 'English', count: 520 },
  { name: 'Biology', count: 390 },
  { name: 'Economics', count: 310 },
];

export const SyllabusView: React.FC<Props> = ({ onOpenTutor }) => {
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [searchQuery, setSearchQuery] = useState('');
  // The option the student tried for each question.
  const [tried, setTried] = useState<Record<number, string>>({});

  const query = searchQuery.trim().toLowerCase();
  const filteredQuestions = DIAGNOSTIC_QUESTIONS.filter((q) => {
    const matchesSubject = q.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      !query || q.question.toLowerCase().includes(query) || q.topic.toLowerCase().includes(query);
    return matchesSubject && matchesSearch;
  });

  return (
    <div className="ui-page pq">
      <header className="pq__head">
        <h1>Past questions</h1>
        <p>Pick a subject, choose an answer, and we’ll show you if it’s right — and why.</p>
      </header>

      <div className="pq__subjects" role="tablist" aria-label="Subjects">
        {SUBJECTS.map((s) => (
          <button
            key={s.name}
            type="button"
            role="tab"
            aria-selected={selectedSubject === s.name}
            className={selectedSubject === s.name ? 'is-on' : ''}
            onClick={() => setSelectedSubject(s.name)}
          >
            {s.name}
            <small>{s.count}</small>
          </button>
        ))}
      </div>

      <label className="pq__search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${selectedSubject} questions`}
          aria-label={`Search ${selectedSubject} questions`}
        />
      </label>

      <div className="pq__list">
        {filteredQuestions.length === 0 && (
          <div className="ui-card pq__empty">
            <strong>No questions here yet</strong>
            <p>
              {query
                ? `Nothing in ${selectedSubject} matches “${searchQuery}”. Try another word.`
                : `${selectedSubject} questions are coming soon. Try Physics, Chemistry, Maths or English.`}
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
                  Question {i + 1} · {q.topic}
                </span>
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
                    {onOpenTutor && (
                      <button type="button" className="ui-link" onClick={onOpenTutor}>
                        <MessageSquareText size={16} aria-hidden /> Ask the tutor
                      </button>
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
