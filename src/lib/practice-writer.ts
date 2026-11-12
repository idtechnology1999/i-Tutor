import { PRACTICE, cms, questionKey } from './cms';
import type { CmsQuestion, CmsSubject, QuestionDraft } from './cms';
import { syllabusTopics } from '../data/waec-syllabus';
import type { SyllabusChoice } from '../data/waec-syllabus';
import { examInfo, isBySchool } from './exams';
import { doubleCheckDrafts } from '../services/practice';
import { organiseWithAI } from './question-import';
import { api, isLive } from '../services/api';
import { uploadMedia } from '../services/pages';

/** How each exam is named to the AI ('' = questions that suit every exam). */
const EXAM_STYLE: Record<string, string> = {
  '': 'JAMB UTME and WAEC/NECO',
  UTME: 'JAMB UTME',
  'Post-UTME': 'university Post-UTME screening',
  WAEC: 'WAEC (WASSCE)',
  NECO: 'NECO (SSCE)',
  GCE: 'WAEC/NECO GCE',
  NABTEB: 'NABTEB',
};
const SYLLABUS_NAME: Record<SyllabusChoice, string> = { jamb: 'JAMB', waec: 'WAEC/NECO', both: 'JAMB and WAEC/NECO' };

/* Writes practice questions with the AI, in batches of up to 20, spread over
   syllabus topics. Each batch is saved as drafts as soon as it arrives, so a
   long run (100 questions) shows up in the bank as it goes and a failure part
   way keeps what was already written. Used by i-Auto and Practice questions. */

const BATCH = 20;

/** "quadratic eqn" → the syllabus's own name ("Quadratic equations") when one matches; otherwise as typed. */
const STOP_WORDS = new Set(['and', 'the', 'for', 'with', 'from', 'into', 'its', 'their', 'other', 'basic', 'simple', 'types']);

export function matchTopic(subject: string, typed: string, syllabus: SyllabusChoice = 'jamb'): string {
  const t = typed.trim().toLowerCase();
  const topics = syllabusTopics(subject, syllabus);
  const exact = topics.find((x) => x.toLowerCase() === t);
  if (exact) return exact;
  // Joining words ("and", "the"…) match almost every topic, so they don't count.
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP_WORDS.has(w));
  const scored = topics
    .map((x) => ({ x, n: words.filter((w) => x.toLowerCase().includes(w.slice(0, Math.max(4, w.length - 2)))).length }))
    .sort((a, b) => b.n - a.n);
  // A syllabus topic only when at least half the meaningful words match; otherwise the topic as written.
  return scored[0] && words.length && scored[0].n >= Math.ceil(words.length / 2) ? scored[0].x : typed.trim();
}

/** Spread `count` questions over the topics, then cut into batches of at most 20. */
function plan(topics: string[], count: number) {
  const each = topics.map((topic, i) => ({ topic, n: Math.floor(count / topics.length) + (i < count % topics.length ? 1 : 0) }));
  const batches: Array<Array<{ topic: string; n: number }>> = [];
  let batch: Array<{ topic: string; n: number }> = [];
  let size = 0;
  for (const item of each) {
    let left = item.n;
    while (left > 0) {
      const take = Math.min(left, BATCH - size);
      batch.push({ topic: item.topic, n: take });
      size += take;
      left -= take;
      if (size === BATCH) {
        batches.push(batch);
        batch = [];
        size = 0;
      }
    }
  }
  if (batch.length) batches.push(batch);
  return batches;
}

/* ---------------------------------------------- Past questions as models */

/** The subject's published past questions (for one exam, or every live exam), fetched once per visit. */
const pastCache = new Map<string, Promise<CmsQuestion[]>>();
function pastQuestions(subject: string, exam: string): Promise<CmsQuestion[]> {
  const key = `${exam}|${subject}`;
  let p = pastCache.get(key);
  if (!p) {
    const params = new URLSearchParams({ subject, ...(exam && !isBySchool(exam) ? { exam } : {}) });
    p = isLive ? api<CmsQuestion[]>(`/api/content/questions?${params}`, { timeout: 60_000 }).catch(() => []) : Promise.resolve([]);
    pastCache.set(key, p);
  }
  return p;
}

const shuffled = <T,>(list: T[]) => {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j]!, a[i]!];
  }
  return a;
};

/** Up to `max` past questions on a syllabus topic (by their topic name, then by shared key words). */
function modelsFor(past: CmsQuestion[], subject: string, topic: string, syllabus: SyllabusChoice, max: number): CmsQuestion[] {
  const t = topic.toLowerCase();
  const same = past.filter((q) => q.topic && (q.topic.toLowerCase() === t || matchTopic(subject, q.topic, syllabus).toLowerCase() === t));
  if (same.length) return shuffled(same).slice(0, max);
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length > 3 && !STOP_WORDS.has(w));
  const near = past.filter((q) => words.some((w) => `${q.topic} ${q.question.slice(-300)}`.toLowerCase().includes(w.slice(0, Math.max(4, w.length - 2)))));
  return shuffled(near).slice(0, max);
}

const modelText = (q: CmsQuestion, long: boolean) => {
  const text = q.question.length > (long ? 2400 : 600) ? `${q.question.slice(0, long ? 2400 : 600)}…` : q.question;
  return `${text}\n${q.options.map((o) => `${o.label}. ${o.text}`).join('  ')}\nAnswer: ${q.correctAnswer}`;
};

/** Topics that need a reading passage written for them. */
const isPassageTopic = (subject: string, topic: string) => subject === 'English' && /comprehension|summary|cloze/i.test(topic);

/* ------------------------------------------------- Drawn figures */

/** A figure the AI drew (SVG) turned into a PNG and uploaded, so it shows like any question diagram. */
async function figureFromSvg(svg: string, alt: string): Promise<{ image: string; imageAlt: string } | null> {
  try {
    const box = svg.match(/viewBox\s*=\s*["']\s*[-\d.]+[\s,]+[-\d.]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i);
    const w = box ? Number(box[1]) : 480;
    const h = box ? Number(box[2]) : 320;
    const scale = Math.min(3, 1200 / Math.max(w, 1));
    const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
    const img = new Image();
    await new Promise<void>((ok, bad) => {
      img.onload = () => ok();
      img.onerror = () => bad(new Error('bad drawing'));
      img.src = url;
    });
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(w * scale);
    canvas.height = Math.round(h * scale);
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    URL.revokeObjectURL(url);
    const blob = await new Promise<Blob | null>((ok) => canvas.toBlob(ok, 'image/png'));
    if (!blob) return null;
    const item = await uploadMedia(new File([blob], `ai-diagram-${Date.now()}.png`, { type: 'image/png' }), alt);
    return { image: item.url, imageAlt: alt };
  } catch {
    return null;
  }
}

export interface WriteResult {
  written: number;
  /** Set when the run stopped early; what was written so far is kept. */
  error?: string;
}

export async function writePracticeQuestions(opts: {
  subject: CmsSubject;
  /** Syllabus topics; empty means the whole syllabus for the subject. */
  topics: string[];
  count: number;
  /** Extra instruction from the admin, e.g. "make them harder". */
  note?: string;
  existing: CmsQuestion[];
  /** The exam they're written for ('' = every exam; JAMB style when not given). */
  exam?: string;
  syllabus?: SyllabusChoice;
  /** Where each batch is saved (default: the browser's question store). */
  save?: (drafts: QuestionDraft[], label: string) => void | Promise<void>;
  onProgress?: (written: number, total: number) => void;
}): Promise<WriteResult> {
  const { subject, count } = opts;
  const syllabus = opts.syllabus ?? 'jamb';
  const exam = opts.exam ?? 'UTME';
  const style = EXAM_STYLE[exam] ?? examInfo(exam)?.name ?? exam;
  const named = opts.topics.map((t) => matchTopic(subject, t, syllabus)).filter(Boolean);
  // A set novel changes from year to year and its facts can't be checked here, so it's only written when asked for by name.
  const all = syllabusTopics(subject, syllabus).filter((t) => !/prescribed novel|set book/i.test(t));
  const topics = named.length ? [...new Set(named)] : all.length ? all : ['General'];
  const seen = new Set(opts.existing.filter((q) => q.subject === subject).map((q) => questionKey(q.question)));
  let written = 0;
  opts.onProgress?.(0, count);
  // Real past questions on each topic guide the AI: what is tested, at what level, in what words.
  const past = await pastQuestions(subject, exam);
  for (const q of past) seen.add(questionKey(q.question));

  for (const batch of plan(topics, count)) {
    const n = batch.reduce((sum, b) => sum + b.n, 0);
    const lines = batch.map((b) => `- ${b.n} on "${b.topic}"`).join('\n');
    const models = batch
      .map((b) => {
        const long = isPassageTopic(subject, b.topic);
        const picked = modelsFor(past, subject, b.topic, syllabus, long ? 1 : Math.min(6, b.n + 2));
        return picked.length ? `Past questions on "${b.topic}":\n${picked.map((q, i) => `(${i + 1}) ${modelText(q, long)}`).join('\n\n')}` : '';
      })
      .filter(Boolean)
      .join('\n\n');
    const passages = batch.filter((b) => isPassageTopic(subject, b.topic));
    try {
      const res = await organiseWithAI({
        subject,
        examType: exam && !isBySchool(exam) ? exam : 'UTME',
        year: null,
        source: '',
        text:
          `Set ${n} ${style} practice questions in ${subject}, following the ${SYLLABUS_NAME[syllabus]} syllabus:\n${lines}\n` +
          `Use exactly those topic names in the topic field. Match ${style}’s style and difficulty, vary the questions, ` +
          'and give four options A–D with one correct answer.' +
          (models
            ? '\n\nBelow are REAL past questions on these topics, as models. Study what each one tests, its level and its wording, then write NEW questions ' +
              'in the same style. You may rework a model into a new question by changing its numbers, names, data, context or wording (work out the new answer ' +
              'afresh), but never copy one, and never repeat the same idea twice. Every question must be on the topic it is listed under.\n\n' +
              `<models>\n${models}\n</models>`
            : '') +
          (passages.length
            ? `\n\nFor ${passages.map((b) => `"${b.topic}"`).join(' and ')}: write ORIGINAL passages (250–400 words each, on Nigerian or general topics a ` +
              'secondary-school student can follow) and about 5 questions on each passage. Put the WHOLE passage at the start of every question on it, then a ' +
              'blank line, then the question itself. For a cloze passage, number the gaps ___1___, ___2___ … and ask one question per gap.'
            : '') +
          (subject === 'English'
            ? '\n\nThe website shows plain text only: write a tested word or phrase in CAPITAL LETTERS (e.g. "The man was very CANDID") and the tested letters of a sound question in capitals inside the word (e.g. "bOOk"), and say "in capital letters" in the question.'
            : '') +
          (opts.note?.trim() ? `\nAlso: ${opts.note.trim()}` : ''),
        file: null,
      });
      if (res.engine !== 'ai') throw new Error(res.fallbackReason ?? 'The AI isn’t connected, so it can’t write questions.');
      const names = batch.map((b) => b.topic);
      const kept = res.questions.filter((q) => {
        const k = questionKey(q.question);
        if (!k || seen.has(k)) return false;
        seen.add(k);
        return true;
      });
      // Figures the AI drew become pictures on the question, like any diagram.
      const figures = await Promise.all(
        kept.map((q) => (q.diagramSvg ? figureFromSvg(q.diagramSvg, `Diagram for a ${subject} practice question (${q.topic || names[0]})`) : Promise.resolve(null))),
      );
      const fresh: QuestionDraft[] = kept
        .filter((q, i) => !q.diagramSvg || figures[i] || !/diagram|figure|graph|curve|below|shown/i.test(q.question))
        .map((q) => ({
          ...(q.diagramSvg ? (figures[kept.indexOf(q)] ?? {}) : {}),
          subject,
          examType: PRACTICE,
          target: opts.exam ?? '',
          year: null,
          // Keep the syllabus name; a batch with one topic files everything under it.
          topic: names.find((t) => t.toLowerCase() === q.topic.trim().toLowerCase()) ?? (names.length === 1 ? names[0] : q.topic || names[0]),
          question: q.question.trim(),
          options: q.options.filter((o) => o.text.trim()),
          correctAnswer: q.correctAnswer,
          explanation: q.explanation,
          answerSource: 'ai',
          source: 'AI-written practice question',
          status: 'draft',
          needsReview: true,
          reviewNote: `${q.reviewNote || 'AI-written — check the answer, then publish.'}${
            q.diagramSvg && figures[kept.indexOf(q)] ? ' The AI drew the diagram: check it matches the question.' : ''
          }`.slice(0, 1000),
        }));
      // A second AI solves each one without the answer; only disagreements stay flagged for review.
      const drafts = await doubleCheckDrafts(fresh);
      const label = `AI wrote ${drafts.length} ${subject} practice questions (${names.join(', ')}).`;
      if (drafts.length) await (opts.save ?? ((d, l) => cms.addQuestions(d, l)))(drafts, label);
      written += drafts.length;
      opts.onProgress?.(written, count);
    } catch (e) {
      return { written, error: (e as Error).message };
    }
  }
  return { written };
}
