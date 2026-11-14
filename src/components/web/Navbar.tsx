import React, { useCallback, useEffect, useRef, useState } from 'react';
import { isLiveExam } from '../../lib/exams';
import {
  BookOpenCheck,
  ChevronRight,
  ClipboardList,
  GraduationCap,
  House,
  Landmark,
  LockOpen,
  Menu,
  MessageSquareText,
  UserRound,
  X,
} from 'lucide-react';
import type { UserProfile } from '../../types';
import type { AppView } from '../../lib/router';
import { pathForView, isAppView } from '../../lib/router';
import { useScrollDirection, useSheetDrag } from '../../lib/ui';
import { BrandMark } from './BrandMark';
import { creditLevel, useCredits } from '../../services/credits';
import type { Credits } from '../../services/credits';

interface Props {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  profile: UserProfile;
  isTutorOpen: boolean;
  onToggleTutor: () => void;
}

/* Signed-in destinations. Same four everywhere: top bar on desktop, tab bar
   on phones. Plain words, one icon each. */
/* `phone: false` keeps a tab off the phone tab bar, which only fits six
   items; Post-UTME stays one tap away on the dashboard. */
const APP_TABS: { label: string; short: string; view: AppView; icon: typeof House; phone?: boolean }[] = [
  { label: 'Home', short: 'Home', view: 'dashboard', icon: House },
  { label: 'JAMB Exam', short: 'Exam', view: 'cbt', icon: ClipboardList },
  { label: 'Past questions', short: 'Questions', view: 'syllabus', icon: BookOpenCheck },
  { label: 'Classroom', short: 'Class', view: 'classroom', icon: GraduationCap },
  { label: 'Post-UTME', short: 'Post-UTME', view: 'postutme', icon: Landmark, phone: false },
];

/** Post-UTME's tab only while Post-UTME is switched on (Admin → Settings → Exams). */
const tabOn = (t: { view: AppView }) => t.view !== 'postutme' || isLiveExam('Post-UTME');

/* Visitor links on the landing page. */
const HOME_ANCHORS = [
  { label: 'Features', href: '#features' },
  { label: 'How it works', href: '#how' },
  { label: 'Pricing', href: '#pricing' },
  { label: 'News', href: '#news' },
];

const goToPath = (path: string) => {
  window.history.pushState({}, '', path);
  window.dispatchEvent(new PopStateEvent('popstate'));
};

const RouteLink: React.FC<{
  view: AppView;
  active: boolean;
  className: string;
  onNavigate?: () => void;
  children: React.ReactNode;
}> = ({ view, active, className, onNavigate, children }) => (
  <a
    href={pathForView(view)}
    onClick={(event) => {
      event.preventDefault();
      onNavigate?.();
      goToPath(pathForView(view));
    }}
    className={`${className}${active ? ' is-active' : ''}`}
    aria-current={active ? 'page' : undefined}
  >
    {children}
  </a>
);

/** The profile circle doubles as the AI allowance ring: what's left, in the
    same green / orange / red as the ring in the tutor. */
const AvatarRing: React.FC<{ credits: Credits }> = ({ credits }) => {
  // 46px box, 3px stroke on radius 21.5: the ring's inside edge is exactly
  // the 40px profile circle, so the two sit flush.
  const r = 21.5;
  const length = 2 * Math.PI * r;
  const share = credits.total ? Math.min(1, credits.left / credits.total) : 0;
  return (
    <svg className={`avatar-ring is-${creditLevel(credits)}`} width="46" height="46" viewBox="0 0 46 46" aria-hidden>
      <circle className="avatar-ring__track" cx="23" cy="23" r={r} />
      <circle className="avatar-ring__bar" cx="23" cy="23" r={r} strokeDasharray={length} strokeDashoffset={length * (1 - share)} />
    </svg>
  );
};

export const Navbar: React.FC<Props> = ({
  activeView,
  onChangeView,
  profile,
  isTutorOpen,
  onToggleTutor,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const inApp = isAppView(activeView);
  const onHome = activeView === 'home';
  const isPremium = profile.plan === 'premium';
  const sheetRef = useRef<HTMLDivElement>(null);
  // The header stays put (sticky) while scrolling; it only gains a shadow once off the top.
  const { atTop } = useScrollDirection();
  const closeMenu = useCallback(() => setMenuOpen(false), []);
  const initial = profile.fullName.charAt(0).toUpperCase() || 'A';
  const credits = useCredits();
  const creditNote = credits
    ? credits.plan === 'premium'
      ? `, ${credits.left} of ${credits.total} AI credits left`
      : `, ${credits.left} of ${credits.total} free AI prompts left`
    : '';

  useSheetDrag(sheetRef, menuOpen, closeMenu);

  useEffect(() => {
    const closeOnPopState = () => setMenuOpen(false);
    window.addEventListener('popstate', closeOnPopState);
    return () => window.removeEventListener('popstate', closeOnPopState);
  }, []);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    document.documentElement.classList.toggle('has-sheet', menuOpen);
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('has-sheet');
    };
  }, [menuOpen]);

  /* --------------------------------------------------------- Signed in */
  if (inApp) {
    return (
      <>
        <header className={`site-nav site-nav--app${atTop ? ' is-top' : ''}`}>
          <div className="site-nav__inner">
            <button
              type="button"
              className="site-nav__brand"
              onClick={() => onChangeView('dashboard')}
              aria-label="i-Tutor home"
            >
              <BrandMark />
            </button>

            <nav className="site-nav__links" aria-label="Main">
              {APP_TABS.filter(tabOn).map((tab) => (
                <RouteLink
                  key={tab.view}
                  view={tab.view}
                  active={activeView === tab.view}
                  className="site-nav__link"
                >
                  {tab.label}
                </RouteLink>
              ))}
            </nav>

            <div className="site-nav__actions">
              <button
                type="button"
                onClick={onToggleTutor}
                className={`site-nav__tutor site-nav__desk${isTutorOpen ? ' is-open' : ''}`}
                aria-expanded={isTutorOpen}
              >
                <MessageSquareText size={16} aria-hidden />
                <span>Ask tutor</span>
              </button>

              {isPremium ? (
                <span className="site-nav__premium">Premium</span>
              ) : (
                <RouteLink view="upgrade" active={activeView === 'upgrade'} className="site-nav__upgrade">
                  <LockOpen size={15} aria-hidden />
                  Upgrade
                </RouteLink>
              )}

              <RouteLink
                view="setup"
                active={activeView === 'setup'}
                className="site-nav__avatar site-nav__desk"
              >
                {credits && <AvatarRing credits={credits} />}
                <span aria-label={`My profile${creditNote}`} title={`My profile${creditNote}`}>
                  {initial}
                </span>
              </RouteLink>
            </div>
          </div>
        </header>

        {/* Phone tab bar */}
        <nav className="tabbar" aria-label="Main">
          {APP_TABS.filter((t) => tabOn(t) && t.phone !== false).map(({ view, short, icon: Icon }) => (
            <RouteLink key={view} view={view} active={activeView === view} className="tabbar__item">
              <Icon size={22} aria-hidden />
              <span>{short}</span>
            </RouteLink>
          ))}
          <button
            type="button"
            className={`tabbar__item${isTutorOpen ? ' is-active' : ''}`}
            onClick={onToggleTutor}
            aria-expanded={isTutorOpen}
          >
            <MessageSquareText size={22} aria-hidden />
            <span>Tutor</span>
          </button>
          <RouteLink view="setup" active={activeView === 'setup'} className="tabbar__item">
            <UserRound size={22} aria-hidden />
            <span>Me</span>
          </RouteLink>
        </nav>
      </>
    );
  }

  /* ----------------------------------------------------------- Visitor */
  const onLogin = activeView === 'login';
  const authActions = (
    <>
      {!onLogin && (
        <RouteLink view="login" active={false} className="site-btn site-btn--quiet" onNavigate={closeMenu}>
          Log in
        </RouteLink>
      )}
      <RouteLink view="signup" active={false} className="site-btn site-btn--primary" onNavigate={closeMenu}>
        {onLogin ? 'Create account' : 'Get started free'}
      </RouteLink>
    </>
  );

  return (
    <>
      <header className={`site-nav site-nav--visitor${atTop ? ' is-top' : ''}`}>
        <div className="site-nav__inner">
          <button
            type="button"
            className="site-nav__brand"
            onClick={() => onChangeView('home')}
            aria-label="i-Tutor home"
          >
            <BrandMark />
          </button>

          <nav className="site-nav__links" aria-label="Primary">
            {onHome &&
              HOME_ANCHORS.map((anchor) => (
                <a key={anchor.href} href={anchor.href} className="site-nav__link">
                  {anchor.label}
                </a>
              ))}
          </nav>

          <div className="site-nav__actions">
            <button
              type="button"
              onClick={onToggleTutor}
              className={`site-nav__ask${isTutorOpen ? ' is-open' : ''}`}
              aria-expanded={isTutorOpen}
            >
              <MessageSquareText size={16} aria-hidden />
              <span>Ask AI</span>
            </button>
            <span className="site-nav__auth">{authActions}</span>
            {onHome && (
              <button
                type="button"
                className="site-nav__toggle"
                onClick={() => setMenuOpen((open) => !open)}
                aria-label={menuOpen ? 'Close menu' : 'Open menu'}
                aria-expanded={menuOpen}
              >
                {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
              </button>
            )}
          </div>
        </div>
      </header>

      {onHome && (
        <>
          <div
            className={`sheet-backdrop${menuOpen ? ' is-open' : ''}`}
            onClick={closeMenu}
            aria-hidden
          />
          <div
            ref={sheetRef}
            className={`sheet${menuOpen ? ' is-open' : ''}`}
            role="dialog"
            aria-modal="true"
            aria-label="Menu"
            inert={!menuOpen}
          >
            <div className="sheet__handle" data-sheet-handle>
              <span />
            </div>
            <nav className="sheet__list" aria-label="Mobile">
              {HOME_ANCHORS.map((anchor, index) => (
                <div className="sheet__row" key={anchor.href} style={{ ['--i' as string]: index }}>
                  <a href={anchor.href} className="site-nav__link" onClick={closeMenu}>
                    {anchor.label}
                  </a>
                  <ChevronRight size={18} aria-hidden />
                </div>
              ))}
            </nav>
            <div className="sheet__cta">{authActions}</div>
          </div>
        </>
      )}
    </>
  );
};
