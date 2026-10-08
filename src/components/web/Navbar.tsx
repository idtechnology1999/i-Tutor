import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  BookOpenCheck,
  ChevronRight,
  ClipboardList,
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

interface Props {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  profile: UserProfile;
  isTutorOpen: boolean;
  onToggleTutor: () => void;
}

/* Signed-in destinations. Same four everywhere: top bar on desktop, tab bar
   on phones. Plain words, one icon each. */
const APP_TABS: { label: string; short: string; view: AppView; icon: typeof House }[] = [
  { label: 'Home', short: 'Home', view: 'dashboard', icon: House },
  { label: 'Practice exam', short: 'Practice', view: 'cbt', icon: ClipboardList },
  { label: 'Past questions', short: 'Questions', view: 'syllabus', icon: BookOpenCheck },
  { label: 'Post-UTME', short: 'Post-UTME', view: 'postutme', icon: Landmark },
];

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
              {APP_TABS.map((tab) => (
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
                <span aria-label="My profile">{initial}</span>
              </RouteLink>
            </div>
          </div>
        </header>

        {/* Phone tab bar */}
        <nav className="tabbar" aria-label="Main">
          {APP_TABS.map(({ view, short, icon: Icon }) => (
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
      <header className={`site-nav${atTop ? ' is-top' : ''}`}>
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
