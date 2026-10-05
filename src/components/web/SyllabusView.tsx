import React, { useState } from 'react';
import { ShieldCheckIcon, SearchIcon, SparklesIcon } from '../Icons';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';

export const SyllabusView: React.FC = () => {
  const [selectedSubject, setSelectedSubject] = useState('Physics');
  const [selectedYear, setSelectedYear] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuestionId, setActiveQuestionId] = useState<number | null>(null);

  const subjects = [
    { name: 'Physics', topics: 18, questionsCount: 420 },
    { name: 'Chemistry', topics: 16, questionsCount: 380 },
    { name: 'Mathematics', topics: 22, questionsCount: 460 },
    { name: 'English', topics: 14, questionsCount: 520 },
    { name: 'Biology', topics: 19, questionsCount: 390 },
    { name: 'Economics', topics: 15, questionsCount: 310 },
  ];

  const filteredQuestions = DIAGNOSTIC_QUESTIONS.filter((q) => {
    const matchesSubject = q.subject.toLowerCase() === selectedSubject.toLowerCase();
    const matchesSearch =
      q.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      q.topic.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSubject && matchesSearch;
  });

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '28px' }}>
      {/* Page Header */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <span className="pill-badge pill-verified">
            <ShieldCheckIcon size={14} color="var(--emerald-600)" />
            OFFICIAL SYLLABUS DIRECTORY
          </span>
          <span style={{ fontSize: '13px', color: 'var(--slate-500)' }}>
            2,400+ Verified Questions with Step-by-Step Logic
          </span>
        </div>
        <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '26px', fontWeight: 700, color: 'var(--slate-900)' }}>
          JAMB UTME Syllabus & Past Question Archive
        </h1>
        <p style={{ color: 'var(--slate-600)', fontSize: '15px', marginTop: '4px' }}>
          Browse official exam topics, practice verified past questions, and understand the logic behind correct answers.
        </p>
      </div>

      {/* Main 2-Column Layout */}
      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '28px' }}>
        {/* Left Sidebar: Subjects List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 700, textTransform: 'uppercase', color: 'var(--slate-500)', letterSpacing: '0.5px' }}>
            Select Subject
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {subjects.map((subj) => {
              const isSelected = selectedSubject === subj.name;
              return (
                <div
                  key={subj.name}
                  onClick={() => setSelectedSubject(subj.name)}
                  style={{
                    padding: '12px 16px',
                    borderRadius: 'var(--radius-md)',
                    border: isSelected ? '1.5px solid var(--teal-900)' : '1px solid var(--slate-200)',
                    backgroundColor: isSelected ? 'var(--teal-50)' : 'var(--white)',
                    cursor: 'pointer',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: isSelected ? 700 : 600, color: isSelected ? 'var(--teal-900)' : 'var(--slate-800)', fontSize: '15px' }}>
                      {subj.name}
                    </div>
                    <div style={{ fontSize: '12px', color: 'var(--slate-500)', marginTop: '2px' }}>
                      {subj.topics} Topics · {subj.questionsCount} Past Qs
                    </div>
                  </div>
                  {isSelected && <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--teal-900)' }} />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Area: Search, Year Filters & Past Questions List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Filter Bar */}
          <div className="web-card" style={{ padding: '16px 20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Search ${selectedSubject} topics, formulas, or past question keywords...`}
                className="web-input"
                style={{ paddingLeft: '40px' }}
              />
              <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                <SearchIcon size={18} color="var(--slate-400)" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px' }}>
              {['All', '2024', '2023', '2022', '2020'].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => setSelectedYear(year)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: 'var(--radius-sm)',
                    border: selectedYear === year ? '1.5px solid var(--teal-900)' : '1px solid var(--slate-200)',
                    background: selectedYear === year ? 'var(--teal-900)' : 'var(--white)',
                    color: selectedYear === year ? '#FFFFFF' : 'var(--slate-700)',
                    fontSize: '13px',
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Questions Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredQuestions.length > 0 ? (
              filteredQuestions.map((q) => {
                const isOpen = activeQuestionId === q.id;
                return (
                  <div key={q.id} className="web-card">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="pill-badge pill-verified">
                          <ShieldCheckIcon size={13} color="var(--emerald-600)" /> Verified
                        </span>
                        <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-900)' }}>
                          {q.subject} · {q.topic}
                        </span>
                      </div>
                      <span style={{ fontSize: '12px', color: 'var(--slate-500)' }}>JAMB UTME Past Question</span>
                    </div>

                    <p style={{ fontSize: '16px', fontWeight: 600, color: 'var(--slate-900)', lineHeight: '1.5', marginBottom: '16px' }}>
                      {q.question}
                    </p>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px', marginBottom: '16px' }}>
                      {q.options.map((opt) => (
                        <div
                          key={opt.label}
                          style={{
                            padding: '10px 14px',
                            borderRadius: '8px',
                            background: opt.label === q.correctAnswer && isOpen ? 'var(--emerald-50)' : 'var(--slate-50)',
                            border: opt.label === q.correctAnswer && isOpen ? '1.5px solid var(--emerald-500)' : '1px solid var(--slate-200)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '10px',
                            fontSize: '14px',
                            color: 'var(--slate-800)',
                          }}
                        >
                          <span style={{ fontWeight: 700, color: opt.label === q.correctAnswer && isOpen ? 'var(--emerald-600)' : 'var(--slate-600)' }}>
                            {opt.label}.
                          </span>
                          <span>{opt.text}</span>
                        </div>
                      ))}
                    </div>

                    {isOpen && (
                      <div
                        style={{
                          padding: '14px 18px',
                          borderRadius: '8px',
                          background: 'var(--teal-50)',
                          border: '1px solid var(--teal-100)',
                          marginBottom: '14px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-900)', fontWeight: 700, fontSize: '13px', marginBottom: '4px' }}>
                          <SparklesIcon size={15} color="var(--teal-900)" />
                          Official Worked Logic Solution:
                        </div>
                        <p style={{ fontSize: '14px', color: '#114745', lineHeight: '1.6' }}>
                          {q.explanation}
                        </p>
                      </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                      <button
                        type="button"
                        onClick={() => setActiveQuestionId(isOpen ? null : q.id)}
                        className="btn-outline-teal"
                        style={{ padding: '8px 16px', fontSize: '13px' }}
                      >
                        {isOpen ? 'Hide Worked Solution' : 'Reveal Worked Solution'}
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="web-card" style={{ textAlign: 'center', padding: '40px' }}>
                <p style={{ color: 'var(--slate-500)', fontSize: '15px' }}>
                  No questions found matching your filter in {selectedSubject}.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
