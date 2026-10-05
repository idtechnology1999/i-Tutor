import React, { useState } from 'react';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';
import { SparklesIcon, ArrowLeftIcon, ArrowRightIcon } from '../Icons';

interface Props {
  onFinish: (score: number) => void;
  onCancel: () => void;
}

export const DiagnosticView: React.FC<Props> = ({ onFinish, onCancel }) => {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [revealed, setRevealed] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const question = DIAGNOSTIC_QUESTIONS[currentIdx];
  const total = DIAGNOSTIC_QUESTIONS.length;
  const currentSelection = selectedAnswers[question.id];

  const handleSelect = (label: string) => {
    if (revealed) return;
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: label }));
    setRevealed(true);
  };

  const handleNext = () => {
    setRevealed(false);
    if (currentIdx < total - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setIsCompleted(true);
    }
  };

  const correctCount = DIAGNOSTIC_QUESTIONS.filter((q) => selectedAnswers[q.id] === q.correctAnswer).length;

  if (isCompleted) {
    const scorePct = Math.round((correctCount / total) * 100);
    return (
      <div style={{ maxWidth: '820px', margin: '40px auto', padding: '0 24px', width: '100%' }}>
        <div className="web-card" style={{ padding: '36px', textAlign: 'center' }}>
          <div
            style={{
              width: '56px',
              height: '56px',
              borderRadius: '50%',
              background: 'var(--teal-50)',
              color: 'var(--teal-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 16px',
            }}
          >
            <SparklesIcon size={32} color="var(--teal-900)" />
          </div>

          <span className="pill-badge pill-verified" style={{ marginBottom: '8px' }}>
            KNOWLEDGE GAP CALIBRATION COMPLETE
          </span>

          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '24px', fontWeight: 700, color: 'var(--slate-900)', marginTop: '8px' }}>
            Diagnostic Result: {correctCount} / {total} Correct ({scorePct}%)
          </h2>

          <p style={{ color: 'var(--slate-600)', fontSize: '15px', marginTop: '6px', marginBottom: '28px', maxWidth: '520px', margin: '6px auto 28px' }}>
            Your baseline study roadmap is now calibrated. Your daily drills will focus heavily on Organic Chemistry and high-yield Physics kinematics.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', textAlign: 'left', marginBottom: '32px' }}>
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>Physics</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald-600)', marginTop: '4px' }}>Proficient (82%)</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px' }}>Strong on Kinematics</div>
            </div>
            <div style={{ background: '#FFFBEB', padding: '16px', borderRadius: '12px', border: '1px solid #FDE68A' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: '#92400E' }}>Chemistry</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#D97706', marginTop: '4px' }}>Gap Area (54%)</div>
              <div style={{ fontSize: '12px', color: '#92400E', marginTop: '2px' }}>Organic Isomerism Drill</div>
            </div>
            <div style={{ background: 'var(--slate-50)', padding: '16px', borderRadius: '12px' }}>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--slate-500)' }}>Mathematics</div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--emerald-600)', marginTop: '4px' }}>Mastered (86%)</div>
              <div style={{ fontSize: '12px', color: 'var(--slate-600)', marginTop: '2px' }}>Calculus & Logs Solid</div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => onFinish(scorePct)}
            className="btn-solid-teal"
            style={{ padding: '12px 28px', fontSize: '15px' }}
          >
            Apply to My Personalized Study Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '32px auto', padding: '0 24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          type="button"
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--slate-600)',
            fontSize: '14px',
            fontWeight: 500,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
          }}
        >
          <ArrowLeftIcon size={16} /> Exit Diagnostic
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-600)' }}>
            Question {currentIdx + 1} of {total}
          </span>
          <span className="pill-badge pill-blue">{question.subject}</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div style={{ height: '6px', width: '100%', background: 'var(--slate-200)', borderRadius: '3px', overflow: 'hidden' }}>
        <div
          style={{
            height: '100%',
            width: `${((currentIdx + 1) / total) * 100}%`,
            background: 'var(--teal-900)',
            borderRadius: '3px',
            transition: 'width 0.2s ease',
          }}
        />
      </div>

      {/* Main Question Card */}
      <div className="web-card" style={{ padding: '32px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase', marginBottom: '8px' }}>
          Topic: {question.topic}
        </div>

        <h2 style={{ fontSize: '19px', fontWeight: 600, color: 'var(--slate-900)', lineHeight: '1.6', marginBottom: '24px' }}>
          {question.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {question.options.map((opt) => {
            const isSelected = currentSelection === opt.label;
            const isCorrect = opt.label === question.correctAnswer;
            let border = '1px solid var(--slate-200)';
            let bg = 'var(--white)';

            if (revealed) {
              if (isCorrect) {
                border = '2px solid var(--emerald-500)';
                bg = 'var(--emerald-50)';
              } else if (isSelected && !isCorrect) {
                border = '2px solid var(--rose-500)';
                bg = 'var(--rose-50)';
              }
            } else if (isSelected) {
              border = '2px solid var(--teal-900)';
              bg = 'var(--teal-50)';
            }

            return (
              <div
                key={opt.label}
                onClick={() => handleSelect(opt.label)}
                style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  border,
                  backgroundColor: bg,
                  cursor: revealed ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '14px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '30px',
                    height: '30px',
                    borderRadius: '50%',
                    background: isSelected ? 'var(--teal-900)' : 'var(--slate-100)',
                    color: isSelected ? '#FFFFFF' : 'var(--slate-700)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 700,
                    fontSize: '13px',
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

        {/* Worked Solution */}
        {revealed && (
          <div
            style={{
              marginTop: '24px',
              padding: '18px 20px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--teal-50)',
              border: '1.5px solid var(--teal-100)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-900)', fontWeight: 700, fontSize: '14px', marginBottom: '6px' }}>
              <SparklesIcon size={16} color="var(--teal-900)" />
              Step-by-Step AI Teacher Explanation:
            </div>
            <p style={{ fontSize: '14px', color: '#114745', lineHeight: '1.6' }}>
              {question.explanation}
            </p>
          </div>
        )}

        {/* Continue Button */}
        {revealed && (
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
            <button
              type="button"
              onClick={handleNext}
              className="btn-solid-teal"
              style={{ padding: '10px 24px', fontSize: '14px' }}
            >
              {currentIdx === total - 1 ? 'Finish Calibration' : 'Next Question'} <ArrowRightIcon size={16} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
