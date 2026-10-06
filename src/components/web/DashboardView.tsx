import React from 'react';
import type { UserProfile } from '../../types';
import {
  FlameIcon,
  SparklesIcon,
  ShieldCheckIcon,
  ZapIcon,
  BookOpenIcon,
  ArrowRightIcon,
  CheckCircleIcon,
} from '../Icons';

interface Props {
  profile: UserProfile;
  onLaunchCBT: () => void;
  onOpenSyllabus: () => void;
  onOpenTutor: () => void;
}

export const DashboardView: React.FC<Props> = ({
  profile,
  onLaunchCBT,
  onOpenSyllabus,
  onOpenTutor,
}) => {
  const projectedScore = Math.round(160 + (profile.diagnosticScore / 100) * 200);

  const subjects = [
    {
      name: 'Use of English',
      isCompulsory: true,
      mastery: 84,
      questionsPracticed: 142,
      topTopic: 'Lexis & Structure',
      weakTopic: 'Oral Forms (Stress Patterns)',
    },
    {
      name: 'Mathematics',
      isCompulsory: false,
      mastery: 78,
      questionsPracticed: 110,
      topTopic: 'Calculus & Logs',
      weakTopic: 'Matrices & Determinants',
    },
    {
      name: 'Physics',
      isCompulsory: false,
      mastery: 72,
      questionsPracticed: 98,
      topTopic: 'Kinematics & Optics',
      weakTopic: 'Magnetic Flux & Induction',
    },
    {
      name: 'Chemistry',
      isCompulsory: false,
      mastery: 58,
      questionsPracticed: 76,
      topTopic: 'Stoichiometry & Gas Laws',
      weakTopic: 'Organic Functional Isomerism ⚠️',
      isNeedsAttention: true,
    },
  ];

  return (
    <div style={{ maxWidth: '1240px', margin: '0 auto', padding: '32px 24px', width: '100%', display: 'flex', flexDirection: 'column', gap: '32px' }}>
      {/* Hero Welcome Banner */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0E3B3A 0%, #114745 60%, #145351 100%)',
          borderRadius: 'var(--radius-xl)',
          padding: '32px 36px',
          color: '#FFFFFF',
          display: 'grid',
          gridTemplateColumns: '1.4fr 1fr',
          gap: '32px',
          boxShadow: 'var(--shadow-lg)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
            <span
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#99F6E4',
                padding: '4px 12px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 600,
                letterSpacing: '0.5px',
                textTransform: 'uppercase',
              }}
            >
              Candidate Portal · 2026/2027 Session
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                backgroundColor: '#D97706',
                color: '#FFFFFF',
                padding: '4px 10px',
                borderRadius: 'var(--radius-full)',
                fontSize: '12px',
                fontWeight: 700,
              }}
            >
              <FlameIcon size={14} color="#FFFFFF" /> 4-DAY STREAK
            </span>
          </div>

          <h1
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '28px',
              fontWeight: 700,
              lineHeight: '1.3',
              marginBottom: '10px',
            }}
          >
            Welcome back, {profile.fullName} 👋
          </h1>

          <p style={{ color: '#D8EEEB', fontSize: '15px', lineHeight: '1.6', maxWidth: '520px', marginBottom: '24px' }}>
            You're on track for <strong>{profile.targetCourse}</strong> at <strong>{profile.targetInstitution}</strong>. Your AI study assistant has prepared your daily weaknesses drill.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={onLaunchCBT}
              className="btn-solid-teal"
              style={{
                backgroundColor: '#D97706',
                borderColor: '#D97706',
                color: '#FFFFFF',
                padding: '12px 24px',
                fontSize: '15px',
              }}
            >
              <ZapIcon size={18} />
              Start Full 4-Subject CBT Mock
            </button>

            <button
              type="button"
              onClick={onOpenTutor}
              className="btn-outline-teal"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                color: '#FFFFFF',
                borderColor: 'rgba(255, 255, 255, 0.3)',
                padding: '12px 20px',
              }}
            >
              <SparklesIcon size={18} />
              Ask AI Teacher a Question
            </button>
          </div>
        </div>

        {/* Target Benchmark Score Card */}
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.08)',
            backdropFilter: 'blur(12px)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid rgba(255, 255, 255, 0.15)',
            padding: '24px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#99F6E4', fontWeight: 600 }}>
                Target Admission Cut-off
              </div>
              <div style={{ fontSize: '36px', fontWeight: 800, fontFamily: 'var(--font-display)', marginTop: '4px' }}>
                {profile.targetScore}{' '}
                <span style={{ fontSize: '16px', fontWeight: 500, color: '#A7F3D0' }}>/ 400</span>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '12px', textTransform: 'uppercase', color: '#99F6E4', fontWeight: 600 }}>
                Current Projected
              </div>
              <div style={{ fontSize: '26px', fontWeight: 700, color: '#FEF3C7', marginTop: '6px' }}>
                {projectedScore}
              </div>
            </div>
          </div>

          <div style={{ margin: '18px 0' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#E2E8F0', marginBottom: '8px' }}>
              <span>Merit Benchmark Progress</span>
              <span style={{ color: '#D97706', fontWeight: 700 }}>
                {profile.targetScore - projectedScore > 0 ? `+${profile.targetScore - projectedScore} pts needed` : 'Target Achieved!'}
              </span>
            </div>
            <div style={{ height: '10px', width: '100%', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '6px', overflow: 'hidden' }}>
              <div
                style={{
                  height: '100%',
                  width: `${Math.min(100, (projectedScore / profile.targetScore) * 100)}%`,
                  background: 'linear-gradient(90deg, #10B981 0%, #34D399 100%)',
                  borderRadius: '6px',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#D8EEEB' }}>
            <ShieldCheckIcon size={16} color="#34D399" />
            <span>Calibrated against past 5 years of UNILAG & UI faculty cut-offs</span>
          </div>
        </div>
      </section>

      {/* Main Grid: Today's AI Study Plan & Knowledge Gaps */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '28px' }}>
        {/* Left Column: Registered 4 Subjects Breakdown */}
        <section className="web-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '18px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Your Registered Subject Syllabus
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--slate-500)', marginTop: '2px' }}>
                Mastery levels across your 4 JAMB subject combination
              </p>
            </div>

            <button
              type="button"
              onClick={onOpenSyllabus}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--teal-700)',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
              }}
            >
              Browse Full Syllabus <ArrowRightIcon size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {subjects.map((subj) => (
              <div
                key={subj.name}
                style={{
                  padding: '16px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: subj.isNeedsAttention ? '1.5px solid #FCD34D' : '1px solid var(--slate-200)',
                  backgroundColor: subj.isNeedsAttention ? '#FFFDF5' : 'var(--white)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '16px',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
                      {subj.name}
                    </span>
                    {subj.isCompulsory && (
                      <span className="pill-badge pill-blue" style={{ fontSize: '11px' }}>
                        Compulsory
                      </span>
                    )}
                    {subj.isNeedsAttention && (
                      <span className="pill-badge pill-amber" style={{ fontSize: '11px' }}>
                        Priority Review
                      </span>
                    )}
                  </div>

                  <div style={{ fontSize: '13px', color: 'var(--slate-600)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                    <span><strong>Top Topic:</strong> {subj.topTopic}</span>
                    <span><strong>Review Area:</strong> {subj.weakTopic}</span>
                    <span><strong>Practiced:</strong> {subj.questionsPracticed} Qs</span>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: subj.isNeedsAttention ? '#D97706' : 'var(--teal-900)' }}>
                      {subj.mastery}%
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--slate-500)', fontWeight: 500 }}>
                      Syllabus Mastery
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={onLaunchCBT}
                    className="btn-subtle"
                    style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 600 }}
                  >
                    Drill Topic
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Right Column: Today's AI Daily Plan & Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Today's Daily Target Card */}
          <section className="web-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: 'var(--radius-sm)',
                    background: 'var(--teal-50)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--teal-900)',
                  }}
                >
                  <SparklesIcon size={18} color="var(--teal-900)" />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
                  Today's AI Study Plan
                </h3>
              </div>
              <span className="pill-badge pill-amber">
                45 / 60 Mins
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircleIcon size={18} color="var(--emerald-600)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--slate-700)', textDecoration: 'line-through' }}>
                  20 questions in Physics Kinematics & Free Fall (Completed)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <CheckCircleIcon size={18} color="var(--emerald-600)" style={{ marginTop: '2px', flexShrink: 0 }} />
                <span style={{ fontSize: '13px', color: 'var(--slate-700)', textDecoration: 'line-through' }}>
                  15 Use of English Lexis & Structure past drill (Completed)
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
                <div
                  style={{
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    border: '2px solid var(--amber-500)',
                    marginTop: '2px',
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: '13px', color: 'var(--slate-900)', fontWeight: 600 }}>
                  15 mins Chemistry Organic Functional Isomerism (Remaining for streak)
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={onLaunchDiagnostic}
              className="btn-solid-teal"
              style={{ width: '100%' }}
            >
              Complete Today's Chemistry Task
            </button>
          </section>

          {/* Diagnostic Knowledge Gap Calibration Card */}
          <section className="web-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--slate-900)' }}>
                Knowledge Gaps Report
              </h3>
              <button
                type="button"
                onClick={onLaunchDiagnostic}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal-700)',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Retake Calibration
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--slate-50)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Mechanics & Kinematics</span>
                <span style={{ color: 'var(--emerald-600)', fontWeight: 700 }}>82% (Strong)</span>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: '#FFFBEB', border: '1px solid #FDE68A', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ fontWeight: 600, color: '#92400E' }}>Organic Chemistry Isomers</span>
                <span style={{ color: '#D97706', fontWeight: 700 }}>52% (Gap)</span>
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--slate-50)', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <span style={{ fontWeight: 600 }}>Calculus & Chain Rule</span>
                <span style={{ color: 'var(--emerald-600)', fontWeight: 700 }}>88% (Mastered)</span>
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Verified Questions Guarantee & Offline Repository Banner */}
      <section
        style={{
          background: 'var(--white)',
          border: '1.5px solid var(--emerald-100)',
          borderRadius: 'var(--radius-lg)',
          padding: '24px 32px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '24px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--emerald-50)',
              color: 'var(--emerald-600)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
          >
            <ShieldCheckIcon size={30} color="var(--emerald-600)" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="pill-badge pill-verified" style={{ fontSize: '12px' }}>
                100% Verified Past Questions
              </span>
              <span style={{ fontSize: '13px', color: 'var(--slate-500)' }}>
                JAMB UTME 2014 – 2024
              </span>
            </div>
            <p style={{ fontSize: '14px', color: 'var(--slate-600)', maxWidth: '680px' }}>
              Every single question in i-Tutor is scrubbed of syllabus typos and checked by university examiners. Explanations show complete step-by-step logic, never blind answer keys.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onOpenSyllabus}
          className="btn-outline-teal"
          style={{ whiteSpace: 'nowrap' }}
        >
          <BookOpenIcon size={16} /> Explore Question Bank
        </button>
      </section>
    </div>
  );
};
