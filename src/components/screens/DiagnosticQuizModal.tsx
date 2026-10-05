import React, { useState } from 'react';
import { DIAGNOSTIC_QUESTIONS } from '../../data/nigerian-curriculum';
import { ArrowLeftIcon, ArrowRightIcon, SparklesIcon, ShieldCheckIcon } from '../Icons';

interface Props {
  onComplete: (score: number) => void;
  onExit: () => void;
}

export const DiagnosticQuizModal: React.FC<Props> = ({ onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  const question = DIAGNOSTIC_QUESTIONS[currentIndex];
  const totalQuestions = DIAGNOSTIC_QUESTIONS.length;
  const currentSelection = selectedAnswers[question.id];

  const handleSelectOption = (label: string) => {
    if (showExplanation) return;
    setSelectedAnswers((prev) => ({ ...prev, [question.id]: label }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
    }
  };

  // Calculate score
  const correctCount = DIAGNOSTIC_QUESTIONS.filter(
    (q) => selectedAnswers[q.id] === q.correctAnswer
  ).length;

  if (isFinished) {
    const percentage = Math.round((correctCount / totalQuestions) * 100);
    return (
      <div
        style={{
          flex: 1,
          background: '#FFFFFF',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '100%',
          textAlign: 'center',
        }}
      >
        <div style={{ flex: 1 }} />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--teal-50)',
              border: '2px solid var(--teal-900)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SparklesIcon size={40} color="var(--teal-900)" />
          </div>

          <span className="badge-pill badge-verified">
            <ShieldCheckIcon size={14} color="var(--green-600)" />
            BASELINE CALIBRATION COMPLETE
          </span>

          <h2 className="text-display-1" style={{ color: 'var(--neutral-900)', fontSize: '24px' }}>
            Diagnostic Score: {correctCount} / {totalQuestions} ({percentage}%)
          </h2>

          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', maxWidth: '300px' }}>
            Your personal AI tutor has mapped your knowledge gaps across Physics, Chemistry, and Mathematics.
          </p>

          {/* Breakdown cards */}
          <div
            style={{
              width: '100%',
              background: 'var(--neutral-50)',
              borderRadius: '16px',
              padding: '16px',
              border: '1px solid var(--neutral-200)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              textAlign: 'left',
              marginTop: '8px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Physics (Kinematics & Optics)</span>
              <span style={{ color: 'var(--green-600)', fontWeight: 700 }}>Strong Foundation</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Chemistry (Organic Isomerism)</span>
              <span style={{ color: 'var(--amber-600)', fontWeight: 700 }}>Recommended Drill Area</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
              <span style={{ fontWeight: 600 }}>Mathematics (Calculus & Logs)</span>
              <span style={{ color: 'var(--green-600)', fontWeight: 700 }}>Proficient</span>
            </div>
          </div>
        </div>

        <div style={{ flex: 1.2 }} />

        <button
          type="button"
          onClick={() => onComplete(percentage)}
          className="btn-primary"
          style={{ minHeight: '48px', height: '48px', width: '100%' }}
        >
          View My Personalized Dashboard
          <ArrowRightIcon size={18} color="#FFFFFF" />
        </button>
      </div>
    );
  }

  const progressPercent = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Top Header & Progress */}
      <div style={{ padding: '12px 20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={onExit}
            className="btn-icon-touch"
            style={{ width: '36px', height: '36px', minWidth: '36px', minHeight: '36px' }}
            aria-label="Exit diagnostic test"
          >
            <ArrowLeftIcon size={18} color="var(--neutral-900)" />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-700)' }}>
            Question {currentIndex + 1} of {totalQuestions}
          </span>
          <span className="badge-pill badge-teal" style={{ fontSize: '11px', padding: '2px 8px' }}>
            {question.subject}
          </span>
        </div>

        <div style={{ height: '4px', width: '100%', background: 'var(--neutral-200)', borderRadius: '2px' }}>
          <div
            style={{
              height: '100%',
              width: `${progressPercent}%`,
              background: 'var(--teal-900)',
              borderRadius: '2px',
              transition: 'width 0.25s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '12px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          gap: '16px',
        }}
      >
        {/* Topic Tag */}
        <div style={{ fontSize: '12px', color: 'var(--neutral-500)', fontWeight: 600, textTransform: 'uppercase' }}>
          Topic: {question.topic}
        </div>

        {/* Question Text */}
        <h2
          className="text-heading-2"
          style={{
            color: 'var(--neutral-900)',
            fontSize: '17px',
            lineHeight: '24px',
            fontWeight: 600,
          }}
        >
          {question.question}
        </h2>

        {/* Options */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {question.options.map((opt) => {
            const isSelected = currentSelection === opt.label;
            const isCorrect = opt.label === question.correctAnswer;
            let borderColor = 'var(--neutral-200)';
            let bgColor = 'var(--white)';

            if (showExplanation) {
              if (isCorrect) {
                borderColor = 'var(--green-600)';
                bgColor = 'var(--green-50)';
              } else if (isSelected && !isCorrect) {
                borderColor = 'var(--red-500)';
                bgColor = 'var(--red-50)';
              }
            } else if (isSelected) {
              borderColor = 'var(--teal-900)';
              bgColor = 'var(--teal-50)';
            }

            return (
              <div
                key={opt.label}
                onClick={() => handleSelectOption(opt.label)}
                style={{
                  padding: '12px 14px',
                  borderRadius: '12px',
                  border: `1.5px solid ${borderColor}`,
                  backgroundColor: bgColor,
                  cursor: showExplanation ? 'default' : 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div
                  style={{
                    width: '28px',
                    height: '28px',
                    borderRadius: '8px',
                    background: isSelected ? 'var(--teal-900)' : 'var(--neutral-100)',
                    color: isSelected ? '#FFFFFF' : 'var(--neutral-700)',
                    fontWeight: 700,
                    fontSize: '13px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {opt.label}
                </div>
                <span style={{ fontSize: '14px', color: 'var(--neutral-900)', fontWeight: 500 }}>
                  {opt.text}
                </span>
              </div>
            );
          })}
        </div>

        {/* Step-by-Step Logic Explanation */}
        {showExplanation && (
          <div
            style={{
              background: 'var(--teal-50)',
              border: '1.5px solid var(--teal-100)',
              borderRadius: '14px',
              padding: '14px',
              animation: 'fadeIn 0.2s ease-out',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--teal-900)', fontWeight: 700, fontSize: '13px', marginBottom: '6px' }}>
              <SparklesIcon size={16} color="var(--teal-900)" />
              Step-by-Step AI Logic:
            </div>
            <p style={{ fontSize: '13px', color: '#145351', lineHeight: '19px' }}>
              {question.explanation}
            </p>
          </div>
        )}

        <div style={{ flex: 1 }} />

        {/* Next Question CTA */}
        {showExplanation && (
          <div style={{ paddingTop: '8px' }}>
            <button
              type="button"
              onClick={handleNext}
              className="btn-primary"
              style={{ minHeight: '48px', height: '48px' }}
            >
              {currentIndex === totalQuestions - 1 ? 'Finish & See Analysis' : 'Next Question'}
              <ArrowRightIcon size={18} color="#FFFFFF" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
