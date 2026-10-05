import React, { useState } from 'react';
import { ArrowLeftIcon, EyeIcon, EyeOffIcon, CheckCircleIcon, CheckIcon } from '../Icons';
import { normalizeNigerianPhone, calculatePasswordStrength } from '../../utils/phone';

interface Props {
  onBack: () => void;
  onSubmit: (data: { fullName: string; phoneOrEmail: string }) => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

export const A04_SignUp: React.FC<Props> = ({ onBack, onSubmit, isLoading = false, loadingMessage }) => {
  const [fullName, setFullName] = useState('');
  const [fullNameTouched, setFullNameTouched] = useState(false);

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Validation logic
  const isNameValid = fullName.trim().length >= 3;
  const phoneValidation = normalizeNigerianPhone(phoneOrEmail);
  const passwordStrength = calculatePasswordStrength(password);
  const isPasswordValid = passwordStrength.checks.length && passwordStrength.checks.hasNumberOrSymbol;

  const isFormValid = isNameValid && phoneValidation.isValid && isPasswordValid;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isFormValid || isLoading) return;
    onSubmit({
      fullName: fullName.trim(),
      phoneOrEmail: phoneValidation.formatted || phoneOrEmail,
    });
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
      {/* Top Bar: Back Arrow (48 × 48px tap target) */}
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
          overflowY: 'auto',
          padding: '8px 24px 24px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Headline & Subhead */}
        <div style={{ marginBottom: '28px' }}>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '6px' }}>
            Create your account
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Takes less than 30 seconds.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {/* Full Name */}
          <div className="form-input-group">
            <label className="form-label" htmlFor="fullName">
              Full Name
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onBlur={() => setFullNameTouched(true)}
                placeholder="e.g., Amina Chinedu"
                className={`form-input ${
                  fullNameTouched ? (isNameValid ? 'is-valid' : 'is-invalid') : ''
                }`}
                style={{ width: '100%', paddingRight: '40px' }}
                autoComplete="name"
              />
              {fullNameTouched && isNameValid && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <CheckIcon size={18} color="var(--green-600)" />
                </div>
              )}
            </div>
            {fullNameTouched && !isNameValid && (
              <span className="form-helper-error">Please enter at least your first & last name</span>
            )}
          </div>

          {/* Phone Number or Email */}
          <div className="form-input-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label className="form-label" htmlFor="phoneOrEmail">
                Phone Number or Email
              </label>
              <span style={{ fontSize: '12px', color: 'var(--neutral-600)' }}>Nigerian (080...) or email</span>
            </div>
            <div style={{ position: 'relative' }}>
              <input
                id="phoneOrEmail"
                type="text"
                value={phoneOrEmail}
                onChange={(e) => setPhoneOrEmail(e.target.value)}
                onBlur={() => setPhoneTouched(true)}
                placeholder="0801 234 5678 or name@email.com"
                className={`form-input ${
                  phoneTouched ? (phoneValidation.isValid ? 'is-valid' : 'is-invalid') : ''
                }`}
                style={{ width: '100%', paddingRight: '40px' }}
                autoComplete="tel email"
              />
              {phoneTouched && phoneValidation.isValid && (
                <div style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)' }}>
                  <CheckIcon size={18} color="var(--green-600)" />
                </div>
              )}
            </div>
            {phoneTouched && !phoneValidation.isValid && (
              <span className="form-helper-error">{phoneValidation.errorMessage}</span>
            )}
            {phoneTouched && phoneValidation.isValid && !phoneOrEmail.includes('@') && (
              <span className="form-helper-valid">
                <CheckCircleIcon size={13} color="var(--green-600)" /> Normalized to {phoneValidation.formatted}
              </span>
            )}
          </div>

          {/* Password with Eye Toggle & 4-Bar Strength Meter */}
          <div className="form-input-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <div style={{ position: 'relative' }}>
              <input
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onBlur={() => setPasswordTouched(true)}
                placeholder="Create a secure password"
                className={`form-input ${
                  passwordTouched ? (isPasswordValid ? 'is-valid' : 'is-invalid') : ''
                }`}
                style={{ width: '100%', paddingRight: '48px' }}
                autoComplete="new-password"
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
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOffIcon size={20} /> : <EyeIcon size={20} />}
              </button>
            </div>

            {/* 4-Bar Dynamic Password Meter */}
            <div style={{ marginTop: '8px' }}>
              <div style={{ display: 'flex', gap: '6px', height: '4px', marginBottom: '6px' }}>
                {[1, 2, 3, 4].map((bar) => {
                  const isFilled = password.length > 0 && passwordStrength.score >= bar;
                  return (
                    <div
                      key={bar}
                      style={{
                        flex: 1,
                        borderRadius: '2px',
                        backgroundColor: isFilled ? passwordStrength.color : 'var(--neutral-200)',
                        transition: 'background-color 0.2s ease',
                      }}
                    />
                  );
                })}
              </div>

              {password.length > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: passwordStrength.color }}>
                    Strength: {passwordStrength.label}
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--neutral-600)' }}>
                    {passwordStrength.checks.length ? '✓ 8+ chars' : 'Min 8 chars'} ·{' '}
                    {passwordStrength.checks.hasNumberOrSymbol ? '✓ Num/Symbol' : 'Need number or symbol'}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div style={{ flex: 1 }} />

          {/* Sticky Bottom CTA */}
          <div style={{ paddingTop: '16px', borderTop: '1px solid var(--neutral-100)' }}>
            <button
              type="submit"
              disabled={!isFormValid || isLoading}
              className="btn-primary"
              style={{ minHeight: '48px', height: '48px' }}
            >
              {isLoading ? (
                <span>{loadingMessage || 'Connecting to JAMB servers...'}</span>
              ) : (
                'Create Account'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
