import { api, demoDelay, isLive } from './api';
import { spendAi } from './credits';
import { lessonFor, outlineFor } from '../data/syllabus';
import type { BoardLine, Lesson } from '../data/syllabus';

/* Personal classroom: a board lesson for one syllabus topic. The backend
   asks the AI to write a lesson in the same shape (steps of board lines plus
   a check question) in the student's tutor style. */

export async function getLesson(subject: string, topic: string, tutorId?: string): Promise<Lesson> {
  return spendAi('lesson', async () => {
    if (!isLive) return lessonFor(subject, topic) ?? outlineFor(subject, topic);
    return api<Lesson>('/api/classroom/lesson', {
      method: 'POST',
      body: { subject, topic, tutorId },
      timeout: 60_000,
    });
  });
}

/** What the student wants about the part of the board they tapped. */
export type ExplainHow = 'explain' | 'why' | 'example' | 'again';

export interface BoardExplanation {
  /** Said before writing (also shown in the chat). */
  say: string;
  /** Written on the board under the lesson. */
  board: BoardLine[];
}

const HEADING: Record<ExplainHow, string> = {
  explain: 'Let me explain',
  why: 'Why?',
  example: 'Another example',
  again: 'Another way to see it',
};

/** The teacher explains part of the board, on the board. */
export async function explainOnBoard(
  req: { subject: string; topic: string; how: ExplainHow; about: string; board: string },
  tutorId?: string,
): Promise<BoardExplanation> {
  return spendAi('board', async () => {
    if (!isLive) {
      await demoDelay(700);
      return {
        say: 'Let me write that out for you.',
        board: [
          { kind: 'title', text: HEADING[req.how] },
          { kind: 'line', text: req.about.slice(0, 70), say: 'Look at this part again, slowly.' },
          { kind: 'note', text: 'With the live teacher, the full explanation is written here.', say: 'In the live classroom I work through it here, line by line.' },
        ],
      };
    }
    return api<BoardExplanation>('/api/classroom/explain', {
      method: 'POST',
      body: { ...req, tutorId },
      timeout: 60_000,
    });
  });
}
