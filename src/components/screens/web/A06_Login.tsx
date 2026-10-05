import React, { useState } from 'react';
import {
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  AlertCircleIcon,
  FingerprintIcon,
  LockIcon,
} from '../../Icons';
import { normalizeNigerianPhone } from '../../../utils/phone';
import { AuthShell, DefaultAside, FormField } from './shared';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onForgotPassword: () => void;
  onSignUpInstead: () => void;
  onBiometricAuth: () => void;
}

const MAX_ATTEMPTS = 5;

export const A06_Login: React.FC<Props> = ({
  onBack,
  onSuccess,
  onForgotPassword,
  onSignUpInstead,
  onBiometricAuth,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [identifierTouched, setIdentifierTouched] = useState(false);
  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const validation = normalizeNigerianPhone(identifier);
  const identifierError =
    identifierTouched && !validation.isValid
      ? 'Enter the phone number or email you registered with.'
      : '';

  const passwordError =
    passwordTouched && password.length === 0 ? 'Enter your password.' : '';

  const isLocked = attempts >= MAX_ATTEMPTS;
  const isFormValid = validation.isValid && password.length > 0 && !isLocked;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setIdentifierTouched(true);
    setPasswordTouched(true);
    if (!isFormValid || submitting) return;

    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      // Placeholder: no credential check yet, so the happy path always passes.
      onSuccess();
    }, 650);
  };

  const failAttempt = () => {
    const next = attempts + 1;
    setAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      setPassword('');
      setPasswordTouched(false);
    }
  };

  return (
    <AuthShell
      eyebrow="Welcome back"
      title="Log in to your candidate account"
      lede="Pick up your diagnostic, your drill list and your mock history where you left off."
      aside={
        <DefaultAside
          heading="Returning candidate"
          body="Your study record is tied to this login, so your mastery matrix and past mock scores travel with you across devices."
          points={[
            'Diagnostic results restored automatically',
            'Mock papers remain available offline',
            'No re-verification needed on this device',
          ]}
          footnote="New here? Registration takes under a minute and needs no card details."
        />
      }
      footer={
        <>
          <p>
            No account yet?{' '}
            <button type="button" className="link-inline" onClick={onSignUpInstead}>
              Create one
            </button>
          </p>
          <p className="auth__foot-back">
            <button type="button" className="link-inline" onClick={onBack}>
              Back to the i-Tutor overview
            </button>
          </p>
        </>
      }
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {isLocked ? (
          <div className="form-banner is-error" role="alert">
            <LockIcon size={16} />
            <span>
              Too many failed attempts. This account is locked for 15 minutes,
              or reset your password to get back in now.
            </span>
          </div>
        ) : submitAttempted && !isFormValid ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>Check the highlighted fields and try again.</span>
          </div>
        ) : null}

        {attempts > 0 && !isLocked ? (
          <p className="auth__warning">
            <AlertCircleIcon size={14} />
            {MAX_ATTEMPTS - attempts} attempt{MAX_ATTEMPTS - attempts === 1 ? '' : 's'} left before
            this account locks.
          </p>
        ) : null}

        <FormField
          id="identifier"
          label="Phone number or email"
          error={identifierError}
          valid={identifierTouched && validation.isValid}
        >
          <div className="control">
            <input
              id="identifier"
              type="text"
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onBlur={() => setIdentifierTouched(true)}
              placeholder="0801 234 5678 or name@email.com"
              className={`control__input${identifierError ? ' is-invalid' : identifierTouched && validation.isValid ? ' is-valid' : ''}`}
              autoComplete="username"
              aria-invalid={Boolean(identifierError)}
              aria-describedby={identifierError ? 'identifier-error' : undefined}
            />
            {identifierTouched && validation.isValid ? (
              <CheckIcon size={17} className="control__status is-ok" />
            ) : null}
          </div>
        </FormField>

        <FormField
          id="loginPassword"
          label="Password"
          error={passwordError}
          valid={passwordTouched && password.length > 0}
        >
          <div className="control">
            <input
              id="loginPassword"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isFormValid) {
                  e.preventDefault();
                  failAttempt();
                }
              }}
              placeholder="Your password"
              className={`control__input${passwordError ? ' is-invalid' : ''}`}
              autoComplete="current-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'loginPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="control__toggle"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </FormField>

        <div className="auth__row">
          <label className="consent__box consent__box--tight">
            <input type="checkbox" defaultChecked />
            <span className="consent__tick" aria-hidden="true">
              <CheckIcon size={13} />
            </span>
            <span className="consent__text">Keep me logged in</span>
          </label>
          <button
            type="button"
            className="link-inline"
            onClick={onForgotPassword}
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={isLocked || submitting}
        >
          {submitting ? 'Logging in…' : 'Log in'}
        </button>

        <button
          type="button"
          className="btn btn--outline btn--block"
          onClick={onBiometricAuth}
        >
          <FingerprintIcon size={17} />
          Use fingerprint or face unlock
        </button>
      </form>
    </AuthShell>
  );
};

export default A06_Login;
