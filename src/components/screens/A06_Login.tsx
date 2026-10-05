import React, { useState } from 'react';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, FingerprintIcon, AlertTriangleIcon } from '../Icons';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
  onBiometricAuth: () => void;
}

export const A06_Login: React.FC<Props> = ({ onBack, onSuccess, onForgotPassword, onBiometricAuth }) => {
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLockedOut, setIsLockedOut] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLockedOut) return;

    // Simulate validation
    if (password === 'wrong') {
      const nextAttempts = failedAttempts + 1;
      setFailedAttempts(nextAttempts);
      if (nextAttempts >= 5) {
        setIsLockedOut(true);
      }
      return;
    }

    onSuccess();
  };

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
      {/* Top Bar: Back Button */}
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
          overflowY: 'auto',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '6px' }}>
            Welcome back
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Continue your daily streak toward 280+ JAMB score.
          </p>
        </div>

        {/* Security Lockout Warning after 5 attempts */}
        {isLockedOut && (
          <div
            style={{
              background: 'var(--red-50)',
              border: '1.5px solid var(--red-500)',
              borderRadius: '12px',
              padding: '14px',
              marginBottom: '20px',
              display: 'flex',
              gap: '12px',
            }}
          >
            <AlertTriangleIcon size={20} color="var(--red-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>
              <div style={{ fontSize: '14px', fontWeight: 600, color: 'var(--red-500)', marginBottom: '4px' }}>
                Account temporarily locked for 15 minutes
              </div>
              <p style={{ fontSize: '13px', color: '#991B1B', lineHeight: '18px' }}>
                Too many incorrect password attempts.{' '}
                <button
                  type="button"
                  onClick={onForgotPassword}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--red-500)',
                    fontWeight: 700,
                    cursor: 'pointer',
                    textDecoration: 'underline',
                  }}
                >
                  [Reset Password now]
                </button>
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Email or Phone */}
          <div className="form-input-group">
            <label className="form-label" htmlFor="login-identity">
              Phone Number or Email
            </label>
            <input
              id="login-identity"
              type="text"
              value={emailOrPhone}
              onChange={(e) => setEmailOrPhone(e.target.value)}
              placeholder="0801 234 5678 or name@email.com"
              className="form-input"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="form-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="login-password">
                Password
              </label>
              <button
                type="button"
                onClick={onForgotPassword}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--teal-700)',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Forgot Password?
              </button>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="form-input"
                style={{ width: '100%', paddingRight: '48px' }}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: 'absolute',
                  right: '4px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '10px',
                  color: 'var(--neutral-600)',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>
          </div>

          {/* Action Row: Primary Login + Biometric Button */}
          <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
            <button
              type="submit"
              disabled={isLockedOut || !password}
              className="btn-primary"
              style={{ flex: 1, minHeight: '48px', height: '48px' }}
            >
              Log In
            </button>

            {/* Biometric FaceID/Fingerprint button icon */}
            <button
              type="button"
              onClick={onBiometricAuth}
              className="btn-secondary"
              style={{
                width: '54px',
                minWidth: '54px',
                minHeight: '48px',
                height: '48px',
                padding: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
              title="Sign in with Fingerprint or FaceID"
            >
              <FingerprintIcon size={26} color="var(--teal-900)" />
            </button>
          </div>

          {/* Prototyping helpers */}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: '24px',
              borderTop: '1px solid var(--neutral-100)',
              display: 'flex',
              gap: '8px',
            }}
          >
            <button
              type="button"
              onClick={() => {
                setEmailOrPhone('0803 123 4567');
                setPassword('jambMaster2026!');
              }}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                borderRadius: '8px',
                background: 'var(--teal-50)',
                color: 'var(--teal-900)',
                border: '1px solid var(--teal-100)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Auto-fill Credentials
            </button>
            <button
              type="button"
              onClick={() => setIsLockedOut(!isLockedOut)}
              style={{
                flex: 1,
                padding: '8px',
                fontSize: '12px',
                borderRadius: '8px',
                background: isLockedOut ? 'var(--neutral-100)' : 'var(--amber-50)',
                color: isLockedOut ? 'var(--neutral-700)' : 'var(--amber-600)',
                border: '1px solid var(--amber-100)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              {isLockedOut ? 'Clear Lockout' : 'Simulate 5x Lockout'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
