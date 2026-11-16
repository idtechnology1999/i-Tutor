import React, { useEffect, useRef, useState } from 'react';
import {
  CreditCard,
  DatabaseBackup,
  Download,
  GraduationCap,
  LoaderCircle,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Tag,
  TriangleAlert,
  Upload,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { cms } from '../../lib/cms';
import { checkAdmin } from '../../lib/question-import';
import { adminChangePassword } from '../../services/admin-auth';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';
import { ExamsCard } from './AdminExams';
import { BackupCard, ResetCard } from './AdminSystem';
import { PaymentsCard, PricesCard } from './AdminPayments';

/* Admin → Settings, in sections: a menu on the left (a row of tabs on phones)
   and one section at a time. The open section is in the address
   (/admin/settings#payments), so a link can open it directly. */

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

const SECTION_IDS = ['exams', 'payments', 'prices', 'ai', 'security', 'data', 'danger'] as const;
type SectionId = (typeof SECTION_IDS)[number];

const sectionFromHash = (): SectionId => SECTION_IDS.find((id) => window.location.hash === `#${id}`) ?? 'exams';

interface Section {
  id: SectionId;
  label: string;
  icon: LucideIcon;
  /** One line under the section title: what it's for. */
  about: string;
  body: React.ReactNode;
  danger?: boolean;
}

export const AdminSettings: React.FC<{ nav: AdminNav; mode: 'live' | 'demo' }> = ({ nav, mode }) => {
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<string>(
    mode === 'live' ? 'Connected to the AI backend.' : 'Not connected — imports use the built-in reader.',
  );
  const fileRef = useRef<HTMLInputElement>(null);

  // The open section follows the address, so Back/Forward and shared links work.
  const [section, setSection] = useState<SectionId>(sectionFromHash);
  useEffect(() => {
    const onHash = () => setSection(sectionFromHash());
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const pick = (id: SectionId) => {
    window.history.replaceState(null, '', `#${id}`);
    setSection(id);
  };

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

  const aiCard = (
    <section className="adm-card">
      <h2 className="adm-card__title">AI connection</h2>
      <p className="adm-muted">
        The AI that organises papers, writes practice questions and runs the tutor works on the server, so your keys stay private.
      </p>
      <div className="adm-status">
        <span className={`adm-mode is-${mode}`}>{mode === 'live' ? 'AI connected' : 'Demo mode'}</span>
        <span>{status}</span>
      </div>
      <button type="button" className="adm-btn" onClick={test} disabled={testing}>
        {testing && <LoaderCircle size={16} className="adm-spin" aria-hidden />} Test connection
      </button>
    </section>
  );

  // Demo mode keeps content in this browser, so its backup and reset work here.
  const demoBackup = (
    <section className="adm-card">
      <h2 className="adm-card__title">Backup</h2>
      <p className="adm-muted">Demo mode: content is saved in this browser. Download a backup to keep it or move it to another computer.</p>
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
  );
  const demoReset = (
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
  );

  const sections: Section[] = [
    { id: 'exams', label: 'Exams', icon: GraduationCap, about: 'Which exams students see, in what order, and how each one works.', body: <ExamsCard nav={nav} /> },
    ...(mode === 'live'
      ? [
          {
            id: 'payments' as const,
            label: 'Payments',
            icon: CreditCard,
            about: 'Paystack: take test payments while you check things, and real ones when you go live.',
            body: <PaymentsCard nav={nav} />,
          },
        ]
      : []),
    {
      id: 'prices',
      label: 'Plans & prices',
      icon: Tag,
      about: 'How much Premium costs. Checkout and every page that shows a price follow what you set here.',
      body: <PricesCard nav={nav} live={mode === 'live'} />,
    },
    { id: 'ai', label: 'AI', icon: Sparkles, about: 'The AI behind imports, practice questions, the tutor and the classroom.', body: aiCard },
    ...(mode === 'live'
      ? [{ id: 'security' as const, label: 'Security', icon: ShieldCheck, about: 'Your own admin password.', body: <PasswordCard nav={nav} /> }]
      : []),
    {
      id: 'data',
      label: 'Backup & data',
      icon: DatabaseBackup,
      about: 'Download everything as one file, or put it back from a backup.',
      body: mode === 'live' ? <BackupCard nav={nav} /> : demoBackup,
    },
    {
      id: 'danger',
      label: 'Danger zone',
      icon: TriangleAlert,
      danger: true,
      about: 'Changes that remove content for everyone. They can’t be undone without a backup.',
      body: mode === 'live' ? <ResetCard nav={nav} /> : demoReset,
    },
  ];
  const current = sections.find((x) => x.id === section) ?? sections[0]!;

  return (
    <div className="adm-page set-page">
      <PageHead title="Settings" sub="How i-Tutor runs: exams, payments and prices, AI, your password and backups." />
      <div className="set-layout">
        <nav className="set-nav" aria-label="Settings sections">
          {sections.map(({ id, label, icon: Icon, danger }) => (
            <button
              key={id}
              type="button"
              className={`set-nav__item${id === current.id ? ' is-on' : ''}${danger ? ' is-danger' : ''}`}
              aria-current={id === current.id ? 'page' : undefined}
              onClick={() => pick(id)}
            >
              <Icon size={17} aria-hidden /> <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className={`set-panel${current.danger ? ' is-danger' : ''}`} key={current.id}>
          <header className="set-panel__head">
            <h2>{current.label}</h2>
            <p>{current.about}</p>
          </header>
          {current.body}
        </div>
      </div>
    </div>
  );
};
