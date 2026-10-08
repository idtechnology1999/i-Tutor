/* -----------------------------------------------------------------------------
   Turning a raw paper into questions — UI side only.

   BACKEND CONTRACT (to be implemented by the backend; not in this repo):

     POST /api/parse-questions
       headers: { "content-type": "application/json", "x-admin-key": <key> }
       body:    { subject, examType, year: number|null, source,
                  text: string,                       // pasted paper
                  file?: { name, mediaType, data } }  // base64 PDF/JPG/PNG/WebP
       200 ->   { questions: ParsedQuestion[], warnings: string[] }
       4xx/5xx -> { error: string }

     GET /api/admin-check   (header x-admin-key)
       200 -> { ok: true, ai: boolean }   401 -> wrong key

   Until that exists, `organiseWithAI` falls back to `basicParse`, a pattern
   matcher for the common "1. … A. … B. … Answer: C" layout, so the whole
   import → review → publish flow works as a demo. The result says which
   engine ran so the review screen can warn accordingly.
   -------------------------------------------------------------------------- */

import { API_BASE, isLive } from '../services/api';

export interface ParsedQuestion {
  number: number;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  answerSource: 'paper' | 'ai';
  explanation: string;
  topic: string;
  year: number;
  needsReview: boolean;
  reviewNote: string;
}

export interface ImportResult {
  questions: ParsedQuestion[];
  warnings: string[];
  engine: 'ai' | 'basic';
  /** Why the AI wasn't used, when engine is 'basic'. */
  fallbackReason?: string;
}

export interface ImportRequest {
  subject: string;
  examType: string;
  year: number | null;
  source: string;
  text: string;
  file?: File | null;
}

const ADMIN_KEY_STORE = 'itutor-admin-key';

export const adminKey = {
  get: () => {
    try {
      return window.sessionStorage.getItem(ADMIN_KEY_STORE) ?? '';
    } catch {
      return '';
    }
  },
  set: (key: string) => {
    try {
      window.sessionStorage.setItem(ADMIN_KEY_STORE, key);
    } catch {
      /* session storage blocked */
    }
  },
  clear: () => {
    try {
      window.sessionStorage.removeItem(ADMIN_KEY_STORE);
    } catch {
      /* ignore */
    }
  },
};

const toBase64 = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1] ?? '');
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

/** Checks the admin key against the server. `offline` means no server here. */
export async function checkAdmin(key: string): Promise<{ status: 'ok' | 'wrong' | 'offline' | 'unconfigured'; ai?: boolean }> {
  if (!isLive) return { status: 'offline' };
  try {
    const res = await fetch(`${API_BASE}/api/admin-check`, { headers: { 'x-admin-key': key } });
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('application/json')) return { status: 'offline' };
    const data = (await res.json()) as { ok: boolean; ai?: boolean };
    if (res.status === 401) return { status: 'wrong' };
    if (res.status === 503) return { status: 'unconfigured' };
    return data.ok ? { status: 'ok', ai: data.ai } : { status: 'wrong' };
  } catch {
    return { status: 'offline' };
  }
}

export async function organiseWithAI(req: ImportRequest): Promise<ImportResult> {
  let file: { name: string; mediaType: string; data: string } | undefined;
  if (req.file) {
    file = { name: req.file.name, mediaType: req.file.type, data: await toBase64(req.file) };
  }

  try {
    if (!isLive) throw new Error('offline');
    const res = await fetch(`${API_BASE}/api/parse-questions`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-admin-key': adminKey.get() },
      body: JSON.stringify({
        subject: req.subject,
        examType: req.examType,
        year: req.year,
        source: req.source,
        text: req.text,
        file,
      }),
    });
    const type = res.headers.get('content-type') ?? '';
    if (!type.includes('application/json')) throw new Error('offline');
    const data = (await res.json()) as { questions?: ParsedQuestion[]; warnings?: string[]; error?: string };
    if (!res.ok) {
      // Real AI errors (bad key, refusal, too long) are shown, not hidden.
      if (res.status === 503 && req.text.trim()) {
        return { ...basicParse(req.text, req.year), engine: 'basic', fallbackReason: data.error };
      }
      throw new Error(data.error ?? `AI import failed (${res.status}).`);
    }
    return { questions: data.questions ?? [], warnings: data.warnings ?? [], engine: 'ai' };
  } catch (error) {
    if ((error as Error).message !== 'offline' && !(error instanceof TypeError)) throw error;
    if (!req.text.trim()) {
      throw new Error(
        'Files are read by the AI backend, which isn’t connected yet. Paste the text instead.',
      );
    }
    return {
      ...basicParse(req.text, req.year),
      engine: 'basic',
      fallbackReason: 'The AI backend isn’t connected yet.',
    };
  }
}

/* ------------------------------------------------------------ Basic parser */

const Q_START = /^\s*(?:Q(?:uestion)?\.?\s*)?(\d{1,3})\s*[.)\]:-]\s+(.*)$/i;
const OPT_LINE = /^\s*\(?([A-Ea-e])\s*[.)\]:-]\s*(.+)$/;
const INLINE_OPTS = /(?:^|\s)\(?([A-E])[.)]\s+(.+?)(?=\s+\(?[A-E][.)]\s+|$)/g;
const ANSWER_LINE = /^\s*(?:ans(?:wer)?|correct(?: answer)?|key)\s*[:.-]?\s*\(?([A-E])\)?\b/i;
const KEY_PAIR = /(\d{1,3})\s*[.):-]?\s*([A-E])\b/g;

export function basicParse(raw: string, year: number | null): Omit<ImportResult, 'engine'> {
  const lines = raw.replace(/\r/g, '').split('\n');
  const questions: ParsedQuestion[] = [];
  const warnings: string[] = [];
  const keyMap = new Map<number, string>();
  let current: ParsedQuestion | null = null;
  let inKey = false;

  const push = () => {
    if (current && current.question.trim()) questions.push(current);
    current = null;
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // "Answers" / "Answer key" section at the end: 1. B  2. C ...
    if (/^(answers?|answer key|key)\s*:?$/i.test(trimmed)) {
      push();
      inKey = true;
      continue;
    }
    if (inKey) {
      for (const m of trimmed.matchAll(KEY_PAIR)) keyMap.set(Number(m[1]), m[2]);
      continue;
    }

    const answer = ANSWER_LINE.exec(trimmed);
    if (answer && current) {
      (current as ParsedQuestion).correctAnswer = answer[1].toUpperCase();
      continue;
    }

    const q = Q_START.exec(trimmed);
    if (q && !OPT_LINE.test(trimmed)) {
      push();
      current = {
        number: Number(q[1]),
        question: q[2],
        options: [],
        correctAnswer: '',
        answerSource: 'paper',
        explanation: '',
        topic: '',
        year: year ?? 0,
        needsReview: true,
        reviewNote: 'Read by the basic parser — check wording, options and answer.',
      };
      // Options written on the same line as the question.
      const inline = [...q[2].matchAll(INLINE_OPTS)];
      if (inline.length >= 2) {
        (current as ParsedQuestion).question = q[2].slice(0, inline[0].index).trim();
        (current as ParsedQuestion).options = inline.map((m) => ({ label: m[1], text: m[2].trim() }));
      }
      continue;
    }

    if (!current) continue;
    const cur = current as ParsedQuestion;

    const opt = OPT_LINE.exec(trimmed);
    if (opt) {
      const inline = [...trimmed.matchAll(INLINE_OPTS)];
      if (inline.length >= 2) {
        cur.options.push(...inline.map((m) => ({ label: m[1].toUpperCase(), text: m[2].trim() })));
      } else {
        cur.options.push({ label: opt[1].toUpperCase(), text: opt[2].trim() });
      }
      continue;
    }

    // Continuation of the question text (wrapped lines).
    if (cur.options.length === 0) cur.question += ` ${trimmed}`;
    else cur.options[cur.options.length - 1].text += ` ${trimmed}`;
  }
  push();

  for (const q of questions) {
    if (!q.correctAnswer && keyMap.has(q.number)) q.correctAnswer = keyMap.get(q.number)!;
    if (q.options.length < 2) q.reviewNote = 'Options not found — add them before publishing.';
    else if (!q.correctAnswer) q.reviewNote = 'No answer found — choose the right option before publishing.';
    else {
      // Complete questions aren't flagged; the screen-level banner already
      // says the basic reader was used.
      q.needsReview = false;
      q.reviewNote = '';
    }
  }

  if (questions.length === 0) {
    warnings.push('No numbered questions were found. Make sure each question starts with its number, like “1.”');
  } else if (questions.some((q) => !q.correctAnswer)) {
    warnings.push('Some questions have no answer. The basic parser can’t work answers out — the AI can.');
  }
  return { questions, warnings };
}
