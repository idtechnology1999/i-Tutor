import React, { useMemo, useState } from 'react';
import {
  Eye as EyeIcon,
  EyeOff as EyeOffIcon,
  Check as CheckIcon,
  CircleAlert as AlertCircleIcon,
  UserRound as UserIcon,
  AtSign as SmartphoneIcon,
} from 'lucide-react';
import {
  normalizeNigerianPhone,
  calculatePasswordStrength,
} from '../../../utils/phone';
import { AuthShell, FormField, PhotoAside } from './shared';

interface Props {
  onBack: () => void;
  onSubmit: (data: { fullName: string; phoneOrEmail: string; password: string }) => void;
  onSignInInstead: () => void;
  isLoading?: boolean;
  loadingMessage?: string;
  /** Message from the server when sign-up fails. */
  serverError?: string;
}

type Channel = 'sms' | 'email';

export const A04_SignUp: React.FC<Props> = ({
  onBack,
  onSubmit,
  onSignInInstead,
  isLoading = false,
  loadingMessage,
  serverError,
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
  // Bumped on each failed submit; the form replays its shake animation.
  const [shakeCount, setShakeCount] = useState(0);

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
    if (!isFormValid) setShakeCount((n) => n + 1);
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
      photo
      eyebrow="Free to start · No card needed"
      title="Create your account"
      lede="Takes under a minute. We’ll send a one-time code to confirm it’s really you."
      aside={
        <PhotoAside
          src="/images/students-at-terminals.jpg"
          alt="Secondary-school students in white uniforms working at computers in a CBT lab"
          caption="Practise on a screen that feels like the real CBT hall — then learn from every question you miss."
          stats={[
            { value: '2,400+', label: 'verified past questions' },
            { value: '4', label: 'UTME subjects live' },
            { value: 'Offline', label: 'once downloaded' },
          ]}
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
              Back to i-Tutor home
            </button>
          </p>
        </>
      }
    >
      <form
        className={`auth__form${shakeCount % 2 ? ' is-shake-a' : shakeCount ? ' is-shake-b' : ''}`}
        onSubmit={handleSubmit}
        noValidate
      >
        {serverError ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>{serverError}</span>
          </div>
        ) : null}
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
          {isLoading ? loadingMessage || 'Sending your code…' : 'Create account'}
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
