import type { BoardLine, LessonQuestion } from '../data/syllabus';

/* Classroom board helpers (components/web/ClassBoard.tsx draws the lines). */

/** How many pen "letters" a line takes to write: text by its length, a
    formula or a drawing by a fixed time. */
export const lenOf = (l: BoardLine) =>
  l.kind === 'diagram' && l.svg ? 110 : l.kind === 'formula' && l.tex ? 36 : Math.max(1, l.text.length);

/** The board as text, so the AI knows what the student is looking at. */
export const boardContext = (lines: BoardLine[]) =>
  lines
    .map((l) => (l.kind === 'diagram' ? `[diagram: ${l.text}]` : l.kind === 'ask' ? `Question for the student: ${l.text}` : (l.tex ?? l.text)))
    .join('\n');

/** The lesson's check question, written on the board for the student to answer. */
export const checkLine = (check: LessonQuestion): BoardLine => ({
  kind: 'ask',
  text: check.question,
  options: check.options,
  answer: check.answer,
  why: check.why,
  say: 'Quick check. Tap your answer on the board.',
});

/** The first sentence or so, for the caption under the board. */
export const captionOf = (text: string) => {
  const plain = text.replace(/\s+/g, ' ').trim();
  const first = /^.{20,160}?[.!?](\s|$)/.exec(plain)?.[0] ?? plain;
  return first.length > 170 ? `${first.slice(0, 167)}…` : first.trim();
};
