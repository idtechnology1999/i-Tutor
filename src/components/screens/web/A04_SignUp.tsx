import React, { useMemo, useState } from 'react';
import {
  EyeIcon,
  EyeOffIcon,
  CheckIcon,
  AlertCircleIcon,
  UserIcon,
  SmartphoneIcon,
} from '../../Icons';
import {
  normalizeNigerianPhone,
  calculatePasswordStrength,
} from '../../../utils/phone';
import { AuthShell, DefaultAside, FormField } from './shared';

interface Props {
  onBack: () => void;
  onSubmit: (data: { fullName: string; phoneOrEmail: string; password: string }) => void;
  onSignInInstead: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
}

type Channel = 'sms' | 'email';

export const A04_SignUp: React.FC<Props> = ({
  onBack,
  onSubmit,
  onSignInInstead,
  isLoading = false,
  loadingMessage,
}) => {
  const [fullName, setFullName] = useState('');
  const [fullNameTouched, setFullNameTouched] = useState(false);

  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  const [password, setPassword] = useState('');
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [consent, setConsent] = useState(false);
  const [consentTouched, setConsentTouched] = useState(false);

  const [submitAttempted, setSubmitAttempted] = useState(false);

  const isNameValid = fullName.trim().split(/\s+/).filter(Boolean).length >= 2;
  const phoneValidation = normalizeNigerianPhone(phoneOrEmail);
  const strength = useMemo(
    () => calculatePasswordStrength(password),
    [password],
  );
  const isPasswordValid = password.length >= 8 && strength.checks.hasNumberOrSymbol;
  const isEmailChannel = phoneOrEmail.includes('@');

  const nameError =
    fullNameTouched && !isNameValid
      ? 'Enter your first and last name as it appears on your school records.'
      : '';

  const contactError =
    phoneTouched && !phoneValidation.isValid ? phoneValidation.errorMessage : '';

  const passwordError =
    passwordTouched && !isPasswordValid
      ? 'Use at least 8 characters, including a number or symbol.'
      : '';

  const consentError = consentTouched && !consent ? 'You need to accept the terms to continue.' : '';

  const isFormValid = isNameValid && phoneValidation.isValid && isPasswordValid && consent;

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setFullNameTouched(true);
    setPhoneTouched(true);
    setPasswordTouched(true);
    setConsentTouched(true);
    if (!isFormValid || isLoading) return;
    onSubmit({
      fullName: fullName.trim(),
      phoneOrEmail: phoneValidation.formatted || phoneOrEmail,
      password,
    });
  };

  const channel: Channel = isEmailChannel ? 'email' : 'sms';

  return (
    <AuthShell
      eyebrow="Create account"
      title="Create your candidate account"
      lede="Takes under a minute. We verify your phone or email before anything else, so no one else can register with your number."
      aside={
        <DefaultAside
          heading="Why we ask for this"
          body="i-Tutor keys your question bank, drill list and mock history to one candidate record. The contact detail is how we prove the account is yours."
          points={[
            'One-time code sent before the account opens',
            'No payment details required to start',
            'Export or delete your record at any time',
          ]}
          footnote={
            <>
              <strong>Passwords</strong><br />
              Hashed with a per-account salt. Never readable by us.<br /><br />
              <strong>Verification</strong><br />
              A one-time code confirms your phone or email before the account opens.<br /><br />
              <strong>Your data</strong><br />
              Study records stay on your device and in your own candidate portal.<br /><br />
              Already registered? Use your existing candidate login instead.
            </>
          }
        />
      }
      footer={
        <>
          <p>
            Already have an account?{' '}
            <button type="button" className="link-inline" onClick={onSignInInstead}>
              Log in
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
        {submitAttempted && !isFormValid ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>Check the highlighted fields and try again.</span>
          </div>
        ) : null}

        <FormField
          id="fullName"
          label="Full name"
          error={nameError}
          valid={fullNameTouched && isNameValid}
        >
          <div className="control">
            <UserIcon size={17} className="control__icon" />
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              onBlur={() => setFullNameTouched(true)}
              placeholder="Amina Chinedu"
              className={`control__input${nameError ? ' is-invalid' : fullNameTouched && isNameValid ? ' is-valid' : ''}`}
              autoComplete="name"
              aria-invalid={Boolean(nameError)}
              aria-describedby={nameError ? 'fullName-error' : undefined}
            />
          </div>
        </FormField>

        <FormField
          id="phoneOrEmail"
          label="Phone number or email"
          hint={isEmailChannel ? 'Code will be emailed' : 'Code will be sent by SMS'}
          error={contactError}
          valid={phoneTouched && phoneValidation.isValid}
        >
          <div className="control">
            <SmartphoneIcon size={17} className="control__icon" />
            <input
              id="phoneOrEmail"
              type="text"
              inputMode="tel"
              value={phoneOrEmail}
              onChange={(e) => setPhoneOrEmail(e.target.value)}
              onBlur={() => setPhoneTouched(true)}
              placeholder="0801 234 5678 or name@email.com"
              className={`control__input${contactError ? ' is-invalid' : phoneTouched && phoneValidation.isValid ? ' is-valid' : ''}`}
              autoComplete="tel"
              aria-invalid={Boolean(contactError)}
              aria-describedby={contactError ? 'phoneOrEmail-error' : undefined}
            />
            {phoneTouched && phoneValidation.isValid ? (
              <CheckIcon size={17} className="control__status is-ok" />
            ) : null}
          </div>
          {phoneTouched && phoneValidation.isValid ? (
            <p className="control__note">
              {isEmailChannel
                ? `We will email a 6-digit code to ${phoneOrEmail.trim()}.`
                : `We will text a 6-digit code to ${phoneValidation.formatted}.`}
            </p>
          ) : null}
        </FormField>

        <FormField
          id="password"
          label="Password"
          hint="8+ characters with a number or symbol"
          error={passwordError}
          valid={passwordTouched && isPasswordValid}
        >
          <div className="control">
            <input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onBlur={() => setPasswordTouched(true)}
              placeholder="Create a password"
              className={`control__input${passwordError ? ' is-invalid' : passwordTouched && isPasswordValid ? ' is-valid' : ''}`}
              autoComplete="new-password"
              aria-invalid={Boolean(passwordError)}
              aria-describedby={passwordError ? 'password-error' : undefined}
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
                <span className="meter__reqs">
                  <span className={password.length >= 8 ? 'is-met' : ''}>
                    {password.length >= 8 ? <CheckIcon size={11} /> : null}8+ chars
                  </span>
                  <span
                    className={strength.checks.hasNumberOrSymbol ? 'is-met' : ''}
                  >
                    {strength.checks.hasNumberOrSymbol ? (
                      <CheckIcon size={11} />
                    ) : null}
                    Number or symbol
                  </span>
                </span>
              </p>
            </div>
          ) : null}
        </FormField>

        <div className="consent">
          <label className="consent__box">
            <input
              type="checkbox"
              checked={consent}
              onChange={(e) => setConsent(e.target.checked)}
              onBlur={() => setConsentTouched(true)}
              aria-invalid={Boolean(consentError)}
              aria-describedby={consentError ? 'consent-error' : undefined}
            />
            <span className="consent__tick" aria-hidden="true">
              <CheckIcon size={13} />
            </span>
            <span className="consent__text">
              I accept the{' '}
              <a href="/terms" className="link-inline">
                terms of use
              </a>{' '}
              and{' '}
              <a href="/privacy" className="link-inline">
                privacy policy
              </a>
              , and consent to i-Tutor storing my study record.
            </span>
          </label>
          {consentError ? (
            <p className="form-field__error" id="consent-error" role="alert">
              {consentError}
            </p>
          ) : null}
        </div>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={isLoading}
        >
          {isLoading ? loadingMessage || 'Sending your code…' : 'Continue'}
        </button>

        <p className="auth__switch">
          {channel === 'sms' ? 'SMS' : 'Email'} verification follows on the next
          screen.
        </p>
      </form>
    </AuthShell>
  );
};

export default A04_SignUp;
