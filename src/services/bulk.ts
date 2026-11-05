import { API_BASE, api, isLive } from './api';
import { isExcel, isWord, officeText } from '../lib/office-files';
import { crop, openPages, toBlob } from '../lib/pdf-pages';
import { uploadMedia } from './pages';

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
  /** Saved questions whose diagram is on a page of the file (cut out by attachDiagrams). */
  diagrams: Array<{ id: number; page: number; hint: string; label: string }>;
  error: string;
}

/**
 * Cuts each diagram out of its page and attaches it to its question: the page
 * is drawn here, the AI says where each diagram is on it, and the cut-out is
 * uploaded like any image. Ones that can't be found stay marked to check.
 */
async function attachDiagrams(file: File, job: BulkJob, onUpdate: (job: BulkJob) => void): Promise<{ attached: number; total: number }> {
  const total = job.diagrams.length;
  let attached = 0;
  let done = 0;
  const say = (message: string) => onUpdate({ ...job, message });
  say(`Cutting out diagrams: 0 of ${total}…`);
  const source = await openPages(file);
  const byPage = new Map<number, BulkJob['diagrams']>();
  for (const d of job.diagrams) if (d.page <= source.pages) byPage.set(d.page, [...(byPage.get(d.page) ?? []), d]);
  for (const [page, list] of byPage) {
    try {
      const canvas = await source.render(page);
      const image = (await toDataUrl(await toBlob(canvas))).split(',')[1] ?? '';
      // At most 20 diagrams per question to the AI (a page rarely has more than a few).
      for (let i = 0; i < list.length; i += 20) {
        const slice = list.slice(i, i + 20);
        const boxes = await api<Array<{ id: string; box: number[] }>>('/api/admin/bulk/locate', {
          method: 'POST',
          body: { image, mediaType: 'image/jpeg', items: slice.map((d) => ({ id: String(d.id), hint: d.hint })) },
          timeout: 90_000,
        });
        for (const d of slice) {
          const b = boxes.find((x) => x.id === String(d.id));
          done += 1;
          if (b) {
            const cut = await toBlob(crop(canvas, b.box), 'image/png');
            const item = await uploadMedia(new File([cut], `q${d.id}-diagram.png`, { type: 'image/png' }), d.hint);
            await api(`/api/admin/questions/${d.id}`, {
              method: 'PATCH',
              body: { image: item.url, imageAlt: d.hint.slice(0, 300), reviewNote: `Diagram cut out of page ${page} automatically: check it’s the right one.` },
            });
            attached += 1;
          }
          say(`Cutting out diagrams: ${done} of ${total}…`);
        }
      }
    } catch {
      // That page couldn't be done; its questions stay marked to check.
      done += list.length;
    }
  }
  return { attached, total };
}

const toDataUrl = (blob: Blob) =>
  new Promise<string>((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

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
  // Diagrams on the pages of a PDF or photo: cut out and attached.
  if (job.stage === 'done' && job.diagrams?.length && !text) {
    try {
      const { attached, total } = await attachDiagrams(file, job, onUpdate);
      job = {
        ...job,
        message: `${job.message} Diagrams: ${attached} of ${total} attached automatically${attached < total ? '; the rest are marked to check' : ''}.`,
      };
    } catch {
      job = { ...job, message: `${job.message} The diagrams couldn’t be cut out automatically; those questions are marked to check.` };
    }
    onUpdate(job);
  }
  return job;
}
