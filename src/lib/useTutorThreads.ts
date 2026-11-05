import { useState } from 'react';
import type { DiagnosticQuestion } from '../types';
import type { TutorPersona } from '../data/tutors';
import { explainQuestion, explainSimpler, similarQuestion } from '../services/tutor';
import type { SimilarQuestion } from '../services/tutor';
import { isOutOfCredits } from '../services/credits';

/* The tutor's conversation under each question (components/web/TutorThread
   draws it): the step-by-step explanation, "Did that make sense?" with
   Yes / No, explain more simply / a similar question / Skip, and practice
   questions. Used by the exam review and the past-questions page. Each
   question keeps its own conversation, so going back to it shows what was said. */

export type Turn =
  | { kind: 'ai'; text: string }
  | { kind: 'tutor'; text: string }
  | { kind: 'student'; text: string }
  | { kind: 'similar'; item: SimilarQuestion; picked?: string }
  | { kind: 'loading'; text: string }
  | { kind: 'error'; text: string; out: boolean };

type Item = Pick<DiagnosticQuestion, 'id' | 'subject' | 'topic' | 'question' | 'options' | 'correctAnswer' | 'explanation' | 'image'>;

export function useTutorThreads({ tutor, firstName }: { tutor?: TutorPersona; firstName: string }) {
  const [threads, setThreads] = useState<Record<number, Turn[]>>({});
  /** Questions the student said they understand (or skipped). */
  const [settled, setSettled] = useState<Record<number, boolean>>({});
  const name = tutor?.name ?? 'Your tutor';

  const request = (item: Item, yourAnswer?: string) => ({
    subject: item.subject,
    question: item.question,
    options: item.options,
    correctAnswer: item.correctAnswer,
    explanation: item.explanation,
    yourAnswer,
    topic: item.topic,
    // The tutor sees the question's diagram too.
    image: item.image,
  });

  const add = (id: number, ...turns: Turn[]) => setThreads((t) => ({ ...t, [id]: [...(t[id] ?? []), ...turns] }));
  const settle = (id: number, value: boolean) => setSettled((x) => ({ ...x, [id]: value }));

  /** Shows "working…" while the AI answers, then the answer (or what went wrong) in its place. */
  const run = (id: number, working: string, work: Promise<Turn>) => {
    add(id, { kind: 'loading', text: working });
    const done = (turn: Turn) =>
      setThreads((t) => {
        const list = [...(t[id] ?? [])];
        const i = list.map((x) => x.kind).lastIndexOf('loading');
        if (i >= 0) list[i] = turn;
        return { ...t, [id]: list };
      });
    work.then(done).catch((err: Error) => done({ kind: 'error', text: err.message, out: isOutOfCredits(err) }));
  };

  return {
    thread: (id: number) => threads[id] ?? [],
    settled: (id: number) => Boolean(settled[id]),

    explain(item: Item, yourAnswer?: string) {
      run(item.id, `${name} is working it through…`, explainQuestion(request(item, yourAnswer), tutor?.id).then((text): Turn => ({ kind: 'ai', text })));
    },

    understood(item: Item) {
      add(
        item.id,
        { kind: 'student', text: 'Yes, I understand.' },
        { kind: 'tutor', text: `Great, ${firstName}! You’ve got it. Go on to the next question when you’re ready, or try a similar one to be sure.` },
      );
      settle(item.id, true);
    },

    simpler(item: Item, yourAnswer?: string) {
      const before = [...(threads[item.id] ?? [])].reverse().find((x) => x.kind === 'ai');
      add(
        item.id,
        { kind: 'student', text: 'No, I don’t understand.' },
        { kind: 'tutor', text: 'No problem, thank you for telling me! I’ll explain it more simply, step by step, so you understand.' },
      );
      settle(item.id, false);
      run(
        item.id,
        `${name} is finding a simpler way…`,
        explainSimpler(request(item, yourAnswer), before?.kind === 'ai' ? before.text : '', tutor?.id).then((text): Turn => ({ kind: 'ai', text })),
      );
    },

    similar(item: Item, yourAnswer?: string) {
      add(
        item.id,
        { kind: 'student', text: 'Give me a similar question.' },
        { kind: 'tutor', text: 'Here’s one like it. Try it yourself first, then I’ll show you the working.' },
      );
      settle(item.id, false);
      run(
        item.id,
        `${name} is writing a question for you…`,
        similarQuestion(request(item, yourAnswer), tutor?.id).then((sq): Turn => ({ kind: 'similar', item: sq })),
      );
    },

    /** Skip: no answer needed (no AI, no credits). An unanswered practice question is put away. */
    skip(item: Item) {
      settle(item.id, true);
      setThreads((t) => ({ ...t, [item.id]: (t[item.id] ?? []).filter((x) => !(x.kind === 'similar' && !x.picked)) }));
    },

    pickSimilar(id: number, index: number, label: string) {
      setThreads((t) => ({ ...t, [id]: (t[id] ?? []).map((x, i) => (i === index && x.kind === 'similar' ? { ...x, picked: label } : x)) }));
    },

    /** Starts this question's conversation again (e.g. "Try again" on a past question). */
    reset(id: number) {
      setThreads((t) => ({ ...t, [id]: [] }));
      settle(id, false);
    },
  };
}

export type TutorThreads = ReturnType<typeof useTutorThreads>;
