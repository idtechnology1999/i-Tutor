import { api, demoDelay, isLive } from './api';
import { hintSteps, solveSteps, tutorById } from '../data/tutors';
import type { SolveRequest } from '../data/tutors';

/* AI tutor: free chat, and explaining one question (or a hint mid-exam).
   The backend calls the AI model with the student's tutor style; the key
   never reaches the browser. Free-plan limits must be enforced there too —
   the browser count in lib/tutor-quota is only for display. */

export interface ChatTurn {
  role: 'student' | 'tutor';
  text: string;
}

/** A worked answer in the step / formula / diagram format the real tutor uses. */
const DEMO_RESISTORS = `Let’s take this one piece at a time.

:::step Picture the circuit
In **parallel**, each resistor has its own path between the same two points, like three roads joining the same two towns.
:::diagram Three resistors side by side between points A and B
<svg viewBox="0 0 320 170" xmlns="http://www.w3.org/2000/svg">
<g stroke="#111" stroke-width="2" fill="none">
<line x1="40" y1="20" x2="40" y2="150"/><line x1="280" y1="20" x2="280" y2="150"/>
<line x1="40" y1="30" x2="125" y2="30"/><rect x="125" y="20" width="70" height="20"/><line x1="195" y1="30" x2="280" y2="30"/>
<line x1="40" y1="85" x2="125" y2="85"/><rect x="125" y="75" width="70" height="20"/><line x1="195" y1="85" x2="280" y2="85"/>
<line x1="40" y1="140" x2="125" y2="140"/><rect x="125" y="130" width="70" height="20"/><line x1="195" y1="140" x2="280" y2="140"/>
</g>
<g font-size="13" text-anchor="middle" fill="#111">
<text x="160" y="15">2 Ω</text><text x="160" y="70">3 Ω</text><text x="160" y="125">6 Ω</text>
<text x="22" y="90">A</text><text x="298" y="90">B</text>
</g>
</svg>
:::
:::

:::step Write the parallel formula
For parallel resistors, we add the **reciprocals**:
:::formula
\\frac{1}{R} = \\frac{1}{R_1} + \\frac{1}{R_2} + \\frac{1}{R_3}
:::
:::

:::step Put in the values
Replace $R_1$, $R_2$ and $R_3$ with 2, 3 and 6:
:::formula
\\frac{1}{R} = \\frac{1}{2} + \\frac{1}{3} + \\frac{1}{6}
:::
:::

:::step Add the fractions
The LCM of 2, 3 and 6 is 6:
:::formula
\\frac{1}{R} = \\frac{3 + 2 + 1}{6} = \\frac{6}{6} = 1
:::
:::

:::step Flip it to get R
We found $\\frac{1}{R}$, not $R$, so turn it upside down:
:::formula
R = \\frac{1}{1} = 1\\ \\Omega
:::
:::

:::answer
The effective resistance is **1 Ω**. Notice it is smaller than the smallest resistor (2 Ω). That is always true in parallel.
:::

:::trap
Adding them straight (2 + 3 + 6 = 11 Ω) is the **series** formula. Examiners always put 11 Ω among the options.
:::

Your turn: what would the total be if the same three were connected in **series**?`;

/** Demo replies, used until the backend is connected. */
const demoReply = (query: string) => {
  const q = query.toLowerCase();
  if (q.includes('resist') || q.includes('parallel')) return DEMO_RESISTORS;
  if (q.includes('isomer') || q.includes('chem')) {
    return 'Good question on Organic Chemistry.\n\n• **Functional group isomers** have the same formula but different groups — e.g. ethanol C₂H₅OH (alcohol) and methoxymethane CH₃OCH₃ (ether).\n• **Chain isomers** have the same group but a different carbon chain — e.g. butane and 2-methylpropane.\n\nQuick check: which of the two would have the higher boiling point, ethanol or methoxymethane? Tell me what you think and why.';
  }
  if (q.includes('kinematic') || q.includes('motion') || q.includes('physic')) {
    return "Let's work through motion questions together.\n\n1. If a body starts from rest, u = 0, so s = ut + ½at² becomes s = ½at².\n2. If time isn't given, use v² = u² + 2as.\n\nTry this: a car starts from rest and reaches 20 m/s in 5 s. What is its acceleration? Show me your first step.";
  }
  if (q.includes('stress') || q.includes('english') || q.includes('oral')) {
    return 'Stress questions are about which syllable is said loudest.\n\n• Most two-syllable **nouns** stress the first syllable: PREsent, REcord.\n• Most two-syllable **verbs** stress the second: preSENT, reCORD.\n\nYour turn: in “She will reCORD the song”, is record a noun or a verb?';
  }
  return "Let's break it down step by step.\n\n1. What is the question really asking for?\n2. What information are you given?\n3. Which formula or rule links them?\n\nPaste the question here and tell me how far you got — I'll guide you from there.";
};

/** One chat message to the tutor; resolves with the tutor's reply. */
export async function askTutor(message: string, history: ChatTurn[], tutorId?: string): Promise<string> {
  if (!isLive) {
    await demoDelay(900);
    return demoReply(message);
  }
  const data = await api<{ reply: string }>('/api/tutor/chat', {
    method: 'POST',
    body: { message, history, tutorId },
    timeout: 60_000,
  });
  return data.reply;
}

/** Demo explanation, available immediately (no network). */
export const demoExplain = (req: SolveRequest, tutorId?: string) =>
  req.mode === 'hint' ? hintSteps(req, tutorById(tutorId)) : solveSteps(req, tutorById(tutorId));

/** Step-by-step explanation of one question, or a hint (no answer) mid-exam. */
export async function explainQuestion(req: SolveRequest, tutorId?: string): Promise<string> {
  if (!isLive) return demoExplain(req, tutorId);
  const data = await api<{ reply: string }>('/api/tutor/explain', {
    method: 'POST',
    body: { ...req, tutorId },
    timeout: 60_000,
  });
  return data.reply;
}
