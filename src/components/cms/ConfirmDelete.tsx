import React, { useEffect, useState } from 'react';
import { KeyRound, Trash2, X } from 'lucide-react';

/* Deleting a page or image changes the public website, so it needs the super
   admin's password, whoever is signed in. The server checks it again. */

export const ConfirmDelete: React.FC<{
  title: string;
  message: React.ReactNode;
  action: string;
  onConfirm: (password: string) => Promise<unknown>;
  onClose: () => void;
}> = ({ title, message, action, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const confirm = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setError('Enter the super admin password to confirm.');
    setBusy(true);
    setError('');
    onConfirm(password)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="cms-modal" onClick={onClose}>
      <form
        className="cms-modal__panel cms-modal__panel--narrow"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        onSubmit={confirm}
      >
        <header className="cms-modal__head">
          <h2>{title}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body cms-newpage">
          <p>{message}</p>
          <label className="adm-field">
            <span>Super admin password</span>
            <div className="adm-input adm-input--icon">
              <KeyRound size={18} aria-hidden />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
            </div>
          </label>
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="cms-modal__foot">
          <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--danger" disabled={busy}>
            <Trash2 size={18} aria-hidden /> {busy ? 'Deleting…' : action}
          </button>
        </footer>
      </form>
    </div>
  );
};
