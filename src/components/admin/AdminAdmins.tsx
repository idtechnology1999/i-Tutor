import React, { useEffect, useState } from 'react';
import { Crown, KeyRound, MailPlus, Send, Trash2, X } from 'lucide-react';
import { inviteAdmin, listAdmins, removeAdmin, resendInvite } from '../../services/admin-auth';
import type { AdminAccount } from '../../services/admin-auth';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Admins (super admin only): invite admins by email and remove them. Removing
   asks for the super admin's password; the server checks it again. */

const when = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Never';

const RemoveDialog: React.FC<{ target: AdminAccount; onClose: () => void; onRemoved: () => void }> = ({ target, onClose, onRemoved }) => {
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
    removeAdmin(target.id, password)
      .then(onRemoved)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="adm-drawer adm-dialog" onClick={onClose}>
      <form className="adm-dialog__panel" onClick={(e) => e.stopPropagation()} onSubmit={confirm} role="dialog" aria-modal="true" aria-label="Remove admin">
        <header className="adm-drawer__head">
          <h2>Remove admin</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <p>
          <strong>{target.name || target.email}</strong> will lose access to the admin panel straight away. Enter <em>your</em> super admin
          password to confirm.
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
            <Trash2 size={18} aria-hidden /> {busy ? 'Removing…' : 'Remove admin'}
          </button>
        </div>
      </form>
    </div>
  );
};

export const AdminAdmins: React.FC<{ nav: AdminNav; me: AdminAccount }> = ({ nav, me }) => {
  const [admins, setAdmins] = useState<AdminAccount[] | null>(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [removing, setRemoving] = useState<AdminAccount | null>(null);

  const load = () =>
    listAdmins()
      .then(setAdmins)
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void load();
  }, []);

  const invite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\S+@\S+\.\S+$/.test(email.trim())) return setError('Enter a valid email address.');
    setBusy(true);
    setError('');
    inviteAdmin(email.trim(), name.trim())
      .then(() => {
        nav.notify(`Invitation sent to ${email.trim()}.`);
        setEmail('');
        setName('');
        return load();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="adm-page">
      <PageHead title="Admins" sub="Only you, the super admin, can see this page, invite admins or remove them." />

      <form className="adm-card adm-invite" onSubmit={invite}>
        <h2 className="adm-card__title">
          <MailPlus size={20} aria-hidden /> Invite an admin
        </h2>
        <p className="adm-muted">They get an email with a code. They open the admin, choose “I have an invitation”, and set their own password.</p>
        <div className="adm-invite__row">
          <input className="adm-input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="their@email.com" aria-label="Email" />
          <input className="adm-input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Name (optional)" aria-label="Name" />
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
            <Send size={18} aria-hidden /> {busy ? 'Sending…' : 'Send invitation'}
          </button>
        </div>
        {error && <p className="adm-error">{error}</p>}
      </form>

      <ul className="adm-admins">
        {admins?.map((a) => (
          <li key={a.id}>
            <i aria-hidden>{(a.name || a.email).charAt(0).toUpperCase()}</i>
            <span className="adm-admins__who">
              <strong>
                {a.name || a.email}
                {a.id === me.id && <em className="adm-admins__you">You</em>}
              </strong>
              <small>{a.email}</small>
            </span>
            <span className={`adm-admins__role is-${a.role}`}>
              {a.role === 'superadmin' ? (
                <>
                  <Crown size={14} aria-hidden /> Super admin
                </>
              ) : (
                'Admin'
              )}
            </span>
            <span className="adm-admins__status">
              {a.status === 'invited' ? <em className="adm-users__pending">Invitation pending</em> : <small>Last sign-in: {when(a.lastLoginAt)}</small>}
            </span>
            <span className="adm-admins__actions">
              {a.status === 'invited' && (
                <button
                  type="button"
                  className="adm-btn"
                  onClick={() =>
                    resendInvite(a.id)
                      .then(() => nav.notify(`Invitation sent again to ${a.email}.`))
                      .catch((err: Error) => setError(err.message))
                  }
                >
                  <Send size={16} aria-hidden /> Resend
                </button>
              )}
              {a.role !== 'superadmin' && (
                <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => setRemoving(a)}>
                  <Trash2 size={16} aria-hidden /> Remove
                </button>
              )}
            </span>
          </li>
        ))}
      </ul>

      {removing && (
        <RemoveDialog
          target={removing}
          onClose={() => setRemoving(null)}
          onRemoved={() => {
            nav.notify(`${removing.name || removing.email} was removed.`);
            setRemoving(null);
            void load();
          }}
        />
      )}
    </div>
  );
};
