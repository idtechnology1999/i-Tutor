import { API_BASE } from './api';

/* Big files (bulk papers, backups) go up in small pieces. The server's web
   server may refuse any request over 1 MB, so a piece stays well under it,
   and a piece that fails on a shaky connection is sent again. */

export const PIECE = 768 * 1024;

const wait = (ms: number) => new Promise((r) => window.setTimeout(r, ms));

/** Sends one piece of a file; tries up to 4 times before giving up. */
export async function sendPiece(path: string, body: Blob): Promise<void> {
  let last = '';
  for (let attempt = 0; attempt < 4; attempt += 1) {
    if (attempt) await wait(1500 * attempt);
    let res: Response;
    try {
      res = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/octet-stream' },
        body,
      });
    } catch {
      last = 'The connection dropped while sending the file. Check your internet and try again.';
      continue;
    }
    if (res.ok) return;
    const data = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 413) throw new Error(data.error ?? 'The server refused the file as too large. Ask your developer to raise the server’s upload limit (nginx client_max_body_size).');
    // Server errors may pass; anything else (expired, signed out) won't.
    last = data.error ?? `Upload failed (${res.status}).`;
    if (res.status < 500) throw new Error(last);
  }
  throw new Error(last);
}
