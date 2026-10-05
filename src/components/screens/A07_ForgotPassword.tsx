import React, { useState } from 'react';
import { ArrowLeftIcon } from '../Icons';

interface Props {
  onBack: () => void;
  onSendCode: (destination: string) => void;
}

export const A07_ForgotPassword: React.FC<Props> = ({ onBack, onSendCode }) => {
  const [identity, setIdentity] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!identity.trim()) return;
    onSendCode(identity.trim());
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
            Reset your password
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Enter your registered Nigerian mobile number or email to receive a recovery code.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          <div className="form-input-group">
            <label className="form-label" htmlFor="forgot-identity">
              Phone Number or Email
            </label>
            <input
              id="forgot-identity"
              type="text"
              value={identity}
              onChange={(e) => setIdentity(e.target.value)}
              placeholder="0801 234 5678 or name@email.com"
              className="form-input"
              required
              autoFocus
            />
          </div>

          <div style={{ flex: 1 }} />

          <button
            type="submit"
            disabled={!identity.trim()}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            Send Reset Code
          </button>
        </form>
      </div>
    </div>
  );
};
