import { API_BASE, ApiError, api, isLive } from './api';
import type { CmsBlock } from '../cms/types';

/* -----------------------------------------------------------------------------
   CMS pages and images (/cms). Live: /api/pages (public) and
   /api/admin/pages, /api/admin/media (admin). Images are saved on the API
   server's disk and served from /uploads.
   Demo mode (no backend): pages and images are kept in this browser, so what
   an admin publishes shows up on the site in the same browser.
   -------------------------------------------------------------------------- */

export interface PageSummary {
  id: string;
  slug: string;
  title: string;
  status: 'draft' | 'published';
  /** Saved changes that visitors can't see yet. */
  hasDraft: boolean;
  updatedAt: string;
  publishedAt: string | null;
}

export interface PageFull extends PageSummary {
  description: string;
  image: string;
  /** What visitors see. */
  blocks: CmsBlock[];
  /** The editor's working copy. */
  draft: CmsBlock[];
}

export interface PublicPage {
  slug: string;
  title: string;
  description: string;
  image: string;
  blocks: CmsBlock[];
  updatedAt: string;
}

export interface PageInput {
  title: string;
  slug: string;
  description: string;
  image: string;
}

export interface MediaItem {
  id: string;
  /** /uploads/… (live), a data URL (demo) or a /images/… site photo. */
  url: string;
  name: string;
  type: string;
  size: number;
  width: number;
  height: number;
  alt: string;
  createdAt: string;
}

export const HOME_SLUG = 'home';

/** "About us!" → "about-us". */
export const slugify = (text: string) =>
  text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9/]+/g, '-')
    .replace(/\/+/g, '/')
    .replace(/(^[-/]+|[-/]+$)/g, '')
    .replace(/-*\/-*/g, '/')
    .slice(0, 120);

/** The address a page is served at. */
export const pagePath = (slug: string) => (slug === HOME_SLUG ? '/' : `/${slug}`);

/* --------------------------------------------------------------- Demo store */

const PAGES_KEY = 'itutor-cms-pages';
const MEDIA_KEY = 'itutor-cms-media';

const readLocal = <T,>(key: string): T[] => {
  try {
    return JSON.parse(window.localStorage.getItem(key) ?? '[]') as T[];
  } catch {
    return [];
  }
};

const writeLocal = (key: string, value: unknown) => {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    throw new ApiError(0, 'This browser is out of storage space. In demo mode images are kept in the browser — delete some, or connect the backend.');
  }
};

const demoPages = () => readLocal<PageFull>(PAGES_KEY);

const demoUpdate = (id: string, change: (p: PageFull) => PageFull) => {
  const pages = demoPages();
  const page = pages.find((p) => p.id === id);
  if (!page) throw new ApiError(404, 'That page no longer exists.');
  const next = { ...change(page), updatedAt: new Date().toISOString() };
  writeLocal(PAGES_KEY, pages.map((p) => (p.id === id ? next : p)));
  return next;
};

const demoSlugCheck = (slug: string, except?: string) => {
  if (demoPages().some((p) => p.slug === slug && p.id !== except)) {
    throw new ApiError(409, `Another page already uses /${slug}. Choose a different address.`);
  }
};

const summaryOf = ({ id, slug, title, status, hasDraft, updatedAt, publishedAt }: PageFull): PageSummary => ({
  id,
  slug,
  title,
  status,
  hasDraft,
  updatedAt,
  publishedAt,
});

/* ------------------------------------------------------------------ Public */

/** A published page, or null when there is none at that address.
    `preview`: a signed-in admin sees the latest saved draft. */
export async function fetchPublicPage(slug: string, preview = false): Promise<PublicPage | null> {
  if (!isLive) {
    const page = demoPages().find((p) => p.slug === slug);
    if (!page || (!preview && page.status !== 'published')) return null;
    return { ...page, blocks: preview ? page.draft : page.blocks };
  }
  const q = `?slug=${encodeURIComponent(slug)}`;
  try {
    if (preview) return await api<PublicPage>(`/api/admin/pages/preview${q}`);
    return await api<PublicPage>(`/api/pages${q}`, { timeout: 8000 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) return null;
    // Not signed in to the admin: show the published page instead.
    if (preview && error instanceof ApiError && (error.status === 401 || error.status === 403)) return fetchPublicPage(slug);
    throw error;
  }
}

/* ------------------------------------------------------------------- Admin */

export async function listPages(): Promise<PageSummary[]> {
  if (!isLive) return demoPages().map(summaryOf).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return api<PageSummary[]>('/api/admin/pages');
}

export async function getPage(id: string): Promise<PageFull> {
  if (!isLive) {
    const page = demoPages().find((p) => p.id === id);
    if (!page) throw new ApiError(404, 'That page no longer exists.');
    return page;
  }
  return api<PageFull>(`/api/admin/pages/${id}`);
}

export async function createPage(input: PageInput & { blocks: CmsBlock[] }): Promise<PageFull> {
  if (!isLive) {
    demoSlugCheck(input.slug);
    const now = new Date().toISOString();
    const { blocks, ...meta } = input;
    const page: PageFull = {
      ...meta,
      id: `page-${Date.now().toString(36)}`,
      status: 'draft',
      hasDraft: true,
      blocks: [],
      draft: blocks,
      updatedAt: now,
      publishedAt: null,
    };
    writeLocal(PAGES_KEY, [...demoPages(), page]);
    return page;
  }
  return api<PageFull>('/api/admin/pages', { method: 'POST', body: input });
}

/** Saves the details and the draft. Visitors don't see it until publishPage. */
export async function savePage(id: string, input: PageInput & { draft: CmsBlock[] }): Promise<PageFull> {
  if (!isLive) {
    demoSlugCheck(input.slug, id);
    return demoUpdate(id, (p) => ({ ...p, ...input, hasDraft: true }));
  }
  return api<PageFull>(`/api/admin/pages/${id}`, { method: 'PUT', body: input });
}

export async function publishPage(id: string): Promise<PageFull> {
  if (!isLive) {
    return demoUpdate(id, (p) => ({ ...p, blocks: p.draft, hasDraft: false, status: 'published', publishedAt: new Date().toISOString() }));
  }
  return api<PageFull>(`/api/admin/pages/${id}/publish`, { method: 'POST' });
}

export async function unpublishPage(id: string): Promise<PageFull> {
  if (!isLive) return demoUpdate(id, (p) => ({ ...p, status: 'draft' }));
  return api<PageFull>(`/api/admin/pages/${id}/unpublish`, { method: 'POST' });
}

/** Throws away unpublished changes. */
export async function discardDraft(id: string): Promise<PageFull> {
  if (!isLive) return demoUpdate(id, (p) => ({ ...p, draft: p.blocks, hasDraft: false }));
  return api<PageFull>(`/api/admin/pages/${id}/discard`, { method: 'POST' });
}

/** Needs the super admin's password. */
export async function deletePage(id: string, password: string) {
  if (!isLive) {
    writeLocal(
      PAGES_KEY,
      demoPages().filter((p) => p.id !== id),
    );
    return;
  }
  await api(`/api/admin/pages/${id}`, { method: 'DELETE', body: { password } });
}

/* ------------------------------------------------------------------ Images */

/** Photos already on the website, offered in the image picker. */
export const SITE_IMAGES: MediaItem[] = [
  ['student-cbt-focus.jpg', 'A student working at a computer in a school CBT lab'],
  ['students-laptops.jpg', 'Students with laptops on red-and-white steps'],
  ['teacher-guiding.jpg', 'A teacher explaining something on a computer screen to students'],
  ['students-at-terminals.jpg', 'Students in white school uniforms working at computers'],
  ['cbt-lab-rows.jpg', 'Rows of computers in a CBT lab'],
  ['student-portrait.jpg', 'A smiling student'],
  ['tutor-session.jpg', 'A tutor helping a student'],
].map(([file, alt]) => ({
  id: `site-${file}`,
  url: `/images/${file}`,
  name: file!,
  type: 'image/jpeg',
  size: 0,
  width: 0,
  height: 0,
  alt: alt!,
  createdAt: '',
}));

export async function listMedia(): Promise<MediaItem[]> {
  if (!isLive) return readLocal<MediaItem>(MEDIA_KEY);
  return api<MediaItem[]>('/api/admin/media');
}

const LONG_SIDE = 2400;

/** Shrinks big photos in the browser before upload (GIFs are kept as they are,
    so they still move). Returns the file to send and its size in pixels. */
export function prepareImage(file: File): Promise<{ blob: Blob; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const { naturalWidth: w, naturalHeight: h } = img;
      const scale = Math.min(1, LONG_SIDE / Math.max(w, h));
      if (file.type === 'image/gif' || (scale === 1 && file.size < 600_000)) return resolve({ blob: file, width: w, height: h });
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(w * scale);
      canvas.height = Math.round(h * scale);
      const ctx = canvas.getContext('2d');
      if (!ctx) return resolve({ blob: file, width: w, height: h });
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      // WebP keeps transparency and is small; browsers that can't write it give PNG back.
      canvas.toBlob(
        (blob) => {
          const usable = blob && blob.type === 'image/webp' ? blob : null;
          if (usable && usable.size < file.size) return resolve({ blob: usable, width: canvas.width, height: canvas.height });
          if (file.type === 'image/png') return resolve({ blob: file, width: w, height: h });
          canvas.toBlob(
            (jpeg) => resolve({ blob: jpeg && jpeg.size < file.size ? jpeg : file, width: jpeg ? canvas.width : w, height: jpeg ? canvas.height : h }),
            'image/jpeg',
            0.86,
          );
        },
        'image/webp',
        0.85,
      );
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new ApiError(0, `“${file.name}” isn’t an image we can read. Use JPEG, PNG, WebP or GIF.`));
    };
    img.src = url;
  });
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new ApiError(0, 'That image couldn’t be read.'));
    reader.readAsDataURL(blob);
  });

export async function uploadMedia(file: File, alt = ''): Promise<MediaItem> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    throw new ApiError(415, `“${file.name}” isn’t a supported image. Use JPEG, PNG, WebP or GIF.`);
  }
  const { blob, width, height } = await prepareImage(file);
  if (blob.size > 12 * 1024 * 1024) throw new ApiError(413, `“${file.name}” is larger than 12 MB, even after shrinking.`);

  if (!isLive) {
    const item: MediaItem = {
      id: `media-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
      url: await toDataUrl(blob),
      name: file.name,
      type: blob.type,
      size: blob.size,
      width,
      height,
      alt,
      createdAt: new Date().toISOString(),
    };
    writeLocal(MEDIA_KEY, [item, ...readLocal<MediaItem>(MEDIA_KEY)]);
    return item;
  }

  // The image is the raw body; the details travel in the address.
  const q = new URLSearchParams({ name: file.name.slice(0, 200), width: String(width), height: String(height), alt });
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 120_000);
  try {
    const res = await fetch(`${API_BASE}/api/admin/media?${q}`, {
      method: 'POST',
      credentials: 'include',
      signal: controller.signal,
      headers: { 'content-type': blob.type || 'application/octet-stream' },
      body: blob,
    });
    const data = (await res.json().catch(() => null)) as (MediaItem & { error?: string }) | null;
    if (!res.ok) throw new ApiError(res.status, data?.error ?? `Upload failed (${res.status}).`);
    return data as MediaItem;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === 'AbortError') throw new ApiError(0, 'The upload took too long. Try a smaller image.');
    throw new ApiError(0, 'Can’t reach i-Tutor right now. Check your internet connection.');
  } finally {
    window.clearTimeout(timer);
  }
}

export async function updateMediaAlt(id: string, alt: string): Promise<MediaItem> {
  if (!isLive) {
    const list = readLocal<MediaItem>(MEDIA_KEY).map((m) => (m.id === id ? { ...m, alt } : m));
    writeLocal(MEDIA_KEY, list);
    return list.find((m) => m.id === id)!;
  }
  return api<MediaItem>(`/api/admin/media/${id}`, { method: 'PATCH', body: { alt } });
}

/** Needs the super admin's password. */
export async function deleteMedia(id: string, password: string) {
  if (!isLive) {
    writeLocal(
      MEDIA_KEY,
      readLocal<MediaItem>(MEDIA_KEY).filter((m) => m.id !== id),
    );
    return;
  }
  await api(`/api/admin/media/${id}`, { method: 'DELETE', body: { password } });
}
