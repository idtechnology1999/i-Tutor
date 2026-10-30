import React, { useEffect, useRef, useState } from 'react';
import {
  Eraser,
  GraduationCap,
  Highlighter,
  Lightbulb,
  ListChecks,
  Lock,
  MessageCircleQuestion,
  Mic,
  Pause,
  Pencil,
  Play,
  RotateCcw,
  SendHorizontal,
  SkipForward,
  Sparkles,
  Square,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { recogniserCtor, speakText } from '../../lib/speech';
import type { Recogniser } from '../../lib/speech';
import type { UserProfile } from '../../types';
import type { TutorPersona } from '../../data/tutors';
import { SYLLABUS, syllabusSubject } from '../../data/syllabus';
import { getLesson } from '../../services/classroom';
import { askTutor } from '../../services/tutor';
import { isLive } from '../../services/api';
import type { BoardLine, Lesson } from '../../data/syllabus';
import { FREE_DAILY, readUsed, writeUsed } from '../../lib/tutor-quota';
import { boardContext, captionOf, checkLine, lenOf } from '../../lib/board';
import { replyForHistory, replyForSpeech } from '../../lib/tutor-reply';
import { BoardItem, InkLayer } from './ClassBoard';
import { TutorReply } from './TutorReply';

/* -----------------------------------------------------------------------------
   Personal classroom. A whiteboard the teacher writes on line by line, talking
   as they go (a caption under the board, and the voice with Speak on). The
   teacher draws diagrams, writes real formulas and stops to ask the student
   questions on the board. The student can tap any line to ask about it, write
   on the board with their own pen, replay a step, or pause the teacher.
   Commands work typed or tapped: "start", "teach me <topic>", "next",
   "repeat", "clear the board", "test me". Anything else is a question for the
   teacher, answered by the AI with the board as context.
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

/** One pen stroke. `hold` keeps a finished line waiting while the teacher is still talking. */
const tick = (pen: Pen, hold: boolean): Pen => {
  if (!pen.pending.length) return pen;
  const [line, ...rest] = pen.pending;
  const chars = pen.chars + CHARS_PER_TICK;
  if (chars < lenOf(line)) return { ...pen, chars };
  return hold ? { ...pen, chars: lenOf(line) } : { written: [...pen.written, line], pending: rest, chars: 0 };
};

/** The index of an ask line on the board that is still waiting for the student. */
const openAsk = (written: BoardLine[], asks: Record<number, string>) => {
  const i = written.length - 1;
  // An ask without choices can't be answered, so it never holds the lesson up.
  return i >= 0 && written[i].kind === 'ask' && written[i].options?.length && asks[i] === undefined ? i : -1;
};

const LINE_ACTIONS = [
  { id: 'explain', label: 'Explain this', icon: Lightbulb },
  { id: 'why', label: 'Why?', icon: MessageCircleQuestion },
  { id: 'example', label: 'Another example', icon: Sparkles },
] as const;

export const ClassroomView: React.FC<Props> = ({ profile, isPremium, tutor, onUpgrade }) => {
  // The student's own subjects (JAMB + WAEC/NECO), in syllabus order.
  const mine = [...new Set([...profile.selectedSubjects, ...(profile.schoolCert?.subjects ?? [])].map(syllabusSubject))];
  const subjects = Object.keys(SYLLABUS).filter((s) => mine.includes(s));
  const teacher = tutor?.name ?? 'Your teacher';

  const [subject, setSubject] = useState(subjects[0] ?? 'English');
  const [topic, setTopic] = useState(SYLLABUS[subjects[0] ?? 'English'][0]);
  const [lesson, setLesson] = useState<Lesson | null>(null);
  const [step, setStep] = useState(0);
  /** The furthest step taught, so earlier ones can be replayed. */
  const [reached, setReached] = useState(0);
  const [speak, setSpeak] = useState(false);
  const [pen, setPen] = useState<Pen>(EMPTY_PEN);
  const [paused, setPaused] = useState(false);
  /** Answers to ask lines on the board, by line index. */
  const [asks, setAsks] = useState<Record<number, string>>({});
  /** The line the student tapped (menu open), and the one being discussed. */
  const [menu, setMenu] = useState<number | null>(null);
  const [focus, setFocus] = useState<number | null>(null);
  const [inking, setInking] = useState(false);
  const [strokes, setStrokes] = useState<string[]>([]);
  const [caption, setCaption] = useState('');
  const [talking, setTalking] = useState(false);
  const [text, setText] = useState('');
  const [chat, setChat] = useState<Chat[]>([
    {
      who: 'teacher',
      text: `Hi ${profile.fullName.split(' ')[0]}, welcome to your classroom. I know your syllabus for ${subjects.join(', ') || 'your subjects'}. Pick a topic and press **Start lesson**, or type “teach me” and a topic. While I teach, tap anything on the board to ask me about it.`,
    },
  ]);
  const [listening, setListening] = useState(false);
  /** Waiting for the AI: a lesson being prepared, or an answer to a question. */
  const [busy, setBusy] = useState<'' | 'lesson' | 'answer'>('');
  const recRef = useRef<Recogniser | null>(null);
  const heardRef = useRef('');
  const hasMic = recogniserCtor() !== null;
  const boardRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  const writing = pen.pending.length > 0;
  const waitingFor = openAsk(pen.written, asks);
  const waiting = writing || busy !== '';
  const current = pen.pending[0];

  /* ------------------------------------------------------------ Voice */

  // `voiced` keeps talking back when the student spoke to the teacher.
  const voicedRef = useRef(false);
  const queueRef = useRef<string[]>([]);
  const talkingRef = useRef(false);

  // Lines are spoken one after another; the pen waits for the voice.
  const playNext = () => {
    const next = queueRef.current.shift();
    if (!next) {
      talkingRef.current = false;
      setTalking(false);
      return;
    }
    talkingRef.current = true;
    setTalking(true);
    let done = false;
    // Some browsers never report the end of a long line: move on anyway.
    const guard = window.setTimeout(() => finish(), 2500 + next.length * 110);
    const finish = () => {
      if (done) return;
      done = true;
      window.clearTimeout(guard);
      playNext();
    };
    speakText(next, finish);
  };
  const narrate = (line: string) => {
    if (!(speak || voicedRef.current) || !line.trim()) return;
    queueRef.current.push(line);
    if (!talkingRef.current) playNext();
  };
  const hush = () => {
    queueRef.current = [];
    talkingRef.current = false;
    setTalking(false);
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
  };

  /* ------------------------------------------------------------- Pen */

  // The pen writes a couple of letters at a time; it stops for pauses and
  // for a question on the board that the student hasn't answered.
  useEffect(() => {
    if (!writing || paused || waitingFor >= 0) return;
    const t = window.setInterval(() => {
      const hold = talkingRef.current;
      setPen((p) => tick(p, hold));
    }, TICK_MS);
    return () => window.clearInterval(t);
  }, [writing, paused, waitingFor]);

  // Each new line: the teacher says what they're writing.
  const lineNo = pen.written.length;
  useEffect(() => {
    if (!current?.say) return;
    setCaption(current.say);
    narrate(current.say);
    // narrate reads the latest settings through refs and state; run once per line.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineNo, current]);

  useEffect(() => {
    boardRef.current?.scrollTo({ top: boardRef.current.scrollHeight, behavior: prefersReducedMotion() ? 'auto' : 'smooth' });
  }, [lineNo, waitingFor]);

  useEffect(() => {
    chatRef.current?.scrollTo({ top: chatRef.current.scrollHeight, behavior: 'smooth' });
  }, [chat]);

  useEffect(
    () => () => {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      recRef.current?.abort();
    },
    [],
  );

  /* ------------------------------------------------------------ Teacher */

  const say = (line: string, extra?: Partial<Chat>) => {
    setChat((prev) => [...prev, { who: 'teacher', text: line, ...extra }]);
    const words = replyForSpeech(line);
    setCaption(captionOf(words));
    narrate(words);
  };

  /** Premium: tap the mic, speak, and the teacher acts on it and answers aloud. */
  const talk = () => {
    if (!isPremium) {
      say(`Talking to ${tutor?.name ?? 'your teacher'} out loud is part of Premium. You can still type to me.`, { upgrade: true });
      return;
    }
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = recogniserCtor();
    if (!Ctor) return;
    hush();
    heardRef.current = '';
    const rec = new Ctor();
    rec.lang = 'en-NG';
    rec.interimResults = true;
    rec.continuous = false;
    rec.onresult = (e) => {
      const heard = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ');
      heardRef.current = heard;
      setText(heard);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        say('Your microphone is blocked. Allow it in the browser, or type to me instead.');
      }
    };
    rec.onend = () => {
      recRef.current = null;
      setListening(false);
      if (heardRef.current.trim()) {
        voicedRef.current = true;
        handle(heardRef.current);
      }
    };
    recRef.current = rec;
    setListening(true);
    try {
      rec.start();
    } catch {
      setListening(false);
    }
  };

  const write = (lines: BoardLine[], fresh = false) => {
    // On phones the chat sits under the board: bring the board into view to watch it write.
    if (window.matchMedia('(max-width: 980px)').matches) {
      window.requestAnimationFrame(() => boardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    }
    setPaused(false);
    setMenu(null);
    setPen((prev) => {
      const base = fresh ? EMPTY_PEN : prev;
      return prefersReducedMotion()
        ? { written: [...base.written, ...base.pending, ...lines], pending: [], chars: 0 }
        : { ...base, pending: [...base.pending, ...lines] };
    });
  };

  const wipe = () => {
    hush();
    setPen(EMPTY_PEN);
    setAsks({});
    setFocus(null);
    setMenu(null);
    setStrokes([]);
    setCaption('');
  };

  const clearBoard = () => {
    wipe();
    say('Board cleared.');
  };

  /** Teach step `i` on a clean board. */
  const teachStep = (l: Lesson, i: number) => {
    hush();
    setAsks({});
    setFocus(null);
    setStrokes([]);
    setStep(i);
    setReached((r) => Math.max(r, i));
    say(l.steps[i].say);
    write(l.steps[i].board, true);
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
    setSubject(subj);
    if ((SYLLABUS[subj] ?? []).includes(top)) setTopic(top);
    setBusy('lesson');
    wipe();
    setCaption(`Preparing your lesson on ${top}…`);
    setChat((prev) => [...prev, { who: 'teacher', text: `Give me a moment. I’m preparing your lesson on ${top}…` }]);
    getLesson(subj, top, tutor?.id)
      .then((l) => {
        setLesson(l);
        setReached(0);
        teachStep(l, 0);
      })
      .catch((err: Error) => say(`I couldn’t prepare that lesson just now. ${err.message}`))
      .finally(() => setBusy(''));
  };

  /** A real question: the AI answers it, knowing what's on the board. */
  const answer = (question: string, about?: string) => {
    const board = boardContext([...pen.written, ...pen.pending]);
    const context =
      `I'm in my classroom ${lesson ? `learning "${lesson.topic}" (${lesson.subject})` : `studying ${subject}`}.` +
      (board ? `\nOn the board right now:\n${board}` : '') +
      (about ? `\nI tapped this part of the board: ${about}` : '') +
      `\n\nMy question: ${question}`;
    // The last few messages, so "and why?" makes sense. The welcome line is skipped.
    const history = chat
      .slice(1)
      .slice(-8)
      .map((c) => (c.who === 'you' ? { role: 'student' as const, text: c.text } : { role: 'tutor' as const, text: replyForHistory(c.text) }));
    setBusy('answer');
    setCaption('Let me think about that…');
    askTutor(context, history, tutor?.id)
      .then((reply) => say(reply))
      .catch((err: Error) => say(`Sorry, I couldn’t answer that just now. ${err.message}`))
      .finally(() => setBusy(''));
  };

  /** Tap a line, pick what you want: the teacher highlights it and explains. */
  const askAbout = (i: number, how: (typeof LINE_ACTIONS)[number]['id']) => {
    const l = pen.written[i];
    if (!l) return;
    setMenu(null);
    setFocus(i);
    const what = l.kind === 'diagram' ? `the diagram “${l.text}”` : `“${l.text}”`;
    const ask = {
      explain: `Explain ${what} more simply, step by step.`,
      why: `Why is ${what} so? Show me where it comes from.`,
      example: `Give me another worked example like ${what}.`,
    }[how];
    setChat((prev) => [...prev, { who: 'you', text: ask }]);
    answer(ask, l.tex ?? l.text);
  };

  const next = () => {
    if (!lesson) {
      startLesson(subject, topic);
      return;
    }
    if (step < lesson.steps.length - 1) {
      teachStep(lesson, step + 1);
      return;
    }
    testMe();
  };

  const repeat = () => {
    if (!lesson) return say('We haven’t started yet. Press “Start lesson” when you’re ready.');
    say('No problem, let me write that again.');
    teachStep(lesson, step);
  };

  const testMe = () => {
    if (!lesson || !lesson.check.question) {
      say('Let’s finish a lesson first, then I’ll test you on it.');
      return;
    }
    // A question is already waiting on the board.
    if (waitingFor >= 0) return;
    setReached(lesson.steps.length);
    write([checkLine(lesson.check)]);
  };

  /** The student answers the question on the board. */
  const pick = (i: number, label: string) => {
    const l = pen.written[i];
    if (!l || asks[i] !== undefined) return;
    setAsks((a) => ({ ...a, [i]: label }));
    const right = label === l.answer;
    const last = lesson && l.text === lesson.check.question;
    say(
      (right ? `Correct! ${l.why ?? ''}` : `Not quite. It’s ${l.answer}. ${l.why ?? ''}`) +
        (last ? ' Say “next topic”, or pick another topic.' : right ? ' Let’s carry on.' : ' Look at it again, then we carry on.'),
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
    if (!msg || busy) return;
    setChat((prev) => [...prev, { who: 'you', text: msg }]);
    setText('');
    const t = msg.toLowerCase();

    // "B", "b.", "(c)", "option d", "it's a" — but not a sentence that starts with "a".
    const choice = t.match(/^(?:(?:option|answer|it'?s|it is)\s+)?\(?([a-f])\)?[.!]?$/);
    if (choice && waitingFor >= 0) return pick(waitingFor, choice[1].toUpperCase());
    if (/\b(clear|wipe|erase|clean)\b/.test(t)) return clearBoard();
    if (/\b(repeat|again|slower|didn.?t (get|understand))\b/.test(t)) return repeat();
    if (/\b(test me|quiz|question me|check me)\b/.test(t)) return testMe();
    if (/\b(pause|wait|hold on|stop)\b/.test(t) && writing) return togglePause(true);
    if (/\bnext topic\b/.test(t)) {
      const list = SYLLABUS[subject];
      const nextTopic = list[(list.indexOf(topic) + 1) % list.length];
      return startLesson(subject, nextTopic);
    }
    if (/\b(next|continue|go on|carry on|resume)\b/.test(t)) return paused ? togglePause(false) : next();
    const teach = t.match(/^(?:please\s+)?(?:teach me|start|begin|lesson on|teach)\b\s*(?:about|on)?\s*(.*)$/);
    if (teach) {
      const want = teach[1].replace(/[.?!]+$/, '').trim();
      if (!want) return startLesson(subject, topic);
      const hit = findTopic(want);
      if (hit) return startLesson(hit.subj, hit.top);
      // The AI can teach any topic; it picks the closest syllabus topic if needed.
      if (isLive) return startLesson(subject, want.charAt(0).toUpperCase() + want.slice(1));
      return say(`“${want}” isn’t in your syllabus list yet. Try one of: ${SYLLABUS[subject].slice(0, 4).join(', ')}.`);
    }
    // A short message naming a topic ("indices") starts that lesson; a
    // sentence or a question goes to the teacher.
    const short = t.split(/\s+/).length <= 4 && !t.includes('?');
    const hit = short ? findTopic(t) : null;
    if (hit) return startLesson(hit.subj, hit.top);
    answer(msg);
  };

  const togglePause = (to = !paused) => {
    setPaused(to);
    if ('speechSynthesis' in window) {
      if (to) window.speechSynthesis.pause();
      else window.speechSynthesis.resume();
    }
    setCaption(to ? 'Paused. Take your time, then press Resume.' : (current?.say ?? ''));
  };

  const shown = [...pen.written, ...(current ? [current] : [])];
  const lastTeacher = chat.map((c) => c.who).lastIndexOf('teacher');
  const total = lesson?.steps.length ?? 0;
  const showCaption = Boolean(caption) && (writing || talking || waitingFor >= 0 || busy !== '' || paused);

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
          {lesson && (
            <nav className="cls__steps" aria-label="Lesson steps">
              {lesson.steps.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  className={`${i === step && reached < total ? 'is-on' : ''}${i <= reached ? ' is-done' : ''}`}
                  disabled={i > reached || waiting}
                  onClick={() => teachStep(lesson, i)}
                  aria-label={`Step ${i + 1}${i <= reached ? ', replay' : ''}`}
                >
                  {i + 1}
                </button>
              ))}
              <button type="button" className={reached >= total ? 'is-on' : ''} disabled={waiting} onClick={testMe}>
                <ListChecks size={15} aria-hidden /> Quiz
              </button>
              <span className="cls__steps-hint">{waitingFor >= 0 ? 'Answer the question on the board' : 'Tap any line on the board to ask about it'}</span>
            </nav>
          )}

          <div className={`cls__board${showCaption ? ' has-caption' : ''}${inking ? ' is-inking' : ''}`} ref={boardRef}>
            <div className="cls__sheet">
              {!shown.length && <p className="cls__empty">{busy === 'lesson' ? 'Preparing your lesson…' : 'The board is clear.'}</p>}
              {shown.map((l, i) => {
                const isCurrent = i === pen.written.length;
                return (
                  <React.Fragment key={i}>
                    <BoardItem
                      line={l}
                      chars={isCurrent ? pen.chars : 0}
                      done={!isCurrent}
                      focused={focus === i}
                      onTap={l.kind !== 'ask' && !inking ? () => setMenu(menu === i ? null : i) : undefined}
                      picked={asks[i]}
                      onPick={(label) => pick(i, label)}
                    />
                    {menu === i && (
                      <div className="cls__linemenu" role="menu">
                        {LINE_ACTIONS.map((a) => (
                          <button key={a.id} type="button" role="menuitem" onClick={() => askAbout(i, a.id)} disabled={busy !== ''}>
                            <a.icon size={16} aria-hidden /> {a.label}
                          </button>
                        ))}
                        <button type="button" className="cls__linemenu-close" onClick={() => setMenu(null)} aria-label="Close">
                          <X size={16} aria-hidden />
                        </button>
                      </div>
                    )}
                  </React.Fragment>
                );
              })}
              <InkLayer active={inking} strokes={strokes} onStroke={(d) => setStrokes((s) => [...s, d])} />
            </div>
          </div>

          {showCaption && (
            <div className={`cls__caption${talking ? ' is-talking' : ''}`} role="status">
              <span className={`tutor-avatar${tutor ? ` tutor-avatar--${tutor.id}` : ''}`} aria-hidden>
                {tutor ? tutor.name.charAt(0) : <GraduationCap size={16} />}
              </span>
              <p>
                <strong>{teacher}:</strong> {caption}
              </p>
              {talking && (
                <span className="cls__waves" aria-hidden>
                  <i />
                  <i />
                  <i />
                </span>
              )}
            </div>
          )}

          <div className="cls__tray" aria-hidden>
            <i />
            <i />
            <i />
          </div>
          <div className="cls__tools">
            {writing ? (
              <button type="button" className="cls__tool cls__tool--main" onClick={() => togglePause()}>
                {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
                {paused ? 'Resume' : 'Pause'}
              </button>
            ) : (
              <button type="button" className="cls__tool cls__tool--main" onClick={next} disabled={busy !== '' || waitingFor >= 0}>
                {lesson ? <SkipForward size={18} aria-hidden /> : <Play size={18} aria-hidden />}
                {lesson ? (step < total - 1 ? 'Next step' : 'Test me') : 'Start lesson'}
              </button>
            )}
            <button type="button" className="cls__tool" onClick={repeat} disabled={waiting || !lesson}>
              <RotateCcw size={18} aria-hidden /> Repeat
            </button>
            <button
              type="button"
              className={`cls__tool${inking ? ' is-on' : ''}`}
              onClick={() => {
                setInking((v) => !v);
                setMenu(null);
              }}
              aria-pressed={inking}
            >
              <Pencil size={18} aria-hidden /> My pen
            </button>
            {strokes.length > 0 && (
              <button type="button" className="cls__tool" onClick={() => setStrokes([])}>
                <Highlighter size={18} aria-hidden /> Clear my ink
              </button>
            )}
            <button type="button" className="cls__tool" onClick={clearBoard} disabled={waiting}>
              <Eraser size={18} aria-hidden /> Clear board
            </button>
            {isPremium && (
              <button
                type="button"
                className={`cls__tool${speak ? ' is-on' : ''}`}
                onClick={() => {
                  if (speak) hush();
                  setSpeak((v) => !v);
                }}
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
                {c.who === 'teacher' ? <TutorReply text={c.text} stepwise={i === lastTeacher} /> : <p>{c.text}</p>}
                {c.upgrade && (
                  <button type="button" className="ui-btn ui-btn--primary" onClick={onUpgrade}>
                    Upgrade
                  </button>
                )}
              </div>
            ))}
            {busy === 'answer' && (
              <div className="cls__msg cls__msg--teacher" role="status">
                <p>{teacher} is thinking…</p>
              </div>
            )}
          </div>
          <div className="cls__chips">
            {(lesson ? ['Next', 'Repeat', 'Test me', 'Explain it another way', 'Clear the board'] : ['Start']).map((c) => (
              <button key={c} type="button" onClick={() => handle(c)} disabled={waiting}>
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
            {hasMic && (
              <button
                type="button"
                className={`cls__mic${listening ? ' is-on' : ''}${isPremium ? '' : ' is-locked'}`}
                onClick={talk}
                aria-label={listening ? 'Stop listening' : `Talk to ${teacher}`}
                aria-pressed={listening}
              >
                {listening ? <Square size={16} aria-hidden /> : isPremium ? <Mic size={18} aria-hidden /> : <Lock size={16} aria-hidden />}
              </button>
            )}
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={
                listening ? 'Listening…' : waitingFor >= 0 ? 'Type your answer: A, B, C…' : lesson ? 'Ask a question about the lesson…' : 'Say or type “teach me indices”…'
              }
              aria-label={`Message ${teacher}`}
            />
            <button type="submit" disabled={!text.trim() || busy !== ''} aria-label="Send">
              <SendHorizontal size={18} aria-hidden />
            </button>
          </form>
        </aside>
      </div>
    </div>
  );
};
