import React, { useEffect } from 'react';
import { OwlBookLogo } from '../Icons';

interface Props {
  onCachedSession: () => void;
  onFirstTimeUser: () => void;
  autoAdvance?: boolean;
}

export const A01_Splash: React.FC<Props> = ({ onCachedSession, onFirstTimeUser, autoAdvance = true }) => {
  useEffect(() => {
    if (!autoAdvance) return;
    const timer = setTimeout(() => {
      onFirstTimeUser();
    }, 1200);
    return () => clearTimeout(timer);
  }, [autoAdvance, onFirstTimeUser]);

  return (
    <div
      style={{
        flex: 1,
        background: 'linear-gradient(180deg, #0E3B3A 0%, #0A2726 100%)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '60px 24px 40px',
        color: '#FFFFFF',
        position: 'relative',
        height: '100%',
      }}
    >
      {/* Decorative ambient glow */}
      <div
        style={{
          position: 'absolute',
          top: '30%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(153, 246, 228, 0.15) 0%, rgba(14, 59, 58, 0) 70%)',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      />

      <div style={{ flex: 1 }} />

      {/* Centered Minimalist Owl/Book Icon with Emerald Spark */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
          zIndex: 2,
        }}
      >
        <div
          style={{
            width: '96px',
            height: '96px',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.08)',
            border: '1.5px solid rgba(153, 246, 228, 0.25)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <OwlBookLogo size={64} showSpark={true} />
        </div>

        <div>
          <h1
            className="text-display-1"
            style={{
              color: '#FFFFFF',
              letterSpacing: '-0.02em',
              marginBottom: '6px',
            }}
          >
            i-Tutor
          </h1>
          <p
            style={{
              color: '#99F6E4',
              fontSize: '14px',
              fontWeight: 400,
              maxWidth: '260px',
              lineHeight: '20px',
            }}
          >
            Your personal AI teacher for exam success.
          </p>
        </div>
      </div>

      <div style={{ flex: 1 }} />

      {/* Bottom Area: 3-Dot Pulse Feedback + Interactive routing test buttons */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '20px',
          width: '100%',
          zIndex: 2,
        }}
      >
        <div className="dot-pulse-container" style={{ minHeight: '24px' }}>
          <div className="dot-pulse-item" />
          <div className="dot-pulse-item" />
          <div className="dot-pulse-item" />
        </div>

        <div
          style={{
            display: 'flex',
            gap: '8px',
            width: '100%',
            maxWidth: '300px',
          }}
        >
          <button
            type="button"
            onClick={onFirstTimeUser}
            className="btn-secondary"
            style={{
              flex: 1,
              minHeight: '40px',
              height: '40px',
              fontSize: '13px',
              background: 'rgba(255, 255, 255, 0.1)',
              borderColor: 'rgba(255, 255, 255, 0.2)',
              color: '#FFFFFF',
            }}
          >
            First-Time User
          </button>
          <button
            type="button"
            onClick={onCachedSession}
            className="btn-primary"
            style={{
              flex: 1,
              minHeight: '40px',
              height: '40px',
              fontSize: '13px',
              background: '#059669',
              boxShadow: 'none',
            }}
          >
            Cached Session
          </button>
        </div>
      </div>
    </div>
  );
};
