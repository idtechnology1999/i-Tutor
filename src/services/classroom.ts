import { api, isLive } from './api';
import { lessonFor, outlineFor } from '../data/syllabus';
import type { Lesson } from '../data/syllabus';

/* Personal classroom: a board lesson for one syllabus topic. The backend
   asks the AI to write a lesson in the same shape (steps of board lines plus
   a check question) in the student's tutor style. */

export async function getLesson(subject: string, topic: string, tutorId?: string): Promise<Lesson> {
  if (!isLive) return lessonFor(subject, topic) ?? outlineFor(subject, topic);
  return api<Lesson>('/api/classroom/lesson', {
    method: 'POST',
    body: { subject, topic, tutorId },
    timeout: 60_000,
  });
}
