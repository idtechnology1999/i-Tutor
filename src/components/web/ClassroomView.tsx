import React, { useEffect, useRef, useState } from 'react';
import { Eraser, GraduationCap, ListChecks, PenLine, Play, RotateCcw, SendHorizontal, SkipForward, Volume2, VolumeX } from 'lucide-react';
import type { UserProfile } from '../../types';
import type { TutorPersona } from '../../data/tutors';
import { SYLLABUS, lessonFor, outlineFor, syllabusSubject } from '../../data/syllabus';
import type { BoardLine, Lesson } from '../../data/syllabus';
import { FREE_DAILY, readUsed, writeUsed } from '../../lib/tutor-quota';

/* -----------------------------------------------------------------------------
   Personal classroom. A plain whiteboard the teacher writes on, line by line,
   like a person with a marker; a chat beside it. The teacher knows the
   student's subjects and their syllabus topics. Commands work typed or tapped:
   "start", "teach me <topic>", "next", "repeat", "clear the board", "test me".
   -------------------------------------------------------------------------- */

interface Props {
  profile: UserProfile;
  isPremium: boolean;
  tutor?: TutorPersona;
  onUpgrade: () => void;
}

interface Chat {
  who: 'teacher' | 'you';
  text: string;
  upgrade?: boolean;
}

/** What's on the board, and what the pen still has to write. */
interface Pen {
  written: BoardLine[];
  pending: BoardLine[];
  chars: number;
}

const EMPTY_PEN: Pen = { written: [], pending: [], chars: 0 };
const CHARS_PER_TICK = 2;
const TICK_MS = 34;

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const tick = (pen: Pen): Pen => {
  if (!pen.pending.length) return pen;
  const [line, ...rest] = pen.pending;
  const chars = pen.chars + CHARS_PER_TICK;
  return chars >= line.text.length ? { written: [...pen.written, line], pending: rest, chars: 0 } : { ...pen, chars };
};

export const ClassroomView: React.FC<Props> = ({ profile, isPremium, tutor, onUpgrade }) => {
  // The student's own subjects (JAMB + WAEC/NECO), in syllabus order.
  const mine = [...new Set([...profile.selectedSubjects, ...(profile.schoolCert?.subjects ?? [])].map(syllabusSubject))];
  const subjects = Object.keys(SYLLABUS).filter((s) => mine.includes(s));
  const teacher = tutor?.name ?? 'Your teacher';

  const [subject, setSubject] = useState(subjects[0] ?? 'English');
  const [topic, setTopic] = useState(SYLLABUS[subjects[0] ?? 'English'][0]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [step, setStep] = useState(0);
  const [quiz, setQuiz] = useState(false);
  const [speak, setSpeak] = useState(false);
  const [pen, setPen] = useState<Pen>(EMPTY_PEN);
  const [text, setText] = useState('');
  const [chat, setChat] = useState<Chat[]>([
    {
      who: 'teacher',
      text: `Hi ${profile.fullName.split(' ')[0]}, welcome to your classroom. I know your syllabus for ${subjects.join(', ') || 'your subjects'}. Pick a topic and say “start”, or type “teach me” and a topic.`,
    },
  ]);
  const boardRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const writing = pen.pending.length > 0;

  // The pen writes a couple of letters at a time until the queue is empty.
  useEffect(() => {
    if (!writing) return;
    const t = window.setInterval(() => setPen(tick), TICK_MS);
    return () => window.clearInterval(t);
  }, [writing]);

  useEffect(() => {
    boardRef.current?.scrollTo({ top: boardRef.current.scrollHeight });
  }, [pen]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    },
    [],
  );

  const say = (line: string, extra?: Partial<Chat>) => {
    setChat((prev) => [...prev, { who: 'teacher', text: line, ...extra }]);
    if (speak && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(line);
      u.lang = 'en-GB';
      u.rate = 0.97;
      window.speechSynthesis.speak(u);
    }
  };

  const write = (lines: BoardLine[]) => {
    // On phones the chat sits under the board: bring the board into view to watch it write.
    if (window.matchMedia('(max-width: 980px)').matches) {
      window.requestAnimationFrame(() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
    setPen((prev) =>
      prefersReducedMotion()
        ? { written: [...prev.written, ...prev.pending, ...lines], pending: [], chars: 0 }
        : { ...prev, pending: [...prev.pending, ...lines] },
    );
  };

  const clearBoard = () => {
    setPen(EMPTY_PEN);
    say('Board cleared.');
  };

  const teachStep = (l: Lesson, i: number) => {
    const s = l.steps[i];
    say(s.say);
    write(s.board);
  };

  const startLesson = (subj: string, top: string) => {
    if (!isPremium) {
      const used = readUsed();
      if (used >= FREE_DAILY) {
        say(`You’ve used today’s ${FREE_DAILY} free lessons and questions. Premium gives you unlimited lessons with ${tutor?.name ?? 'your own tutor'}.`, {
          upgrade: true,
        });
        return;
      }
      writeUsed(used + 1);
    }
    const l = lessonFor(subj, top) ?? outlineFor(subj, top);
    setSubject(subj);
    setTopic(top);
    setLesson(l);
    setStep(0);
    setQuiz(false);
    setPen(EMPTY_PEN);
    teachStep(l, 0);
  };

  const next = () => {
    if (!lesson) {
      startLesson(subject, topic);
      return;
    }
    if (step < lesson.steps.length - 1) {
      setStep(step + 1);
      teachStep(lesson, step + 1);
      return;
    }
    testMe();
  };

  const repeat = () => {
    if (!lesson) return say('We haven’t started yet — say “start” when you’re ready.');
    setPen(EMPTY_PEN);
    say('No problem, let me write that again.');
    write(lesson.steps[step].board);
  };

  const testMe = () => {
    if (!lesson || !lesson.check.question) {
      say('Let’s finish a lesson first, then I’ll test you on it.');
      return;
    }
    setQuiz(true);
    say(
      `Quick check: ${lesson.check.question}\n${lesson.check.options.map((o) => `${o.label}. ${o.text}`).join('\n')}\nReply with A, B, C or D.`,
    );
  };

  const findTopic = (q: string) => {
    for (const subj of subjects) {
      const hit = SYLLABUS[subj].find((t) => q.includes(t.toLowerCase()) || t.toLowerCase().includes(q));
      if (hit) return { subj, top: hit };
    }
    return null;
  };

  const handle = (raw: string) => {
    const msg = raw.trim();
    if (!msg) return;
    setChat((prev) => [...prev, { who: 'you', text: msg }]);
    setText('');
    const t = msg.toLowerCase();

    if (quiz && /^[a-d]\b/.test(t) && lesson) {
      const pick = t[0].toUpperCase();
      setQuiz(false);
      say(
        pick === lesson.check.answer
          ? `Correct! ${lesson.check.why} Say “next topic” or pick another one.`
          : `Not quite — it’s ${lesson.check.answer}. ${lesson.check.why}`,
      );
      return;
    }
    if (/\b(clear|wipe|erase|clean)\b/.test(t)) return clearBoard();
    if (/\b(repeat|again|slower|didn.?t (get|understand))\b/.test(t)) return repeat();
    if (/\b(test me|quiz|question me|check me)\b/.test(t)) return testMe();
    if (/\bnext topic\b/.test(t)) {
      const list = SYLLABUS[subject];
      const nextTopic = list[(list.indexOf(topic) + 1) % list.length];
      return startLesson(subject, nextTopic);
    }
    if (/\b(next|continue|go on|carry on)\b/.test(t)) return next();
    const teach = t.match(/\b(?:teach me|explain|start|begin|lesson on|teach)\b\s*(?:about|on)?\s*(.*)$/);
    if (teach) {
      const want = teach[1].replace(/[.?!]+$/, '').trim();
      if (!want) return startLesson(subject, topic);
      const hit = findTopic(want);
      if (hit) return startLesson(hit.subj, hit.top);
      return say(`“${want}” isn’t in your syllabus list yet. Try one of: ${SYLLABUS[subject].slice(0, 4).join(', ')}.`);
    }
    const hit = findTopic(t);
    if (hit) return startLesson(hit.subj, hit.top);
    say(
      lesson
        ? 'Good question. Say “next” to continue, “repeat” to see it again, or “test me” for a quick question.'
        : 'Say “start” to begin, or “teach me” and a topic — for example “teach me quadratic equations”.',
    );
  };

  const current = pen.pending[0];

  return (
    <div className="ui-page room-page">
      <header className="cls__head">
        <div>
          <p className="cls__eyebrow">
            <GraduationCap size={16} aria-hidden /> My classroom
          </p>
          <h1>{lesson ? lesson.topic : 'Your personal classroom'}</h1>
        </div>
        <div className="cls__pickers">
          <select
            className="cls__select"
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setTopic(SYLLABUS[e.target.value][0]);
            }}
            aria-label="Subject"
          >
            {subjects.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select className="cls__select" value={topic} onChange={(e) => setTopic(e.target.value)} aria-label="Topic">
            {(SYLLABUS[subject] ?? []).map((t) => (
              <option key={t}>{t}</option>
            ))}
          </select>
        </div>
      </header>

      <div className="cls">
        <section className="cls__boardwrap" aria-label="Whiteboard">
          <div className="cls__board" ref={boardRef}>
            {!pen.written.length && !current && <p className="cls__empty">The board is clear.</p>}
            {pen.written.map((l, i) => (
              <p key={i} className={`bl bl--${l.kind}`}>
                {l.text}
              </p>
            ))}
            {current && (
              <p className={`bl bl--${current.kind}`}>
                {current.text.slice(0, pen.chars)}
                <PenLine size={20} className="cls__pen" aria-hidden />
              </p>
            )}
          </div>
          <div className="cls__tray" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div className="cls__tools">
            <button type="button" className="cls__tool cls__tool--main" onClick={next} disabled={writing}>
              {lesson ? <SkipForward size={18} aria-hidden /> : <Play size={18} aria-hidden />}
              {lesson ? (step < lesson.steps.length - 1 ? 'Next' : 'Test me') : 'Start lesson'}
            </button>
            <button type="button" className="cls__tool" onClick={repeat} disabled={writing || !lesson}>
              <RotateCcw size={18} aria-hidden /> Repeat
            </button>
            <button type="button" className="cls__tool" onClick={clearBoard} disabled={writing}>
              <Eraser size={18} aria-hidden /> Clear board
            </button>
            <button type="button" className="cls__tool" onClick={testMe} disabled={writing || !lesson}>
              <ListChecks size={18} aria-hidden /> Test me
            </button>
            {isPremium && (
              <button
                type="button"
                className={`cls__tool${speak ? ' is-on' : ''}`}
                onClick={() => setSpeak((v) => !v)}
                aria-pressed={speak}
              >
                {speak ? <Volume2 size={18} aria-hidden /> : <VolumeX size={18} aria-hidden />} Speak
              </button>
            )}
          </div>
        </section>

        <aside className="cls__chat" aria-label={`Chat with ${teacher}`}>
          <header className="cls__chat-head">
            {tutor ? (
              <span className={`tutor-avatar tutor-avatar--${tutor.id}`} aria-hidden>
                {tutor.name.charAt(0)}
              </span>
            ) : (
              <span className="tutor-avatar" aria-hidden>
                <GraduationCap size={18} />
              </span>
            )}
            <div>
              <strong>{teacher}</strong>
              <small>{isPremium ? 'Unlimited lessons' : `Free: ${FREE_DAILY} lessons or questions a day`}</small>
            </div>
          </header>
          <div className="cls__log" ref={chatRef} aria-live="polite">
            {chat.map((c, i) => (
              <div key={i} className={`cls__msg cls__msg--${c.who}`}>
                <p>{c.text}</p>
                {c.upgrade && (
                  <button type="button" className="ui-btn ui-btn--primary" onClick={onUpgrade}>
                    Upgrade
                  </button>
                )}
              </div>
            ))}
          </div>
          <div className="cls__chips">
            {['Start', 'Next', 'Repeat', 'Clear the board', 'Test me'].map((c) => (
              <button key={c} type="button" onClick={() => handle(c)} disabled={writing}>
                {c}
              </button>
            ))}
          </div>
          <form
            className="cls__input"
            onSubmit={(e) => {
              e.preventDefault();
              handle(text);
            }}
          >
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Say “teach me indices”…"
              aria-label={`Message ${teacher}`}
            />
            <button type="submit" disabled={!text.trim()} aria-label="Send">
              <SendHorizontal size={18} aria-hidden />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
