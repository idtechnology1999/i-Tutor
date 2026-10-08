import React, { useEffect, useRef, useState } from 'react';
import { askTutor, demoExplain, explainQuestion } from '../../services/tutor';
import { isLive } from '../../services/api';
import { ArrowRight, AudioLines, BadgeCheck, LockOpen, MessageSquareText, Mic, SendHorizontal, X } from 'lucide-react';
import { VoiceLesson } from './VoiceLesson';
import { FREE_DAILY, readUsed, writeUsed } from '../../lib/tutor-quota';
import type { SolveRequest, TutorPersona } from '../../data/tutors';
import type { AppView } from '../../lib/router';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
  studentName?: string;
  /** Lets the tutor send students to a page ("take me to past questions"). */
  onNavigate?: (view: AppView) => void;
  /** Premium: the student's own tutor. */
  tutor?: TutorPersona;
  /** Opened from "Solve with my tutor": start on this question. */
  solve?: SolveRequest;
}

interface NavLink {
  label: string;
  view: AppView;
}

interface Message {
  sender: 'user' | 'tutor';
  text: string;
  links?: NavLink[];
}


/** Light formatting: **bold**, $maths$ and a few LaTeX commands as plain text. */
const formatText = (text: string) => {
  const clean = text
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\implies/g, '⇒')
    .replace(/\$/g, '');
  return clean
    .split(/(\*\*[^*]+\*\*)/g)
    .map((part, i) =>
      part.startsWith('**') && part.endsWith('**') ? <strong key={i}>{part.slice(2, -2)}</strong> : part,
    );
};

/* -----------------------------------------------------------------------------
   Site guide. Questions about using i-Tutor get a plain answer plus buttons
   that open the right page. These don't count towards the free daily limit.
   -------------------------------------------------------------------------- */

const PAGES = {
  exam: { label: 'Open practice exam', view: 'cbt' as AppView },
  questions: { label: 'Open past questions', view: 'syllabus' as AppView },
  home: { label: 'Go to my home page', view: 'dashboard' as AppView },
  upgrade: { label: 'See Premium plans', view: 'upgrade' as AppView },
  profile: { label: 'Open my profile', view: 'setup' as AppView },
  course: { label: 'Practise for my course', view: 'course' as AppView },
  signup: { label: 'Create a free account', view: 'signup' as AppView },
  login: { label: 'Log in', view: 'login' as AppView },
};

const GUIDE: Array<{ test: RegExp; text: string; links: NavLink[] }> = [
  {
    test: /\b(pay|payment|upgrade|premium|price|pricing|cost|subscribe|subscription|card|ussd|transfer|activate)\b/,
    text: 'To unlock unlimited help from me, go to Premium. Pick a plan (from ₦2,500 a month), then pay with your card, a bank transfer or USSD. It switches on straight away.',
    links: [PAGES.upgrade],
  },
  {
    test: /\b(exam|mock|cbt|test|timed|timer)\b/,
    text: 'Tap Practice exam. Choose a subject (or all subjects) and how many questions you want, then press Start exam. The timer only starts when you press Start.',
    links: [PAGES.exam],
  },
  {
    test: /\b(past questions?|questions bank|syllabus|practi[cs]e questions?|old questions?)\b/,
    text: 'Open Past questions, pick a subject at the top, then tap an answer. You’ll see straight away if it’s right — and why.',
    links: [PAGES.questions],
  },
  {
    test: /\b(course|engineering|medicine|law|pharmacy|nursing|accounting|subject combination|which subjects)\b/,
    text: 'Open Practise for my course and pick your course. You’ll see the four JAMB subjects it needs and can start a practice exam with just those subjects.',
    links: [PAGES.course],
  },
  {
    test: /\b(profile|goal|school|university|subjects?|account|settings|log ?out)\b/,
    text: 'Your profile shows your plan, your goal (course and school) and your subjects. Tap Change to update your goal.',
    links: [PAGES.profile],
  },
  {
    test: /\b(sign ?up|register|create (an )?account|join)\b/,
    text: 'Creating an account is free and takes about a minute. You’ll get a code to confirm your phone or email.',
    links: [PAGES.signup, PAGES.login],
  },
  {
    test: /\b(log ?in|sign ?in|password)\b/,
    text: 'Use Log in with the phone number or email you registered with. If you forgot your password, there’s a link on that page to reset it.',
    links: [PAGES.login],
  },
  {
    test: /\b(home|dashboard|progress|streak|score|today)\b/,
    text: 'Your home page shows today’s practice, your likely score and how each subject is going.',
    links: [PAGES.home],
  },
  {
    test: /\b(how (do|can) i (use|start|navigate|find)|where (is|are|do)|help me (use|find|navigate)|show me around|get started|what can (i|you) do|navigate|menu)\b/,
    text: 'Here’s how i-Tutor works:\n\n1. **Practice exam** — timed tests like the real CBT.\n2. **Past questions** — try a question and check the answer.\n3. **Ask me** — I’ll guide you through any question step by step.\n4. **Me** — your plan, goal and subjects.\n\nTap where you want to go:',
    links: [PAGES.exam, PAGES.questions, PAGES.home, PAGES.upgrade],
  },
];

const guideFor = (query: string) => {
  const q = query.toLowerCase();
  // Subject questions ("explain isomers") are tutoring, not navigation.
  if (/\b(explain|solve|calculate|what is|why|isomer|formula|equation)\b/.test(q)) return null;
  return GUIDE.find((g) => g.test.test(q)) ?? null;
};

const PROMPTS = [
  'How do I use i-Tutor?',
  'Explain chain vs functional isomers',
  'Help me with motion questions',
  'How do stress patterns work?',
];

export const AITutorDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  isPremium = false,
  onUpgrade,
  studentName = 'there',
  onNavigate,
  tutor,
  solve,
}) => {
  const [messages, setMessages] = useState<Message[]>(() => [
    {
      sender: 'tutor',
      text: tutor
        ? `Hi ${studentName}, it’s ${tutor.name}, your personal tutor. Send me any question — or tap “Solve with ${tutor.name}” under a question — and we’ll work through it together.`
        : `Hi ${studentName}! I'm your i-Tutor tutor. Ask me about any JAMB question in English, Maths, Physics or Chemistry. I'll guide you to the answer step by step. You can also ask me how to find anything on the site.`,
    },
  ]);
  // Opened from Ask AI / Solve with…: the question and its explanation come
  // first. Demo mode answers instantly; the backend answers after a moment.
  const [seedReply, setSeedReply] = useState<string | null>(() =>
    solve && !isLive ? demoExplain(solve, tutor?.id) : null,
  );
  useEffect(() => {
    if (!solve || !isLive) return;
    explainQuestion(solve, tutor?.id)
      .then(setSeedReply)
      .catch((err: Error) => setSeedReply(`Sorry, I couldn’t explain that just now. ${err.message}`));
  }, [solve, tutor?.id]);
  const seeded: Message[] = solve
    ? [
        {
          sender: 'user',
          text:
            solve.mode === 'hint'
              ? `I’m stuck on this ${solve.subject} question — can I have a hint? ${solve.question}`
              : `Please explain this ${solve.subject} question: ${solve.question}`,
        },
        ...(seedReply ? [{ sender: 'tutor' as const, text: seedReply }] : []),
      ]
    : [];
  const shown = [...messages.slice(0, 1), ...seeded, ...messages.slice(1)];
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const thinking = typing || (Boolean(solve) && seedReply === null);
  const [used, setUsed] = useState(readUsed);
  // Voice lesson: Premium only; free users see what it is and how to unlock it.
  const [voice, setVoice] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  const left = Math.max(0, FREE_DAILY - used);
  const blocked = !isPremium && left === 0;

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [messages, typing, seedReply]);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = (textToSend ?? inputText).trim();
    if (!query || thinking) return;
    const guide = guideFor(query);
    if (blocked && !guide) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputText('');

    if (guide) {
      setTyping(true);
      window.setTimeout(() => {
        setTyping(false);
        setMessages((prev) => [...prev, { sender: 'tutor', text: guide.text, links: guide.links }]);
      }, 600);
      return;
    }

    if (!isPremium) {
      const next = used + 1;
      setUsed(next);
      writeUsed(next);
    }

    setTyping(true);
    const history = shown.map((m) => ({ role: m.sender === 'user' ? ('student' as const) : ('tutor' as const), text: m.text }));
    askTutor(query, history, tutor?.id)
      .then((reply) => setMessages((prev) => [...prev, { sender: 'tutor', text: reply }]))
      .catch((err: Error) => setMessages((prev) => [...prev, { sender: 'tutor', text: `Sorry — ${err.message}` }]))
      .finally(() => setTyping(false));
  };

  return (
    <>
      <div className="tutor-backdrop" onClick={onClose} aria-hidden />
      <aside className="tutor" role="dialog" aria-label="Ask the tutor">
        <header className="tutor__head">
          {tutor ? (
            <span className={`tutor-avatar tutor-avatar--${tutor.id}`} aria-hidden>
              {tutor.name.charAt(0)}
            </span>
          ) : (
            <span className="tutor__avatar">
              <MessageSquareText size={18} aria-hidden />
            </span>
          )}
          <div className="tutor__title">
            <strong>{tutor ? `${tutor.name} · your tutor` : 'Ask the tutor'}</strong>
            {isPremium ? (
              <span className="tutor__plan is-premium">
                <BadgeCheck size={13} aria-hidden /> {tutor ? `${tutor.style} · unlimited` : 'Premium · unlimited'}
              </span>
            ) : (
              <span className="tutor__plan">
                {left} of {FREE_DAILY} free questions left today
              </span>
            )}
          </div>
          {!voice && (
            <button
              type="button"
              className="tutor__voice"
              onClick={() => setVoice(true)}
              aria-label="Start a voice lesson"
              title="Voice lesson"
            >
              <AudioLines size={18} aria-hidden />
              <span>Voice</span>
            </button>
          )}
          <button type="button" className="tutor__close" onClick={onClose} aria-label="Close tutor">
            <X size={20} aria-hidden />
          </button>
        </header>

        {voice && isPremium && <VoiceLesson studentName={studentName} onBack={() => setVoice(false)} />}

        {voice && !isPremium && (
          <div className="voice voice--locked">
            <span className="voice__orb is-idle" aria-hidden>
              <i />
              <i />
              <i />
            </span>
            <span className="voice__badge">
              <Mic size={14} aria-hidden /> Premium
            </span>
            <h2>Learn by talking</h2>
            <p>
              With Premium, your tutor teaches you out loud like a real teacher, asks you questions and listens to your
              spoken answers.
            </p>
            <ul className="voice__perks">
              <li>Lessons in Physics, Chemistry, Maths and English</li>
              <li>Answer with your voice — or type if you prefer</li>
              <li>Hints when you’re stuck, praise when you’re right</li>
            </ul>
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--block"
              onClick={() => {
                onClose();
                onUpgrade?.();
              }}
            >
              Unlock voice lessons · from ₦2,500/month
            </button>
            <button type="button" className="ui-link voice__back-link" onClick={() => setVoice(false)}>
              Back to chat
            </button>
          </div>
        )}

        {!voice && !isPremium && !blocked && (
          <div className="tutor__meter" aria-hidden>
            <i style={{ width: `${(left / FREE_DAILY) * 100}%` }} />
          </div>
        )}

        {!voice && (
          <>
            <div className="tutor__log" ref={logRef} aria-live="polite">
              {shown.map((m, idx) => (
                <React.Fragment key={idx}>
                  <p className={`tutor__msg tutor__msg--${m.sender}`}>{formatText(m.text)}</p>
                  {m.links && onNavigate && (
                    <div className="tutor__links">
                      {m.links.map((link) => (
                        <button
                          key={link.view}
                          type="button"
                          onClick={() => {
                            onClose();
                            onNavigate(link.view);
                          }}
                        >
                          {link.label}
                          <ArrowRight size={16} aria-hidden />
                        </button>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              ))}
              {thinking && (
                <p className="tutor__msg tutor__msg--tutor tutor__typing" aria-label="Tutor is typing">
                  <i />
                  <i />
                  <i />
                </p>
              )}
            </div>

            {blocked ? (
              <div className="tutor__limit">
                <span className="tutor__limit-icon">
                  <LockOpen size={20} aria-hidden />
                </span>
                <strong>You’ve used today’s 5 free questions</strong>
                <p>Upgrade to keep asking now, or come back tomorrow for 5 more.</p>
                <button
                  type="button"
                  className="ui-btn ui-btn--primary ui-btn--block"
                  onClick={() => {
                    onClose();
                    onUpgrade?.();
                  }}
                >
                  Upgrade · from ₦2,500/month
                </button>
              </div>
            ) : (
              <>
                {messages.length < 3 && (
                  <div className="tutor__prompts">
                    {PROMPTS.map((prompt) => (
                      <button key={prompt} type="button" onClick={() => handleSend(prompt)}>
                        {prompt}
                      </button>
                    ))}
                  </div>
                )}
                <form
                  className="tutor__input"
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleSend();
                  }}
                >
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Type your question…"
                    aria-label="Your question"
                  />
                  <button type="submit" disabled={!inputText.trim() || thinking} aria-label="Send">
                    <SendHorizontal size={18} aria-hidden />
                  </button>
                </form>
              </>
            )}
          </>
        )}
      </aside>
    </>
  );
};
