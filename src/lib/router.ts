import { useCallback, useEffect, useState } from 'react';
import { withViewTransition } from './ui';

/**
 * Minimal History API router.
 *
 * The app has one entry point per view, so a full routing library is more
 * dependency than this needs. This maps a path to a view id, keeps the address
 * bar in sync, and handles back/forward via `popstate`.
 */

export type AppView =
  | 'home'
  | 'dashboard'
  | 'cbt'
  | 'syllabus'
  | 'setup'
  // Account
  | 'signup'
  | 'otp'
  | 'login'
  | 'forgot'
  | 'reset'
  // Onboarding
  | 'track'
  | 'subjects'
  | 'institution'
  | 'goals'
  | 'permissions'
  | 'baseline';

export const VIEW_PATHS: Record<AppView, string> = {
  home: '/',
  cbt: '/cbt-simulation',
  syllabus: '/syllabus',
  dashboard: '/dashboard',
  setup: '/setup',
  signup: '/register',
  otp: '/verify',
  login: '/login',
  forgot: '/forgot-password',
  reset: '/reset-password',
  track: '/onboarding/track',
  subjects: '/onboarding/subjects',
  institution: '/onboarding/institution',
  goals: '/onboarding/goals',
  permissions: '/onboarding/permissions',
  baseline: '/onboarding/baseline',
};

export type AccountView =
  | 'signup'
  | 'otp'
  | 'login'
  | 'forgot'
  | 'reset'
  | 'track'
  | 'subjects'
  | 'institution'
  | 'goals'
  | 'permissions'
  | 'baseline';

const ACCOUNT_VIEWS: ReadonlySet<AppView> = new Set<AccountView>([
  'signup',
  'otp',
  'login',
  'forgot',
  'reset',
  'track',
  'subjects',
  'institution',
  'goals',
  'permissions',
  'baseline',
]);

/** True for the registration and onboarding sequence (A04–A14). */
export const isAccountFlowView = (view: AppView): view is AccountView =>
  ACCOUNT_VIEWS.has(view);

const PATH_VIEWS: Record<string, AppView> = Object.entries(VIEW_PATHS).reduce(
  (acc, [view, path]) => {
    acc[path] = view as AppView;
    acc[path.toLowerCase()] = view as AppView;
    return acc;
  },
  {} as Record<string, AppView>,
);

/** Legacy / hand-typed variants we still answer to, so old links keep working. */
const ALIASES: Record<string, AppView> = {
  '/cbt': 'cbt',
  '/cbt_simulation': 'cbt',
  '/cbt_simulation.html': 'cbt',
  '/cbt_simulation/': 'cbt',
  '/cbt_simulayion': 'cbt',
  '/index.html': 'home',
  '/home': 'home',
  '/portal': 'dashboard',
  '/sign-up': 'signup',
  '/signup': 'signup',
  '/register/': 'signup',
  '/signin': 'login',
  '/sign-in': 'login',
  '/otp': 'otp',
  '/verify-code': 'otp',
  '/password-reset': 'reset',
  '/track': 'track',
  '/subject': 'subjects',
  '/institution-course': 'institution',
  '/exam-goals': 'goals',
  '/exam-date-goals': 'goals',
  '/notifications': 'permissions',
  '/placement': 'baseline',
};

const normalise = (pathname: string) => {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.replace(/\/+$/, '') || '/';
  }
  return pathname;
};

/** `/A04_SIGNUP.html`, `/cbt_simulayion` and similar screen-file names. */
const SCREEN_IDS: Record<string, AppView> = {
  a01_splash: 'home',
  a02_onboarding: 'home',
  a03_welcome: 'home',
  a04_signup: 'signup',
  a05_otp: 'otp',
  a06_login: 'login',
  a07_forgot_pw: 'forgot',
  a08_reset_pw: 'reset',
  a09_exam_track: 'track',
  a10_subjects: 'subjects',
  a11_institution: 'institution',
  a12_goals: 'goals',
  a13_permissions: 'permissions',
  a14_diagnostic: 'baseline',
  home_dashboard: 'dashboard',
};

export const pathForView = (view: AppView) => VIEW_PATHS[view];

export const viewForPath = (pathname: string): AppView => {
  const path = normalise(pathname).toLowerCase();
  const fromScreenId = SCREEN_IDS[path.replace(/^\/|\.html$/g, '')];
  if (fromScreenId) return fromScreenId;
  return PATH_VIEWS[path] ?? ALIASES[path] ?? 'home';
};

export const useRouter = () => {
  const [path, setPath] = useState(() =>
    typeof window === 'undefined' ? '/' : normalise(window.location.pathname),
  );

  useEffect(() => {
    const onPopState = () =>
      withViewTransition(() => setPath(normalise(window.location.pathname)));
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const navigate = useCallback((to: string, options?: { replace?: boolean }) => {
    const next = normalise(to);
    if (next === normalise(window.location.pathname)) return;

    if (options?.replace) {
      window.history.replaceState({}, '', next);
    } else {
      window.history.pushState({}, '', next);
    }
    withViewTransition(() => setPath(next));
  }, []);

  return { path, view: viewForPath(path), navigate };
};

/**
 * Dev-only check so a mistyped path does not silently land on the homepage.
 * Call it from the app shell; it is a no-op in production builds.
 */
export const assertRouteCovers = (paths: string[]): string[] => {
  if (!import.meta.env.DEV) return [];
  return paths.filter((path) => viewForPath(path) === 'home' && path !== '/');
};
