import React, { useRef, useState } from 'react';
import { Download, LoaderCircle, RotateCcw, Upload } from 'lucide-react';
import { cms } from '../../lib/cms';
import { checkAdmin } from '../../lib/question-import';
import { adminChangePassword } from '../../services/admin-auth';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/** Any admin can change their own password here (forgotten ones: the sign-in screen). */
const PasswordCard: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (next.length < 8) return setError('Use at least 8 characters for the new password.');
    if (next !== confirm) return setError('The two new passwords don’t match.');
    setBusy(true);
    setError('');
    adminChangePassword(current, next)
      .then(() => {
        setCurrent('');
        setNext('');
        setConfirm('');
        nav.notify('Password changed. Other devices have been signed out.');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <form className="adm-card" onSubmit={save}>
      <h2 className="adm-card__title">Your password</h2>
      <p className="adm-muted">Changing it signs you out on every other device.</p>
      <div className="adm-grid-2">
        <input className="adm-input" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Current password" autoComplete="current-password" aria-label="Current password" />
        <span />
        <input className="adm-input" type="password" value={next} onChange={(e) => setNext(e.target.value)} placeholder="New password (8+ characters)" autoComplete="new-password" aria-label="New password" />
        <input className="adm-input" type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" autoComplete="new-password" aria-label="Repeat new password" />
      </div>
      {error && <p className="adm-error">{error}</p>}
      <div className="adm-row-actions">
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || !current || !next}>
          {busy ? 'Saving…' : 'Change password'}
        </button>
      </div>
    </form>
  );
};

export const AdminSettings: React.FC<{ nav: AdminNav; mode: 'live' | 'demo' }> = ({ nav, mode }) => {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string>(
    mode === 'live' ? 'Connected to the AI backend.' : 'Not connected — imports use the built-in reader.',
  );
  const fileRef = useRef<HTMLInputElement>(null);

  const test = async () => {
    setTesting(true);
    const r = await checkAdmin();
    setTesting(false);
    setStatus(
      r.status === 'ok'
        ? r.ai
          ? 'Connected. The AI is ready.'
          : 'Connected, but the AI key isn’t set on the server yet.'
        : r.status === 'wrong'
          ? 'Your admin session has ended. Sign in again.'
          : r.status === 'unconfigured'
            ? 'The server is reachable but not set up yet.'
            : 'No AI backend found. Imports use the built-in reader.',
    );
  };

  const exportBackup = () => {
    const blob = new Blob([cms.exportJson()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `itutor-content-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    nav.notify('Backup downloaded.');
  };

  const importBackup = async (file: File) => {
    try {
      cms.importJson(await file.text());
      nav.notify('Content restored from backup.');
    } catch (e) {
      nav.notify((e as Error).message);
    }
  };

  return (
    <div className="adm-page adm-page--narrow">
      <PageHead title="Settings" />

      {mode === 'live' && <PasswordCard nav={nav} />}

      <section className="adm-card">
        <h2 className="adm-card__title">AI connection</h2>
        <p className="adm-muted">
          The AI that organises papers runs on the server so your keys stay private. Your developer connects it at{' '}
          <code>/api/parse-questions</code>.
        </p>
        <div className="adm-status">
          <span className={`adm-mode is-${mode}`}>{mode === 'live' ? 'AI connected' : 'Demo mode'}</span>
          <span>{status}</span>
        </div>
        <button type="button" className="adm-btn" onClick={test} disabled={testing}>
          {testing && <LoaderCircle size={16} className="adm-spin" aria-hidden />} Test connection
        </button>
      </section>

      <section className="adm-card">
        <h2 className="adm-card__title">Backup</h2>
        <p className="adm-muted">
          Content is saved in this browser until the database is connected. Download a backup regularly, and use it to
          move your work to another computer.
        </p>
        <div className="adm-row-actions">
          <button type="button" className="adm-btn" onClick={exportBackup}>
            <Download size={16} aria-hidden /> Download backup
          </button>
          <button type="button" className="adm-btn" onClick={() => fileRef.current?.click()}>
            <Upload size={16} aria-hidden /> Restore from file
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void importBackup(f);
              e.target.value = '';
            }}
          />
        </div>
      </section>

      <section className="adm-card adm-card--danger">
        <h2 className="adm-card__title">Start over</h2>
        <p className="adm-muted">Remove everything you’ve added and go back to the starter questions and news.</p>
        <button
          type="button"
          className="adm-btn adm-btn--danger-ghost"
          onClick={() => {
            if (!window.confirm('Reset all content to the starter set? Download a backup first if you want to keep your work.')) return;
            cms.reset();
            nav.notify('Content reset.');
          }}
        >
          <RotateCcw size={16} aria-hidden /> Reset content
        </button>
      </section>
    </div>
  );
};
