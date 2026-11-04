import { PRACTICE, cms, questionKey } from './cms';
import type { CmsQuestion, CmsSubject, QuestionDraft } from './cms';
import { syllabusTopics } from '../data/waec-syllabus';
import type { SyllabusChoice } from '../data/waec-syllabus';
import { examInfo, isBySchool } from './exams';
import { organiseWithAI } from './question-import';

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
export function matchTopic(subject: string, typed: string, syllabus: SyllabusChoice = 'jamb'): string {
  const t = typed.trim().toLowerCase();
  const topics = syllabusTopics(subject, syllabus);
  const exact = topics.find((x) => x.toLowerCase() === t);
  if (exact) return exact;
  const words = t.split(/[^a-z0-9]+/).filter((w) => w.length > 2);
  const scored = topics
    .map((x) => ({ x, n: words.filter((w) => x.toLowerCase().includes(w.slice(0, Math.max(4, w.length - 2)))).length }))
    .sort((a, b) => b.n - a.n);
  return scored[0] && scored[0].n > 0 ? scored[0].x : typed.trim();
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
  const all = syllabusTopics(subject, syllabus);
  const topics = named.length ? [...new Set(named)] : all.length ? all : ['General'];
  const seen = new Set(opts.existing.filter((q) => q.subject === subject).map((q) => questionKey(q.question)));
  let written = 0;
  opts.onProgress?.(0, count);

  for (const batch of plan(topics, count)) {
    const n = batch.reduce((sum, b) => sum + b.n, 0);
    const lines = batch.map((b) => `- ${b.n} on "${b.topic}"`).join('\n');
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
          (opts.note?.trim() ? `\nAlso: ${opts.note.trim()}` : ''),
        file: null,
      });
      if (res.engine !== 'ai') throw new Error(res.fallbackReason ?? 'The AI isn’t connected, so it can’t write questions.');
      const names = batch.map((b) => b.topic);
      const drafts: QuestionDraft[] = res.questions
        .filter((q) => {
          const k = questionKey(q.question);
          if (!k || seen.has(k)) return false;
          seen.add(k);
          return true;
        })
        .map((q) => ({
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
          reviewNote: q.reviewNote || 'AI-written — check the answer, then publish.',
        }));
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
