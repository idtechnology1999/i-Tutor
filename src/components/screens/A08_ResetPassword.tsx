import React, { useState } from 'react';
import { ArrowLeftIcon, CheckIcon, CheckCircleIcon } from '../Icons';
import { calculatePasswordStrength } from '../../utils/phone';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
}

export const A08_ResetPassword: React.FC<Props> = ({ onBack, onSuccess }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const strength = calculatePasswordStrength(password);
  const hasMinLength = password.length >= 8;
  const hasNumberOrSymbol = strength.checks.hasNumberOrSymbol;
  const isMatching = password === confirmPassword && confirmPassword.length > 0;
  const canSubmit = hasMinLength && hasNumberOrSymbol && isMatching;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || isSubmitting) return;

    setIsSubmitting(true);
    setShowSuccessToast(true);

    setTimeout(() => {
      onSuccess();
    }, 1200);
  };

  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '8px 16px',
          minHeight: '48px',
        }}
      >
        <button
          type="button"
          onClick={onBack}
          className="btn-icon-touch"
          aria-label="Go back"
        >
          <ArrowLeftIcon size={22} color="var(--neutral-900)" />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: '8px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '8px' }}>
            Set new password
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Choose a strong password to protect your study profile and progress.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="form-input-group">
            <label className="form-label" htmlFor="new-password">
              New Password
            </label>
            <input
              id="new-password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter new password"
              className="form-input"
              required
            />
          </div>

          <div className="form-input-group">
            <label className="form-label" htmlFor="confirm-password">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Re-enter password"
              className={`form-input ${
                confirmPassword ? (isMatching ? 'is-valid' : 'is-invalid') : ''
              }`}
              required
            />
            {confirmPassword && !isMatching && (
              <span className="form-helper-error">Passwords do not match</span>
            )}
          </div>

          {/* Live Requirements Checklist */}
          <div
            style={{
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: '12px',
              padding: '14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              marginTop: '4px',
            }}
          >
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--neutral-900)' }}>
              Password Requirements:
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: hasMinLength ? 'var(--green-600)' : 'var(--neutral-300)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <CheckIcon size={12} />
              </div>
              <span style={{ color: hasMinLength ? 'var(--neutral-900)' : 'var(--neutral-600)' }}>
                At least 8 characters
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
              <div
                style={{
                  width: '18px',
                  height: '18px',
                  borderRadius: '50%',
                  background: hasNumberOrSymbol ? 'var(--green-600)' : 'var(--neutral-300)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#FFFFFF',
                }}
              >
                <CheckIcon size={12} />
              </div>
              <span style={{ color: hasNumberOrSymbol ? 'var(--neutral-900)' : 'var(--neutral-600)' }}>
                Contains a number or symbol
              </span>
            </div>
          </div>

          <div style={{ flex: 1 }} />

          <button
            type="submit"
            disabled={!canSubmit || isSubmitting}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            {isSubmitting ? 'Updating Password...' : 'Reset & Log In'}
          </button>
        </form>
      </div>

      {/* Success Toast Modal */}
      {showSuccessToast && (
        <div
          style={{
            position: 'absolute',
            bottom: '24px',
            left: '20px',
            right: '20px',
            background: 'var(--teal-900)',
            color: '#FFFFFF',
            padding: '16px',
            borderRadius: '14px',
            boxShadow: 'var(--shadow-float)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            zIndex: 100,
            animation: 'slideUp 0.3s ease-out',
          }}
        >
          <CheckCircleIcon size={24} color="#99F6E4" />
          <div>
            <div style={{ fontWeight: 600, fontSize: '14px' }}>Password updated successfully</div>
            <div style={{ fontSize: '12px', color: '#99F6E4' }}>Logging you into your account...</div>
          </div>
        </div>
      )}
    </div>
  );
};
