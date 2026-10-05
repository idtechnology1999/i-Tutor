import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeftIcon, AlertCircleIcon, RefreshCwIcon } from '../Icons';

interface Props {
  phoneOrEmail: string;
  onChangeNumber: () => void;
  onVerified: () => void;
}

export const A05_OTP: React.FC<Props> = ({ phoneOrEmail, onChangeNumber, onVerified }) => {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [timer, setTimer] = useState<number>(45);
  const [canResend, setCanResend] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shake, setShake] = useState<boolean>(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Focus first input on mount
  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  // Countdown timer for 45s
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => setTimer((t) => t - 1), 1000);
      return () => clearInterval(interval);
    } else {
      setCanResend(true);
    }
  }, [timer]);

  // Handle input change & auto-advance
  const handleDigitChange = (index: number, value: string) => {
    // Only accept numeric input
    const cleanChar = value.replace(/\D/g, '').slice(-1);
    const newDigits = [...digits];
    newDigits[index] = cleanChar;
    setDigits(newDigits);
    setErrorMessage(null);

    // Auto-advance
    if (cleanChar && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Check if 6th digit is filled
    if (cleanChar && index === 5 && newDigits.every((d) => d !== '')) {
      const fullCode = newDigits.join('');
      validateCode(fullCode);
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pastedData) return;

    const newDigits = [...digits];
    for (let i = 0; i < 6; i++) {
      newDigits[i] = pastedData[i] || '';
    }
    setDigits(newDigits);

    if (pastedData.length === 6) {
      validateCode(pastedData);
    } else {
      inputRefs.current[pastedData.length]?.focus();
    }
  };

  const validateCode = (code: string) => {
    // Correct demo code: any code EXCEPT '000000'
    if (code === '000000') {
      triggerError('Incorrect code. 3 attempts remaining.');
      return;
    }

    // Success transition
    onVerified();
  };

  const triggerError = (msg: string) => {
    setErrorMessage(msg);
    setShake(true);
    setTimeout(() => setShake(false), 500);
  };

  const handleResend = () => {
    setTimer(45);
    setCanResend(false);
    setErrorMessage(null);
    setDigits(['', '', '', '', '', '']);
    inputRefs.current[0]?.focus();
  };

  const formatPhoneNumber = (val: string) => {
    if (val.length >= 10) {
      return `${val.slice(0, 4)} •••• ${val.slice(-3)}`;
    }
    return val;
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
          onClick={onChangeNumber}
          className="btn-icon-touch"
          aria-label="Change phone number"
        >
          <ArrowLeftIcon size={22} color="var(--neutral-900)" />
        </button>
      </div>

      <div
        style={{
          flex: 1,
          padding: '12px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        {/* Header & Subhead */}
        <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '8px' }}>
          Verify your phone
        </h1>
        <p className="text-body-reg" style={{ color: 'var(--neutral-600)', marginBottom: '32px' }}>
          We sent a 6-digit code to{' '}
          <strong style={{ color: 'var(--neutral-900)' }}>{formatPhoneNumber(phoneOrEmail || '0803 123 4891')}</strong>{' '}
          <button
            type="button"
            onClick={onChangeNumber}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--teal-700)',
              fontWeight: 600,
              cursor: 'pointer',
              textDecoration: 'underline',
              fontSize: '14px',
            }}
          >
            [Change Number]
          </button>
        </p>

        {/* 6 Discrete Numeric Cells (48px wide x 56px high) */}
        <div
          className={shake ? 'shake-animation' : ''}
          style={{
            display: 'flex',
            gap: '8px',
            justifyContent: 'center',
            marginBottom: '20px',
            width: '100%',
          }}
        >
          {digits.map((digit, index) => {
            const hasError = Boolean(errorMessage);
            return (
              <input
                key={index}
                ref={(el) => {
                  inputRefs.current[index] = el;
                }}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={digit}
                onChange={(e) => handleDigitChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                style={{
                  width: '48px',
                  height: '56px',
                  borderRadius: '12px',
                  border: hasError ? '2px solid var(--red-500)' : digit ? '2px solid var(--teal-900)' : '1.5px solid var(--neutral-300)',
                  backgroundColor: hasError ? 'var(--red-50)' : digit ? 'var(--teal-50)' : 'var(--white)',
                  fontSize: '22px',
                  fontWeight: 700,
                  textAlign: 'center',
                  color: 'var(--neutral-900)',
                  outline: 'none',
                  transition: 'all 0.15s ease',
                  boxShadow: digit ? '0 2px 8px rgba(14, 59, 58, 0.1)' : 'none',
                }}
              />
            );
          })}
        </div>

        {/* Error Helper Text */}
        {errorMessage && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              color: 'var(--red-500)',
              fontSize: '13px',
              fontWeight: 500,
              marginBottom: '20px',
            }}
          >
            <AlertCircleIcon size={16} color="var(--red-500)" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Timer & Resend Controls */}
        <div style={{ marginTop: '12px', marginBottom: 'auto' }}>
          {!canResend ? (
            <p style={{ fontSize: '14px', color: 'var(--neutral-600)' }}>
              Resend code in <strong style={{ color: 'var(--teal-900)' }}>0:{timer < 10 ? `0${timer}` : timer}</strong>
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', alignItems: 'center' }}>
              <p style={{ fontSize: '14px', color: 'var(--neutral-700)' }}>
                Didn't receive code?
              </p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  type="button"
                  onClick={() => handleResend()}
                  className="btn-secondary"
                  style={{
                    minHeight: '36px',
                    height: '36px',
                    fontSize: '13px',
                    padding: '0 14px',
                    borderRadius: '8px',
                  }}
                >
                  <RefreshCwIcon size={14} /> Resend via SMS
                </button>
                <button
                  type="button"
                  onClick={() => handleResend()}
                  className="btn-secondary"
                  style={{
                    minHeight: '36px',
                    height: '36px',
                    fontSize: '13px',
                    padding: '0 14px',
                    borderRadius: '8px',
                    borderColor: '#25D366',
                    color: '#075E54',
                    backgroundColor: '#F0FDF4',
                  }}
                >
                  Resend via WhatsApp
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Interactive Simulation Controls */}
        <div
          style={{
            background: 'var(--neutral-50)',
            border: '1px solid var(--neutral-200)',
            borderRadius: '12px',
            padding: '12px',
            width: '100%',
            marginTop: '20px',
          }}
        >
          <div style={{ fontSize: '12px', color: 'var(--neutral-600)', marginBottom: '8px', fontWeight: 600 }}>
            PROTOTYPE TESTING SHORTCUTS
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => {
                setDigits(['1', '2', '3', '4', '5', '6']);
                setTimeout(onVerified, 200);
              }}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                borderRadius: '6px',
                background: 'var(--teal-50)',
                color: 'var(--teal-900)',
                border: '1px solid var(--teal-100)',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Fill Valid OTP (123456)
            </button>
            <button
              type="button"
              onClick={() => {
                setDigits(['0', '0', '0', '0', '0', '0']);
                triggerError('Incorrect code. 3 attempts remaining.');
              }}
              style={{
                flex: 1,
                padding: '6px',
                fontSize: '12px',
                borderRadius: '6px',
                background: 'var(--red-50)',
                color: 'var(--red-500)',
                border: '1px solid #FECACA',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Test Shake (000000)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
