import React, { useState, useEffect } from 'react';
import type { UserProfile } from '../../types';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';
import { SparklesIcon, CheckCircleIcon, ArrowLeftIcon, ArrowRightIcon } from '../Icons';

interface Props {
  profile: UserProfile;
  onExit: () => void;
}

export const CBTExamView: React.FC<Props> = ({ profile, onExit }) => {
  const [activeSubject, setActiveSubject] = useState<'Physics' | 'Chemistry' | 'Mathematics' | 'English'>('Physics');
  const [currentQIndex, setCurrentQIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [flagged, setFlagged] = useState<Record<number, boolean>>({});
  const [timeLeft, setTimeLeft] = useState(7200); // 2 hours = 7200s
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcInput, setCalcInput] = useState('0');
  const [showExplanation, setShowExplanation] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  // Timer countdown
  useEffect(() => {
    if (timeLeft <= 0 || isSubmitted) return;
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, isSubmitted]);

  const formatTime = (secs: number) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = secs % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const subjectQuestions = DIAGNOSTIC_QUESTIONS.filter((q) => q.subject === activeSubject);
  const activeQuestion = subjectQuestions[currentQIndex] || DIAGNOSTIC_QUESTIONS[0];

  const handleSelectOption = (label: string) => {
    setAnswers((prev) => ({ ...prev, [activeQuestion.id]: label }));
  };

  const toggleFlag = () => {
    setFlagged((prev) => ({ ...prev, [activeQuestion.id]: !prev[activeQuestion.id] }));
  };

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

  if (isSubmitted) {
    const answeredCount = Object.keys(answers).length;
    const correctCount = DIAGNOSTIC_QUESTIONS.filter((q) => answers[q.id] === q.correctAnswer).length;
    const scorePct = Math.round((correctCount / DIAGNOSTIC_QUESTIONS.length) * 100);

    return (
      <div style={{ maxWidth: '840px', margin: '60px auto', padding: '0 24px', width: '100%' }}>
        <div className="web-card" style={{ padding: '40px', textAlign: 'center' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'var(--emerald-50)',
              color: 'var(--emerald-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
            }}
          >
            <CheckCircleIcon size={36} color="var(--emerald-600)" />
          </div>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)' }}>
            JAMB CBT Mock Exam Completed!
          </h2>
          <p style={{ color: 'var(--slate-600)', fontSize: '15px', marginTop: '6px', marginBottom: '28px' }}>
            Candidate: <strong>{profile.fullName}</strong> · Target: <strong>{profile.targetScore}/400</strong>
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '16px',
              maxWidth: '540px',
              margin: '0 auto 32px',
            }}
          >
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', color: 'var(--slate-500)', fontWeight: 600 }}>Questions Answered</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--slate-900)', marginTop: '4px' }}>
                {answeredCount} / {DIAGNOSTIC_QUESTIONS.length}
              </div>
            </div>
            <div style={{ background: 'var(--emerald-50)', padding: '16px', borderRadius: '12px', border: '1px solid var(--emerald-100)' }}>
              <div style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: 600 }}>Correct Answers</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--emerald-600)', marginTop: '4px' }}>
                {correctCount}
              </div>
            </div>
            <div style={{ background: 'var(--teal-50)', padding: '16px', borderRadius: '12px', border: '1px solid var(--teal-100)' }}>
              <div style={{ fontSize: '12px', color: 'var(--teal-900)', fontWeight: 600 }}>Estimated Score</div>
              <div style={{ fontSize: '24px', fontWeight: 800, color: 'var(--teal-900)', marginTop: '4px' }}>
                {Math.round(160 + (scorePct / 100) * 200)} / 400
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onExit}
            className="btn-solid-teal"
            style={{ padding: '12px 28px', fontSize: '15px' }}
          >
            Return to Study Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="cbt-container">
      {/* Top CBT System Bar */}
      <header className="cbt-top-bar">
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <button
            type="button"
            onClick={onExit}
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              border: 'none',
              color: '#FFFFFF',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <ArrowLeftIcon size={14} /> Back to Dashboard
          </button>

          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.5px' }}>
              JAMB UTME CBT SYSTEM · 2026/2027
            </div>
            <div style={{ fontSize: '12px', color: '#D8EEEB' }}>
              Candidate: {profile.fullName} · Reg No: JAMB/2026/089412
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Official JAMB Timer */}
          <div className="cbt-timer-box">
            <span>⏱️ TIME LEFT:</span>
            <span>{formatTime(timeLeft)}</span>
          </div>

          <button
            type="button"
            onClick={() => setShowCalculator(!showCalculator)}
            style={{
              background: showCalculator ? 'var(--amber-500)' : 'rgba(255, 255, 255, 0.15)',
              border: 'none',
              color: '#FFFFFF',
              padding: '8px 14px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            🧮 Calculator
          </button>

          <button
            type="button"
            onClick={() => setIsSubmitted(true)}
            style={{
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
              border: 'none',
              padding: '8px 16px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Submit Exam
          </button>
        </div>
      </header>

      {/* Subject Navigation Tabs (English, Mathematics, Physics, Chemistry) */}
      <div style={{ backgroundColor: '#FFFFFF', borderBottom: '1px solid var(--slate-200)', padding: '0 32px', display: 'flex', gap: '8px' }}>
        {(['Physics', 'Chemistry', 'Mathematics', 'English'] as const).map((subject) => {
          const isActive = activeSubject === subject;
          return (
            <button
              key={subject}
              type="button"
              onClick={() => {
                setActiveSubject(subject);
                setCurrentQIndex(0);
                setShowExplanation(false);
              }}
              style={{
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                borderBottom: isActive ? '3px solid var(--teal-900)' : '3px solid transparent',
                color: isActive ? 'var(--teal-900)' : 'var(--slate-600)',
                fontWeight: isActive ? 700 : 500,
                fontSize: '14px',
                cursor: 'pointer',
              }}
            >
              {subject} {subject === 'English' && '(Compulsory)'}
            </button>
          );
        })}
      </div>

      {/* Main CBT Workspace Layout */}
      <div className="cbt-layout">
        {/* Left: Active Question Area */}
        <div className="web-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '520px' }}>
          <div>
            {/* Question Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--slate-100)', paddingBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--teal-900)' }}>
                  Question {currentQIndex + 1} of {subjectQuestions.length}
                </span>
                <span className="pill-badge pill-blue" style={{ fontSize: '11px' }}>
                  {activeQuestion.topic}
                </span>
              </div>

              <button
                type="button"
                onClick={toggleFlag}
                style={{
                  background: flagged[activeQuestion.id] ? '#FFFBEB' : 'var(--slate-100)',
                  border: flagged[activeQuestion.id] ? '1px solid #F59E0B' : '1px solid var(--slate-200)',
                  color: flagged[activeQuestion.id] ? '#92400E' : 'var(--slate-700)',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                {flagged[activeQuestion.id] ? '🚩 Flagged for Review' : '🏳️ Flag Question'}
              </button>
            </div>

            {/* Question Statement */}
            <div style={{ fontSize: '17px', fontWeight: 600, color: 'var(--slate-900)', lineHeight: '1.6', marginBottom: '24px' }}>
              {activeQuestion.question}
            </div>

            {/* Multiple Choice Options */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeQuestion.options.map((opt) => {
                const isSelected = answers[activeQuestion.id] === opt.label;
                return (
                  <div
                    key={opt.label}
                    onClick={() => handleSelectOption(opt.label)}
                    style={{
                      padding: '14px 18px',
                      borderRadius: 'var(--radius-md)',
                      border: isSelected ? '2px solid var(--teal-900)' : '1.5px solid var(--slate-200)',
                      backgroundColor: isSelected ? 'var(--teal-50)' : 'var(--white)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '16px',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div
                      style={{
                        width: '32px',
                        height: '32px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid var(--teal-900)' : '2px solid var(--slate-300)',
                        backgroundColor: isSelected ? 'var(--teal-900)' : 'transparent',
                        color: isSelected ? '#FFFFFF' : 'var(--slate-700)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 700,
                        fontSize: '14px',
                        flexShrink: 0,
                      }}
                    >
                      {opt.label}
                    </div>
                    <span style={{ fontSize: '15px', color: 'var(--slate-800)', fontWeight: isSelected ? 600 : 400 }}>
                      {opt.text}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Step-by-Step Logic Explanation Drawer */}
            {showExplanation && (
              <div
                style={{
                  marginTop: '24px',
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  background: 'var(--teal-50)',
                  border: '1.5px solid var(--teal-100)',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-900)', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
                  <SparklesIcon size={16} color="var(--teal-900)" />
                  i-Tutor AI Logic Breakdown:
                </div>
                <p style={{ fontSize: '14px', color: '#114745', lineHeight: '1.6' }}>
                  {activeQuestion.explanation}
                </p>
              </div>
            )}
          </div>

          {/* Bottom CBT Navigation Controls */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '20px', borderTop: '1px solid var(--slate-100)', marginTop: '24px' }}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                disabled={currentQIndex === 0}
                onClick={() => {
                  setCurrentQIndex((prev) => prev - 1);
                  setShowExplanation(false);
                }}
                className="btn-subtle"
                style={{ padding: '10px 18px' }}
              >
                <ArrowLeftIcon size={16} /> Previous
              </button>

              <button
                type="button"
                disabled={currentQIndex === subjectQuestions.length - 1}
                onClick={() => {
                  setCurrentQIndex((prev) => prev + 1);
                  setShowExplanation(false);
                }}
                className="btn-subtle"
                style={{ padding: '10px 18px' }}
              >
                Next <ArrowRightIcon size={16} />
              </button>
            </div>

            <button
              type="button"
              onClick={() => setShowExplanation(!showExplanation)}
              className="btn-outline-teal"
              style={{ padding: '10px 18px' }}
            >
              <SparklesIcon size={16} />
              {showExplanation ? 'Hide AI Explanation' : 'Explain Step-by-Step'}
            </button>
          </div>
        </div>

        {/* Right: Question Palette & Calculator */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Question Palette */}
          <div className="web-card">
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--slate-900)', marginBottom: '4px' }}>
              Question Palette ({activeSubject})
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--slate-500)', marginBottom: '12px' }}>
              Click any question number to navigate
            </p>

            <div className="cbt-palette-grid">
              {subjectQuestions.map((q, idx) => {
                const isCurrent = idx === currentQIndex;
                const isAnswered = Boolean(answers[q.id]);
                const isFlagged = Boolean(flagged[q.id]);

                let className = 'cbt-palette-btn';
                if (isCurrent) className += ' active';
                else if (isFlagged) className += ' flagged';
                else if (isAnswered) className += ' answered';

                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      setCurrentQIndex(idx);
                      setShowExplanation(false);
                    }}
                    className={className}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--slate-100)', display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px', fontSize: '12px', color: 'var(--slate-600)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#ECFDF5', border: '1px solid #10B981' }} />
                <span>Answered</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FFFBEB', border: '1px solid #F59E0B' }} />
                <span>Flagged</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#0E3B3A' }} />
                <span>Current</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#FFFFFF', border: '1px solid var(--slate-300)' }} />
                <span>Unattempted</span>
              </div>
            </div>
          </div>

          {/* Simple 8-Key Calculator (as in JAMB CBT center) */}
          {showCalculator && (
            <div className="web-card" style={{ padding: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                <span style={{ fontSize: '13px', fontWeight: 700 }}>JAMB Standard Calculator</span>
                <button
                  type="button"
                  onClick={() => setShowCalculator(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px' }}
                >
                  ✕
                </button>
              </div>

              <div
                style={{
                  background: '#F1F5F9',
                  borderRadius: '6px',
                  padding: '10px 14px',
                  fontFamily: 'monospace',
                  fontSize: '20px',
                  fontWeight: 700,
                  textAlign: 'right',
                  marginBottom: '12px',
                  overflow: 'hidden',
                }}
              >
                {calcInput}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '6px' }}>
                {['7', '8', '9', '/', '4', '5', '6', '*', '1', '2', '3', '-', 'C', '0', '=', '+'].map((btn) => (
                  <button
                    key={btn}
                    type="button"
                    onClick={() => handleCalcClick(btn)}
                    style={{
                      height: '38px',
                      borderRadius: '6px',
                      border: '1px solid var(--slate-200)',
                      background: btn === '=' ? 'var(--teal-900)' : btn === 'C' ? '#FEE2E2' : '#FFFFFF',
                      color: btn === '=' ? '#FFFFFF' : btn === 'C' ? '#DC2626' : 'var(--slate-800)',
                      fontSize: '15px',
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {btn}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
