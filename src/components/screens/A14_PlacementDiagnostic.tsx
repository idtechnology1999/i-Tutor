import React from 'react';
import { SparklesIcon, CheckCircleIcon, ArrowRightIcon, OwlBookLogo } from '../Icons';

interface Props {
  onStartBaselineTest: () => void;
  onSkipToDashboard: () => void;
}

export const A14_PlacementDiagnostic: React.FC<Props> = ({
  onStartBaselineTest,
  onSkipToDashboard,
}) => {
  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '24px 24px 32px',
        height: '100%',
        overflowY: 'auto',
      }}
    >
      <div style={{ flex: 1 }} />

      {/* Focused High-Value Milestone Card */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '16px',
        }}
      >
        {/* Illustrative AI Mentor Visual */}
        <div
          style={{
            width: '84px',
            height: '84px',
            borderRadius: '24px',
            background: 'linear-gradient(135deg, #0E3B3A 0%, #145351 100%)',
            boxShadow: '0 8px 32px rgba(14, 59, 58, 0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          <OwlBookLogo size={52} showSpark={true} />
          <div
            style={{
              position: 'absolute',
              top: '-6px',
              right: '-6px',
              background: '#D97706',
              borderRadius: '50%',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              boxShadow: '0 2px 6px rgba(217, 119, 6, 0.4)',
            }}
          >
            <SparklesIcon size={14} color="#FFFFFF" />
          </div>
        </div>

        {/* Calibration Badge */}
        <span
          className="badge-pill"
          style={{
            background: 'var(--amber-50)',
            color: 'var(--amber-600)',
            border: '1px solid var(--amber-100)',
            padding: '4px 12px',
            fontSize: '11px',
            fontWeight: 700,
          }}
        >
          PERSONALIZED LEARNING CALIBRATION
        </span>

        <div>
          <h1
            className="text-display-1"
            style={{
              color: 'var(--neutral-900)',
              fontSize: '24px',
              lineHeight: '32px',
              marginBottom: '8px',
            }}
          >
            Let’s find out what you already know.
          </h1>
          <p
            className="text-body-reg"
            style={{
              color: 'var(--neutral-600)',
              fontSize: '15px',
              lineHeight: '22px',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            Spend 5 minutes answering 10 diagnostic questions. Your personal AI tutor will pinpoint your knowledge gaps and build your day-by-day study roadmap.
          </p>
        </div>

        {/* Value Pillars (3 horizontal points with emerald checks) */}
        <div
          style={{
            background: 'var(--neutral-50)',
            border: '1.5px solid var(--neutral-200)',
            borderRadius: '16px',
            padding: '16px',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            gap: '12px',
            textAlign: 'left',
            marginTop: '8px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ marginTop: '2px' }}>
              <CheckCircleIcon size={18} color="var(--green-600)" />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--neutral-900)', fontWeight: 500, lineHeight: '18px' }}>
              Pinpoints your weakest topics in Physics, Chemistry & Maths
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ marginTop: '2px' }}>
              <CheckCircleIcon size={18} color="var(--green-600)" />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--neutral-900)', fontWeight: 500, lineHeight: '18px' }}>
              Prevents wasting time on topics you already know
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
            <div style={{ marginTop: '2px' }}>
              <CheckCircleIcon size={18} color="var(--green-600)" />
            </div>
            <span style={{ fontSize: '13px', color: 'var(--neutral-900)', fontWeight: 500, lineHeight: '18px' }}>
              Calibrates your starting AI practice difficulty
            </span>
          </div>
        </div>
      </div>

      <div style={{ flex: 1.2 }} />

      {/* Button Hierarchy */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
        {/* Primary CTA (48px): Start 5-Min Baseline Test */}
        <button
          type="button"
          onClick={onStartBaselineTest}
          className="btn-primary"
          style={{ minHeight: '48px', height: '48px' }}
        >
          Start 5-Min Baseline Test
          <ArrowRightIcon size={18} color="#FFFFFF" />
        </button>

        {/* Secondary Text Button */}
        <button
          type="button"
          onClick={onSkipToDashboard}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--teal-700)',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '10px',
            textAlign: 'center',
          }}
        >
          Skip for Now — Go to Dashboard
        </button>
      </div>
    </div>
  );
};
