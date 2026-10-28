import { createContext, useContext, useSyncExternalStore } from 'react';
import { fetchPublicPage } from '../services/pages';
import type { FieldSpec } from './registry';
import type { BlockData } from './types';
import { isPreview } from './usePage';

/* -----------------------------------------------------------------------------
   Editable text on the app screens (/cms/screens): login, sign-up and the
   onboarding steps. The forms stay in code; the CMS changes the label,
   heading, introduction and photo around them.

   All screens live in one CMS document (slug "screens"): one block per
   screen, id = screen id, holding only screens an admin has edited. A screen
   without one keeps the wording written in its component.
   -------------------------------------------------------------------------- */

export const SCREENS_SLUG = 'screens';

export interface ScreenDef {
  id: string;
  label: string;
  group: 'Account' | 'Onboarding';
  /** Where the screen is in the app. */
  path: string;
  kind: 'auth' | 'onboard' | 'note';
  /** Has the photo on the right (login, sign-up). */
  photo?: boolean;
  /** {placeholders} the text may use, with what they become. */
  vars?: Record<string, string>;
  /** The wording in the component today: the editor's starting point. */
  defaults: BlockData;
}

const photo = (src: string, alt: string, caption: string, badge: [string, string, string]) => ({
  image: { src, alt },
  caption,
  showBadge: true,
  badgeLabel: badge[0],
  badgeValue: badge[1],
  badgeNote: badge[2],
});

export const SCREENS: ScreenDef[] = [
  {
    id: 'login',
    label: 'Log in',
    group: 'Account',
    path: '/login',
    kind: 'auth',
    photo: true,
    defaults: {
      eyebrow: 'Welcome back',
      title: 'Log in to i-Tutor',
      lede: 'Pick up your mocks, weak topics and tutor sessions where you left off.',
      ...photo(
        '/images/student-cbt-focus.jpg',
        'A student concentrating at a computer in a school CBT lab',
        'Your progress follows you — phone, laptop or the cyber-café computer.',
        ['Mock score', '268/400', '+34 since last week'],
      ),
    },
  },
  {
    id: 'signup',
    label: 'Create account',
    group: 'Account',
    path: '/register',
    kind: 'auth',
    photo: true,
    defaults: {
      eyebrow: 'Free to start · No card needed',
      title: 'Create your account',
      lede: 'Takes under a minute. We’ll send a one-time code to confirm it’s really you.',
      ...photo(
        '/images/students-at-terminals.jpg',
        'Secondary-school students in white uniforms working at computers in a CBT lab',
        'Practise on a screen that feels like the real CBT hall — then learn from every question you miss.',
        ['Free to start', '₦0', 'No card needed'],
      ),
    },
  },
  {
    id: 'otp',
    label: 'Verify code',
    group: 'Account',
    path: '/verify',
    kind: 'auth',
    vars: { digits: 'how many digits the code has', destination: 'the student’s email, partly hidden' },
    defaults: {
      eyebrow: 'Verification',
      title: 'Enter the email code',
      lede: 'We sent a {digits}-digit code to {destination}. It expires in 10 minutes.',
    },
  },
  {
    id: 'forgot',
    label: 'Forgot password',
    group: 'Account',
    path: '/forgot-password',
    kind: 'auth',
    defaults: {
      eyebrow: 'Recovery',
      title: 'Reset your password',
      lede: 'Tell us the email address on the account and we will send a reset code.',
    },
  },
  {
    id: 'forgot-sent',
    label: 'Forgot password: code sent',
    group: 'Account',
    path: '/forgot-password',
    kind: 'auth',
    vars: { destination: 'the email they typed' },
    defaults: {
      eyebrow: 'Recovery',
      title: 'Check your messages',
      lede: 'If an account exists for {destination}, a reset code is on its way.',
    },
  },
  {
    id: 'reset',
    label: 'Reset password',
    group: 'Account',
    path: '/reset-password',
    kind: 'auth',
    vars: { destination: 'the student’s email' },
    defaults: {
      eyebrow: 'Recovery',
      title: 'Enter your code',
      lede: 'We sent a 6-digit code to {destination}. Enter it below with your new password.',
    },
  },
  {
    id: 'reset-done',
    label: 'Reset password: done',
    group: 'Account',
    path: '/reset-password',
    kind: 'auth',
    defaults: {
      eyebrow: 'Password updated',
      title: 'Your password has been changed',
      lede: 'For your security, every other session on this account has been signed out.',
    },
  },
  {
    id: 'track',
    label: 'Step 1 · Your exams',
    group: 'Onboarding',
    path: '/onboarding/track',
    kind: 'onboard',
    defaults: {
      title: 'Which exams are you preparing for?',
      lede: 'Tick all that apply. We’ll show you the right past questions and practice exams for each one. You can change this later.',
    },
  },
  {
    id: 'schoolcert',
    label: 'Step 2 · School exam class',
    group: 'Onboarding',
    path: '/onboarding/school-exams',
    kind: 'onboard',
    vars: { names: 'the school exams they picked, e.g. “WAEC and NECO”' },
    defaults: {
      title: 'Your {names} class',
      lede: 'Choose your class, then check the subjects you’ll sit. We’ll give you {names} past questions for each one.',
    },
  },
  {
    id: 'subjects',
    label: 'Step 2 · JAMB subjects',
    group: 'Onboarding',
    path: '/onboarding/subjects',
    kind: 'onboard',
    defaults: {
      title: 'Choose your subjects',
      lede: 'JAMB is 4 subjects: English plus the 3 you choose. We use this to build your question bank and to work out which topics need attention first.',
    },
  },
  {
    id: 'institution',
    label: 'Step 3 · School and course',
    group: 'Onboarding',
    path: '/onboarding/institution',
    kind: 'onboard',
    defaults: {
      title: 'Where are you aiming?',
      lede: 'Pick your school and course. We’ll check the latest cut-off marks and the subjects they ask for, and prepare you with the school’s Post-UTME questions.',
    },
  },
  {
    id: 'goals',
    label: 'Step 4 · Exam date and goal',
    group: 'Onboarding',
    path: '/onboarding/goals',
    kind: 'onboard',
    defaults: {
      title: 'When is your exam, and what score are you aiming for?',
      lede: 'We use your exam month and target score to build a study plan that fits the time you actually have.',
    },
  },
  {
    id: 'permissions',
    label: 'Step 5 · Reminders and offline',
    group: 'Onboarding',
    path: '/onboarding/permissions',
    kind: 'onboard',
    defaults: {
      title: 'Two settings that make i-Tutor work on a weak network',
      lede: 'Both are optional and both can be changed later in Settings. Nothing here requires a payment card or a phone number.',
    },
  },
  {
    id: 'baseline',
    label: 'Step 6 · Placement test',
    group: 'Onboarding',
    path: '/onboarding/baseline',
    kind: 'onboard',
    defaults: {
      title: 'One last step: a short placement test',
      lede: 'Twenty questions across your subjects. It is the fastest way for i-Tutor to know which topics to show you first — and which ones to leave alone for now.',
    },
  },
  {
    id: 'onboarding',
    label: 'Note under the steps',
    group: 'Onboarding',
    path: '/onboarding/track',
    kind: 'note',
    defaults: {
      railNote: 'Answers here calibrate your question bank. You can change any of this later in Settings.',
    },
  },
];

export const SCREEN_DEFS: Record<string, ScreenDef> = Object.fromEntries(SCREENS.map((s) => [s.id, s]));

/** The editor's form for a screen. */
export const screenFields = (def: ScreenDef): FieldSpec[] => {
  const help = def.vars
    ? `You can use ${Object.entries(def.vars)
        .map(([k, v]) => `{${k}} (${v})`)
        .join(', ')}.`
    : undefined;
  if (def.kind === 'note') {
    return [{ kind: 'textarea', key: 'railNote', label: 'Note under the step list', rows: 3 }];
  }
  const fields: FieldSpec[] = [];
  if (def.kind === 'auth') fields.push({ kind: 'text', key: 'eyebrow', label: 'Small label above the heading' });
  fields.push(
    { kind: 'textarea', key: 'title', label: 'Heading', rows: 2, help: def.vars && 'title' in def.defaults && String(def.defaults.title).includes('{') ? help : undefined },
    { kind: 'textarea', key: 'lede', label: 'Introduction', rows: 3, help },
  );
  if (def.photo) {
    fields.push(
      { kind: 'image', key: 'image', label: 'Photo' },
      { kind: 'textarea', key: 'caption', label: 'Photo caption', rows: 2 },
      { kind: 'toggle', key: 'showBadge', label: 'Show the card on the photo' },
      { kind: 'text', key: 'badgeLabel', label: 'Card label', show: (d) => d.showBadge === true },
      { kind: 'text', key: 'badgeValue', label: 'Card number', show: (d) => d.showBadge === true },
      { kind: 'text', key: 'badgeNote', label: 'Card note', show: (d) => d.showBadge === true },
    );
  }
  return fields;
};

/* ---------------------------------------------------------------- Store */

type ScreenMap = Record<string, BlockData>;

const CACHE_KEY = 'itutor-page:screens';
const EMPTY: BlockData = {};

const toMap = (blocks: Array<{ id: string; type: string; hidden?: boolean; data: BlockData }>): ScreenMap =>
  Object.fromEntries(blocks.filter((b) => b.type === 'screen' && !b.hidden).map((b) => [b.id, b.data]));

let screens: ScreenMap = (() => {
  try {
    return JSON.parse(window.localStorage.getItem(CACHE_KEY) ?? '{}') as ScreenMap;
  } catch {
    return {};
  }
})();
let started = false;
const listeners = new Set<() => void>();

/** Fetched once, the first time a screen that uses it is shown. */
function load() {
  if (started) return;
  started = true;
  const preview = isPreview();
  fetchPublicPage(SCREENS_SLUG, preview)
    .then((page) => {
      screens = page ? toMap(page.blocks) : {};
      if (!preview) {
        try {
          window.localStorage.setItem(CACHE_KEY, JSON.stringify(screens));
        } catch {
          /* no cache */
        }
      }
      listeners.forEach((l) => l());
    })
    .catch(() => {
      /* keep the cached or built-in wording */
    });
}

const subscribe = (listener: () => void) => {
  load();
  listeners.add(listener);
  return () => listeners.delete(listener);
};

/** The CMS editor shows its unsaved draft in place of the published text. */
export const ScreenDraftContext = createContext<ScreenMap | null>(null);

/** What an admin set for this screen ({} when nothing). */
export function useScreenText(id: string | undefined): BlockData {
  const draft = useContext(ScreenDraftContext);
  const published = useSyncExternalStore(subscribe, () => screens);
  if (!id) return EMPTY;
  return (draft ?? published)[id] ?? EMPTY;
}

/** The admin's text with {placeholders} filled in, or the screen's own
    wording when there is none (or a placeholder has no value here). */
export function screenText(value: unknown, fallback: string, vars?: Record<string, string | number | undefined>): string {
  if (typeof value !== 'string' || !value.trim()) return fallback;
  let missing = false;
  const out = value.replace(/\{(\w+)\}/g, (_, key: string) => {
    const v = vars?.[key];
    if (v === undefined || v === '') {
      missing = true;
      return '';
    }
    return String(v);
  });
  return missing ? fallback : out;
}
