import React, { useMemo, useState } from 'react';
import {
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  AlertCircleIcon,
  ShieldCheckIcon,
} from '../../Icons';
import { calculatePasswordStrength } from '../../../utils/phone';
import { AuthShell, FormField, TrustList } from './shared';

interface Props {
  onBack: () => void;
  onSuccess: () => void;
  onGoToLogin: () => void;
}

const RULES: { id: string; label: string; test: (value: string) => boolean }[] = [
  { id: 'length', label: 'At least 8 characters', test: (v) => v.length >= 8 },
  { id: 'case', label: 'One uppercase letter', test: (v) => /[A-Z]/.test(v) },
  { id: 'number', label: 'One number', test: (v) => /\d/.test(v) },
  {
    id: 'symbol',
    label: 'One symbol or space',
    test: (v) => /[^A-Za-z0-9]/.test(v),
  },
];

export const A08_ResetPassword: React.FC<Props> = ({
  onBack,
  onSuccess,
  onGoToLogin,
}) => {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touched, setTouched] = useState({ password: false, confirm: false });
  const [show, setShow] = useState({ password: false, confirm: false });
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const strength = useMemo(() => calculatePasswordStrength(password), [password]);

  const met = RULES.map((rule) => ({ ...rule, passed: rule.test(password) }));
  const allPassed = met.every((rule) => rule.passed);

  const passwordError =
    touched.password && !allPassed
      ? 'Your password does not meet all four requirements yet.'
      : '';

  const mismatch = touched.confirm && confirm.length > 0 && confirm !== password;
  const confirmError = mismatch
    ? 'The two passwords do not match.'
    : touched.confirm && confirm.length === 0
      ? 'Type the password once more to confirm.'
      : '';

  const isFormValid = allPassed && confirm.length > 0 && confirm === password;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouched({ password: true, confirm: true });
    if (!isFormValid || saving) return;

    setSaving(true);
    window.setTimeout(() => {
      setSaving(false);
      setDone(true);
      onSuccess();
    }, 800);
  };

  if (done) {
    return (
      <AuthShell
        eyebrow="Password updated"
        title="Your password has been changed"
        lede="For your security, every other session on this account has been signed out."
        narrow
        aside={
          <div className="auth__panel">
            <h2 className="auth__panel-title">What happens next</h2>
            <p className="auth__panel-body">
              Sign in again with the password you just set. Your study record is
              untouched, so you will land back on your diagnostic and drill list.
            </p>
            <TrustList
              items={[
                'Other devices have been signed out',
                'Your mock history is preserved',
                'Use the new password everywhere you sign in',
              ]}
            />
          </div>
        }
      >
        <div className="confirm">
          <span className="confirm__badge">
            <ShieldCheckIcon size={26} />
          </span>
          <p className="confirm__text">
            Password saved. You can sign in with it now.
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={onGoToLogin}
          >
            Go to log in
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Set a new password"
      lede="Choose something you have not used on i-Tutor before. You will use it every time you sign in."
      narrow
      aside={
        <div className="auth__panel">
          <h2 className="auth__panel-title">A stronger password</h2>
          <p className="auth__panel-body">
            Four requirements, no symbols you will forget. A short phrase of
            unrelated words is easier to recall and harder to guess than
            P@ssw0rd1.
          </p>
          <TrustList
            items={[
              'Never reuse your email or phone password',
              'We store a salted hash, not the password',
              'You can change it again at any time',
            ]}
          />
        </div>
      }
      footer={
        <button type="button" className="link-inline" onClick={onBack}>
          Back
        </button>
      }
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {submitAttempted && !isFormValid ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>Fix the highlighted fields and try again.</span>
          </div>
        ) : null}

        <FormField
          id="newPassword"
          label="New password"
          error={passwordError}
          valid={touched.password && allPassed}
        >
          <div className="control">
            <input
              id="newPassword"
              type={show.password ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, password: true }))}
              placeholder="At least 8 characters"
              className={`control__input${passwordError ? ' is-invalid' : touched.password && allPassed ? ' is-valid' : ''}`}
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'newPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, password: !s.password }))}
              className="control__toggle"
              aria-label={show.password ? 'Hide password' : 'Show password'}
            >
              {show.password ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>

          {password.length > 0 ? (
            <div className="meter">
              <div className="meter__bars">
                {[1, 2, 3, 4].map((bar) => (
                  <i
                    key={bar}
                    className={strength.score >= bar ? 'is-on' : ''}
                    style={
                      strength.score >= bar
                        ? { background: strength.color }
                        : undefined
                    }
                  />
                ))}
              </div>
              <p className="meter__label">
                <span style={{ color: strength.color, fontWeight: 600 }}>
                  {strength.label}
                </span>
              </p>
            </div>
          ) : null}
        </FormField>

        <ul className="rules">
          {met.map((rule) => (
            <li key={rule.id} className={rule.passed ? 'is-met' : ''}>
              <span className="rules__mark">
                {rule.passed ? <CheckIcon size={12} /> : null}
              </span>
              {rule.label}
            </li>
          ))}
        </ul>

        <FormField
          id="confirmPassword"
          label="Confirm new password"
          error={confirmError}
          valid={touched.confirm && confirm.length > 0 && !mismatch}
        >
          <div className="control">
            <input
              id="confirmPassword"
              type={show.confirm ? 'text' : 'password'}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
              placeholder="Type it once more"
              className={`control__input${confirmError ? ' is-invalid' : touched.confirm && confirm.length > 0 && !mismatch ? ' is-valid' : ''}`}
              autoComplete="new-password"
              aria-invalid={Boolean(confirmError)}
              aria-describedby={confirmError ? 'confirmPassword-error' : undefined}
            />
            <button
              type="button"
              onClick={() => setShow((s) => ({ ...s, confirm: !s.confirm }))}
              className="control__toggle"
              aria-label={show.confirm ? 'Hide password' : 'Show password'}
            >
              {show.confirm ? <EyeOffIcon size={18} /> : <EyeIcon size={18} />}
            </button>
          </div>
        </FormField>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={saving}
        >
          {saving ? 'Saving…' : 'Save new password'}
        </button>
      </form>
    </AuthShell>
  );
};

export default A08_ResetPassword;
