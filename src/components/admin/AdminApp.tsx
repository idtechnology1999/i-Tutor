import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpenCheck,
  KeyRound,
  LayoutDashboard,
  LoaderCircle,
  LogOut,
  Newspaper,
  ScanText,
  Settings,
} from 'lucide-react';
import { BrandMark } from '../web/BrandMark';
import { adminKey, checkAdmin } from '../../lib/question-import';
import { useCms } from '../../lib/cms';
import type { CmsSubject } from '../../lib/cms';
import { AdminOverview } from './AdminOverview';
import { AdminQuestions } from './AdminQuestions';
import { AdminImport } from './AdminImport';
import { AdminNews } from './AdminNews';
import { AdminSettings } from './AdminSettings';

export type Section = 'overview' | 'questions' | 'import' | 'news' | 'settings';
export type QuestionFilter = 'all' | 'published' | 'draft' | 'review';

/** Which part of the bank is open: a subject (or All) and a year (or all years). */
export interface BankScope {
  subject: string;
  year: number | null;
}

/** Subject and year handed to the importer from the bank. */
export interface ImportPreset {
  subject: CmsSubject;
  year: number | null;
}

export interface AdminNav {
  go: (section: Section, opts?: { filter?: QuestionFilter; scope?: BankScope; preset?: ImportPreset | null }) => void;
  notify: (message: string) => void;
}

const NAV: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'questions', label: 'Past questions', icon: BookOpenCheck },
  { id: 'import', label: 'Import with AI', icon: ScanText },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const SECTION_KEY = 'itutor-admin-section';
const MODE_KEY = 'itutor-admin-mode';

/* --------------------------------------------------------------- Sign-in */

const SignIn: React.FC<{ onIn: (mode: 'live' | 'demo') => void; onExit: () => void }> = ({ onIn, onExit }) => {
  const [key, setKey] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!key.trim()) {
      setError('Enter your admin key.');
      return;
    }
    setBusy(true);
    setError('');
    const result = await checkAdmin(key.trim());
    setBusy(false);
    if (result.status === 'wrong') {
      setError('That admin key is not right.');
      return;
    }
    adminKey.set(key.trim());
    onIn(result.status === 'ok' ? 'live' : 'demo');
  };

  return (
    <div className="adm-signin">
      <form className="adm-signin__card" onSubmit={submit} noValidate>
        <BrandMark />
        <h1>Admin</h1>
        <p>Manage past questions, news and site content.</p>
        <label className="adm-field">
          <span>Admin key</span>
          <div className="adm-input adm-input--icon">
            <KeyRound size={18} aria-hidden />
            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Enter your admin key"
              autoComplete="current-password"
              autoFocus
            />
          </div>
        </label>
        {error && <p className="adm-error">{error}</p>}
        <button type="submit" className="adm-btn adm-btn--primary adm-btn--block" disabled={busy}>
          {busy ? <LoaderCircle size={18} className="adm-spin" aria-hidden /> : null}
          {busy ? 'Checking…' : 'Sign in'}
        </button>
        <button type="button" className="adm-link" onClick={onExit}>
          Back to the website
        </button>
      </form>
    </div>
  );
};

/* ----------------------------------------------------------------- Shell */

export const AdminApp: React.FC<{ onExit: () => void }> = ({ onExit }) => {
  const [mode, setMode] = useState<'live' | 'demo' | null>(() => {
    try {
      return (window.sessionStorage.getItem(MODE_KEY) as 'live' | 'demo' | null) ?? null;
    } catch {
      return null;
    }
  });
  const [section, setSection] = useState<Section>(() => {
    try {
      return (window.sessionStorage.getItem(SECTION_KEY) as Section) || 'overview';
    } catch {
      return 'overview';
    }
  });
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('all');
  const [bankScope, setBankScope] = useState<BankScope>({ subject: 'English', year: null });
  const [importPreset, setImportPreset] = useState<{ value: ImportPreset | null; n: number }>({ value: null, n: 0 });
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const { questions } = useCms();
  const reviewCount = questions.filter((q) => q.needsReview || q.status === 'draft').length;

  useEffect(() => {
    try {
      window.sessionStorage.setItem(SECTION_KEY, section);
    } catch {
      /* ignore */
    }
    window.scrollTo({ top: 0 });
  }, [section]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const nav: AdminNav = {
    go: (next, opts) => {
      if (opts?.filter) setQuestionFilter(opts.filter);
      if (opts?.scope) setBankScope(opts.scope);
      if (next === 'import') setImportPreset((p) => ({ value: opts?.preset ?? null, n: p.n + 1 }));
      setSection(next);
    },
    notify: (text) => setToast((prev) => ({ id: (prev?.id ?? 0) + 1, text })),
  };

  const signIn = (m: 'live' | 'demo') => {
    try {
      window.sessionStorage.setItem(MODE_KEY, m);
    } catch {
      /* ignore */
    }
    setMode(m);
  };

  const signOut = () => {
    adminKey.clear();
    try {
      window.sessionStorage.removeItem(MODE_KEY);
    } catch {
      /* ignore */
    }
    setMode(null);
  };

  if (!mode) return <SignIn onIn={signIn} onExit={onExit} />;

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-side__brand">
          <BrandMark />
          <span className="adm-side__tag">Admin</span>
        </div>
        <nav className="adm-side__nav" aria-label="Admin">
          {NAV.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              className={`adm-side__item${section === id ? ' is-on' : ''}`}
              aria-current={section === id ? 'page' : undefined}
              onClick={() => nav.go(id)}
            >
              <Icon size={18} aria-hidden />
              <span>{label}</span>
              {id === 'questions' && reviewCount > 0 && <b className="adm-side__count">{reviewCount}</b>}
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          <span className={`adm-mode is-${mode}`}>{mode === 'live' ? 'AI connected' : 'Demo mode'}</span>
          <button type="button" className="adm-side__item" onClick={onExit}>
            <ArrowUpRight size={18} aria-hidden />
            <span>View website</span>
          </button>
          <button type="button" className="adm-side__item" onClick={signOut}>
            <LogOut size={18} aria-hidden />
            <span>Sign out</span>
          </button>
        </div>
      </aside>

      <main className="adm-main">
        {section === 'overview' && <AdminOverview nav={nav} mode={mode} />}
        {section === 'questions' && (
          <AdminQuestions
            nav={nav}
            filter={questionFilter}
            onFilter={setQuestionFilter}
            scope={bankScope}
            onScope={setBankScope}
          />
        )}
        {section === 'import' && <AdminImport key={importPreset.n} nav={nav} preset={importPreset.value} />}
        {section === 'news' && <AdminNews nav={nav} />}
        {section === 'settings' && <AdminSettings nav={nav} mode={mode} />}
      </main>

      {toast && (
        <div className="adm-toast" key={toast.id} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
};

/* -------------------------------------------------------- Shared bits */

export const PageHead: React.FC<{ title: string; sub?: string; actions?: React.ReactNode }> = ({
  title,
  sub,
  actions,
}) => (
  <header className="adm-head">
    <div>
      <h1>{title}</h1>
      {sub && <p>{sub}</p>}
    </div>
    {actions && <div className="adm-head__actions">{actions}</div>}
  </header>
);

export const StatusChip: React.FC<{ status: 'published' | 'draft'; review?: boolean }> = ({ status, review }) =>
  review ? (
    <span className="adm-chip is-review">Needs review</span>
  ) : status === 'published' ? (
    <span className="adm-chip is-live">Published</span>
  ) : (
    <span className="adm-chip is-draft">Draft</span>
  );
