import React, { useState } from 'react';
import { OwlBookLogo, SparklesIcon, XIcon, SendIcon } from '../Icons';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  sender: 'user' | 'tutor';
  text: string;
  timestamp: string;
}

export const AITutorDrawer: React.FC<Props> = ({ isOpen, onClose }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'tutor',
      text: "Hello Amina! I'm your i-Tutor AI tutor. I specialize in the JAMB UTME syllabus. Ask me any question in Physics, Chemistry, Mathematics, or Use of English, and I'll break down the step-by-step logic!",
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');

  if (!isOpen) return null;

  const handleSend = (textToSend?: string) => {
    const query = textToSend || inputText;
    if (!query.trim()) return;

    const userMsg: Message = {
      sender: 'user',
      text: query,
      timestamp: 'Just now',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText('');

    // Simulate smart teacher response
    setTimeout(() => {
      let reply = "Let's break this down step-by-step using JAMB principles:\n\n1. **Core Concept**: In JAMB examinations, question traps often rely on mixing up related definitions.\n2. **Elimination Strategy**: Eliminate options with dimensional inconsistencies first.\n3. **Key Formula**: Always verify your SI units before calculating.\n\nWould you like to solve a live practice question on this topic?";

      if (query.toLowerCase().includes('isomer') || query.toLowerCase().includes('chem')) {
        reply = "Great question on Organic Chemistry! In JAMB:\n\n• **Functional Group Isomerism**: Compounds share the same molecular formula but possess different functional groups (e.g., Ethanol $C_2H_5OH$ [alcohol] vs. Methoxymethane $CH_3OCH_3$ [ether]).\n• **Chain Isomerism**: Functional group is identical, but carbon skeleton branching differs (e.g. Butane vs 2-Methylpropane).\n\n*JAMB Exam Tip*: Look at the boiling points—alcohols form intermolecular hydrogen bonds, so their boiling points are dramatically higher than their ether isomers!";
      } else if (query.toLowerCase().includes('kinematics') || query.toLowerCase().includes('physic')) {
        reply = "Let's master JAMB Motion equations quickly:\n\n1. If a body starts from rest, $u = 0$, which immediately simplifies $s = ut + \\frac{1}{2}at^2$ down to $s = \\frac{1}{2}at^2$.\n2. For uniform deceleration to a halt, $v = 0$, so $0 = u^2 - 2as \\implies s = \\frac{u^2}{2a}$.\n\n*Mental Math Tip*: If time $t$ is not mentioned in the problem, go straight to $v^2 = u^2 + 2as$!";
      }

      setMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: reply,
          timestamp: 'Just now',
        },
      ]);
    }, 700);
  };

  const samplePrompts = [
    'Explain Functional vs Chain Isomerism',
    'How to quickly solve Kinematics without time',
    'Tips for Oral English Stress Patterns',
  ];

  return (
    <aside className="ai-tutor-drawer">
      {/* Header */}
      <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--slate-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              background: 'var(--teal-900)',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <OwlBookLogo size={20} showSpark={true} />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '15px', color: 'var(--slate-900)' }}>
              i-Tutor AI Tutor
            </div>
            <div style={{ fontSize: '12px', color: 'var(--emerald-600)', fontWeight: 500 }}>
              ● 24/7 JAMB Syllabus Engine
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '6px' }}
        >
          <XIcon size={20} color="var(--slate-500)" />
        </button>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '14px' }}>
        {messages.map((m, idx) => (
          <div
            key={idx}
            style={{
              alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '88%',
              background: m.sender === 'user' ? 'var(--teal-900)' : 'var(--slate-100)',
              color: m.sender === 'user' ? '#FFFFFF' : 'var(--slate-900)',
              padding: '12px 16px',
              borderRadius: m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-line',
            }}
          >
            {m.sender === 'tutor' && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--amber-600)', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>
                <SparklesIcon size={12} color="var(--amber-600)" /> Step-by-Step Teacher Explanation
              </div>
            )}
            {m.text}
          </div>
        ))}
      </div>

      {/* Suggested Quick Prompts */}
      <div style={{ padding: '8px 20px', display: 'flex', gap: '6px', overflowX: 'auto', borderTop: '1px solid var(--slate-100)' }}>
        {samplePrompts.map((prompt) => (
          <button
            key={prompt}
            type="button"
            onClick={() => handleSend(prompt)}
            style={{
              padding: '6px 10px',
              borderRadius: 'var(--radius-full)',
              background: 'var(--teal-50)',
              border: '1px solid var(--teal-100)',
              color: 'var(--teal-900)',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              whiteSpace: 'nowrap',
            }}
          >
            {prompt}
          </button>
        ))}
      </div>

      {/* Input Box */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend();
        }}
        style={{ padding: '14px 20px', borderTop: '1px solid var(--slate-200)', display: 'flex', gap: '10px' }}
      >
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Ask a question about any JAMB question or topic..."
          className="web-input"
          style={{ flex: 1, padding: '10px 14px', fontSize: '14px' }}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="btn-solid-teal"
          style={{ padding: '10px 16px' }}
        >
          <SendIcon size={16} />
        </button>
      </form>
    </aside>
  );
};
