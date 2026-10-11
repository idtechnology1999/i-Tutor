import React, { useState } from 'react';
import { ArrowLeft, KeyRound, LoaderCircle, Mail, ShieldCheck } from 'lucide-react';
import { BrandMark } from '../web/BrandMark';
import { isLive } from '../../services/api';
import { adminAcceptInvite, adminChangePassword, adminForgot, adminLogin, adminReset } from '../../services/admin-auth';
import type { AdminAccount } from '../../services/admin-auth';

/* Admin sign-in screens: sign in · forgot password (code by email) · accept
   an invitation · choose a new password (required while on the default one). */

/** Pre-filled on the sign-in form; the super admin created on first start. */
const DEFAULT_EMAIL = 'idtechrealworldinnovations@gmail.com';

type View = 'login' | 'forgot' | 'reset' | 'invite';

const Field: React.FC<{
  label: string;
  type?: string;
  value: string;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  autoComplete?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputMode?: 'numeric' | 'email' | 'text';
}> = ({ label, type = 'text', value, onChange, icon, autoComplete, placeholder, autoFocus, inputMode }) => (
  <label className="adm-field">
    <span>{label}</span>
    <div className={`adm-input${icon ? ' adm-input--icon' : ''}`}>
      {icon}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        autoFocus={autoFocus}
        inputMode={inputMode}
      />
    </div>
  </label>
);

const Card: React.FC<{ title: string; sub: string; children: React.ReactNode; onSubmit: () => void }> = ({ title, sub, children, onSubmit }) => (
  <div className="adm-signin">
    <form
      className="adm-signin__card"
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <BrandMark />
      <h1>{title}</h1>
      <p>{sub}</p>
      {children}
    </form>
  </div>
);

const Submit: React.FC<{ busy: boolean; label: string; busyLabel: string }> = ({ busy, label, busyLabel }) => (
  <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
    {busy && <LoaderCircle size={18} className="adm-spin" aria-hidden />}
    {busy ? busyLabel : label}
  </button>
);

/** Sign in, forgot password and invitations. */
export const AdminAuth: React.FC<{
  onSignedIn: (admin: AdminAccount) => void;
  onDemo: () => void;
  onExit: () => void;
}> = ({ onSignedIn, onDemo, onExit }) => {
  const [view, setView] = useState<View>('login');
  const [email, setEmail] = useState(DEFAULT_EMAIL);
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [note, setNote] = useState('');

  const go = (next: View) => {
    setView(next);
    setError('');
    setNote('');
    setPassword('');
    setConfirm('');
    setCode('');
  };

  const run = (task: () => Promise<void>) => {
    setBusy(true);
    setError('');
    task()
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  const newPasswordProblem = () =>
    password.length < 8 ? 'Use at least 8 characters for the new password.' : password !== confirm ? 'The two passwords don’t match.' : '';

  const back = (
    <button type="button" className="adm-link adm-auth__back" onClick={() => go('login')}>
      <ArrowLeft size={16} aria-hidden /> Back to sign in
    </button>
  );

  if (!isLive) {
    return (
      <Card title="Admin" sub="No backend is connected, so the admin runs in demo mode in this browser." onSubmit={onDemo}>
        <Submit busy={false} label="Open demo admin" busyLabel="" />
        <button type="button" className="adm-link" onClick={onExit}>
          Back to the website
        </button>
      </Card>
    );
  }

  if (view === 'forgot') {
    return (
      <Card
        title="Forgot password"
        sub="Enter your admin email. If it belongs to an admin, we’ll email a 6-digit code."
        onSubmit={() =>
          run(async () => {
            if (!email.trim()) throw new Error('Enter your email.');
            await adminForgot(email.trim());
            go('reset');
            setNote(`If ${email.trim()} is an admin, a code is on its way. Check your inbox and spam folder.`);
          })
        }
      >
        <Field label="Email" type="email" value={email} onChange={setEmail} icon={<Mail size={18} aria-hidden />} autoComplete="username" autoFocus inputMode="email" />
        {error && <p className="adm-error">{error}</p>}
        <Submit busy={busy} label="Send code" busyLabel="Sending…" />
        {back}
      </Card>
    );
  }

  if (view === 'reset') {
    return (
      <Card
        title="Set a new password"
        sub={`Enter the code we emailed to ${email} and choose a new password.`}
        onSubmit={() =>
          run(async () => {
            const problem = newPasswordProblem();
            if (problem) throw new Error(problem);
            await adminReset(email.trim(), code, password);
            go('login');
            setNote('Password changed. Sign in with your new password.');
          })
        }
      >
        {note && <p className="adm-auth__note">{note}</p>}
        <Field label="6-digit code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} icon={<ShieldCheck size={18} aria-hidden />} autoComplete="one-time-code" inputMode="numeric" autoFocus />
        <Field label="New password" type="password" value={password} onChange={setPassword} icon={<KeyRound size={18} aria-hidden />} autoComplete="new-password" placeholder="At least 8 characters" />
        <Field label="Repeat new password" type="password" value={confirm} onChange={setConfirm} icon={<KeyRound size={18} aria-hidden />} autoComplete="new-password" />
        {error && <p className="adm-error">{error}</p>}
        <Submit busy={busy} label="Change password" busyLabel="Saving…" />
        <button
          type="button"
          className="adm-link"
          onClick={() =>
            run(async () => {
              await adminForgot(email.trim());
              setNote('A new code is on its way.');
            })
          }
        >
          Send a new code
        </button>
        {back}
      </Card>
    );
  }

  if (view === 'invite') {
    return (
      <Card
        title="Accept your invitation"
        sub="Use the email that received the invitation and the code inside it, then choose your password."
        onSubmit={() =>
          run(async () => {
            if (!name.trim()) throw new Error('Enter your name.');
            const problem = newPasswordProblem();
            if (problem) throw new Error(problem);
            onSignedIn(await adminAcceptInvite(email.trim(), code, name.trim(), password));
          })
        }
      >
        <Field label="Email" type="email" value={email} onChange={setEmail} icon={<Mail size={18} aria-hidden />} autoComplete="username" inputMode="email" />
        <Field label="Invitation code" value={code} onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))} icon={<ShieldCheck size={18} aria-hidden />} autoComplete="one-time-code" inputMode="numeric" />
        <Field label="Your name" value={name} onChange={setName} autoComplete="name" placeholder="e.g. Amina Chinedu" />
        <Field label="Choose a password" type="password" value={password} onChange={setPassword} icon={<KeyRound size={18} aria-hidden />} autoComplete="new-password" placeholder="At least 8 characters" />
        <Field label="Repeat password" type="password" value={confirm} onChange={setConfirm} icon={<KeyRound size={18} aria-hidden />} autoComplete="new-password" />
        {error && <p className="adm-error">{error}</p>}
        <Submit busy={busy} label="Join the admin team" busyLabel="Joining…" />
        {back}
      </Card>
    );
  }

  return (
    <Card
      title="Admin"
      sub="Manage past questions, news and site content."
      onSubmit={() =>
        run(async () => {
          if (!email.trim() || !password) throw new Error('Enter your email and password.');
          onSignedIn(await adminLogin(email.trim(), password));
        })
      }
    >
      {note && <p className="adm-auth__note">{note}</p>}
      <Field label="Email" type="email" value={email} onChange={setEmail} icon={<Mail size={18} aria-hidden />} autoComplete="username" inputMode="email" />
      <Field label="Password" type="password" value={password} onChange={setPassword} icon={<KeyRound size={18} aria-hidden />} autoComplete="current-password" autoFocus />
      <button type="button" className="adm-link adm-auth__forgot" onClick={() => go('forgot')}>
        Forgot password?
      </button>
      {error && <p className="adm-error">{error}</p>}
      <Submit busy={busy} label="Sign in" busyLabel="Signing in…" />
      <button type="button" className="adm-link" onClick={() => go('invite')}>
        I have an invitation
      </button>
      <button type="button" className="adm-link" onClick={onExit}>
        Back to the website
      </button>
    </Card>
  );
};

/** Shown while an admin is on the default password: they must choose a new one. */
export const AdminChangePassword: React.FC<{
  admin: AdminAccount;
  onDone: (admin: AdminAccount) => void;
  onSignOut: () => void;
}> = ({ admin, onDone, onSignOut }) => {
  const [current, setCurrent] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  return (
    <Card
      title="Choose a new password"
      sub={`You’re signed in as ${admin.email} with the default password. Choose your own before continuing.`}
      onSubmit={() => {
        if (password.length < 8) return setError('Use at least 8 characters for the new password.');
        if (password !== confirm) return setError('The two passwords don’t match.');
        setBusy(true);
        setError('');
        adminChangePassword(current, password)
          .then(onDone)
          .catch((err: Error) => setError(err.message))
          .finally(() => setBusy(false));
      }}
    >
      <Field label="Current password" type="password" value={current} onChange={setCurrent} icon={<KeyRound size={18} aria-hidden />} autoComplete="current-password" autoFocus />
      <Field label="New password" type="password" value={password} onChange={setPassword} icon={<KeyRound size={18} aria-hidden />} autoComplete="new-password" placeholder="At least 8 characters" />
      <Field label="Repeat new password" type="password" value={confirm} onChange={setConfirm} icon={<KeyRound size={18} aria-hidden />} autoComplete="new-password" />
      {error && <p className="adm-error">{error}</p>}
      <Submit busy={busy} label="Save and continue" busyLabel="Saving…" />
      <button type="button" className="adm-link" onClick={onSignOut}>
        Sign out
      </button>
    </Card>
  );
};
