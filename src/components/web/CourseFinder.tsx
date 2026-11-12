import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_COURSES } from '../../data/nigerian-curriculum';
import { findCourses } from '../../services/career';
import type { CareerMatch } from '../../services/career';

/* "Not sure what to study?": a short, friendly set of questions about what a
   student enjoys, is good at and cares about. The AI reads the answers and
   shows courses that fit, with the reasons, the jobs they lead to and the
   usual UTME subjects. Opened from the course step of sign-up and profile setup. */

interface Step {
  id: string;
  question: string;
  hint?: string;
  /** How many choices may be ticked (1 = pick one). 0 = a free-text answer. */
  pick: number;
  options?: string[];
}

const SUBJECTS = [
  'English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Agricultural Science', 'Further Mathematics', 'Computer Studies',
  'Technical Drawing', 'Economics', 'Commerce', 'Accounting', 'Government', 'Literature in English', 'History', 'Geography', 'CRS / IRS',
  'Civic Education', 'Fine Arts', 'Music', 'French or a Nigerian language',
];

const STEPS: Step[] = [
  { id: 'enjoy', question: 'Which subjects do you actually enjoy?', hint: 'Not the ones you “should” like. Pick up to 4.', pick: 4, options: SUBJECTS },
  { id: 'best', question: 'Which subjects do you score best in?', hint: 'Pick up to 4. It’s fine if they’re different from the ones you enjoy.', pick: 4, options: SUBJECTS },
  {
    id: 'free',
    question: 'It’s a free afternoon. What would you rather do?',
    hint: 'Pick up to 3.',
    pick: 3,
    options: [
      'Fix, build or take things apart',
      'Draw, design or make something beautiful',
      'Read, write or tell stories',
      'Solve puzzles or maths problems',
      'Help or look after someone',
      'Organise an event or lead a group',
      'Sell something or plan a small business',
      'Explore plants, animals or nature',
      'Play with computers, apps or games',
      'Argue a point or debate',
      'Perform: sing, act or make videos',
    ],
  },
  {
    id: 'problem',
    question: 'Which problem in Nigeria would you most love to solve?',
    pick: 1,
    options: [
      'Sick people not getting good care',
      'Bad roads, houses and power supply',
      'Businesses failing and people staying poor',
      'Injustice, corruption and bad leadership',
      'Hunger, farming and food prices',
      'Technology and apps Nigerians need',
      'Children and young people not learning well',
      'Pollution, flooding and the environment',
      'People not getting the right information',
    ],
  },
  {
    id: 'work',
    question: 'How do you like to work?',
    pick: 1,
    options: ['With my hands and tools', 'With people, all day', 'With numbers and data', 'With ideas and words', 'With computers', 'A mix of these'],
  },
  {
    id: 'place',
    question: 'Picture yourself at work in ten years. Where are you?',
    pick: 1,
    options: [
      'A hospital, clinic or laboratory',
      'An office in a big company or bank',
      'A building site, farm or out in the field',
      'A studio or creative space',
      'A courtroom, government office or embassy',
      'My own business',
      'Anywhere, working online',
      'A classroom or lecture hall',
    ],
  },
  {
    id: 'value',
    question: 'What matters most to you in a future job?',
    hint: 'Pick up to 2.',
    pick: 2,
    options: ['Good money', 'Helping people', 'Being respected', 'Creativity and freedom', 'A safe, steady job', 'Travelling the world', 'Being my own boss', 'Discovering new things'],
  },
  {
    id: 'friends',
    question: 'Your friends usually come to you for…',
    pick: 1,
    options: [
      'Advice when they have problems',
      'Help with schoolwork or maths',
      'Fixing their phones or gadgets',
      'Settling quarrels',
      'Ideas and plans',
      'Making them laugh',
      'Organising things',
      'Honestly, they don’t really come to me yet',
    ],
  },
  {
    id: 'years',
    question: 'How do you feel about many years of study?',
    pick: 1,
    options: ['Ready for 6 years or more (like Medicine or Architecture)', '4 to 5 years is fine', 'I’d like to start working as soon as I can'],
  },
  {
    id: 'more',
    question: 'Anything else we should know?',
    hint: 'Optional: a dream, a hobby, someone you admire, or a course your family suggests. Skip it if you like.',
    pick: 0,
  },
];

const COURSE_LIST = ALL_COURSES.map((c) => `${c.name}|${c.faculty}`);

export const CourseFinder: React.FC<{
  onClose: () => void;
  /** When given, each result has a "Choose this course" button. */
  onPick?: (course: string, faculty: string) => void;
  /** For visitors (no account yet): where "Start preparing" goes. */
  startHref?: string;
  /** When it popped up by itself: a "Don't show this again" link. */
  onNeverAgain?: () => void;
}> = ({ onClose, onPick, startHref, onNeverAgain }) => {
  const [stage, setStage] = useState<'intro' | 'ask' | 'thinking' | 'result' | 'error'>('intro');
  const [at, setAt] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string[]>>({});
  const [text, setText] = useState('');
  const [result, setResult] = useState<CareerMatch | null>(null);
  const [error, setError] = useState('');
  const panel = useRef<HTMLDivElement>(null);

  // Escape closes; focus starts inside the dialog.
  useEffect(() => {
    panel.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  // Braces matter: newer browsers return a promise from scrollTo, and an effect must return nothing (or a cleanup function).
  useEffect(() => {
    if (panel.current) panel.current.scrollTop = 0;
  }, [stage, at]);

  const step = STEPS[at]!;
  const chosen = answers[step.id] ?? [];
  const ready = step.pick === 0 || chosen.length > 0;

  const toggle = (opt: string) =>
    setAnswers((a) => {
      const now = a[step.id] ?? [];
      if (step.pick === 1) return { ...a, [step.id]: [opt] };
      if (now.includes(opt)) return { ...a, [step.id]: now.filter((x) => x !== opt) };
      return now.length >= step.pick ? a : { ...a, [step.id]: [...now, opt] };
    });

  const submit = async () => {
    setStage('thinking');
    setError('');
    const list = STEPS.filter((s) => s.pick > 0)
      .map((s) => ({ question: s.question, answer: (answers[s.id] ?? []).join('; ') }))
      .filter((x) => x.answer);
    if (text.trim()) list.push({ question: STEPS[STEPS.length - 1]!.question, answer: text.trim().slice(0, 800) });
    const pending = findCourses(list, COURSE_LIST);
    if (!pending) {
      setError('The course finder works on the live website only.');
      setStage('error');
      return;
    }
    try {
      setResult(await pending);
      setStage('result');
    } catch (e) {
      setError((e as Error).message);
      setStage('error');
    }
  };

  const next = () => (at < STEPS.length - 1 ? setAt(at + 1) : void submit());
  const facultyOf = useMemo(() => new Map(ALL_COURSES.map((c) => [c.name, c.faculty])), []);
  const restart = () => {
    setAnswers({});
    setText('');
    setAt(0);
    setResult(null);
    setStage('ask');
  };

  return (
    <div className="cfind" role="presentation" onClick={onClose}>
      <div
        className="cfind__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cfind-title"
        tabIndex={-1}
        ref={panel}
        onClick={(e) => e.stopPropagation()}
      >
        <button type="button" className="cfind__close" onClick={onClose} aria-label="Close">
          ×
        </button>

        {stage === 'intro' && (
          <div className="cfind__intro">
            <span className="cfind__badge">Course finder</span>
            <h2 id="cfind-title">Not sure what to study? That’s normal.</h2>
            <p className="cfind__lead">
              You’re not behind, and nothing is wrong with you. Most people your age have simply never been asked the right questions.
            </p>
            <p>
              Answer ten quick questions about what you enjoy, what you’re good at and what matters to you. Our AI reads your answers and shows you the courses
              that fit the way you’re made, with the reasons why, the jobs they lead to and the subjects you’ll need.
            </p>
            <ul className="cfind__points">
              <li>About 3 minutes</li>
              <li>No right or wrong answers</li>
              <li>Free</li>
            </ul>
            <button type="button" className="btn btn--primary cfind__go" onClick={() => setStage('ask')}>
              Let’s discover what fits me
            </button>
            <div className="cfind__later">
              <button type="button" onClick={onClose}>
                Maybe later
              </button>
              {onNeverAgain && (
                <button type="button" onClick={onNeverAgain}>
                  Don’t show this again
                </button>
              )}
            </div>
          </div>
        )}

        {stage === 'ask' && (
          <div className="cfind__ask">
            <div className="cfind__progress" aria-hidden>
              <i style={{ width: `${((at + 1) / STEPS.length) * 100}%` }} />
            </div>
            <p className="cfind__count">
              Question {at + 1} of {STEPS.length}
            </p>
            <h2 id="cfind-title">{step.question}</h2>
            {step.hint && <p className="cfind__hint">{step.hint}</p>}
            {step.pick === 0 ? (
              <textarea
                className="cfind__text"
                value={text}
                maxLength={800}
                rows={4}
                onChange={(e) => setText(e.target.value)}
                placeholder="e.g. I love fixing my dad’s generator, and I admire my aunt who is a pharmacist."
              />
            ) : (
              <div className="cfind__opts" role="group" aria-label={step.question}>
                {step.options!.map((o) => {
                  const on = chosen.includes(o);
                  const full = !on && step.pick > 1 && chosen.length >= step.pick;
                  return (
                    <button key={o} type="button" className={`cfind__opt${on ? ' is-on' : ''}`} aria-pressed={on} disabled={full} onClick={() => toggle(o)}>
                      {o}
                    </button>
                  );
                })}
              </div>
            )}
            <div className="cfind__nav">
              <button type="button" className="btn btn--ghost" onClick={() => (at ? setAt(at - 1) : setStage('intro'))}>
                Back
              </button>
              <button type="button" className="btn btn--primary" onClick={next} disabled={!ready}>
                {at === STEPS.length - 1 ? 'Show what fits me' : 'Next'}
              </button>
            </div>
          </div>
        )}

        {stage === 'thinking' && (
          <div className="cfind__thinking" aria-live="polite">
            <span className="cfind__pulse" aria-hidden />
            <h2 id="cfind-title">Reading your answers…</h2>
            <p>Matching what you enjoy, what you’re good at and what matters to you with over 150 courses.</p>
          </div>
        )}

        {stage === 'error' && (
          <div className="cfind__thinking" role="alert">
            <h2 id="cfind-title">That didn’t work this time</h2>
            <p>{error}</p>
            <div className="cfind__nav">
              <button type="button" className="btn btn--ghost" onClick={() => setStage('ask')}>
                Back to my answers
              </button>
              <button type="button" className="btn btn--primary" onClick={() => void submit()}>
                Try again
              </button>
            </div>
          </div>
        )}

        {stage === 'result' && result && (
          <div className="cfind__result">
            <span className="cfind__badge">What fits you</span>
            <h2 id="cfind-title">{result.title}</h2>
            <p className="cfind__lead">{result.summary}</p>
            {result.strengths.length > 0 && (
              <ul className="cfind__strengths" aria-label="Your strengths">
                {result.strengths.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            )}
            <h3>Courses that fit you</h3>
            <ol className="cfind__matches">
              {result.matches.map((m, i) => (
                <li key={m.course} className={i === 0 ? 'is-top' : ''}>
                  <div className="cfind__mhead">
                    <strong>{m.course}</strong>
                    <span className="cfind__fit" title={`${m.fit}% match`}>
                      <i style={{ width: `${m.fit}%` }} />
                    </span>
                    <small>{m.fit}% match</small>
                  </div>
                  <p>{m.why}</p>
                  {m.careers.length > 0 && (
                    <p className="cfind__meta">
                      <b>Can lead to:</b> {m.careers.join(', ')}
                    </p>
                  )}
                  {m.subjects && (
                    <p className="cfind__meta">
                      <b>Usual UTME subjects:</b> {m.subjects}
                    </p>
                  )}
                  {onPick && (
                    <button
                      type="button"
                      className="btn btn--primary btn--sm"
                      onClick={() => {
                        onPick(m.course, facultyOf.get(m.course) ?? '');
                        onClose();
                      }}
                    >
                      Choose {m.course}
                    </button>
                  )}
                </li>
              ))}
            </ol>
            {!onPick && startHref && result.matches[0] && (
              <a className="btn btn--primary cfind__go cfind__start" href={startHref}>
                Start preparing for {result.matches[0].course}, free
              </a>
            )}
            {result.nextStep && (
              <p className="cfind__next">
                <b>Try this week:</b> {result.nextStep}
              </p>
            )}
            <p className="cfind__fine">
              This is a guide, not a verdict. Talk to a teacher, a parent, or someone already doing the job before you decide. Subject requirements differ by school:
              we check them for you once you choose your school and course.
            </p>
            <div className="cfind__nav">
              <button type="button" className="btn btn--ghost" onClick={restart}>
                Start again
              </button>
              <button type="button" className="btn btn--primary" onClick={onClose}>
                Done
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

/** The friendly invitation shown on the course step. */
export const CourseFinderInvite: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <button type="button" className="cfind-invite" onClick={onOpen}>
    <span className="cfind-invite__icon" aria-hidden>
      ✦
    </span>
    <span className="cfind-invite__text">
      <strong>Not sure which course? You’re not alone.</strong>
      <small>Answer 10 quick questions and discover the courses that fit you.</small>
    </span>
    <span className="cfind-invite__go" aria-hidden>
      →
    </span>
  </button>
);

export default CourseFinder;
