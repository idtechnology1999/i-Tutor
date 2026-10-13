import React, { useEffect, useState } from 'react';
import {
  ArrowUpRight,
  BookOpenCheck,
  GraduationCap,
  Landmark,
  LayoutDashboard,
  ListChecks,
  LogOut,
  Newspaper,
  ScanText,
  ShieldCheck,
  Settings,
  UsersRound,
  UserRoundCog,
  Workflow,
} from 'lucide-react';
import { BrandMark } from '../web/BrandMark';
import { browserOnlyQuestions, onCmsError, syncQuestions, uploadBrowserQuestions, useCms } from '../../lib/cms';
import type { CmsSubject, ExamType } from '../../lib/cms';
import { AdminOverview } from './AdminOverview';
import { AdminQuestions } from './AdminQuestions';
import { AdminPractice } from './AdminPractice';
import { AdminImport } from './AdminImport';
import { AdminNews } from './AdminNews';
import { AdminSettings } from './AdminSettings';
import { AdminCourses } from './AdminCourses';
import { AdminPostUtme } from './AdminPostUtme';
import { AdminAuto } from './AdminAuto';
import { AdminUsers } from './AdminUsers';
import { AdminTeam } from './AdminTeam';
import { AdminAdmins } from './AdminAdmins';
import { AdminAuth, AdminChangePassword } from './AdminAuth';
import { adminLogout, currentAdminAccount } from '../../services/admin-auth';
import type { AdminAccount } from '../../services/admin-auth';
import { isLive } from '../../services/api';

export type Section = 'overview' | 'questions' | 'practice' | 'import' | 'postutme' | 'courses' | 'news' | 'users' | 'team' | 'admins' | 'settings';
export type QuestionFilter = 'all' | 'published' | 'draft' | 'review';

/** Which part of the bank is open: a subject (or All) and a year (or all years). */
export interface BankScope {
  exam: ExamType;
  /** Post-UTME only. */
  school: string;
  subject: string;
  year: number | null;
}

/** Subject and year handed to the importer from the bank. */
export interface ImportPreset {
  exam: ExamType;
  school: string;
  subject: CmsSubject;
  year: number | null;
  /** Pre-filled request for the AI, e.g. "Set 40 questions on animal production". */
  request?: string;
}

export interface AdminNav {
  go: (section: Section, opts?: { filter?: QuestionFilter; scope?: BankScope; preset?: ImportPreset | null }) => void;
  notify: (message: string) => void;
}

const NAV: Array<{ id: Section; label: string; icon: typeof LayoutDashboard }> = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'questions', label: 'Past questions', icon: BookOpenCheck },
  { id: 'practice', label: 'Practice questions', icon: ListChecks },
  { id: 'import', label: 'Import with AI', icon: ScanText },
  { id: 'postutme', label: 'Post-UTME', icon: Landmark },
  { id: 'courses', label: 'Courses', icon: GraduationCap },
  { id: 'news', label: 'News', icon: Newspaper },
  { id: 'users', label: 'Users', icon: UsersRound },
  { id: 'team', label: 'Team', icon: UserRoundCog },
  { id: 'admins', label: 'Admins', icon: ShieldCheck },
  { id: 'settings', label: 'Settings', icon: Settings },
];

/** Each section has its own address under /admin. */
const SECTION_PATH: Record<Section, string> = {
  overview: '/admin',
  questions: '/admin/past-questions',
  practice: '/admin/practice',
  import: '/admin/import',
  postutme: '/admin/post-utme',
  courses: '/admin/courses',
  news: '/admin/news',
  users: '/admin/users',
  team: '/admin/team',
  admins: '/admin/admins',
  settings: '/admin/settings',
};

const sectionForPath = (path: string): Section => {
  const clean = path.toLowerCase().replace(/\/+$/, '');
  const hit = (Object.keys(SECTION_PATH) as Section[]).find((k) => SECTION_PATH[k] === clean);
  return hit ?? 'overview';
};
const MODE_KEY = 'itutor-admin-mode';

/* ----------------------------------------------------------------- Shell */

export const AdminApp: React.FC<{
  path: string;
  navigate: (to: string) => void;
  onExit: () => void;
}> = ({ path, navigate, onExit }) => {
  // Live: the signed-in admin (undefined while checking). Demo: no backend.
  const [account, setAccount] = useState<AdminAccount | null | undefined>(isLive ? undefined : null);
  const [demo, setDemo] = useState(() => {
    try {
      return !isLive && window.sessionStorage.getItem(MODE_KEY) === 'demo';
    } catch {
      return false;
    }
  });
  const mode: 'live' | 'demo' = demo ? 'demo' : 'live';

  useEffect(() => {
    if (isLive) void currentAdminAccount().then(setAccount);
  }, []);
  // Signed in: load the whole bank, drafts included.
  const signedIn = Boolean(account);
  useEffect(() => {
    if (signedIn) void syncQuestions('admin');
  }, [signedIn]);
  // The address is the source of truth: /admin/settings shows Settings, and
  // back/forward move between sections.
  const section = sectionForPath(path);
  const [questionFilter, setQuestionFilter] = useState<QuestionFilter>('all');
  const [bankScope, setBankScope] = useState<BankScope>({ exam: 'UTME', school: '', subject: 'English', year: null });
  const [importPreset, setImportPreset] = useState<{ value: ImportPreset | null; n: number }>({ value: null, n: 0 });
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const [autoOpen, setAutoOpen] = useState(false);

  // Ctrl/⌘ + K opens i-Auto from anywhere in the admin; Esc closes it.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setAutoOpen((o) => !o);
      } else if (e.key === 'Escape') {
        setAutoOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  const { questions } = useCms();
  const toCheck = questions.filter((q) => q.needsReview || q.status === 'draft');
  const reviewCount = toCheck.filter((q) => q.examType !== 'Practice').length;
  const practiceCount = toCheck.length - reviewCount;

  useEffect(() => {
    window.scrollTo({ top: 0 });
  }, [section]);

  // Changes the server refused (e.g. a duplicate paper) are reported, then the bank reloads.
  useEffect(() => onCmsError((text) => setToast((prev) => ({ id: (prev?.id ?? 0) + 1, text }))), []);

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
      navigate(SECTION_PATH[next]);
    },
    notify: (text) => setToast((prev) => ({ id: (prev?.id ?? 0) + 1, text })),
  };

  const enterDemo = () => {
    try {
      window.sessionStorage.setItem(MODE_KEY, 'demo');
    } catch {
      /* ignore */
    }
    setDemo(true);
  };

  const signOut = () => {
    if (isLive) void adminLogout().catch(() => undefined);
    try {
      window.sessionStorage.removeItem(MODE_KEY);
    } catch {
      /* ignore */
    }
    setDemo(false);
    setAccount(null);
  };

  if (isLive && account === undefined) return <div className="adm-signin" aria-busy="true" />;
  if (!demo && !account) return <AdminAuth onSignedIn={setAccount} onDemo={enterDemo} onExit={onExit} />;
  if (account?.mustChangePassword) return <AdminChangePassword admin={account} onDone={setAccount} onSignOut={signOut} />;

  // Only the super admin sees (and may open) Admins.
  const isSuper = account?.role === 'superadmin';
  const navItems = NAV.filter((n) => n.id !== 'admins' || isSuper);

  return (
    <div className="adm">
      <aside className="adm-side">
        <div className="adm-side__brand">
          <BrandMark />
          <span className="adm-side__tag">Admin</span>
        </div>
        <button type="button" className="adm-side__auto" onClick={() => setAutoOpen(true)}>
          <Workflow size={18} aria-hidden />
          <span>i-Auto</span>
          <kbd>Ctrl K</kbd>
        </button>
        <nav className="adm-side__nav" aria-label="Admin">
          {navItems.map(({ id, label, icon: Icon }) => (
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
              {id === 'practice' && practiceCount > 0 && <b className="adm-side__count">{practiceCount}</b>}
            </button>
          ))}
        </nav>
        <div className="adm-side__foot">
          {account && (
            <span className="adm-side__me">
              <strong>{account.name || account.email}</strong>
              <small>{account.role === 'superadmin' ? 'Super admin' : 'Admin'}</small>
            </span>
          )}
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
        {mode === 'live' && <BrowserQuestionsBanner nav={nav} />}
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
        {section === 'practice' && <AdminPractice nav={nav} />}
        {section === 'import' && <AdminImport key={importPreset.n} nav={nav} preset={importPreset.value} />}
        {section === 'postutme' && <AdminPostUtme nav={nav} />}
        {section === 'courses' && <AdminCourses nav={nav} />}
        {section === 'news' && <AdminNews nav={nav} />}
        {section === 'users' && <AdminUsers nav={nav} mode={mode} />}
        {section === 'team' && <AdminTeam nav={nav} />}
        {section === 'admins' && account && isSuper && <AdminAdmins nav={nav} me={account} />}
        {section === 'settings' && <AdminSettings nav={nav} mode={mode} />}
      </main>

      {!autoOpen && (
        <button type="button" className="auto-fab" onClick={() => setAutoOpen(true)} aria-label="Open i-Auto">
          <Workflow size={20} aria-hidden />
          <span>i-Auto</span>
        </button>
      )}
      <AdminAuto open={autoOpen} onClose={() => setAutoOpen(false)} nav={nav} />

      {toast && (
        <div className="adm-toast" key={toast.id} role="status">
          {toast.text}
        </div>
      )}
    </div>
  );
};

/** Live: offers to upload questions an admin saved in this browser before the
    site used the database, so students can see them. */
const BrowserQuestionsBanner: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  useCms(); // re-check after every change to the bank
  const [busy, setBusy] = useState(false);
  const pending = isLive ? browserOnlyQuestions() : [];
  if (!pending.length) return null;
  const upload = () => {
    setBusy(true);
    void uploadBrowserQuestions()
      .then((r) =>
        nav.notify(
          r.failed
            ? `Uploaded ${r.uploaded}. ${r.failed} couldn’t be uploaded: ${r.error ?? 'try again'}.`
            : `Uploaded ${r.uploaded} question${r.uploaded === 1 ? '' : 's'} to the database.`,
        ),
      )
      .finally(() => setBusy(false));
  };
  return (
    <div className="adm-note adm-banner adm-upload-banner" role="status">
      <div>
        <strong>
          {pending.length} question{pending.length === 1 ? ' is' : 's are'} saved only in this browser.
        </strong>{' '}
        Students can’t see {pending.length === 1 ? 'it' : 'them'} until {pending.length === 1 ? 'it’s' : 'they’re'} in the database. Drafts stay
        drafts.
      </div>
      <button type="button" className="adm-btn adm-btn--primary" onClick={upload} disabled={busy}>
        {busy ? 'Uploading…' : 'Upload to database'}
      </button>
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
