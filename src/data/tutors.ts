/* -----------------------------------------------------------------------------
   Personal AI tutors (Premium). Each paying student picks one; the same tutor
   then helps them everywhere — chat, voice lessons and "solve this question".
   They are AI tutors with a teaching style, not real people, and the UI says so.
   Backend later: send `style` with each tutor request so the model answers in
   that voice.
   -------------------------------------------------------------------------- */

export interface TutorPersona {
  id: string;
  name: string;
  style: string;
  blurb: string;
  /** How this tutor opens and closes a worked solution. */
  open: string;
  close: string;
}

export const TUTORS: TutorPersona[] = [
  {
    id: 'ada',
    name: 'Ada',
    style: 'Patient, step by step',
    blurb: 'Breaks every question into small steps and checks you follow each one before moving on.',
    open: 'Let’s take this one slowly, one step at a time.',
    close: 'Want me to give you a similar question so you can try it yourself?',
  },
  {
    id: 'tobi',
    name: 'Tobi',
    style: 'Quick, with exam tricks',
    blurb: 'Gets straight to the point and shows the shortcuts that save time in the CBT hall.',
    open: 'Quick one — here’s how to crack it.',
    close: 'Exam trick: cross out the options that clearly don’t fit first, then decide between the rest.',
  },
  {
    id: 'zainab',
    name: 'Zainab',
    style: 'Everyday examples',
    blurb: 'Explains ideas with things from everyday life in Nigeria so they stick.',
    open: 'Let’s think about this the way you’d explain it to a friend.',
    close: 'Try saying the key idea back to me in your own words — that’s how it sticks.',
  },
];

export const tutorById = (id?: string) => TUTORS.find((t) => t.id === id);

/** A question the student wants solved, with what they picked (if anything). */
export interface SolveRequest {
  subject: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
  yourAnswer?: string;
  topic?: string;
  /** 'hint' during a timed exam: point the way, don't give the answer. */
  mode?: 'solve' | 'hint';
}

/** During a timed practice exam: a nudge, never the answer. */
export const hintSteps = (q: SolveRequest, tutor?: TutorPersona) =>
  [
    tutor ? `${tutor.name} here — no answers mid-exam, but here’s a nudge.` : 'No answers mid-exam, but here’s a nudge.',
    `**What topic is this?** ${q.topic || q.subject}.`,
    '**Try this:** underline the key words in the question, then cross out any option that clearly doesn’t match them. Pick from what’s left.',
    'When you submit, tap the question in your results and I’ll show you the full working.',
  ].join('\n\n');

/** A worked, step-by-step solution in the tutor's voice. */
export const solveSteps = (q: SolveRequest, tutor?: TutorPersona) => {
  const right = q.options.find((o) => o.label === q.correctAnswer);
  const yours = q.yourAnswer ? q.options.find((o) => o.label === q.yourAnswer) : undefined;
  const short = q.question.length > 140 ? `${q.question.slice(0, 137)}…` : q.question;
  const lines = [
    tutor?.open ?? 'Let’s solve it step by step.',
    `**1. What it’s asking:** ${short}`,
    `**2. The key idea:** ${q.explanation}`,
    `**3. The answer:** ${q.correctAnswer}. ${right?.text ?? ''}`.trim(),
  ];
  if (yours && q.yourAnswer !== q.correctAnswer) {
    lines.push(
      `You picked **${yours.label}. ${yours.text}** — it looks close, but it doesn’t match the key idea in step 2. That’s the trap examiners set.`,
    );
  }
  lines.push(tutor?.close ?? 'Ask me if any step isn’t clear.');
  return lines.join('\n\n');
};
