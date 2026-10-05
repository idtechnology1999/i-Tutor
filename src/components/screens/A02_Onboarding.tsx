import React, { useState } from 'react';
import { ArrowRightIcon, ShieldCheckIcon, SparklesIcon, WifiOffIcon, CheckCircleIcon } from '../Icons';

interface Props {
  onComplete: () => void;
  onSkip: () => void;
}

export const A02_Onboarding: React.FC<Props> = ({ onComplete, onSkip }) => {
  const [currentSlide, setCurrentSlide] = useState(0);

  const slides = [
    {
      step: '01',
      headline: 'Learn, Don’t Memorise',
      copy: 'Master underlying principles behind tough JAMB concepts with step-by-step logic, not rote memorization.',
      renderVisual: () => (
        <div
          style={{
            width: '100%',
            height: '240px',
            background: 'linear-gradient(135deg, #EDF7F6 0%, #D2EBE9 100%)',
            borderRadius: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            border: '1px solid rgba(14, 59, 58, 0.08)',
          }}
        >
          {/* Metaphor: Puzzle pieces clicking into clarity */}
          <div style={{ position: 'relative', width: '180px', height: '160px' }}>
            {/* Top-Left Piece */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                left: '10px',
                width: '75px',
                height: '65px',
                background: '#0E3B3A',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#99F6E4',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(14, 59, 58, 0.25)',
              }}
            >
              F = ma
            </div>

            {/* Top-Right Piece */}
            <div
              style={{
                position: 'absolute',
                top: '10px',
                right: '10px',
                width: '75px',
                height: '65px',
                background: '#D97706',
                borderRadius: '12px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFBEB',
                fontSize: '12px',
                fontWeight: 600,
                boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)',
              }}
            >
              E = mc²
            </div>

            {/* Bottom-Center Locking Core */}
            <div
              style={{
                position: 'absolute',
                bottom: '10px',
                left: '30px',
                width: '120px',
                height: '65px',
                background: '#FFFFFF',
                borderRadius: '12px',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                border: '2px solid #059669',
                boxShadow: '0 8px 24px rgba(5, 150, 105, 0.2)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#059669', fontSize: '11px', fontWeight: 700 }}>
                <CheckCircleIcon size={14} color="#059669" /> LOGIC SOLVED
              </div>
              <span style={{ fontSize: '12px', color: '#111827', fontWeight: 600 }}>Concepts Aligned</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      step: '02',
      headline: 'Verified Questions Only',
      copy: 'Practice with authentic past questions, completely scrubbed of syllabus errors and verified by subject matter experts.',
      renderVisual: () => (
        <div
          style={{
            width: '100%',
            height: '240px',
            background: 'linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            position: 'relative',
            border: '1px solid rgba(5, 150, 105, 0.15)',
          }}
        >
          {/* Authentic JAMB Question Card */}
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '16px',
              width: '100%',
              boxShadow: '0 6px 20px rgba(5, 150, 105, 0.12)',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
              <span className="badge-pill badge-verified">
                <ShieldCheckIcon size={14} color="#059669" />
                Verified Past Question
              </span>
              <span style={{ fontSize: '12px', color: '#6B7280', fontWeight: 500 }}>JAMB 2024 · Q14</span>
            </div>
            <p style={{ fontSize: '13px', color: '#111827', fontWeight: 500, lineHeight: '18px' }}>
              "The kinetic theory of gases assumes that collisions between molecules are perfectly..."
            </p>
            <div
              style={{
                marginTop: '10px',
                padding: '6px 10px',
                background: '#ECFDF5',
                borderRadius: '8px',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              <CheckCircleIcon size={14} color="#059669" /> Correct Answer: Elastic (Zero Syllabus Error)
            </div>
          </div>
        </div>
      ),
    },
    {
      step: '03',
      headline: 'Your Personal AI Teacher',
      copy: 'Get 24/7 personalized explanations tailored to your exact weaknesses in Maths, Physics, and Chemistry.',
      renderVisual: () => (
        <div
          style={{
            width: '100%',
            height: '240px',
            background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '20px',
            gap: '12px',
            border: '1px solid rgba(217, 119, 6, 0.15)',
          }}
        >
          {/* User message */}
          <div
            style={{
              alignSelf: 'flex-end',
              background: '#0E3B3A',
              color: '#FFFFFF',
              padding: '10px 14px',
              borderRadius: '14px 14px 2px 14px',
              fontSize: '13px',
              maxWidth: '85%',
              boxShadow: '0 2px 8px rgba(14, 59, 58, 0.15)',
            }}
          >
            "Why is option C wrong for Organic Isomerism?"
          </div>

          {/* AI Response Card */}
          <div
            style={{
              alignSelf: 'flex-start',
              background: '#FFFFFF',
              color: '#111827',
              padding: '12px 14px',
              borderRadius: '14px 14px 14px 2px',
              fontSize: '13px',
              maxWidth: '92%',
              border: '1px solid #FDE68A',
              boxShadow: '0 4px 12px rgba(217, 119, 6, 0.08)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontWeight: 600, fontSize: '11px', marginBottom: '4px' }}>
              <SparklesIcon size={13} color="#D97706" /> i-Tutor AI Tutor
            </div>
            <p style={{ lineHeight: '18px', color: '#374151' }}>
              Let's trace the molecular formula: Option C has a branching methyl group, making it a <em>chain isomer</em>, not a functional isomer!
            </p>
          </div>
        </div>
      ),
    },
    {
      step: '04',
      headline: 'Study Even With Limited Internet',
      copy: 'Download full question banks and notes. Keep practicing seamlessly even when your connection drops.',
      renderVisual: () => (
        <div
          style={{
            width: '100%',
            height: '240px',
            background: 'linear-gradient(135deg, #F3F4F6 0%, #E5E7EB 100%)',
            borderRadius: '20px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
            border: '1px solid #D1D5DB',
            position: 'relative',
          }}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              padding: '18px',
              width: '100%',
              boxShadow: '0 8px 24px rgba(0, 0, 0, 0.08)',
              border: '1px solid #E5E7EB',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span
                  style={{
                    padding: '6px 10px',
                    borderRadius: '8px',
                    background: '#FEF3C7',
                    color: '#92400E',
                    fontSize: '12px',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                >
                  <WifiOffIcon size={14} color="#92400E" /> Offline Mode Active
                </span>
              </div>
              <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>100% Synced</span>
            </div>

            <div style={{ fontSize: '13px', color: '#4B5563', marginBottom: '10px' }}>
              Local storage contains <strong>2,400+ JAMB Questions</strong> ready for offline mock tests.
            </div>

            <div
              style={{
                width: '100%',
                height: '8px',
                background: '#EDF7F6',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div style={{ width: '100%', height: '100%', background: '#0E3B3A', borderRadius: '4px' }} />
            </div>
          </div>
        </div>
      ),
    },
  ];

  const handleNext = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide((prev) => prev + 1);
    } else {
      onComplete();
    }
  };

  const slide = slides[currentSlide];

  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '20px 24px 32px',
        height: '100%',
      }}
    >
      {/* Top Bar: Skip link (teal-700, 14px, top-right) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minHeight: '44px',
        }}
      >
        <button
          type="button"
          onClick={onSkip}
          style={{
            background: 'none',
            border: 'none',
            color: '#145351',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 12px',
            borderRadius: '8px',
          }}
        >
          Skip
        </button>
      </div>

      {/* Main Slide Content */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', flex: 1, justifyContent: 'center' }}>
        {slide.renderVisual()}

        <div>
          <h2
            className="text-heading-1"
            style={{
              color: '#111827',
              marginBottom: '10px',
              letterSpacing: '-0.01em',
            }}
          >
            {slide.headline}
          </h2>
          <p
            className="text-body-reg"
            style={{
              color: '#4B5563',
              lineHeight: '24px',
            }}
          >
            {slide.copy}
          </p>
        </div>
      </div>

      {/* Bottom Controls: 4-dot indicator + Primary CTA Button (48px height) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '20px' }}>
        {/* 4-dot Indicator (Current: 24px elongated pill in teal-900; inactive: 8px circle in neutral-300) */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          {slides.map((_, index) => {
            const isActive = index === currentSlide;
            return (
              <div
                key={index}
                onClick={() => setCurrentSlide(index)}
                style={{
                  height: '8px',
                  width: isActive ? '24px' : '8px',
                  borderRadius: '4px',
                  backgroundColor: isActive ? '#0E3B3A' : '#D1D5DB',
                  transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                  cursor: 'pointer',
                }}
              />
            );
          })}
        </div>

        <button
          type="button"
          onClick={handleNext}
          className="btn-primary"
          style={{
            height: '48px',
            minHeight: '48px',
          }}
        >
          {currentSlide === slides.length - 1 ? 'Get Started' : 'Next'}
          <ArrowRightIcon size={18} color="#FFFFFF" />
        </button>
      </div>
    </div>
  );
};
