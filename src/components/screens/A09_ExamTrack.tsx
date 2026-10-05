import React from 'react';
import type { ExamTrack } from '../../types';
import { ArrowLeftIcon, CheckIcon, SparklesIcon, ArrowRightIcon } from '../Icons';

interface Props {
  selectedTrack: ExamTrack;
  onSelectTrack: (track: ExamTrack) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const A09_ExamTrack: React.FC<Props> = ({ selectedTrack, onSelectTrack, onContinue, onBack }) => {
  const tracks: {
    id: ExamTrack;
    title: string;
    targetBadge?: string;
    description: string;
    isRecommended?: boolean;
  }[] = [
    {
      id: 'jamb',
      title: 'JAMB UTME',
      targetBadge: 'Target: 400 Marks',
      description: 'Comprehensive coverage of all 4 registered subjects based strictly on the current syllabus.',
    },
    {
      id: 'post-jamb',
      title: 'Post-UTME',
      targetBadge: 'University Screening',
      description: 'University-specific past questions, institutional aptitude test drills, and mock screening modules.',
    },
    {
      id: 'both',
      title: 'Both (Recommended)',
      isRecommended: true,
      targetBadge: 'Full Admission Track',
      description: 'Unified syllabus prep to carry you seamlessly from UTME registration to final university admission.',
    },
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
      {/* Top Header & Progress Bar (20% - Step 1 of 5) */}
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
            Step 1 of 5
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* 20% Teal Progress Bar */}
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
              width: '20%',
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
          padding: '20px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '6px' }}>
            Which exam are you preparing for?
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Personalize your question bank and difficulty progression.
          </p>
        </div>

        {/* 3 Vertical Selector Cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
          {tracks.map((track) => {
            const isSelected = selectedTrack === track.id;
            return (
              <div
                key={track.id}
                onClick={() => onSelectTrack(track.id)}
                className={`surface-card surface-card-selectable ${isSelected ? 'is-selected' : ''}`}
                style={{
                  position: 'relative',
                  padding: '18px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                  borderColor: isSelected ? 'var(--teal-900)' : 'var(--neutral-200)',
                  backgroundColor: isSelected ? 'var(--teal-50)' : 'var(--white)',
                }}
              >
                {track.isRecommended && (
                  <div style={{ position: 'absolute', top: '-10px', right: '16px' }}>
                    <span
                      className="badge-pill"
                      style={{
                        background: 'var(--amber-500)',
                        color: '#FFFFFF',
                        fontSize: '11px',
                        padding: '3px 8px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                      }}
                    >
                      <SparklesIcon size={12} color="#FFFFFF" /> RECOMMENDED
                    </span>
                  </div>
                )}

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3
                      className="text-heading-2"
                      style={{
                        color: 'var(--neutral-900)',
                        fontSize: '17px',
                        fontWeight: 600,
                      }}
                    >
                      {track.title}
                    </h3>
                    {track.targetBadge && (
                      <span className="badge-pill badge-teal" style={{ fontSize: '11px', padding: '2px 8px' }}>
                        {track.targetBadge}
                      </span>
                    )}
                  </div>

                  {/* Animated Check Icon */}
                  <div
                    style={{
                      width: '24px',
                      height: '24px',
                      borderRadius: '50%',
                      border: isSelected ? '2px solid var(--teal-900)' : '2px solid var(--neutral-300)',
                      backgroundColor: isSelected ? 'var(--teal-900)' : 'transparent',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s ease',
                      flexShrink: 0,
                    }}
                  >
                    {isSelected && <CheckIcon size={14} color="#FFFFFF" />}
                  </div>
                </div>

                <p style={{ fontSize: '14px', color: 'var(--neutral-600)', lineHeight: '20px' }}>
                  {track.description}
                </p>
              </div>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <div style={{ paddingTop: '16px' }}>
          <button
            type="button"
            onClick={onContinue}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            Continue to Subjects
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  );
};
