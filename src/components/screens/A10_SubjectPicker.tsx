import React from 'react';
import { ArrowLeftIcon, LockIcon, CheckIcon, ArrowRightIcon } from '../Icons';
import { JAMB_SUBJECTS } from '../../data/nigerian-curriculum';

interface Props {
  selectedSubjects: string[];
  onToggleSubject: (subjectName: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export const A10_SubjectPicker: React.FC<Props> = ({
  selectedSubjects,
  onToggleSubject,
  onContinue,
  onBack,
}) => {
  const count = selectedSubjects.length;
  const isComplete = count === 4;

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
      {/* Top Header & 40% Progress Bar */}
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
            Step 2 of 5
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* 40% Teal Progress Bar */}
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
              width: '40%',
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
        }}
      >
        {/* Title & Counter Pill */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
          <div>
            <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '4px' }}>
              Select your 4 subjects
            </h1>
            <p className="text-body-sm" style={{ color: 'var(--neutral-600)' }}>
              Choose according to your target university faculty brochure.
            </p>
          </div>

          {/* Counter pill: Amber alert until 4 selected */}
          <span
            className="badge-pill"
            style={{
              background: isComplete ? 'var(--green-50)' : 'var(--amber-50)',
              color: isComplete ? 'var(--green-600)' : 'var(--amber-600)',
              border: isComplete ? '1px solid var(--green-100)' : '1px solid var(--amber-100)',
              fontSize: '12px',
              fontWeight: 700,
              padding: '4px 10px',
              flexShrink: 0,
            }}
          >
            {count} of 4 selected
          </span>
        </div>

        {/* Rule Enforcement Banner: Use of English is compulsory */}
        <div
          style={{
            background: 'var(--amber-50)',
            border: '1px solid var(--amber-100)',
            borderRadius: '12px',
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          <div
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#92400E',
              flexShrink: 0,
            }}
          >
            <LockIcon size={16} color="#92400E" />
          </div>
          <p style={{ fontSize: '13px', color: '#92400E', fontWeight: 600, lineHeight: '18px' }}>
            Use of English is compulsory for all JAMB candidates.
          </p>
        </div>

        {/* 2-Column Subject Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '10px',
            marginBottom: '16px',
          }}
        >
          {JAMB_SUBJECTS.map((subject) => {
            const isSelected = selectedSubjects.includes(subject.name);
            const isLocked = subject.isCompulsory;
            const isComingSoon = subject.isComingSoon;

            return (
              <div
                key={subject.id}
                onClick={() => {
                  if (isLocked || isComingSoon) return;
                  onToggleSubject(subject.name);
                }}
                className={`surface-card ${!isComingSoon && !isLocked ? 'surface-card-selectable' : ''}`}
                style={{
                  padding: '12px 14px',
                  borderRadius: '14px',
                  border: isSelected
                    ? '2px solid var(--teal-900)'
                    : isLocked
                    ? '1.5px solid var(--neutral-300)'
                    : '1.5px solid var(--neutral-200)',
                  backgroundColor: isSelected
                    ? 'var(--teal-50)'
                    : isLocked
                    ? '#F9FAFB'
                    : isComingSoon
                    ? '#F3F4F6'
                    : 'var(--white)',
                  opacity: isComingSoon ? 0.6 : 1,
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                  minHeight: '84px',
                  position: 'relative',
                  cursor: isComingSoon ? 'not-allowed' : isLocked ? 'default' : 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <span
                    style={{
                      fontSize: '14px',
                      fontWeight: isSelected ? 700 : 500,
                      color: isSelected ? 'var(--teal-900)' : 'var(--neutral-900)',
                      lineHeight: '18px',
                    }}
                  >
                    {subject.name}
                  </span>

                  {isLocked ? (
                    <span
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        background: '#E5E7EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#6B7280',
                      }}
                      title="Compulsory subject"
                    >
                      <LockIcon size={12} />
                    </span>
                  ) : isComingSoon ? null : (
                    <div
                      style={{
                        width: '20px',
                        height: '20px',
                        borderRadius: '50%',
                        border: isSelected ? '2px solid var(--teal-900)' : '2px solid var(--neutral-300)',
                        backgroundColor: isSelected ? 'var(--teal-900)' : 'transparent',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {isSelected && <CheckIcon size={12} color="#FFFFFF" />}
                    </div>
                  )}
                </div>

                {isComingSoon && (
                  <span
                    className="badge-pill"
                    style={{
                      fontSize: '10px',
                      padding: '2px 6px',
                      background: 'var(--neutral-200)',
                      color: 'var(--neutral-600)',
                      alignSelf: 'flex-start',
                    }}
                  >
                    Coming Soon
                  </span>
                )}

                {isLocked && (
                  <span
                    style={{
                      fontSize: '11px',
                      color: 'var(--neutral-500)',
                      fontWeight: 500,
                    }}
                  >
                    Compulsory
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div style={{ flex: 1 }} />

        {/* Sticky Bottom CTA: Confirm Subjects (Enabled only when count == 4) */}
        <div style={{ paddingTop: '12px', borderTop: '1px solid var(--neutral-100)' }}>
          <button
            type="button"
            onClick={onContinue}
            disabled={!isComplete}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            {isComplete ? 'Confirm Subjects' : `Select ${4 - count} more subject${4 - count > 1 ? 's' : ''}`}
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </button>
        </div>
      </div>
    </div>
  );
};
