import { API_BASE, ApiError, api, demoDelay, isLive } from './api';

/* Student reviews of i-Tutor (backend routes/reviews.ts) and the student's
   photo. Only reviews an admin approved come back from getReviews(). Demo mode
   keeps everything in this browser. */

export interface PublicReview {
  id: string;
  /** "Amina C." */
  name: string;
  rating: number;
  text: string;
  /** /uploads/… or '' */
  photo: string;
  gender: 'female' | 'male' | '';
  course: string;
  date: string;
}

export interface MyReview {
  rating: number;
  text: string;
  status: 'pending' | 'approved' | 'hidden';
}

const DEMO_KEY = 'itutor-demo-review';

export async function getReviews(): Promise<PublicReview[]> {
  if (!isLive) return [];
  return api<PublicReview[]>('/api/reviews', { timeout: 10_000 }).catch(() => []);
}

export async function getMyReview(): Promise<MyReview | null> {
  if (!isLive) {
    try {
      return JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? 'null') as MyReview | null;
    } catch {
      return null;
    }
  }
  return api<MyReview | null>('/api/reviews/mine');
}

export async function sendReview(rating: number, text: string): Promise<MyReview> {
  if (!isLive) {
    await demoDelay(500);
    const mine: MyReview = { rating, text, status: 'pending' };
    try {
      window.localStorage.setItem(DEMO_KEY, JSON.stringify(mine));
    } catch {
      /* not kept when storage is blocked */
    }
    return mine;
  }
  return api<MyReview>('/api/reviews', { method: 'POST', body: { rating, text } });
}

/** Shrinks a photo to a 320 × 320 square (centre crop) as JPEG, so uploads stay small. */
async function squareJpeg(file: File, size = 320): Promise<Blob> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error('That file isn’t a photo we can open. Choose a JPEG or PNG.'));
      i.src = url;
    });
    const side = Math.min(img.naturalWidth, img.naturalHeight);
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Couldn’t prepare that photo.'))), 'image/jpeg', 0.85),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}

/** Uploads the student's photo; returns its address for the profile. Demo mode: kept as a data URL. */
export async function uploadPhoto(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Choose a photo (JPEG, PNG or WebP).');
  const blob = await squareJpeg(file);
  if (!isLive) {
    return await new Promise<string>((resolve) => {
      const r = new FileReader();
      r.onload = () => resolve(String(r.result));
      r.readAsDataURL(blob);
    });
  }
  const res = await fetch(`${API_BASE}/api/me/photo`, { method: 'POST', credentials: 'include', headers: { 'content-type': 'image/jpeg' }, body: blob });
  const data = (await res.json().catch(() => null)) as { photo?: string; error?: string } | null;
  if (!res.ok || !data?.photo) throw new ApiError(res.status, data?.error ?? 'Couldn’t upload that photo. Try again.');
  return data.photo;
}

/* ------------------------------------------------------------------ Admin */

export interface AdminReview extends PublicReview {
  status: 'pending' | 'approved' | 'hidden';
  fullName: string;
}

export const listAdminReviews = (status: AdminReview['status']) =>
  api<{ reviews: AdminReview[]; counts: Partial<Record<AdminReview['status'], number>> }>(`/api/admin/reviews?status=${status}`);

export const setReviewStatus = (id: string, status: AdminReview['status']) =>
  api<void>(`/api/admin/reviews/${id}`, { method: 'PATCH', body: { status } });

export const deleteReview = (id: string) => api<void>(`/api/admin/reviews/${id}`, { method: 'DELETE' });
