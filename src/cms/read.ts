import { createContext, useContext } from 'react';
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

export const image = (v: unknown): CmsImage => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  return { src: str(o.src), alt: str(o.alt) };
};

export const link = (v: unknown): CmsLink => {
  const o = (typeof v === 'object' && v !== null ? v : {}) as Record<string, unknown>;
  return { label: str(o.label), href: str(o.href) };
};

/** Uploaded images are stored as /uploads/… on the API server. */
export const mediaSrc = (src: string) => (src.startsWith('/uploads/') && isLive ? `${API_BASE}${src}` : src);

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
