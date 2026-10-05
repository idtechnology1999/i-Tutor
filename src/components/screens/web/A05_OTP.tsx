import React, { useEffect, useRef, useState } from 'react';
import { AlertCircleIcon, RefreshCwIcon } from '../../Icons';
import { AuthShell, TrustList } from './shared';

interface Props {
  phoneOrEmail: string;
  onChangeNumber: () => void;
  onVerified: () => void;
  /** Simulated network conditions so the error states are reachable in review. */
  forcedState?: 'idle' | 'wrong' | 'expired';
}

const CODE_LENGTH = 6;
const RESEND_SECONDS = 30;

const maskDestination = (value: string) => {
  const trimmed = value.trim();
  if (trimmed.includes('@')) {
    const [name, domain] = trimmed.split('@');
    const head = name.slice(0, 2);
    return `${head}${'•'.repeat(Math.max(name.length - 2, 2))}@${domain}`;
  }
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return trimmed;
  return `${digits.slice(0, 4)} ••• ${digits.slice(-3)}`;
};

export const A05_OTP: React.FC<Props> = ({
  phoneOrEmail,
  onChangeNumber,
  onVerified,
  forcedState = 'idle',
}) => {
  const [digits, setDigits] = useState<string[]>(() => Array(CODE_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(RESEND_SECONDS);
  const [attempts, setAttempts] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const inputs = useRef<Array<HTMLInputElement | null>>([]);

  const isEmail = phoneOrEmail.includes('@');
  const code = digits.join('');
  const isComplete = code.length === CODE_LENGTH;

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  // Derived, not stored: the demo switch drives the message so changing it
  // never needs a synchronising effect.
  const forcedError =
    forcedState === 'wrong'
      ? 'That code does not match. Check the digits and try again.'
      : forcedState === 'expired'
        ? 'This code has expired. Request a new one to continue.'
        : null;

  const activeError = error ?? forcedError;

  const setDigit = (index: number, value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (!cleaned) {
      setDigits((prev) => prev.map((d, i) => (i === index ? '' : d)));
      return;
    }
    // Paste or fast typing can deliver several digits at once.
    const next = [...digits];
    for (let offset = 0; offset < cleaned.length; offset += 1) {
      const target = index + offset;
      if (target >= CODE_LENGTH) break;
      next[target] = cleaned[offset];
    }
    setDigits(next);
    setError(null);
    const focusAt = Math.min(index + cleaned.length, CODE_LENGTH - 1);
    inputs.current[focusAt]?.focus();
  };

  const handleKeyDown = (index: number, event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace' && !digits[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowLeft' && index > 0) {
      inputs.current[index - 1]?.focus();
    }
    if (event.key === 'ArrowRight' && index < CODE_LENGTH - 1) {
      inputs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (event: React.ClipboardEvent) => {
    const text = event.clipboardData.getData('text').replace(/\D/g, '');
    if (!text) return;
    event.preventDefault();
    setDigit(0, text);
  };

  const verify = () => {
    if (!isComplete || submitting) return;
    setSubmitting(true);
    window.setTimeout(() => {
      setSubmitting(false);
      // Placeholder check: any six digits pass, since there is no backend yet.
      onVerified();
    }, 700);
  };

  const handleResend = () => {
    setResendIn(RESEND_SECONDS);
    setError(null);
    setAttempts(0);
    setDigits(Array(CODE_LENGTH).fill(''));
    inputs.current[0]?.focus();
  };

  return (
    <AuthShell
      eyebrow="Verification"
      title={`Enter the ${isEmail ? 'email' : 'SMS'} code`}
      lede={`We sent a ${CODE_LENGTH}-digit code to ${maskDestination(phoneOrEmail)}. It expires in 10 minutes.`}
      narrow
      aside={
        <div className="auth__panel">
          <h2 className="auth__panel-title">Not receiving it?</h2>
          <ul className="auth__tips">
            <li>Check that {isEmail ? 'the email' : 'the number'} above is correct.</li>
            <li>
              {isEmail
                ? 'Look in spam or promotions for a message from i-Tutor.'
                : 'Confirm the phone has signal and that SMS is not blocked.'}
            </li>
            <li>Corporate or school networks sometimes delay SMS by a minute.</li>
          </ul>
          <TrustList
            items={[
              'The code is single-use',
              'We never ask you to read it aloud',
            ]}
          />
        </div>
      }
      footer={
        <button type="button" className="link-inline" onClick={onChangeNumber}>
          Wrong number? Change it
        </button>
      }
    >
      <div className="otp">
        <div className="otp__boxes">
          {digits.map((digit, index) => (
            <input
              key={index}
              ref={(el) => {
                inputs.current[index] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={CODE_LENGTH}
              value={digit}
              onChange={(e) => setDigit(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              disabled={submitting}
              aria-label={`Digit ${index + 1} of ${CODE_LENGTH}`}
              className={`otp__box${activeError ? ' is-invalid' : ''}${digit ? ' is-filled' : ''}`}
            />
          ))}
        </div>

        {activeError ? (
          <div className="form-banner is-error" role="alert">
            <AlertCircleIcon size={16} />
            <span>{activeError}</span>
          </div>
        ) : null}

        {attempts >= 3 ? (
          <p className="otp__attempts">
            Three incorrect attempts. Request a fresh code to continue.
          </p>
        ) : null}

        <button
          type="button"
          className="btn btn--primary btn--block"
          onClick={verify}
          disabled={!isComplete || submitting}
        >
          {submitting ? 'Verifying…' : 'Verify and continue'}
        </button>

        <div className="otp__resend">
          {resendIn > 0 ? (
            <span className="otp__countdown">
              Resend available in {resendIn}s
            </span>
          ) : (
            <button
              type="button"
              className="link-inline"
              onClick={handleResend}
            >
              <RefreshCwIcon size={13} /> Resend code
            </button>
          )}
        </div>

        <p className="auth__switch">
          {isEmail
            ? 'Check your inbox and promotions folder for the message.'
            : 'The code arrives as an SMS from i-Tutor within a minute.'}
        </p>
      </div>
    </AuthShell>
  );
};

export default A05_OTP;
