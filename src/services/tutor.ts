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

/** Demo replies, used until the backend is connected. */
const demoReply = (query: string) => {
  const q = query.toLowerCase();
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
