import React from 'react';
import { OwlBookLogo, GoogleLogo, SparklesIcon, ShieldCheckIcon } from '../Icons';

interface Props {
  onCreateAccount: () => void;
  onLogin: () => void;
  onGoogleAuth: () => void;
}

export const A03_Welcome: React.FC<Props> = ({ onCreateAccount, onLogin, onGoogleAuth }) => {
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
      }}
    >
      <div style={{ flex: 1 }} />

      {/* Header & Hero Brand Identity */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: '20px',
        }}
      >
        {/* 40px i-Tutor Badge */}
        <div
          style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: 'var(--teal-50)',
            border: '1.5px solid var(--teal-100)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <OwlBookLogo size={42} showSpark={true} />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span className="badge-pill badge-amber">
            <SparklesIcon size={13} color="#D97706" />
            AI-POWERED PREPARATION
          </span>
          <span className="badge-pill badge-verified">
            <ShieldCheckIcon size={13} color="#059669" />
            JAMB SYLLABUS
          </span>
        </div>

        <div>
          <h1
            className="text-display-1"
            style={{
              color: 'var(--neutral-900)',
              fontSize: '26px',
              lineHeight: '34px',
              marginBottom: '10px',
            }}
          >
            Your JAMB preparation just became personal.
          </h1>
          <p
            className="text-body-reg"
            style={{
              color: 'var(--neutral-600)',
              maxWidth: '320px',
              margin: '0 auto',
            }}
          >
            Join over 100,000 students scoring 280+ with AI-guided practice.
          </p>
        </div>
      </div>

      <div style={{ flex: 1.2 }} />

      {/* Button Architecture */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', width: '100%' }}>
        {/* Primary CTA (48px): Create Free Account */}
        <button
          type="button"
          onClick={onCreateAccount}
          className="btn-primary"
          style={{ minHeight: '48px', height: '48px' }}
        >
          Create Free Account
        </button>

        {/* Secondary CTA (48px): Log In */}
        <button
          type="button"
          onClick={onLogin}
          className="btn-secondary"
          style={{ minHeight: '48px', height: '48px' }}
        >
          Log In
        </button>

        {/* Social Authentication: "Or continue with" divider */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            margin: '6px 0',
          }}
        >
          <div style={{ flex: 1, height: '1px', background: 'var(--neutral-200)' }} />
          <span style={{ fontSize: '13px', color: 'var(--neutral-400)', fontWeight: 500 }}>
            Or continue with
          </span>
          <div style={{ flex: 1, height: '1px', background: 'var(--neutral-200)' }} />
        </div>

        {/* Google Auth Pill Button */}
        <button
          type="button"
          onClick={onGoogleAuth}
          className="btn-google"
          style={{ minHeight: '48px', height: '48px' }}
        >
          <GoogleLogo size={20} />
          Continue with Google
        </button>

        {/* Footer Legal Text (12px) */}
        <p
          className="text-micro"
          style={{
            textAlign: 'center',
            color: 'var(--neutral-400)',
            textTransform: 'none',
            fontSize: '12px',
            lineHeight: '16px',
            marginTop: '8px',
          }}
        >
          By proceeding, you agree to our{' '}
          <a href="#terms" style={{ color: 'var(--teal-700)', textDecoration: 'underline' }}>
            Terms of Service
          </a>{' '}
          &{' '}
          <a href="#privacy" style={{ color: 'var(--teal-700)', textDecoration: 'underline' }}>
            Privacy Policy
          </a>
          .
        </p>
      </div>
    </div>
  );
};
