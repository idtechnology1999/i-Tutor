import React, { useMemo, useRef, useState } from 'react';
import { CheckCircle2, CircleAlert, FolderOpen, LoaderCircle, MinusCircle, X } from 'lucide-react';
import { CMS_SUBJECTS, localQuestions, paperQuestions, syncQuestions } from '../../lib/cms';
import type { CmsSubject, QuestionDraft } from '../../lib/cms';
import { api, isLive } from '../../services/api';
import { uploadMedia } from '../../services/pages';
import type { AdminNav } from './AdminApp';

/* Admin → Past questions → Import prepared files. Loads papers that were read
   and checked beforehand (by Claude, from the PDF pages): a folder holding
   <year>-<part>.json files and img/<year>-q<n>.png diagrams. Each year is
   saved as one paper of drafts, with its diagrams uploaded and attached. A
   year already in the bank is skipped, unless Replace is ticked (super admin
   password). Answers are marked as worked out by Claude, so Check answers can
   still confirm them with a second, independent AI. Nothing is published. */

interface PreparedQuestion {
  number: number;
  question: string;
  options: Array<[string, string]>;
  answer: string;
  explanation?: string;
  topic?: string;
  image?: unknown;
  notes?: string[];
}

interface PreparedFile {
  subject: string;
  exam: string;
  year: number;
  paperNotes?: string[];
  questions: PreparedQuestion[];
}

interface Paper {
  key: string;
  subject: CmsSubject;
  exam: string;
  year: number;
  questions: PreparedQuestion[];
  paperNotes: string[];
  images: Map<string, File>;
  state: 'ready' | 'working' | 'saved' | 'skipped' | 'failed';
  note: string;
}

const CLAUDE_NOTE = 'Answer worked out by Claude from the original page; run Check answers for a second, independent check.';

export const PreparedImport: React.FC<{ nav: AdminNav; onClose: () => void }> = ({ nav, onClose }) => {
  const [papers, setPapers] = useState<Paper[]>([]);
  const [error, setError] = useState('');
  const [replace, setReplace] = useState(false);
  const [password, setPassword] = useState('');
  const [running, setRunning] = useState(false);
  const pickRef = useRef<HTMLInputElement>(null);

  const update = (key: string, patch: Partial<Paper>) => setPapers((prev) => prev.map((p) => (p.key === key ? { ...p, ...patch } : p)));

  /** Reads the chosen folder: the year files and their diagram pictures. */
  const read = async (list: FileList | null) => {
    setError('');
    if (!list?.length) return;
    const files = [...list];
    const images = new Map(files.filter((f) => /\.png$/i.test(f.name)).map((f) => [f.name, f]));
    const byKey = new Map<string, Paper>();
    for (const f of files.filter((x) => /^\d{4}-[a-z]\.json$/i.test(x.name))) {
      let data: PreparedFile;
      try {
        data = JSON.parse(await f.text()) as PreparedFile;
      } catch {
        setError(`${f.name} is not a valid file.`);
        continue;
      }
      if (!(CMS_SUBJECTS as readonly string[]).includes(data.subject)) {
        setError(`${f.name}: "${data.subject}" is not a subject in the bank.`);
        continue;
      }
      const key = `${data.exam}|${data.subject}|${data.year}`;
      const paper = byKey.get(key) ?? {
        key,
        subject: data.subject as CmsSubject,
        exam: data.exam,
        year: data.year,
        questions: [],
        paperNotes: [],
        images,
        state: 'ready' as const,
        note: '',
      };
      paper.questions.push(...data.questions);
      paper.paperNotes.push(...(data.paperNotes ?? []));
      byKey.set(key, paper);
    }
    const list2 = [...byKey.values()].sort((a, b) => a.subject.localeCompare(b.subject) || a.year - b.year);
    for (const p of list2) p.questions.sort((a, b) => a.number - b.number);
    if (!list2.length) setError('No prepared year files were found in that folder. Choose the folder that holds files like 1983-a.json.');
    setPapers(list2);
  };

  const bank = localQuestions();
  const existing = (p: Paper) => paperQuestions(bank, p.subject, p.exam, p.year);

  /** One question as a draft. Questions that can't be saved (no options) are left out and reported. */
  const toDraft = (p: Paper, q: PreparedQuestion, image?: { url: string; alt: string }): QuestionDraft | null => {
    if (!q.options || q.options.length < 2) return null;
    const notes = q.notes ?? [];
    const flagged = notes.length > 0 || !q.answer;
    return {
      subject: p.subject,
      examType: p.exam,
      year: p.year,
      topic: (q.topic ?? '').slice(0, 200),
      question: q.question,
      options: q.options.map(([label, text]) => ({ label, text })),
      correctAnswer: q.answer ?? '',
      explanation: q.explanation ?? '',
      answerSource: q.answer ? 'ai' : 'manual',
      source: `Read by Claude from the past-question book (${p.subject} ${p.year})`,
      status: 'draft',
      needsReview: flagged,
      reviewNote: (flagged ? notes.join(' ') || 'No answer yet: choose the right option.' : CLAUDE_NOTE).slice(0, 1000),
      ...(image ? { image: image.url, imageAlt: image.alt } : {}),
    } as QuestionDraft;
  };

  const run = async () => {
    if (replace && !password) return setError('Enter the super admin password to replace years already in the bank.');
    setError('');
    setRunning(true);
    let saved = 0;
    for (const p of papers) {
      if (p.state === 'saved') continue;
      const old = existing(p);
      if (old.length && !replace) {
        update(p.key, { state: 'skipped', note: `Already in the bank (${old.length} questions). Tick Replace to read it in again.` });
        continue;
      }
      update(p.key, { state: 'working', note: 'Uploading diagrams…' });
      try {
        const drafts: QuestionDraft[] = [];
        const left: number[] = [];
        let done = 0;
        const withImage = p.questions.filter((q) => q.image).length;
        for (const q of p.questions) {
          let image: { url: string; alt: string } | undefined;
          if (q.image) {
            const file = p.images.get(`${p.year}-q${q.number}.png`);
            if (!file) throw new Error(`The diagram for question ${q.number} (${p.year}-q${q.number}.png) is missing from the folder.`);
            const alt = `Diagram for ${p.subject} ${p.year} question ${q.number}`;
            const item = await uploadMedia(file, alt);
            image = { url: item.url, alt };
            done += 1;
            update(p.key, { note: `Uploading diagrams: ${done} of ${withImage}…` });
          }
          const d = toDraft(p, q, image);
          if (d) drafts.push(d);
          else left.push(q.number);
        }
        update(p.key, { note: 'Saving…' });
        if (old.length) {
          await api('/api/admin/questions/replace', { method: 'POST', body: { password, ids: old.map((q) => q.id), questions: drafts }, timeout: 90_000 });
        } else {
          await api('/api/admin/questions', { method: 'POST', body: drafts, timeout: 90_000 });
        }
        saved += 1;
        const notes = [
          `${drafts.length} questions saved as drafts${withImage ? `, ${withImage} with diagrams` : ''}${old.length ? ` (replaced ${old.length})` : ''}.`,
          left.length ? `Left out (no options in the book): ${left.join(', ')}.` : '',
          ...p.paperNotes,
        ].filter(Boolean);
        update(p.key, { state: 'saved', note: notes.join(' ') });
      } catch (e) {
        update(p.key, { state: 'failed', note: (e as Error).message });
      }
    }
    setRunning(false);
    await syncQuestions('admin').catch(() => undefined);
    if (saved) nav.notify(`${saved} paper${saved === 1 ? '' : 's'} imported as drafts. Run Check answers, then publish.`);
  };

  const total = useMemo(() => papers.reduce((n, p) => n + p.questions.length, 0), [papers]);
  const icon = { ready: MinusCircle, working: LoaderCircle, saved: CheckCircle2, skipped: MinusCircle, failed: CircleAlert };

  return (
    <div className="cms-modal" onClick={() => !running && onClose()}>
      <div className="cms-modal__panel bulk" role="dialog" aria-modal="true" aria-labelledby="pi-title" onClick={(e) => e.stopPropagation()}>
        <header className="cms-modal__head">
          <h2 id="pi-title">
            <FolderOpen size={20} aria-hidden /> Import prepared files
          </h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} disabled={running} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body bulk__body">
          <p className="adm-muted">
            Choose a prepared folder (for example <b>prepared-claude\physics-part1</b>). Each year is saved as one paper of <b>drafts</b>, with its diagrams.
            Questions the book printed wrongly arrive marked <b>Needs review</b> with a note saying what to check.
          </p>
          {!isLive && <p className="adm-note">This needs the live site.</p>}

          <div className="bulk__replace">
            <label className="adm-check">
              <input type="checkbox" checked={replace} onChange={(e) => setReplace(e.target.checked)} disabled={running} />
              <span>
                <b>Replace years already in the bank.</b> Their old questions are deleted and these are saved instead.
              </span>
            </label>
            {replace && (
              <label className="adm-field">
                <span>Super admin password</span>
                <input type="password" className="adm-input" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" disabled={running} />
              </label>
            )}
          </div>

          <button type="button" className="bulk__drop" onClick={() => pickRef.current?.click()} disabled={running}>
            <FolderOpen size={22} aria-hidden />
            <strong>Choose the prepared folder</strong>
            <small>The folder with the year files (1983-a.json …) and the img folder inside it</small>
          </button>
          <input
            ref={(el) => {
              pickRef.current = el;
              // Folder picking (all files inside, including img/).
              if (el) el.setAttribute('webkitdirectory', '');
            }}
            type="file"
            multiple
            hidden
            onChange={(e) => void read(e.target.files)}
          />

          {papers.length > 0 && (
            <>
              <p className="adm-muted">
                {papers.length} papers, {total} questions.
              </p>
              <ul className="bulk__files">
                {papers.map((p) => {
                  const Icon = icon[p.state];
                  const there = existing(p).length;
                  return (
                    <li key={p.key}>
                      <div className="bulk__file">
                        <strong>
                          <Icon size={15} className={p.state === 'working' ? 'adm-spin' : ''} aria-hidden /> {p.subject} {p.year}
                        </strong>
                        <small>
                          {p.questions.length} questions · {p.questions.filter((q) => q.image).length} diagrams ·{' '}
                          {p.questions.filter((q) => (q.notes ?? []).length || !q.answer).length} to review
                          {there && p.state === 'ready' ? ` · already in the bank (${there})` : ''}
                        </small>
                      </div>
                      {p.note && <p className={`bulk__msg${p.state === 'failed' ? ' is-bad' : ''}`}>{p.note}</p>}
                    </li>
                  );
                })}
              </ul>
            </>
          )}
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="cms-modal__foot">
          <button type="button" className="adm-btn" onClick={onClose} disabled={running}>
            Close
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => void run()} disabled={!isLive || running || !papers.length}>
            {running ? 'Importing…' : 'Import as drafts'}
          </button>
        </footer>
      </div>
    </div>
  );
};
