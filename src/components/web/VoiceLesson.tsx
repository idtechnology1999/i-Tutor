import React, { useEffect, useRef, useState } from 'react';
import { canSpeak, pickVoice, recogniserCtor } from '../../lib/speech';
import type { Recogniser } from '../../lib/speech';
import { ArrowLeft, Keyboard, Mic, PhoneOff, RotateCcw, SendHorizontal, Square } from 'lucide-react';

/* -----------------------------------------------------------------------------
   Voice lesson (Premium). The tutor talks the student through a topic, asks a
   question, listens to the spoken answer and replies — like a lesson with a
   real teacher. Uses the browser's own speech (no server needed for the UI):
   speechSynthesis to talk, SpeechRecognition to listen. Where listening isn't
   supported the student types the answer instead.
   Backend later: send the transcript to the tutor model and speak its reply.
   -------------------------------------------------------------------------- */

interface Step {
  say: string;
  /** Spoken question the student answers. */
  ask: string;
  /** What a right answer contains. */
  expect: RegExp;
  right: string;
  hint: string;
}

interface Lesson {
  id: string;
  subject: string;
  title: string;
  steps: Step[];
}

const LESSONS: Lesson[] = [
  {
    id: 'motion',
    subject: 'Physics',
    title: 'Motion in a straight line',
    steps: [
      {
        say: 'Let’s talk about motion. When a body starts from rest, its initial velocity u is zero. Acceleration is how fast velocity changes: change in velocity divided by time.',
        ask: 'A car starts from rest and reaches twenty metres per second in five seconds. What is its acceleration?',
        expect: /\b(4|four)\b/,
        right: 'Exactly. Twenty divided by five gives four metres per second squared. Well done.',
        hint: 'Not quite. Take the change in velocity, twenty minus zero, and divide by the time, five seconds. What do you get?',
      },
      {
        say: 'Now distance. When u is zero, s equals half a t squared.',
        ask: 'Using the same car, with acceleration four for five seconds, how far does it travel?',
        expect: /\b(50|fifty)\b/,
        right: 'Correct, fifty metres. Half of four is two, times twenty-five gives fifty.',
        hint: 'Close. Half of four is two. Five squared is twenty-five. Multiply them together.',
      },
    ],
  },
  {
    id: 'stress',
    subject: 'English',
    title: 'Word stress',
    steps: [
      {
        say: 'Stress is the syllable we say loudest. Most two-syllable nouns are stressed on the first syllable, like PREsent. Most two-syllable verbs are stressed on the second, like preSENT.',
        ask: 'In the sentence, she will reCORD the song, is record a noun or a verb?',
        expect: /\bverb\b/,
        right: 'Yes, it’s a verb, so the stress falls on the second syllable: reCORD.',
        hint: 'Think about what it’s doing. She will do something to the song. Is that a noun or a verb?',
      },
    ],
  },
  {
    id: 'isomers',
    subject: 'Chemistry',
    title: 'Isomers',
    steps: [
      {
        say: 'Isomers have the same molecular formula but a different structure. Ethanol and methoxymethane are both C two H six O, but ethanol is an alcohol and methoxymethane is an ether.',
        ask: 'Which of the two has the higher boiling point, ethanol or methoxymethane?',
        expect: /\bethanol\b/,
        right: 'Right, ethanol. Its O H group forms hydrogen bonds, which take more energy to break.',
        hint: 'Think about hydrogen bonding. Which one has an O H group?',
      },
    ],
  },
  {
    id: 'quadratics',
    subject: 'Mathematics',
    title: 'Quadratic equations',
    steps: [
      {
        say: 'To solve a quadratic by factorising, find two numbers that multiply to give the last term and add to give the middle term.',
        ask: 'Solve x squared minus five x plus six equals zero. What are the two values of x?',
        expect: /(\b(2|two)\b[\s\S]*\b(3|three)\b)|(\b(3|three)\b[\s\S]*\b(2|two)\b)/,
        right: 'Perfect. Two and three, because two times three is six and two plus three is five.',
        hint: 'Find two numbers that multiply to six and add up to five.',
      },
    ],
  },
];

type Phase = 'pick' | 'speaking' | 'waiting' | 'listening' | 'thinking' | 'done';

interface Line {
  who: 'tutor' | 'you';
  text: string;
}

interface Props {
  studentName: string;
  onBack: () => void;
}

export const VoiceLesson: React.FC<Props> = ({ studentName, onBack }) => {
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [phase, setPhase] = useState<Phase>('pick');
  const [lines, setLines] = useState<Line[]>([]);
  const [heard, setHeard] = useState('');
  const [typed, setTyped] = useState('');
  const [typing, setTyping] = useState(() => recogniserCtor() === null);
  const [micError, setMicError] = useState('');
  const recRef = useRef<Recogniser | null>(null);
  const heardRef = useRef('');
  const logRef = useRef<HTMLDivElement>(null);
  const hasMic = recogniserCtor() !== null;

  // Stop talking and listening when the lesson closes.
  useEffect(
    () => () => {
      if (canSpeak()) window.speechSynthesis.cancel();
      recRef.current?.abort();
    },
    [],
  );

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [lines, heard]);

  /** Say something out loud, show it as a caption, then run `next`. */
  const speak = (text: string, next: Phase) => {
    setLines((prev) => [...prev, { who: 'tutor', text }]);
    setPhase('speaking');
    if (!canSpeak()) {
      window.setTimeout(() => setPhase(next), 1200);
      return;
    }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const voice = pickVoice();
    if (voice) u.voice = voice;
    u.lang = voice?.lang ?? 'en-GB';
    u.rate = 0.96;
    u.pitch = 1.02;
    u.onend = () => setPhase(next);
    u.onerror = () => setPhase(next);
    window.speechSynthesis.speak(u);
  };

  const teach = (l: Lesson, i: number) => {
    const step = l.steps[i];
    speak(`${step.say} ${step.ask}`, 'waiting');
  };

  const start = (l: Lesson) => {
    setLesson(l);
    setStepIndex(0);
    setLines([]);
    const hello = `Hi ${studentName}. Today we’re doing ${l.title}. Listen, then answer out loud when I ask you. `;
    const step = l.steps[0];
    speak(`${hello}${step.say} ${step.ask}`, 'waiting');
  };

  const answer = (said: string) => {
    if (!lesson) return;
    const text = said.trim();
    if (!text) {
      setPhase('waiting');
      return;
    }
    const step = lesson.steps[stepIndex];
    setLines((prev) => [...prev, { who: 'you', text }]);
    setHeard('');
    setPhase('thinking');
    window.setTimeout(() => {
      if (!step.expect.test(text.toLowerCase())) {
        speak(step.hint, 'waiting');
        return;
      }
      const last = stepIndex === lesson.steps.length - 1;
      if (last) {
        speak(`${step.right} That’s the end of this lesson. Great work, ${studentName}.`, 'done');
      } else {
        const next = lesson.steps[stepIndex + 1];
        setStepIndex(stepIndex + 1);
        speak(`${step.right} Next. ${next.say} ${next.ask}`, 'waiting');
      }
    }, 700);
  };

  const listen = () => {
    const Ctor = recogniserCtor();
    if (!Ctor) return;
    if (canSpeak()) window.speechSynthesis.cancel();
    setMicError('');
    heardRef.current = '';
    setHeard('');
    const rec = new Ctor();
    rec.lang = 'en-NG';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const text = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      heardRef.current = text;
      setHeard(text);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        setMicError('Microphone is blocked. Allow it in your browser, or type your answer.');
        setTyping(true);
      } else if (e.error === 'no-speech') {
        setMicError('I didn’t hear anything. Tap the mic and try again.');
      }
    };
    rec.onend = () => {
      recRef.current = null;
      if (heardRef.current.trim()) answer(heardRef.current);
      else setPhase('waiting');
    };
    recRef.current = rec;
    setPhase('listening');
    try {
      rec.start();
    } catch {
      setPhase('waiting');
    }
  };

  const stopListening = () => recRef.current?.stop();

  const repeat = () => {
    if (!lesson) return;
    setLines((prev) => prev.slice(0, -1));
    teach(lesson, stepIndex);
  };

  const end = () => {
    if (canSpeak()) window.speechSynthesis.cancel();
    recRef.current?.abort();
    setLesson(null);
    setPhase('pick');
    setLines([]);
  };

  /* ------------------------------------------------------------ Topic list */
  if (phase === 'pick' || !lesson) {
    return (
      <div className="voice voice--pick">
        <button type="button" className="voice__back" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden /> Back to chat
        </button>
        <div className="voice__intro">
          <span className={`voice__orb is-idle`} aria-hidden>
            <i />
            <i />
            <i />
          </span>
          <h2>Voice lesson</h2>
          <p>Your tutor talks you through a topic, asks you questions and listens to your answers — like a real class.</p>
          {!hasMic && <p className="voice__note">This browser can’t listen, so you’ll type your answers. Chrome works best.</p>}
        </div>
        <ul className="voice__topics">
          {LESSONS.map((l) => (
            <li key={l.id}>
              <button type="button" onClick={() => start(l)}>
                <small>{l.subject}</small>
                <strong>{l.title}</strong>
                <span>
                  {l.steps.length} question{l.steps.length === 1 ? '' : 's'}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    );
  }

  /* ------------------------------------------------------------ In lesson */
  const status: Record<Phase, string> = {
    pick: '',
    speaking: 'Tutor is speaking…',
    waiting: hasMic && !typing ? 'Your turn — tap the mic and answer' : 'Your turn — type your answer',
    listening: 'Listening…',
    thinking: 'Thinking…',
    done: 'Lesson complete',
  };

  return (
    <div className="voice">
      <div className="voice__top">
        <small>{lesson.subject}</small>
        <strong>{lesson.title}</strong>
        <span className="voice__progress">
          Question {Math.min(stepIndex + 1, lesson.steps.length)} of {lesson.steps.length}
        </span>
      </div>

      <div className="voice__stage">
        <span className={`voice__orb is-${phase}`} aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <p className="voice__status" aria-live="polite">
          {status[phase]}
        </p>
      </div>

      <div className="voice__log" ref={logRef}>
        {lines.map((line, i) => (
          <p key={i} className={`voice__line voice__line--${line.who}`}>
            {line.text}
          </p>
        ))}
        {heard && <p className="voice__line voice__line--you is-live">{heard}</p>}
      </div>

      {micError && <p className="voice__error">{micError}</p>}

      {phase === 'done' ? (
        <div className="voice__controls">
          <button type="button" className="ui-btn ui-btn--primary ui-btn--block" onClick={end}>
            Choose another lesson
          </button>
        </div>
      ) : typing ? (
        <form
          className="tutor__input voice__type"
          onSubmit={(e) => {
            e.preventDefault();
            answer(typed);
            setTyped('');
          }}
        >
          <input
            type="text"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
            placeholder="Type your answer…"
            aria-label="Your answer"
            disabled={phase !== 'waiting'}
          />
          <button type="submit" disabled={!typed.trim() || phase !== 'waiting'} aria-label="Send answer">
            <SendHorizontal size={18} aria-hidden />
          </button>
        </form>
      ) : null}

      {phase !== 'done' && (
        <div className="voice__controls">
          <button type="button" className="voice__ctl" onClick={repeat} disabled={phase !== 'waiting'}>
            <span>
              <RotateCcw size={20} aria-hidden />
            </span>
            Repeat
          </button>
          {hasMic && !typing ? (
            <button
              type="button"
              className={`voice__mic${phase === 'listening' ? ' is-on' : ''}`}
              onClick={phase === 'listening' ? stopListening : listen}
              disabled={phase !== 'waiting' && phase !== 'listening'}
              aria-label={phase === 'listening' ? 'Stop and send my answer' : 'Answer with my voice'}
            >
              {phase === 'listening' ? <Square size={26} aria-hidden /> : <Mic size={30} aria-hidden />}
            </button>
          ) : (
            <span className="voice__mic-spacer" />
          )}
          {hasMic ? (
            <button type="button" className="voice__ctl" onClick={() => setTyping((t) => !t)}>
              <span>{typing ? <Mic size={20} aria-hidden /> : <Keyboard size={20} aria-hidden />}</span>
              {typing ? 'Speak' : 'Type'}
            </button>
          ) : (
            <span className="voice__mic-spacer" />
          )}
        </div>
      )}

      <button type="button" className="voice__end" onClick={end}>
        <PhoneOff size={18} aria-hidden /> End lesson
      </button>
    </div>
  );
};
