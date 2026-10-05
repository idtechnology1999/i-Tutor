import React, { useState } from 'react';
import type { UserProfile } from '../../types';
import {
  OwlBookLogo,
  FlameIcon,
  SparklesIcon,
  ShieldCheckIcon,
  CloudCheckIcon,
  BookOpenIcon,
  ZapIcon,
  CompassIcon,
  UserIcon,
} from '../Icons';

interface Props {
  profile: UserProfile;
  onRetakeDiagnostic: () => void;
  onResetFlow: () => void;
}

export const HomeDashboard: React.FC<Props> = ({ profile, onRetakeDiagnostic, onResetFlow }) => {
  const [activeTab, setActiveTab] = useState<'home' | 'practice' | 'tutor' | 'syllabus' | 'profile'>('home');
  const simulatedScore = profile.diagnosticScore > 0 ? profile.diagnosticScore : 72;

  // Derive projected JAMB score based on target and diagnostic
  const projectedJAMB = Math.round(160 + (simulatedScore / 100) * 200);

  return (
    <div
      style={{
        flex: 1,
        background: 'var(--neutral-50)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Scrollable Dashboard Body */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          padding: '16px 20px 84px',
          display: 'flex',
          flexDirection: 'column',
          gap: '18px',
        }}
      >
        {/* Top Header Row: Profile Avatar, Greeting, Streak Badge */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '14px',
                background: 'var(--teal-900)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: '17px',
                boxShadow: 'var(--shadow-flat-subtle)',
              }}
            >
              {profile.fullName.charAt(0) || 'A'}
            </div>
            <div>
              <div style={{ fontSize: '13px', color: 'var(--neutral-600)', fontWeight: 500 }}>
                Welcome back,
              </div>
              <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--neutral-900)' }}>
                {profile.fullName.split(' ')[0] || 'Candidate'} 👋
              </div>
            </div>
          </div>

          {/* Streak Badge */}
          <div
            className="badge-pill badge-amber"
            style={{
              padding: '6px 12px',
              fontSize: '13px',
              fontWeight: 700,
            }}
          >
            <FlameIcon size={16} color="#D97706" />
            4-DAY STREAK
          </div>
        </div>

        {/* Target Benchmark & Projection Card */}
        <div
          style={{
            background: 'linear-gradient(135deg, #0E3B3A 0%, #145351 100%)',
            borderRadius: '20px',
            padding: '20px',
            color: '#FFFFFF',
            boxShadow: '0 8px 24px rgba(14, 59, 58, 0.25)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle logo watermark */}
          <div
            style={{
              position: 'absolute',
              right: '-16px',
              bottom: '-16px',
              opacity: 0.12,
              pointerEvents: 'none',
            }}
          >
            <OwlBookLogo size={120} showSpark={false} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
            <div>
              <span
                style={{
                  background: 'rgba(255, 255, 255, 0.15)',
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-pill)',
                  fontSize: '11px',
                  fontWeight: 600,
                  color: '#99F6E4',
                  letterSpacing: '0.5px',
                }}
              >
                {profile.targetInstitution ? `${profile.targetInstitution.split(' ')[0]} CANDIDATE` : 'JAMB UTME CANDIDATE'}
              </span>
              <div style={{ fontSize: '13px', color: '#E2E8F0', marginTop: '6px' }}>
                {profile.targetCourse || 'Medicine & Surgery'}
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px', color: '#99F6E4', textTransform: 'uppercase', fontWeight: 600 }}>
                Target Score
              </div>
              <div style={{ fontSize: '26px', fontWeight: 800, color: '#FFFFFF', fontFamily: 'var(--font-family-display)' }}>
                {profile.targetScore}{' '}
                <span style={{ fontSize: '14px', fontWeight: 500, color: '#A7F3D0' }}>/ 400</span>
              </div>
            </div>
          </div>

          {/* Progress Bar comparing projected vs target */}
          <div style={{ marginBottom: '8px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#E2E8F0', marginBottom: '4px' }}>
              <span>Projected Benchmark: <strong>{projectedJAMB} / 400</strong></span>
              <span style={{ color: '#D97706', fontWeight: 700 }}>+15 pts to Merit Quota</span>
            </div>
            <div style={{ height: '8px', width: '100%', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '4px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${(projectedJAMB / 400) * 100}%`,
                  background: '#10B981',
                  borderRadius: '4px',
                }}
              />
            </div>
          </div>
        </div>

        {/* Today's AI Study Plan with Radial Ring */}
        <div className="surface-card" style={{ display: 'flex', alignItems: 'center', gap: '16px', padding: '16px' }}>
          {/* Radial visual indicator */}
          <div style={{ position: 'relative', width: '64px', height: '64px', flexShrink: 0 }}>
            <svg width="64" height="64" viewBox="0 0 36 36">
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#E5E7EB"
                strokeWidth="3.5"
              />
              <path
                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                fill="none"
                stroke="#0E3B3A"
                strokeWidth="3.5"
                strokeDasharray="75, 100"
                strokeLinecap="round"
              />
            </svg>
            <div
              style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '12px',
                fontWeight: 700,
                color: 'var(--teal-900)',
              }}
            >
              75%
            </div>
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <span className="badge-pill badge-teal" style={{ fontSize: '10px', padding: '2px 6px' }}>
                DAILY TARGET
              </span>
              <span style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>45 / 60 mins</span>
            </div>
            <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--neutral-900)' }}>
              15 mins of Chemistry Drill left
            </h3>
            <p style={{ fontSize: '12px', color: 'var(--neutral-600)', marginTop: '2px' }}>
              Complete 10 Organic Chemistry questions to preserve today's streak.
            </p>
          </div>
        </div>

        {/* Diagnostic Knowledge Gaps Breakdown */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <h2 className="text-heading-2" style={{ color: 'var(--neutral-900)', fontSize: '16px' }}>
              Diagnostic Knowledge Gaps
            </h2>
            <button
              type="button"
              onClick={onRetakeDiagnostic}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal-700)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Retake Test
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1px solid var(--neutral-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-900)' }}>
                  Physics: Kinematics & Mechanics
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>78% accuracy · 42 questions mastered</div>
              </div>
              <span className="badge-pill badge-verified" style={{ fontSize: '11px' }}>
                Proficient
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1.5px solid var(--amber-500)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-900)' }}>
                  Chemistry: Organic Isomerism
                </div>
                <div style={{ fontSize: '12px', color: '#92400E' }}>52% accuracy · ⚠️ Top knowledge gap</div>
              </div>
              <span className="badge-pill badge-amber" style={{ fontSize: '11px' }}>
                Needs Drill
              </span>
            </div>

            <div
              style={{
                padding: '12px 14px',
                borderRadius: '12px',
                background: '#FFFFFF',
                border: '1px solid var(--neutral-200)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--neutral-900)' }}>
                  Mathematics: Calculus & Logs
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>88% accuracy · 64 questions mastered</div>
              </div>
              <span className="badge-pill badge-verified" style={{ fontSize: '11px' }}>
                Mastered
              </span>
            </div>
          </div>
        </div>

        {/* Practice Quick Launch Suite */}
        <div>
          <h2 className="text-heading-2" style={{ color: 'var(--neutral-900)', fontSize: '16px', marginBottom: '10px' }}>
            Practice Mode Quick Launch
          </h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
            {/* Authentic JAMB CBT Mode */}
            <div
              onClick={() => onRetakeDiagnostic()}
              className="surface-card surface-card-selectable"
              style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--teal-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--teal-900)',
                }}
              >
                <ZapIcon size={20} color="var(--teal-900)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)' }}>
                  JAMB CBT Exam
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                  Full 4-subject mock simulation with authentic 2-hour timer.
                </div>
              </div>
            </div>

            {/* Offline Question Bank */}
            <div
              className="surface-card surface-card-selectable"
              style={{ padding: '14px', display: 'flex', flexDirection: 'column', gap: '8px' }}
            >
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '10px',
                  background: 'var(--green-50)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--green-600)',
                }}
              >
                <CloudCheckIcon size={20} color="var(--green-600)" />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--neutral-900)' }}>
                  Offline Bank
                </div>
                <div style={{ fontSize: '12px', color: 'var(--neutral-600)', marginTop: '2px' }}>
                  2,400+ questions cached. Zero mobile data needed.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Verified Past Question Guarantee Banner */}
        <div
          style={{
            background: 'var(--green-50)',
            border: '1.5px solid var(--green-100)',
            borderRadius: '16px',
            padding: '14px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '10px',
              background: '#D1FAE5',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--green-600)',
              flexShrink: 0,
            }}
          >
            <ShieldCheckIcon size={22} color="var(--green-600)" />
          </div>
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--green-600)' }}>
              100% Verified Past Questions
            </div>
            <p style={{ fontSize: '12px', color: '#065F46', lineHeight: '16px', marginTop: '2px' }}>
              Every past question is verified by seasoned examiners and audited against the official JAMB syllabus.
            </p>
          </div>
        </div>

        {/* Quick Restart Walkthrough Button */}
        <div style={{ textAlign: 'center', marginTop: '10px' }}>
          <button
            type="button"
            onClick={onResetFlow}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--neutral-500)',
              fontSize: '13px',
              cursor: 'pointer',
              textDecoration: 'underline',
              padding: '6px',
            }}
          >
            ← Restart Flow from Splash / Onboarding
          </button>
        </div>
      </div>

      {/* Fixed Bottom Navigation Bar (5 tabs) */}
      <div
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '68px',
          background: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          borderTop: '1px solid var(--neutral-200)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          padding: '0 8px 10px',
          zIndex: 40,
        }}
      >
        <button
          type="button"
          onClick={() => setActiveTab('home')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'home' ? 'var(--teal-900)' : 'var(--neutral-400)',
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          <OwlBookLogo size={20} showSpark={activeTab === 'home'} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'home' ? 700 : 500 }}>Home</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('practice')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'practice' ? 'var(--teal-900)' : 'var(--neutral-400)',
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          <BookOpenIcon size={20} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'practice' ? 700 : 500 }}>Practice</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('tutor')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'tutor' ? 'var(--teal-900)' : 'var(--neutral-400)',
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          <SparklesIcon size={20} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'tutor' ? 700 : 500 }}>AI Tutor</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('syllabus')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'syllabus' ? 'var(--teal-900)' : 'var(--neutral-400)',
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          <CompassIcon size={20} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'syllabus' ? 700 : 500 }}>Syllabus</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          style={{
            background: 'none',
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '4px',
            color: activeTab === 'profile' ? 'var(--teal-900)' : 'var(--neutral-400)',
            cursor: 'pointer',
            padding: '6px 12px',
          }}
        >
          <UserIcon size={20} />
          <span style={{ fontSize: '11px', fontWeight: activeTab === 'profile' ? 700 : 500 }}>Profile</span>
        </button>
      </div>
    </div>
  );
};
