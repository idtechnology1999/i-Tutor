import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, BadgeCheck, LockOpen, MessageSquareText, SendHorizontal, X } from 'lucide-react';
import type { AppView } from '../../lib/router';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
  studentName?: string;
  /** Lets the tutor send students to a page ("take me to past questions"). */
  onNavigate?: (view: AppView) => void;
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

const FREE_DAILY = 5;
const quotaKey = () => `itutor-tutor-${new Date().toISOString().slice(0, 10)}`;

const readUsed = () => {
  try {
    return Number(window.localStorage.getItem(quotaKey()) ?? 0) || 0;
  } catch {
    return 0;
  }
};

const writeUsed = (n: number) => {
  try {
    window.localStorage.setItem(quotaKey(), String(n));
  } catch {
    /* storage blocked — the count simply resets on reload */
  }
};

/** Light formatting: **bold**, $maths$ and a few LaTeX commands as plain text. */
const formatText = (text: string) => {
  const clean = text
    .replace(/\\frac\{1\}\{2\}/g, '½')
    .replace(/\\frac\{([^}]+)\}\{([^}]+)\}/g, '$1/$2')
    .replace(/\\implies/g, '⇒')
    .replace(/\$/g, '');
  return clean.split(/(\*\*[^*]+\*\*)/g).map((part, i) =>
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

const replyFor = (query: string) => {
  const q = query.toLowerCase();
  if (q.includes('isomer') || q.includes('chem')) {
    return "Good question on Organic Chemistry.\n\n• **Functional group isomers** have the same formula but different groups — e.g. ethanol C₂H₅OH (alcohol) and methoxymethane CH₃OCH₃ (ether).\n• **Chain isomers** have the same group but a different carbon chain — e.g. butane and 2-methylpropane.\n\nQuick check: which of the two would have the higher boiling point, ethanol or methoxymethane? Tell me what you think and why.";
  }
  if (q.includes('kinematic') || q.includes('motion') || q.includes('physic')) {
    return "Let's work through motion questions together.\n\n1. If a body starts from rest, u = 0, so s = ut + ½at² becomes s = ½at².\n2. If time isn't given, use v² = u² + 2as.\n\nTry this: a car starts from rest and reaches 20 m/s in 5 s. What is its acceleration? Show me your first step.";
  }
  if (q.includes('stress') || q.includes('english') || q.includes('oral')) {
    return "Stress questions are about which syllable is said loudest.\n\n• Most two-syllable **nouns** stress the first syllable: PREsent, REcord.\n• Most two-syllable **verbs** stress the second: preSENT, reCORD.\n\nYour turn: in “She will reCORD the song”, is record a noun or a verb?";
  }
  return "Let's break it down step by step.\n\n1. What is the question really asking for?\n2. What information are you given?\n3. Which formula or rule links them?\n\nPaste the question here and tell me how far you got — I'll guide you from there.";
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
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'tutor',
      text: `Hi ${studentName}! I'm your i-Tutor tutor. Ask me about any JAMB question in English, Maths, Physics or Chemistry. I'll guide you to the answer step by step. You can also ask me how to find anything on the site.`,
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [typing, setTyping] = useState(false);
  const [used, setUsed] = useState(readUsed);
  const logRef = useRef<HTMLDivElement>(null);

  const left = Math.max(0, FREE_DAILY - used);
  const blocked = !isPremium && left === 0;

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

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
    if (!query || typing) return;
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
    window.setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [...prev, { sender: 'tutor', text: replyFor(query) }]);
    }, 900);
  };

  return (
    <>
      <div className="tutor-backdrop" onClick={onClose} aria-hidden />
      <aside className="tutor" role="dialog" aria-label="Ask the tutor">
        <header className="tutor__head">
          <span className="tutor__avatar">
            <MessageSquareText size={18} aria-hidden />
          </span>
          <div className="tutor__title">
            <strong>Ask the tutor</strong>
            {isPremium ? (
              <span className="tutor__plan is-premium">
                <BadgeCheck size={13} aria-hidden /> Premium · unlimited
              </span>
            ) : (
              <span className="tutor__plan">
                {left} of {FREE_DAILY} free questions left today
              </span>
            )}
          </div>
          <button type="button" className="tutor__close" onClick={onClose} aria-label="Close tutor">
            <X size={20} aria-hidden />
          </button>
        </header>

        {!isPremium && !blocked && (
          <div className="tutor__meter" aria-hidden>
            <i style={{ width: `${(left / FREE_DAILY) * 100}%` }} />
          </div>
        )}

        <div className="tutor__log" ref={logRef} aria-live="polite">
          {messages.map((m, idx) => (
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
          {typing && (
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
              <button type="submit" disabled={!inputText.trim() || typing} aria-label="Send">
                <SendHorizontal size={18} aria-hidden />
              </button>
            </form>
          </>
        )}
      </aside>
    </>
  );
};
