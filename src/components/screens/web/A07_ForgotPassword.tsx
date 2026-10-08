import React, { useState } from 'react';
import { requestPasswordReset } from '../../../services/auth';
import { CheckIcon, SendIcon, AlertCircleIcon, ShieldCheckIcon } from '../../Icons';
import { normalizeNigerianPhone } from '../../../utils/phone';
import { AuthShell, FormField, TrustList } from './shared';

interface Props {
  onBack: () => void;
  onSendCode: (destination: string) => void;
  onConfirm: () => void;
}

type Phase = 'form' | 'sent';

export const A07_ForgotPassword: React.FC<Props> = ({
  onBack,
  onSendCode,
  onConfirm,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [sending, setSending] = useState(false);
  const [phase, setPhase] = useState<Phase>('form');
  const [destination, setDestination] = useState('');
  const [serverError, setServerError] = useState('');

  const validation = normalizeNigerianPhone(identifier);
  const error =
    touched && !validation.isValid
      ? 'Enter the phone number or email on your account.'
      : '';

  const isEmail = identifier.includes('@');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    setSubmitAttempted(true);
    setTouched(true);
    if (!validation.isValid || sending) return;

    const value = validation.formatted || identifier.trim();
    setSending(true);
    setServerError('');
    requestPasswordReset(value)
      .then(() => {
        setDestination(value);
        setPhase('sent');
        onSendCode(value);
      })
      .catch((err: Error) => setServerError(err.message))
      .finally(() => setSending(false));
  };

  if (phase === 'sent') {
    return (
      <AuthShell
        eyebrow="Recovery"
        title="Check your messages"
        lede={`If an account exists for ${destination}, a reset code is on its way.`}
        narrow
        aside={
          <div className="auth__panel">
            <h2 className="auth__panel-title">For your security</h2>
            <p className="auth__panel-body">
              We send the same confirmation whether or not the account exists,
              so this page cannot be used to discover who has registered.
            </p>
            <TrustList
              items={[
                'The code expires in 10 minutes',
                'Only one reset is active at a time',
                'Your password is never emailed to you',
              ]}
            />
          </div>
        }
        footer={
          <button
            type="button"
            className="link-inline"
            onClick={() => {
              setPhase('form');
              setSubmitAttempted(false);
            }}
          >
            Use a different number or email
          </button>
        }
      >
        <div className="confirm">
          <span className="confirm__badge">
            <ShieldCheckIcon size={26} />
          </span>
          <p className="confirm__text">
            {isEmail
              ? 'If that address is registered, a 6-digit reset code is in your inbox.'
              : 'If that number is registered, a 6-digit reset code is on its way by SMS.'}
          </p>
          <button
            type="button"
            className="btn btn--primary btn--block"
            onClick={onConfirm}
          >
            Enter the reset code
          </button>
        </div>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      eyebrow="Recovery"
      title="Reset your password"
      lede="Tell us the phone number or email on the account and we will send a reset code."
      narrow
      aside={
        <div className="auth__panel">
          <h2 className="auth__panel-title">Account recovery</h2>
          <p className="auth__panel-body">
            Resetting does not affect your study record. Your diagnostic results,
            mastery matrix and mock history stay exactly as they are.
          </p>
          <TrustList
            items={[
              'One code at a time per account',
              'Codes expire after 10 minutes',
              'You will set a new password, not recover the old one',
            ]}
          />
        </div>
      }
      footer={
        <button type="button" className="link-inline" onClick={onBack}>
          Back to log in
        </button>
      }
    >
      <form className="auth__form" onSubmit={handleSubmit} noValidate>
        {serverError ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>{serverError}</span>
          </div>
        ) : null}
        {submitAttempted && !validation.isValid ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>Enter a valid Nigerian phone number or an email address.</span>
          </div>
        ) : null}

        <FormField
          id="recoveryIdentifier"
          label="Phone number or email"
          error={error}
          valid={touched && validation.isValid}
        >
          <div className="control">
            <input
              id="recoveryIdentifier"
              type="text"
              inputMode="email"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              onBlur={() => setTouched(true)}
              placeholder="0801 234 5678 or name@email.com"
              className={`control__input${error ? ' is-invalid' : touched && validation.isValid ? ' is-valid' : ''}`}
              autoComplete="username"
              aria-invalid={Boolean(error)}
              aria-describedby={error ? 'recoveryIdentifier-error' : undefined}
            />
            {touched && validation.isValid ? (
              <CheckIcon size={17} className="control__status is-ok" />
            ) : null}
          </div>
        </FormField>

        <button
          type="submit"
          className="btn btn--primary btn--block"
          disabled={sending}
        >
          <SendIcon size={16} />
          {sending ? 'Sending code…' : 'Send reset code'}
        </button>
      </form>
    </AuthShell>
  );
};

export default A07_ForgotPassword;
