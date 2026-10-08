/* Minimal typing for the browser speech recogniser (not in every TS DOM lib). */
export interface Recogniser {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
}
export type RecogniserCtor = new () => Recogniser;

export const recogniserCtor = (): RecogniserCtor | null => {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: RecogniserCtor; webkitSpeechRecognition?: RecogniserCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

export const canSpeak = () => typeof window !== 'undefined' && 'speechSynthesis' in window;

/** A warm, clear English voice — Nigerian if the device has one. */
export const pickVoice = () => {
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === 'en-NG') ??
    voices.find((v) => v.lang === 'en-GB' && /female|samantha|serena|google/i.test(v.name)) ??
    voices.find((v) => v.lang === 'en-GB') ??
    voices.find((v) => v.lang.startsWith('en')) ??
    null
  );
};

/** Read a line aloud in the best English voice available. */
export const speakText = (text: string) => {
  if (!canSpeak()) return;
  window.speechSynthesis.cancel();
  const u = new SpeechSynthesisUtterance(text);
  const voice = pickVoice();
  if (voice) u.voice = voice;
  u.lang = voice?.lang ?? 'en-GB';
  u.rate = 0.97;
  window.speechSynthesis.speak(u);
};
