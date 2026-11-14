import { createContext, useContext } from 'react';
import type { CSSProperties } from 'react';
import { API_BASE, isLive } from '../services/api';
import type { BlockData, CmsImage, CmsLink } from './types';

/* Safe readers for block data, plus the context blocks use to follow links. */

export const str = (v: unknown, fallback = '') => (typeof v === 'string' ? v : fallback);

export const bool = (v: unknown) => v === true;

export const items = (v: unknown): BlockData[] =>
  Array.isArray(v) ? v.filter((x): x is BlockData => typeof x === 'object' && x !== null) : [];

/** A list of lines. The editor keeps empty lines while typing; pages skip them. */
export const lines = (v: unknown): string[] =>
  (Array.isArray(v) ? v : typeof v === 'string' ? v.split('\n') : [])
    .filter((s): s is string => typeof s === 'string')
    .map((s) => s.trim())
    .filter(Boolean);

/** The nine points an image can be kept in view by (page builder → image → "Keep this part in view"). */
export const FOCUS_POINTS = [
  'left top', 'center top', 'right top',
  'left center', 'center center', 'right center',
  'left bottom', 'center bottom', 'right bottom',
] as const;

export const image = (v: unknown): CmsImage => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  const focus = str(o.focus);
  return {
    src: str(o.src),
    alt: str(o.alt),
    // Only the nine known points: nothing else reaches the page's CSS.
    ...((FOCUS_POINTS as readonly string[]).includes(focus) && focus !== 'center center' ? { focus } : {}),
    ...(o.mirror === true ? { mirror: true } : {}),
  };
};

/** How an image is shown: which part stays in view and which way it faces. */
export const imageStyle = (im: CmsImage): CSSProperties | undefined =>
  im.focus || im.mirror
    ? { ...(im.focus ? { objectPosition: im.focus } : {}), ...(im.mirror ? { transform: 'scaleX(-1)' } : {}) }
    : undefined;

export const link = (v: unknown): CmsLink => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  return { label: str(o.label), href: str(o.href) };
};

/** Uploaded images are stored as /uploads/… on the API server. */
/* Older built-in photos, replaced by real photos of Nigerian students
   (public/images/jamb-…, credits in services/pages.ts). Pages saved in the
   page builder with an old photo show its replacement, so nobody has to
   re-pick them by hand. Uploaded images are never touched. */
const UPGRADED_PHOTOS: Record<string, string> = {
  '/images/student-cbt-focus.jpg': '/images/jamb-students-smiling.jpg',
  '/images/students-laptops.jpg': '/images/jamb-student-laptop.jpg',
  '/images/students-at-terminals.jpg': '/images/jamb-class-uniform.jpg',
};

/** Who took a built-in photo (after the upgrade above), for its credit line. */
const PHOTO_CREDITS: Record<string, string> = {
  '/images/jamb-students-smiling.jpg': 'Photo: amazinggraceu on Pexels',
  '/images/jamb-student-laptop.jpg': 'Photo: Kojo Kwarteng on Unsplash',
  '/images/jamb-boys-laptop.jpg': 'Photo: Roman Odintsov on Pexels',
  '/images/jamb-student-library.jpg': 'Photo: Kampus Production on Pexels',
  '/images/jamb-student-bright.jpg': 'Photo: Yan Krukov on Pexels',
  '/images/jamb-class-uniform.jpg': 'Photo: Tosin Olowoleni on Pexels',
  '/images/jamb-nursing-students.jpg': 'Photo: AB Pixels NG on Pexels',
  '/images/jamb-graduates.jpg': 'Photo: Shot by Khalid on Pexels',
  '/images/jamb-graduates-wide.jpg': 'Photo: Shot by Khalid on Pexels',
};

export const sitePhoto = (src: string) => UPGRADED_PHOTOS[src] ?? src;
/** The right credit for a built-in photo; otherwise the credit an admin typed. */
export const photoCredit = (src: string, typed: string) => PHOTO_CREDITS[sitePhoto(src)] ?? typed;

export const mediaSrc = (src: string) => {
  const s = sitePhoto(src);
  return s.startsWith('/uploads/') && isLive ? `${API_BASE}${s}` : s;
};

/** Only links we know how to follow; anything else (javascript:, //host) is dropped. */
export const safeHref = (href: string) => {
  const h = href.trim();
  return /^(\/(?!\/)|#|https?:\/\/|mailto:|tel:|action:)/i.test(h) ? h : '';
};

export const isExternal = (href: string) => /^(https?:|mailto:|tel:)/i.test(href);

export interface CmsEnv {
  /** Follow a link or run an app action. */
  run: (href: string) => void;
  /** Inside the page editor: links do nothing, motion is off. */
  editing: boolean;
}

export const CmsContext = createContext<CmsEnv>({
  run: (href) => {
    if (!href.startsWith('action:')) window.location.assign(href);
  },
  editing: false,
});

export const useCmsEnv = () => useContext(CmsContext);
