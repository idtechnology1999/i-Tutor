import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CalendarIcon, SparklesIcon } from '../Icons';
import type { DailyCommitment, ExamTrack } from '../../types';

interface Props {
  examMonth: string;
  onChangeExamMonth: (month: string) => void;
  targetScore: number;
  onChangeTargetScore: (score: number) => void;
  dailyCommitment: DailyCommitment;
  onChangeDailyCommitment: (val: DailyCommitment) => void;
  track: ExamTrack;
  selectedSubjects: string[];
  onContinue: () => void;
  onBack: () => void;
}

export const A12_ExamDateGoals: React.FC<Props> = ({
  examMonth,
  onChangeExamMonth,
  targetScore,
  onChangeTargetScore,
  dailyCommitment,
  onChangeDailyCommitment,
  track,
  selectedSubjects,
  onContinue,
  onBack,
}) => {
  // Benchmark badge calculation
  const getMilestoneBadge = (score: number) => {
    if (score >= 320) {
      return { text: 'Elite Tier — Top Quota Contender', color: '#059669', bg: '#ECFDF5', border: '#D1FAE5' };
    }
    if (score >= 280) {
      return { text: 'Competitive for Top Federal Universities', color: '#D97706', bg: '#FFFBEB', border: '#FEF3C7' };
    }
    if (score >= 250) {
      return { text: 'Competitive for Merit Admission', color: '#2563EB', bg: '#EFF6FF', border: '#DBEAFE' };
    }
    if (score >= 200) {
      return { text: 'Good for State & Private Universities', color: '#4B5563', bg: '#F3F4F6', border: '#E5E7EB' };
    }
    return { text: 'Minimum Cut-off Threshold', color: '#DC2626', bg: '#FEF2F2', border: '#FEE2E2' };
  };

  const badge = getMilestoneBadge(targetScore);

  const commitmentOptions: { id: DailyCommitment; label: string }[] = [
    { id: '30min', label: '30 min' },
    { id: '1hour', label: '1 hour' },
    { id: '2hours', label: '2 hours' },
    { id: '3hours', label: '3+ hours' },
  ];

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
      {/* Top Header & 80% Progress Bar */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-icon-touch"
            style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
            aria-label="Back"
          >
            <ArrowLeftIcon size={20} color="var(--neutral-900)" />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-700)' }}>
            Step 4 of 5
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* 80% Teal Progress Bar */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'var(--neutral-200)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '80%',
              background: 'var(--teal-900)',
              borderRadius: '2px',
              transition: 'width 0.3s ease',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '16px 20px 24px',
          display: 'flex',
          flexDirection: 'column',
          overflowY: 'auto',
          gap: '18px',
        }}
      >
        <div>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '4px' }}>
            Set your target & daily goal
          </h1>
          <p className="text-body-sm" style={{ color: 'var(--neutral-600)' }}>
            i-Tutor calibrates daily drills to match your target admission benchmark.
          </p>
        </div>

        {/* Module 1: Exam Window Date Picker */}
        <div className="form-input-group" style={{ marginBottom: 0 }}>
          <label className="form-label" htmlFor="exam-window">
            Official Exam Window
          </label>
          <div style={{ position: 'relative' }}>
            <input
              id="exam-window"
              type="text"
              value={examMonth}
              onChange={(e) => onChangeExamMonth(e.target.value)}
              className="form-input"
              style={{ width: '100%', paddingLeft: '42px', minHeight: '48px' }}
            />
            <div style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }}>
              <CalendarIcon size={18} color="var(--teal-900)" />
            </div>
          </div>
        </div>

        {/* Module 2: Target Score Slider (Range: 160 – 400) */}
        <div
          style={{
            background: 'var(--neutral-50)',
            border: '1px solid var(--neutral-200)',
            borderRadius: '16px',
            padding: '16px',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--neutral-900)' }}>
              Target JAMB Score
            </span>
            <span
              style={{
                fontSize: '24px',
                fontWeight: 800,
                color: 'var(--teal-900)',
                fontFamily: 'var(--font-family-display)',
              }}
            >
              {targetScore}{' '}
              <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--neutral-500)' }}>/ 400</span>
            </span>
          </div>

          {/* Interactive Range Slider */}
          <input
            type="range"
            min="160"
            max="400"
            step="5"
            value={targetScore}
            onChange={(e) => onChangeTargetScore(Number(e.target.value))}
            className="score-slider"
            style={{ margin: '12px 0 10px' }}
          />

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--neutral-500)', marginBottom: '10px' }}>
            <span>160 (Min)</span>
            <span>200</span>
            <span>250</span>
            <span style={{ fontWeight: 700, color: 'var(--teal-900)' }}>280 (Top Federal)</span>
            <span>400</span>
          </div>

          {/* Dynamic Milestone Indicator Badge */}
          <div
            style={{
              padding: '8px 12px',
              borderRadius: '10px',
              backgroundColor: badge.bg,
              border: `1px solid ${badge.border}`,
              color: badge.color,
              fontSize: '12px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <SparklesIcon size={14} color={badge.color} />
            {badge.text}
          </div>
        </div>

        {/* Module 3: Daily Commitment Chips */}
        <div>
          <label className="form-label" style={{ marginBottom: '8px', display: 'block' }}>
            Daily Study Commitment
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
            {commitmentOptions.map((opt) => {
              const isSelected = dailyCommitment === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeDailyCommitment(opt.id)}
                  style={{
                    minHeight: '44px',
                    borderRadius: '12px',
                    border: isSelected ? '2px solid var(--teal-900)' : '1px solid var(--neutral-300)',
                    background: isSelected ? 'var(--teal-50)' : 'var(--white)',
                    color: isSelected ? 'var(--teal-900)' : 'var(--neutral-700)',
                    fontWeight: isSelected ? 700 : 500,
                    fontSize: '13px',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Module 4: Real-Time Summary Card (Dark Teal Card #0E3B3A) */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0E3B3A 0%, #145351 100%)',
            borderRadius: '16px',
            padding: '16px',
            color: '#FFFFFF',
            boxShadow: '0 4px 16px rgba(14, 59, 58, 0.2)',
          }}
        >
          <div style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.5px', color: '#99F6E4', fontWeight: 600, marginBottom: '6px' }}>
            YOUR STUDY BLUEPRINT SUMMARY
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '15px', fontWeight: 700 }}>
              Track: {track === 'both' ? 'JAMB + Post-UTME' : track === 'post-jamb' ? 'Post-UTME' : 'JAMB UTME'}
            </span>
            <span
              style={{
                background: '#D97706',
                color: '#FFFFFF',
                padding: '2px 8px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              Target: {targetScore}/400
            </span>
          </div>

          <div style={{ fontSize: '13px', color: '#EDF7F6', marginBottom: '4px' }}>
            <strong>Subjects:</strong> {selectedSubjects.join(', ')}
          </div>
          <div style={{ fontSize: '13px', color: '#EDF7F6' }}>
            <strong>Daily Plan:</strong> {dailyCommitment === '1hour' ? '1 hr/day' : dailyCommitment === '30min' ? '30 min/day' : dailyCommitment === '2hours' ? '2 hrs/day' : '3+ hrs/day'}
          </div>
        </div>

        <div style={{ flex: 1 }} />

        {/* Sticky CTA */}
        <div style={{ paddingTop: '8px' }}>
          <button
            type="button"
            onClick={onContinue}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            Confirm Goals & Continue
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  );
};
