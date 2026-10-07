import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ChevronRight, Menu, MessageSquareText, X } from 'lucide-react';
import { useScrollDirection, useSheetDrag } from '../../lib/ui';
import type { UserProfile } from '../../types';
import type { AppView } from '../../lib/router';
import { pathForView, isAccountFlowView } from '../../lib/router';
import { BrandMark } from './BrandMark';

interface Props {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  profile: UserProfile;
  isTutorOpen: boolean;
  onToggleTutor: () => void;
}

const NAV_ITEMS: { label: string; view: AppView }[] = [
  { label: 'Home', view: 'home' },
  { label: 'CBT practice', view: 'cbt' },
  { label: 'Syllabus', view: 'syllabus' },
  { label: 'Dashboard', view: 'dashboard' },
];

/* In-page sections, only offered while the landing page is on screen. */
const HOME_ANCHORS = [
  { label: 'Features', href: '#features' },
  { label: 'Pricing', href: '#pricing' },
];

export const Navbar: React.FC<Props> = ({
  activeView,
  onChangeView,
  profile,
  isTutorOpen,
  onToggleTutor,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const inAccountFlow = isAccountFlowView(activeView);
  const onHome = activeView === 'home';
  const sheetRef = useRef<HTMLDivElement>(null);
  const { direction, atTop } = useScrollDirection();
  const tucked = direction === 'down' && !menuOpen && !isTutorOpen;
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useSheetDrag(sheetRef, menuOpen, closeMenu);

  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [menuOpen]);

  // Back/forward navigation can change the route without going through the
  // links below, so close the mobile panel when the browser moves underneath.
  useEffect(() => {
    const closeOnPopState = () => setMenuOpen(false);
    window.addEventListener('popstate', closeOnPopState);
    return () => window.removeEventListener('popstate', closeOnPopState);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    // Lets the page behind recede while the sheet is up, as iOS does.
    document.documentElement.classList.toggle('has-sheet', menuOpen);
    return () => {
      document.body.style.overflow = '';
      document.documentElement.classList.remove('has-sheet');
    };
  }, [menuOpen]);

  const go = (view: AppView) => {
    onChangeView(view);
    setMenuOpen(false);
  };

  const goToPath = (path: string) => {
    window.history.pushState({}, '', path);
    setMenuOpen(false);
    window.dispatchEvent(new PopStateEvent('popstate'));
  };

  const routeLink = (item: { label: string; view: AppView }) => (
    <a
      key={item.view}
      href={pathForView(item.view)}
      onClick={(event) => {
        event.preventDefault();
        goToPath(pathForView(item.view));
      }}
      className={`site-nav__link ${activeView === item.view ? 'is-active' : ''}`}
      aria-current={activeView === item.view ? 'page' : undefined}
    >
      {item.label}
    </a>
  );

  const anchorLinks = onHome
    ? HOME_ANCHORS.map((anchor) => (
        <a
          key={anchor.href}
          href={anchor.href}
          className="site-nav__link"
          onClick={() => setMenuOpen(false)}
        >
          {anchor.label}
        </a>
      ))
    : null;

  const authLink = inAccountFlow ? (
    <a
      href={pathForView('login')}
      onClick={(event) => {
        event.preventDefault();
        goToPath(pathForView('login'));
      }}
      className="site-btn site-btn--outline"
    >
      Log in
    </a>
  ) : (
    <a
      href={pathForView('signup')}
      onClick={(event) => {
        event.preventDefault();
        goToPath(pathForView('signup'));
      }}
      className="site-btn site-btn--primary"
    >
      Get started
    </a>
  );

  return (
    <>
    <header
      className={`site-nav${tucked ? ' is-tucked' : ''}${atTop ? ' is-top' : ''}`}
    >
      <div className="site-nav__inner">
        <button
          type="button"
          className="site-nav__brand"
          onClick={() => go('home')}
          aria-label="i-Teacher home"
        >
          <BrandMark />
        </button>

        <nav className="site-nav__links" aria-label="Primary">
          {NAV_ITEMS.map(routeLink)}
          {anchorLinks}
        </nav>

        <div className="site-nav__actions">
          <button
            type="button"
            onClick={onToggleTutor}
            className={`site-nav__tutor ${isTutorOpen ? 'is-open' : ''}`}
            aria-expanded={isTutorOpen}
          >
            {isTutorOpen ? <X size={16} aria-hidden /> : <MessageSquareText size={16} aria-hidden />}
            <span>{isTutorOpen ? 'Close tutor' : 'Ask tutor'}</span>
          </button>

          <span className="site-nav__auth">{authLink}</span>

          <button
            type="button"
            onClick={() => go('setup')}
            className="site-nav__avatar"
            title="Candidate profile and goals"
            aria-label="Candidate profile and goals"
          >
            {profile.fullName.charAt(0).toUpperCase() || 'A'}
          </button>

          <button
            type="button"
            className="site-nav__toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <X size={20} aria-hidden /> : <Menu size={20} aria-hidden />}
          </button>
        </div>
      </div>

    </header>

    {/* Mobile menu: an iOS-style bottom sheet over a frosted backdrop. It
        stays mounted so it can animate out; `inert` keeps it out of the tab
        order while closed. */}
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
        {[...NAV_ITEMS.map(routeLink), ...(anchorLinks ?? [])].map((link, index) => (
          <div
            className="sheet__row"
            key={index}
            style={{ ['--i' as string]: index }}
          >
            {link}
            <ChevronRight size={18} aria-hidden />
          </div>
        ))}
      </nav>
      <div className="sheet__cta">{authLink}</div>
    </div>
    </>
  );
};
