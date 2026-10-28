import { useEffect, useState } from 'react';
import { fetchPublicPage } from '../services/pages';
import type { PublicPage } from '../services/pages';

/* Loads a published CMS page for the website. The last copy is kept in this
   browser so a returning visitor sees the page at once while it refreshes.
   ?preview in the address shows a signed-in admin the latest saved draft. */

export type PageState =
  | { status: 'loading'; page: null }
  | { status: 'ready'; page: PublicPage }
  | { status: 'missing'; page: null }
  | { status: 'error'; page: null };

const cacheKey = (slug: string) => `itutor-page:${slug}`;

const readCache = (slug: string): PublicPage | null => {
  try {
    const raw = window.localStorage.getItem(cacheKey(slug));
    return raw ? (JSON.parse(raw) as PublicPage) : null;
  } catch {
    return null;
  }
};

const writeCache = (slug: string, page: PublicPage | null) => {
  try {
    if (page) window.localStorage.setItem(cacheKey(slug), JSON.stringify(page));
    else window.localStorage.removeItem(cacheKey(slug));
  } catch {
    /* storage full or blocked: no cache */
  }
};

export const isPreview = () => typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview');

export function usePublicPage(slug: string): PageState {
  const [preview] = useState(isPreview);
  const [state, setState] = useState<PageState>(() => {
    const cached = preview ? null : readCache(slug);
    return cached ? { status: 'ready', page: cached } : { status: 'loading', page: null };
  });

  useEffect(() => {
    let alive = true;
    fetchPublicPage(slug, preview)
      .then((page) => {
        if (!alive) return;
        setState(page ? { status: 'ready', page } : { status: 'missing', page: null });
        if (!preview) writeCache(slug, page);
      })
      .catch(() => {
        // Offline or the server is down: keep the cached copy if there is one.
        if (alive) setState((s) => (s.status === 'ready' ? s : { status: 'error', page: null }));
      });
    return () => {
      alive = false;
    };
  }, [slug, preview]);

  return state;
}
