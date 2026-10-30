/* Parsing tutor replies into pieces; drawn by components/web/TutorReply.tsx. */

export type Piece =
  | { kind: 'text'; text: string }
  | { kind: 'formula'; tex: string }
  | { kind: 'diagram'; svg: string; caption: string }
  | { kind: 'answer' | 'trap'; body: Piece[] }
  | { kind: 'step'; title: string; body: Piece[] };

const BLOCKS = new Set(['step', 'formula', 'diagram', 'answer', 'trap']);
const OPEN = /^\s*:::\s*([a-z]+)\s*(.*)$/i;
const CLOSE = /^\s*:::\s*$/;

interface Frame {
  kind: string;
  title: string;
  lines: string[];
  body: Piece[];
}

/** Turns the reply into pieces. Unclosed blocks end with the reply, so a
    slightly wrong reply still shows everything. */
export function parseReply(text: string): Piece[] {
  const root: Frame = { kind: 'root', title: '', lines: [], body: [] };
  const stack: Frame[] = [root];
  const top = () => stack[stack.length - 1]!;

  const flushText = (f: Frame) => {
    const t = f.lines.join('\n').trim();
    if (t) f.body.push({ kind: 'text', text: t });
    f.lines = [];
  };
  const close = () => {
    const f = stack.pop()!;
    const parent = top();
    const raw = f.lines.join('\n').trim();
    if (f.kind === 'formula') {
      f.lines = [];
      // One formula per line, so "working" can be several lines in one block.
      for (const line of raw.split('\n').map((l) => stripMath(l.trim())).filter(Boolean)) parent.body.push({ kind: 'formula', tex: line });
      return;
    }
    if (f.kind === 'diagram') {
      parent.body.push({ kind: 'diagram', svg: raw, caption: f.title });
      return;
    }
    flushText(f);
    if (f.kind === 'step') parent.body.push({ kind: 'step', title: f.title, body: f.body });
    else parent.body.push({ kind: f.kind as 'answer' | 'trap', body: f.body });
  };

  for (const line of text.replace(/\r\n/g, '\n').split('\n')) {
    const f = top();
    const raw = f.kind === 'formula' || f.kind === 'diagram';
    const open = OPEN.exec(line);
    if (open && BLOCKS.has(open[1]!.toLowerCase()) && !raw) {
      flushText(f);
      const kind = open[1]!.toLowerCase();
      // A new step while one is open: the model forgot to close the last one.
      if (kind === 'step') while (top().kind !== 'root') close();
      stack.push({ kind, title: open[2]!.trim(), lines: [], body: [] });
    } else if (CLOSE.test(line) && stack.length > 1) {
      close();
    } else {
      f.lines.push(line);
    }
  }
  while (stack.length > 1) close();
  flushText(root);
  return root.body;
}

/** "$$x$$", "$x$" or "\[x\]" around a whole formula line: just the maths. */
export const stripMath = (s: string) => s.replace(/^\$\$?|\$\$?$/g, '').replace(/^\\\[|\\\]$/g, '').trim();

/** The words of a reply, for reading aloud: no drawings, block markers or maths signs. */
export const replyForSpeech = (text: string) =>
  text
    .replace(/:::\s*diagram[^\n]*\n[\s\S]*?\n\s*:::\s*(\n|$)/gi, '')
    .replace(/:::\s*formula[\s\S]*?\n\s*:::/gi, '')
    .replace(/^\s*:::\s*(step|answer|trap)?\s*/gim, '')
    .replace(/\\[a-zA-Z]+/g, ' ')
    .replace(/[$*{}^_\\]/g, '')
    .replace(/\n+/g, '. ')
    .replace(/\s+/g, ' ')
    .trim();

/** For the history sent back to the AI: drawings are long and it doesn't need them. */
export const replyForHistory = (text: string) =>
  text.replace(/(:::\s*diagram[^\n]*\n)[\s\S]*?(\n\s*:::\s*(\n|$))/gi, '$1[diagram]$2');
