import type { ParsedQuestion } from './question-import';

/* Reads Word (.docx) and Excel (.xlsx) files in the browser, so they can be
   imported like pasted text. Both are zip archives of XML; the browser's own
   DecompressionStream unzips them, so no library is needed.
   - Word: the document's paragraphs, one per line.
   - Excel: the first sheet. A sheet with a header row like
       Question | A | B | C | D | Answer | Topic | Explanation
     becomes questions directly (exact, no AI); any other sheet is turned
     into tab-separated lines for the AI reader. */

export const isWord = (f: File) => /\.docx$/i.test(f.name);
export const isExcel = (f: File) => /\.xlsx$/i.test(f.name);

/** The files in a zip archive, by path (only what we ask for is unzipped). */
async function unzip(file: File, wanted: (path: string) => boolean): Promise<Map<string, string>> {
  const buf = new DataView(await file.arrayBuffer());
  const bytes = new Uint8Array(buf.buffer);
  // The end-of-central-directory record is in the last 64 KB.
  let eocd = -1;
  for (let i = bytes.length - 22; i >= Math.max(0, bytes.length - 65_557); i -= 1) {
    if (buf.getUint32(i, true) === 0x06054b50) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) throw new Error('That file isn’t a valid Word or Excel file.');
  const count = buf.getUint16(eocd + 10, true);
  let p = buf.getUint32(eocd + 16, true);
  const out = new Map<string, string>();
  const decoder = new TextDecoder();
  for (let n = 0; n < count; n += 1) {
    if (buf.getUint32(p, true) !== 0x02014b50) break;
    const method = buf.getUint16(p + 10, true);
    const size = buf.getUint32(p + 20, true);
    const nameLen = buf.getUint16(p + 28, true);
    const extraLen = buf.getUint16(p + 30, true);
    const commentLen = buf.getUint16(p + 32, true);
    const local = buf.getUint32(p + 42, true);
    const name = decoder.decode(bytes.subarray(p + 46, p + 46 + nameLen));
    p += 46 + nameLen + extraLen + commentLen;
    if (!wanted(name)) continue;
    const start = local + 30 + buf.getUint16(local + 26, true) + buf.getUint16(local + 28, true);
    const data = bytes.subarray(start, start + size);
    if (method === 0) out.set(name, decoder.decode(data));
    else if (method === 8) {
      const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream('deflate-raw'));
      out.set(name, await new Response(stream).text());
    }
  }
  return out;
}

const xml = (text: string) => new DOMParser().parseFromString(text, 'application/xml');
const byTag = (node: Document | Element, tag: string) => Array.from(node.getElementsByTagName(tag));

/** A Word document's text, one paragraph per line. */
export async function wordText(file: File): Promise<string> {
  const files = await unzip(file, (p) => p === 'word/document.xml');
  const doc = files.get('word/document.xml');
  if (!doc) throw new Error('No text found in that Word file.');
  return byTag(xml(doc), 'w:p')
    .map((para) => byTag(para, 'w:t').map((t) => t.textContent ?? '').join(''))
    .filter((line) => line.trim())
    .join('\n');
}

/** The first sheet of an Excel workbook, as rows of cell text. */
export async function excelRows(file: File): Promise<string[][]> {
  const files = await unzip(file, (p) => p === 'xl/sharedStrings.xml' || /^xl\/worksheets\/sheet1\.xml$/.test(p));
  const sheet = files.get('xl/worksheets/sheet1.xml');
  if (!sheet) throw new Error('No sheet found in that Excel file.');
  const shared = files.get('xl/sharedStrings.xml');
  const strings = shared ? byTag(xml(shared), 'si').map((si) => byTag(si, 't').map((t) => t.textContent ?? '').join('')) : [];
  const col = (ref: string) => {
    const letters = ref.replace(/\d+/g, '');
    let n = 0;
    for (const ch of letters) n = n * 26 + (ch.charCodeAt(0) - 64);
    return n - 1;
  };
  return byTag(xml(sheet), 'row').map((row) => {
    const cells: string[] = [];
    for (const c of byTag(row, 'c')) {
      const type = c.getAttribute('t');
      const v = byTag(c, 'v')[0]?.textContent ?? byTag(c, 't').map((t) => t.textContent ?? '').join('');
      const text = type === 's' ? (strings[Number(v)] ?? '') : v;
      cells[col(c.getAttribute('r') ?? 'A')] = text.trim();
    }
    return Array.from(cells, (x) => x ?? '');
  });
}

/**
 * A sheet laid out as questions (a header row naming Question, the options
 * and Answer), read exactly; null when the sheet isn't laid out that way.
 */
export function questionsFromRows(rows: string[][], year: number | null): ParsedQuestion[] | null {
  const header = rows[0]?.map((h) => h.trim().toLowerCase()) ?? [];
  const at = (...names: string[]) => header.findIndex((h) => names.includes(h));
  const q = at('question', 'questions', 'question text');
  const ans = at('answer', 'correct answer', 'correct', 'key');
  const optCols = ['a', 'b', 'c', 'd', 'e'].map((l) => at(l, `option ${l}`, `option${l}`)).filter((i) => i >= 0);
  if (q < 0 || ans < 0 || optCols.length < 2) return null;
  const topic = at('topic');
  const expl = at('explanation', 'solution', 'working');
  return rows
    .slice(1)
    .filter((r) => r[q]?.trim())
    .map((r, i) => {
      const options = optCols.map((c, k) => ({ label: 'ABCDE'[k]!, text: r[c] ?? '' })).filter((o) => o.text.trim());
      const raw = (r[ans] ?? '').trim();
      // "C", "c", "C." or the option's own text.
      const letter = /^[a-e]\b/i.test(raw) ? raw[0]!.toUpperCase() : (options.find((o) => o.text.trim().toLowerCase() === raw.toLowerCase())?.label ?? '');
      return {
        number: i + 1,
        question: r[q]!.trim(),
        options,
        correctAnswer: letter,
        answerSource: 'paper' as const,
        explanation: expl >= 0 ? (r[expl] ?? '') : '',
        topic: topic >= 0 ? (r[topic] ?? '') : '',
        year: year ?? 0,
        needsReview: !letter,
        reviewNote: letter ? '' : 'No answer in the sheet: choose the right option.',
      };
    });
}

/** Any Office file as plain text for the AI reader (Excel rows tab-separated). */
export async function officeText(file: File): Promise<string> {
  if (isWord(file)) return wordText(file);
  return (await excelRows(file)).map((r) => r.join('\t')).join('\n');
}
