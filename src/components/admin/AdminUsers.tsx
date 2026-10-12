import React, { useEffect, useState } from 'react';
import { BadgeCheck, Crown, KeyRound, Search, Trash2, UsersRound, X } from 'lucide-react';
import { deleteUser, listUsers } from '../../services/admin';
import type { AdminUser, UserList } from '../../services/admin';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Users: everyone who has registered, newest first, with a search box.
   Plans only change through payments. Deleting a user asks for the signed-in
   admin's password; the server checks it again. */

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 31 ? `${days} d ago` : day(iso);
};

const EXAM_NAME: Record<string, string> = { UTME: 'JAMB' };

const DeleteDialog: React.FC<{ target: AdminUser; onClose: () => void; onDeleted: () => void }> = ({ target, onClose, onDeleted }) => {
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
    if (!password) return setError('Enter your password to confirm.');
    setBusy(true);
    setError('');
    deleteUser(target.id, password)
      .then(onDeleted)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="adm-drawer adm-dialog" onClick={onClose}>
      <form className="adm-dialog__panel" onClick={(e) => e.stopPropagation()} onSubmit={confirm} role="dialog" aria-modal="true" aria-label="Delete user">
        <header className="adm-drawer__head">
          <h2>Delete user</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <p>
          <strong>{target.fullName}</strong> ({target.phoneOrEmail}) and their sessions, payments and usage will be deleted for good. This can’t
          be undone. Enter <em>your</em> admin password to confirm.
        </p>
        <label className="adm-field">
          <span>Your password</span>
          <div className="adm-input adm-input--icon">
            <KeyRound size={18} aria-hidden />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
          </div>
        </label>
        {error && <p className="adm-error">{error}</p>}
        <div className="adm-dialog__actions">
          <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--danger" disabled={busy}>
            <Trash2 size={18} aria-hidden /> {busy ? 'Deleting…' : 'Delete user'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const AdminUsers: React.FC<{ nav: AdminNav; mode: 'live' | 'demo' }> = ({ nav, mode }) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<UserList | null>(null);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState<AdminUser | null>(null);
  const [reload, setReload] = useState(0);

  // Search as the admin types, a moment after they stop.
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      listUsers(query.trim())
        .then((d) => !cancelled && (setData(d), setError('')))
        .catch((err: Error) => !cancelled && setError(err.message));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query, reload]);

  return (
    <div className="adm-page">
      <PageHead title="Users" sub="Everyone who has registered on i-Tutor, newest first." />

      {mode === 'demo' ? (
        <div className="adm-empty">
          <h3>Connect the backend to see users</h3>
          <p>Demo mode has no real accounts. Sign in with the admin key while the server is running.</p>
        </div>
      ) : (
        <>
          <div className="adm-users__stats">
            <div>
              <UsersRound size={20} aria-hidden />
              <b>{data?.total ?? '–'}</b>
              <span>registered</span>
            </div>
            <div>
              <BadgeCheck size={20} aria-hidden />
              <b>{data?.verified ?? '–'}</b>
              <span>verified</span>
            </div>
            <div>
              <Crown size={20} aria-hidden />
              <b>{data?.premium ?? '–'}</b>
              <span>on Premium</span>
            </div>
          </div>

          <label className="adm-users__search">
            <Search size={18} aria-hidden />
            <input
              className="adm-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name or email"
              aria-label="Search users"
            />
          </label>

          {error && <p className="adm-users__error">{error}</p>}

          {data && data.users.length === 0 ? (
            <div className="adm-empty">
              <h3>{query ? 'No one matches that search' : 'No users yet'}</h3>
              <p>{query ? 'Try part of a name or email.' : 'Students appear here as soon as they register.'}</p>
            </div>
          ) : (
            <div className="adm-users__table" role="table" aria-label="Users">
              <div className="adm-users__row adm-users__row--head" role="row">
                <span role="columnheader">Student</span>
                <span role="columnheader">Exams</span>
                <span role="columnheader">Plan</span>
                <span role="columnheader">Joined</span>
                <span role="columnheader">Last active</span>
                <span role="columnheader" aria-label="Actions" />
              </div>
              {data?.users.map((u) => (
                <div key={u.id} className="adm-users__row" role="row">
                  <span role="cell" className="adm-users__who">
                    <i aria-hidden>{u.fullName.charAt(0).toUpperCase()}</i>
                    <span>
                      <strong>
                        {u.fullName}
                        {u.verified ? (
                          <BadgeCheck size={15} className="adm-users__ok" aria-label="Verified" />
                        ) : (
                          <em className="adm-users__pending">Not verified</em>
                        )}
                      </strong>
                      <small>{u.phoneOrEmail}</small>
                    </span>
                  </span>
                  <span role="cell" className="adm-users__exams">
                    {u.exams.length ? u.exams.map((e) => <em key={e}>{EXAM_NAME[e] ?? e}</em>) : <small>Not set</small>}
                  </span>
                  <span role="cell">
                    {u.plan === 'premium' ? (
                      <span className="adm-users__plan is-premium">
                        Premium
                        {u.planExpiresAt && <small>until {day(u.planExpiresAt)}</small>}
                      </span>
                    ) : (
                      <span className="adm-users__plan">Free</span>
                    )}
                  </span>
                  <span role="cell">{day(u.createdAt)}</span>
                  <span role="cell">{ago(u.lastActiveAt)}</span>
                  <span role="cell" className="adm-users__actions">
                    <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => setDeleting(u)} aria-label={`Delete ${u.fullName}`}>
                      <Trash2 size={16} aria-hidden /> Delete
                    </button>
                  </span>
                </div>
              ))}
            </div>
          )}
          {data && data.users.length === 500 && <p className="adm-muted">Showing the newest 500. Search to find someone older.</p>}

          {deleting && (
            <DeleteDialog
              target={deleting}
              onClose={() => setDeleting(null)}
              onDeleted={() => {
                nav.notify(`${deleting.fullName} was deleted.`);
                setDeleting(null);
                setReload((n) => n + 1);
              }}
            />
          )}
        </>
      )}
    </div>
  );
};
