import { API_BASE, api, isLive } from './api';
import { isExcel, isWord, officeText } from '../lib/office-files';

/* Bulk upload of past papers (backend ai/bulk.ts): one file with many papers
   (e.g. JAMB English 1999–2004) is read on the server and each paper is
   filed under its exam, subject and year, as drafts. The file goes up in
   3 MB pieces (the site's proxy limits one request's size); Word and Excel
   are turned into text here first. Then the job is followed until it ends. */

export type PaperState = 'waiting' | 'reading' | 'saved' | 'skipped' | 'failed';

export interface BulkPaper {
  subject: string;
  year: number;
  expected: number;
  found: number;
  saved: number;
  needsReview: number;
  state: PaperState;
  note: string;
}

export interface BulkJob {
  id: string;
  fileName: string;
  exam: string;
  stage: 'uploading' | 'surveying' | 'extracting' | 'done' | 'failed';
  message: string;
  papers: BulkPaper[];
  error: string;
}

const CHUNK = 3 * 1024 * 1024;
const MAX = 18 * 1024 * 1024;

const mediaTypeOf = (f: File) =>
  f.type === 'application/pdf' || /\.pdf$/i.test(f.name)
    ? 'application/pdf'
    : ['image/jpeg', 'image/png', 'image/webp'].includes(f.type)
      ? f.type
      : 'text/plain';

/** Uploads one file and follows its job; `onUpdate` gets every change. */
export async function bulkUpload(
  file: File,
  opts: { exam: string; school: string; subject: string },
  onUpdate: (job: BulkJob) => void,
): Promise<BulkJob> {
  if (!isLive) throw new Error('Bulk upload needs the live site: the AI reads the files on the server.');
  const office = isWord(file) || isExcel(file);
  const plain = /\.txt$/i.test(file.name);
  const text = office ? await officeText(file) : plain ? await file.text() : undefined;
  if (!text && file.size > MAX) throw new Error(`${file.name} is larger than 18 MB. Split it into smaller files.`);

  let job = await api<BulkJob>('/api/admin/bulk', {
    method: 'POST',
    body: { fileName: file.name, mediaType: text ? 'text/plain' : mediaTypeOf(file), exam: opts.exam, school: opts.school, subject: opts.subject, ...(text ? { text } : {}) },
  });
  onUpdate(job);

  if (!text) {
    for (let at = 0; at < file.size; at += CHUNK) {
      onUpdate({ ...job, message: `Uploading ${file.name}: ${Math.round((at / file.size) * 100)}%…` });
      const res = await fetch(`${API_BASE}/api/admin/bulk/${job.id}/chunk`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/octet-stream' },
        body: file.slice(at, at + CHUNK),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(data.error ?? `Upload failed (${res.status}).`);
      }
    }
  }

  job = await api<BulkJob>(`/api/admin/bulk/${job.id}/run`, { method: 'POST', body: {} });
  onUpdate(job);
  // Follow it until it ends (big files take a few minutes).
  while (job.stage !== 'done' && job.stage !== 'failed') {
    await new Promise((r) => window.setTimeout(r, 2500));
    try {
      job = await api<BulkJob>(`/api/admin/bulk/${job.id}`);
      onUpdate(job);
    } catch (e) {
      // A dropped connection: keep following; an expired job: stop.
      if (/expired/i.test((e as Error).message)) throw e;
    }
  }
  return job;
}
