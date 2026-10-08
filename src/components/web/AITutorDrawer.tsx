import React, { useEffect, useRef, useState } from 'react';
import { BadgeCheck, LockOpen, MessageSquareText, SendHorizontal, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  isPremium?: boolean;
  onUpgrade?: () => void;
  studentName?: string;
}

interface Message {
  sender: 'user' | 'tutor';
  text: string;
}

const FREE_DAILY = 5;
const quotaKey = () => `iteacher-tutor-${new Date().toISOString().slice(0, 10)}`;

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
}) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'tutor',
      text: `Hi ${studentName}! I'm your i-Teacher tutor. Ask me about any JAMB question in English, Maths, Physics or Chemistry. I'll guide you to the answer step by step.`,
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
    if (!query || blocked || typing) return;

    setMessages((prev) => [...prev, { sender: 'user', text: query }]);
    setInputText('');
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
            <p key={idx} className={`tutor__msg tutor__msg--${m.sender}`}>
              {formatText(m.text)}
            </p>
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
