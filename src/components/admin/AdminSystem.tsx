import React, { useEffect, useRef, useState } from 'react';
import { DatabaseBackup, Download, KeyRound, LoaderCircle, RotateCcw, Upload, X } from 'lucide-react';
import { syncQuestions } from '../../lib/cms';
import { downloadBackup, questionCounts, resetExam, runRestore, uploadBackup } from '../../services/system';
import type { BackupSummary, ExamCount } from '../../services/system';
import type { AdminNav } from './AdminApp';

/* Admin → Settings (live site): whole-system backup and restore, and
   resetting one exam. All need the super admin password; restore and reset
   keep a safety copy of everything on the server first. */

/** Collection names, as admins know them. */
const NAMES: Record<string, string> = {
  Question: 'questions',
  Paper: 'papers',
  User: 'students',
  AdminUser: 'admins',
  Payment: 'payments',
  Attempt: 'practice results',
  Page: 'pages',
  News: 'news posts',
  Course: 'courses',
  Exam: 'exams',
  Media: 'images',
};

const summaryText = (s: BackupSummary) =>
  Object.entries(s.counts)
    .filter(([k, n]) => NAMES[k] && n)
    .map(([k, n]) => `${n.toLocaleString()} ${NAMES[k]}`)
    .join(' · ');

/** Super admin password, plus a word to type when the change can't be undone. */
const ConfirmDialog: React.FC<{
  title: string;
  message: React.ReactNode;
  word?: string;
  action: string;
  danger?: boolean;
  onConfirm: (password: string) => Promise<unknown>;
  onClose: () => void;
}> = ({ title, message, word, action, danger, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [typed, setTyped] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && !busy && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [busy, onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return setError('Enter the super admin password.');
    if (word && typed.trim().toUpperCase() !== word) return setError(`Type ${word} to confirm.`);
    setBusy(true);
    setError('');
    onConfirm(password)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="cms-modal" onClick={() => !busy && onClose()}>
      <form className="cms-modal__panel cms-modal__panel--narrow" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="cms-modal__head">
          <h2>{title}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} disabled={busy} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body cms-newpage">
          <div>{message}</div>
          <label className="adm-field">
            <span>Super admin password</span>
            <div className="adm-input adm-input--icon">
              <KeyRound size={18} aria-hidden />
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
            </div>
          </label>
          {word && (
            <label className="adm-field">
              <span>
                Type <b>{word}</b> to confirm
              </span>
              <input className="adm-input" value={typed} onChange={(e) => setTyped(e.target.value)} autoComplete="off" />
            </label>
          )}
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="cms-modal__foot">
          <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={`adm-btn ${danger ? 'adm-btn--danger' : 'adm-btn--primary'}`} disabled={busy}>
            {busy && <LoaderCircle size={16} className="adm-spin" aria-hidden />} {busy ? 'Working…' : action}
          </button>
        </footer>
      </form>
    </div>
  );
};

/* ------------------------------------------------------- Backup & restore */

export const BackupCard: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const [dialog, setDialog] = useState<'download' | 'upload' | 'restore' | null>(null);
  const [progress, setProgress] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [pending, setPending] = useState<{ id: string; summary: BackupSummary; password: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <section className="adm-card sysb" aria-labelledby="sysb-title">
      <h2 className="adm-card__title" id="sysb-title">
        <DatabaseBackup size={18} aria-hidden /> Backup &amp; restore
      </h2>
      <p className="adm-muted">
        A backup is the whole system in one file: questions, students, admins, payments, practice results, pages, news, courses, exams and settings.
        Restore puts everything back exactly as it was in that file. Uploaded images are kept by the server’s nightly backup.
      </p>
      <div className="adm-row-actions">
        <button type="button" className="adm-btn adm-btn--primary" onClick={() => setDialog('download')}>
          <Download size={16} aria-hidden /> Download backup
        </button>
        <button type="button" className="adm-btn" onClick={() => fileRef.current?.click()}>
          <Upload size={16} aria-hidden /> Restore from file
        </button>
        <input
          ref={fileRef}
          type="file"
          accept=".gz,.json,application/gzip,application/json"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            e.target.value = '';
            if (f) {
              setFile(f);
              setDialog('upload');
            }
          }}
        />
      </div>
      {progress && (
        <p className="adm-muted sysb__progress">
          <LoaderCircle size={14} className="adm-spin" aria-hidden /> {progress}
        </p>
      )}
      <p className="adm-muted sysb__warn">The backup file holds students’ and admins’ accounts (passwords stay scrambled). Keep it somewhere private.</p>

      {dialog === 'download' && (
        <ConfirmDialog
          title="Download a backup"
          message="Everything on i-Tutor is saved to one file on this computer."
          action="Download backup"
          onClose={() => setDialog(null)}
          onConfirm={async (password) => {
            setDialog(null);
            try {
              const summary = await downloadBackup(password, setProgress);
              nav.notify(`Backup downloaded: ${summaryText(summary)}.`);
            } catch (e) {
              nav.notify((e as Error).message);
            } finally {
              setProgress('');
            }
          }}
        />
      )}

      {dialog === 'upload' && file && (
        <ConfirmDialog
          title="Restore from a backup"
          message={
            <p>
              First the file <b>{file.name}</b> is uploaded and checked; you’ll see what it holds before anything changes.
            </p>
          }
          action="Upload and check"
          onClose={() => setDialog(null)}
          onConfirm={async (password) => {
            const { id, summary } = await uploadBackup(file, password, setProgress).finally(() => setProgress(''));
            setPending({ id, summary, password });
            setDialog('restore');
          }}
        />
      )}

      {dialog === 'restore' && pending && (
        <ConfirmDialog
          title="Replace everything with this backup?"
          danger
          word="RESTORE"
          message={
            <>
              <p>
                This backup is from <b>{new Date(pending.summary.createdAt).toLocaleString()}</b> and holds: {summaryText(pending.summary)}.
              </p>
              <p>
                <b>Everything on i-Tutor now will be replaced by it.</b> Anything added since then is removed. A copy of everything as it is now is saved on the
                server first, so this can be undone. Everyone may need to sign in again.
              </p>
            </>
          }
          action="Restore everything"
          onClose={() => {
            setDialog(null);
            setPending(null);
          }}
          onConfirm={async (password) => {
            const result = await runRestore(pending.id, password);
            setDialog(null);
            setPending(null);
            await syncQuestions('admin').catch(() => undefined);
            nav.notify(`Restored: ${summaryText({ createdAt: '', counts: result.restored })}. The previous state is saved on the server (${result.safety}).`);
          }}
        />
      )}
    </section>
  );
};

/* ------------------------------------------------------------ Reset exams */

export const ResetCard: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const [rows, setRows] = useState<ExamCount[] | null>(null);
  const [target, setTarget] = useState<ExamCount | null>(null);
  const [version, setVersion] = useState(0);

  useEffect(() => {
    questionCounts()
      .then(setRows)
      .catch(() => setRows([]));
  }, [version]);

  const word = (r: ExamCount) => (r.exam ? r.label.toUpperCase() : 'SHARED');

  return (
    <section className="adm-card adm-card--danger sysr" aria-labelledby="sysr-title">
      <h2 className="adm-card__title" id="sysr-title">
        <RotateCcw size={18} aria-hidden /> Reset an exam
      </h2>
      <p className="adm-muted">
        Removes all of one exam’s questions: its past questions and its own practice questions, published and drafts. Use it to clear out test questions
        before adding real ones. Its settings stay. A copy of everything is saved on the server first.
      </p>
      {!rows ? (
        <p className="adm-muted">
          <LoaderCircle size={14} className="adm-spin" aria-hidden /> Counting questions…
        </p>
      ) : (
        <ul className="sysr__list">
          {rows.map((r) => {
            const total = r.past + r.practice;
            return (
              <li key={r.exam || 'shared'}>
                <div>
                  <strong>{r.label}</strong>
                  <small>{r.exam ? `${r.past.toLocaleString()} past · ${r.practice.toLocaleString()} practice` : `${r.practice.toLocaleString()} practice questions every exam uses`}</small>
                </div>
                <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => setTarget(r)} disabled={total === 0}>
                  <RotateCcw size={16} aria-hidden /> {total === 0 ? 'Empty' : 'Reset'}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {target && (
        <ConfirmDialog
          title={`Reset ${target.label}?`}
          danger
          word={word(target)}
          message={
            <p>
              This removes <b>{(target.past + target.practice).toLocaleString()} questions</b>
              {target.exam ? (
                <>
                  : {target.past.toLocaleString()} {target.label} past questions and {target.practice.toLocaleString()} {target.label} practice questions
                </>
              ) : (
                ' from the shared practice bank'
              )}
              , published and drafts. Students stop seeing them straight away. A copy of everything is saved on the server first.
            </p>
          }
          action={`Reset ${target.label}`}
          onClose={() => setTarget(null)}
          onConfirm={async (password) => {
            const result = await resetExam(target.exam, password, word(target));
            setTarget(null);
            setVersion((v) => v + 1);
            await syncQuestions('admin').catch(() => undefined);
            nav.notify(`${target.label} reset: ${result.removed.toLocaleString()} questions removed. A copy of everything before is on the server (${result.safety}).`);
          }}
        />
      )}
    </section>
  );
};
