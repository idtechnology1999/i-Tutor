import React, { useEffect, useState } from 'react';
import {
  OwlBookLogo,
  SparklesIcon,
  MenuIcon,
  XIcon,
} from '../Icons';
import type { UserProfile } from '../../types';
import type { AppView } from '../../lib/router';
import { pathForView, isAccountFlowView } from '../../lib/router';

interface Props {
  activeView: AppView;
  onChangeView: (view: AppView) => void;
  profile: UserProfile;
  isTutorOpen: boolean;
  onToggleTutor: () => void;
}

const NAV_ITEMS: { label: string; view: AppView }[] = [
  { label: 'Overview', view: 'home' },
  { label: 'CBT Simulation', view: 'cbt' },
  { label: 'Syllabus', view: 'syllabus' },
  { label: 'Portal', view: 'dashboard' },
];

export const Navbar: React.FC<Props> = ({
  activeView,
  onChangeView,
  profile,
  isTutorOpen,
  onToggleTutor,
}) => {
  const [menuOpen, setMenuOpen] = useState(false);
  // The header is identical on every route. Anything route-specific lives in
  // the page body, not in the bar itself.
  const inAccountFlow = isAccountFlowView(activeView);

  // Back/forward navigation can change the route without going through the
  // links below, so close the mobile panel when the browser moves underneath.
  useEffect(() => {
    const closeOnPopState = () => setMenuOpen(false);
    window.addEventListener('popstate', closeOnPopState);
    return () => window.removeEventListener('popstate', closeOnPopState);
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
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

  return (
    <header className="web-navbar">
      <div className="web-navbar__inner">
        <div className="nav-left">
          <button
            type="button"
            className="brand-logo-wrap"
            onClick={() => go('home')}
            aria-label="Go to overview"
          >
            <span className="brand-mark">
              <OwlBookLogo size={36} plain />
            </span>
            <span className="brand-text-block">
              <span className="brand-text-name">i-Tutor</span>
              <span className="brand-sub-badge">WAEC &middot; NECO &middot; UTME</span>
            </span>
          </button>

          <nav className="nav-links" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <a
                key={item.view}
                href={pathForView(item.view)}
                onClick={(event) => {
                  event.preventDefault();
                  goToPath(pathForView(item.view));
                }}
                className={`nav-link-btn ${activeView === item.view ? 'active' : ''}`}
                aria-current={activeView === item.view ? 'page' : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="nav-right">
          <button
            type="button"
            onClick={onToggleTutor}
            className="btn-tutor-trigger"
            aria-expanded={isTutorOpen}
          >
            <SparklesIcon size={14} color={isTutorOpen ? '#D97706' : '#0E3B3A'} />
            {isTutorOpen ? 'Close tutor' : 'Ask AI tutor'}
          </button>

          {inAccountFlow ? (
            <a
              href={pathForView('login')}
              onClick={(event) => {
                event.preventDefault();
                goToPath(pathForView('login'));
              }}
              className="btn btn--outline btn--sm"
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
              className="btn btn--primary btn--sm nav-cta"
            >
              Register
            </a>
          )}

          <div className="nav-account">
            <button
              type="button"
              onClick={() => go('setup')}
              className="avatar-btn"
              title="Candidate profile and goals"
            >
              <span className="avatar-circle">
                {profile.fullName.charAt(0).toUpperCase() || 'A'}
              </span>
            </button>
          </div>

          <button
            type="button"
            className="nav-mobile-toggle"
            onClick={() => setMenuOpen((open) => !open)}
            aria-label={menuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={menuOpen}
          >
            {menuOpen ? <XIcon size={18} /> : <MenuIcon size={18} />}
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="nav-mobile-panel">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.view}
              href={pathForView(item.view)}
              onClick={(event) => {
                event.preventDefault();
                goToPath(pathForView(item.view));
              }}
              className={`nav-link-btn ${activeView === item.view ? 'active' : ''}`}
            >
              {item.label}
            </a>
          ))}

          <div className="nav-mobile-cta">
            {inAccountFlow ? (
              <a
                href={pathForView('login')}
                onClick={(event) => {
                  event.preventDefault();
                  goToPath(pathForView('login'));
                }}
                className="btn btn--primary btn--block"
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
                className="btn btn--primary btn--block"
              >
                Register
              </a>
            )}
            <a
              href={pathForView('diagnostic')}
              onClick={(event) => {
                event.preventDefault();
                goToPath(pathForView('diagnostic'));
              }}
              className="btn btn--outline btn--block"
            >
              Take the 10-minute diagnostic
            </a>
          </div>
        </div>
      )}
    </header>
  );
};
