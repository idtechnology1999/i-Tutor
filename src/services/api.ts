/* -----------------------------------------------------------------------------
   The one place the frontend talks to the backend.

   Set VITE_API_URL (see .env.example) to the backend's address, e.g.
   https://itutor-api.onrender.com. While it's empty the app runs in demo mode:
   every service in src/services keeps working with its built-in stand-in, so
   the UI can be used and tested without a server. The full list of endpoints
   is in docs/BACKEND_CONTRACT.md.

   Sessions: the backend sets an httpOnly cookie on login, so requests are sent
   with credentials. Never put API keys (AI, Paystack secret) in the frontend.
   -------------------------------------------------------------------------- */

export const API_BASE = (import.meta.env.VITE_API_URL ?? '').trim().replace(/\/+$/, '');

/** True when a backend address is configured; false means demo mode. */
export const isLive = API_BASE !== '';

/** A failed request, with the server's message when it sent one. */
export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  headers?: Record<string, string>;
  /** Milliseconds before giving up. AI calls get longer. */
  timeout?: number;
}

/** JSON request to the backend. Throws ApiError on any failure. */
export async function api<T>(path: string, { method = 'GET', body, headers, timeout = 20_000 }: RequestOptions = {}) {
  if (!isLive) throw new ApiError(0, 'The backend is not connected (demo mode).');

  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), timeout);
  try {
    const res = await fetch(`${API_BASE}${path}`, {
      method,
      credentials: 'include',
      signal: controller.signal,
      headers: { ...(body === undefined ? {} : { 'content-type': 'application/json' }), ...headers },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const isJson = (res.headers.get('content-type') ?? '').includes('application/json');
    const data = isJson ? await res.json() : null;
    if (!res.ok) {
      const message = (data as { error?: string } | null)?.error ?? `Request failed (${res.status}).`;
      throw new ApiError(res.status, message);
    }
    return data as T;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if ((error as Error).name === 'AbortError') throw new ApiError(0, 'The server took too long to answer. Try again.');
    throw new ApiError(0, 'Can’t reach i-Tutor right now. Check your internet connection.');
  } finally {
    window.clearTimeout(timer);
  }
}

/** Demo mode: a short pause so loading states can be seen and tested. */
export const demoDelay = (ms = 600) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));
