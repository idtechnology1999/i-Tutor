import React, { useEffect, useRef, useState } from 'react';
import { CheckSquare, ChevronLeft, ChevronRight, Info, LoaderCircle, Mic, Plus, Search, Shuffle, Sparkles, Square, Trash2, Upload, X } from 'lucide-react';
import { CMS_SUBJECTS, EXAM_LABEL, PRACTICE } from '../../lib/cms';
import { OFF_NOTE, isCertLike, isLiveExam, liveExams, useExams } from '../../lib/exams';
import type { ExamInfo } from '../../lib/exams';
import type { CmsQuestion, CmsSubject, QuestionDraft } from '../../lib/cms';
import { SYLLABUS_LABEL, syllabusTopics } from '../../data/waec-syllabus';
import type { SyllabusChoice } from '../../data/waec-syllabus';
import { matchTopic, writePracticeQuestions } from '../../lib/practice-writer';
import { organiseWithAI } from '../../lib/question-import';
import { publishProblems } from '../../lib/question-rules';
import { canSpeak, recogniserCtor, speakText } from '../../lib/speech';
import type { Recogniser } from '../../lib/speech';
import {
  addPractice,
  deletePractice,
  doubleCheckDrafts,
  getPracticeSettings,
  listPractice,
  practiceSummary,
  savePracticeSettings,
  setPracticeStatus,
  updatePractice,
} from '../../services/practice';
import type { PracticePage, PracticeSettings, RealExam, Source, SubjectCount, Target } from '../../services/practice';
import { QuestionEditor } from './QuestionEditor';
import type { AdminNav } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';

/* Practice questions: a bank separate from past papers, for each exam (JAMB,
   WAEC, …) or shared by every exam, organised by syllabus topic. It can hold
   any number of questions, so it's loaded a page at a time from the server.
   - Per exam, the admin decides how students' practice sets are built: the
     practice bank, past questions, or a mix (and how big a set is), and which
     syllabus organises the topics: JAMB, WAEC/NECO or both merged.
   - The AI writer works on the chosen exam and subject: tick topics, then say
     or type what to set ("set 30 questions"). It writes drafts to check.
   Every time a student practises, the server draws a fresh random set. */

const ALL = '__all';
const OTHER = '__other';
const PAGE = 50;

/** '' = shared by every exam; then every exam in Admin → Settings → Exams (on or off, so a bank can be filled before it goes live). */
const tabsFor = (exams: ExamInfo[]): Array<{ id: '' | RealExam; label: string; full: string; off: boolean }> => [
  { id: '', label: 'Shared', full: 'Questions for every exam', off: false },
  ...exams.map((e) => ({ id: e.id, label: e.label, full: e.name, off: !e.enabled })),
];

const SOURCES: Array<{ id: Source; label: string; help: string }> = [
  { id: 'practice', label: 'Practice bank', help: 'Only questions from this bank.' },
  { id: 'past', label: 'Past questions', help: 'Only real past questions for this exam.' },
  { id: 'mix', label: 'Mix both', help: 'Some of each, in the share you choose.' },
];

const blank = (subject: CmsSubject, topic: string, target: string): QuestionDraft => ({
  subject,
  examType: PRACTICE,
  target,
  year: null,
  topic,
  question: '',
  options: ['A', 'B', 'C', 'D'].map((label) => ({ label, text: '' })),
  correctAnswer: '',
  explanation: '',
  answerSource: 'manual',
  source: 'i-Tutor practice',
  status: 'draft',
  needsReview: false,
  reviewNote: '',
});

const UNITS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17, eighteen: 18, nineteen: 19,
};
const TENS: Record<string, number> = { twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60, seventy: 70, eighty: 80, ninety: 90 };

/** The number the admin typed or said: "30", "thirty five", "a hundred", "two hundred". null if none. */
const numberIn = (text: string): number | null => {
  const digits = text.match(/\d+/)?.[0];
  if (digits) return Number(digits);
  const words = text.toLowerCase().replace(/-/g, ' ').split(/[^a-z]+/);
  let total = 0;
  let found = false;
  for (let i = 0; i < words.length; i += 1) {
    const w = words[i];
    if (w === 'hundred') {
      total = (total || 1) * 100;
      found = true;
    } else if (w in TENS) {
      total += TENS[w];
      found = true;
    } else if (w in UNITS) {
      total += UNITS[w];
      found = true;
    } else if (found && w !== 'and') break;
  }
  return found ? total : null;
};

/** "set 10 questions on each topic" → 10 per topic; "set 30 questions" → 30 in total; null until a number is given. */
const countFrom = (instruction: string, topics: number): number | null => {
  const n = numberIn(instruction);
  if (!n) return null;
  const each = /\b(each|every|per)\b/i.test(instruction);
  return Math.max(1, Math.min(500, each ? n * Math.max(1, topics) : n));
};

/** What's left of the instruction once the count is taken out ("harder ones with calculations"), as extra guidance for the AI. */
const noteFrom = (instruction: string) =>
  instruction
    .replace(/\b(please\s+)?(set|write|generate|make|create|give( me)?)\b/gi, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(new RegExp(`\\b(a\\s+)?(${[...Object.keys(UNITS), ...Object.keys(TENS), 'hundred'].join('|')})\\b`, 'gi'), ' ')
    .replace(/\b(in|on|for)\s+(this|the|these)\s+topics?(\s+selected)?\b/gi, ' ')
    .replace(/\b(on|for|in|from|across|based on)\s+(each|every|all|the|these|those|selected|this|the selected)(\s+(selected|chosen))?\s+topics?(\s+selected)?\b/gi, ' ')
    .replace(/\b(each|per|every)\s+topic\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .replace(/^(more\s+|new\s+)?(practice\s+)?questions?$/i, '')
    .trim();

const n = (x: number) => x.toLocaleString('en-NG');
const order = (subject: string) => (CMS_SUBJECTS as readonly string[]).indexOf(subject);

/** Past questions in a set of `size` (rounded as the server rounds it). */
const pastIn = (s: PracticeSettings, size: number) => (s.source === 'past' ? size : s.source === 'practice' ? 0 : Math.round((size * s.pastShare) / 100));

/** The biggest set a subject is drawn for: JAMB's mock on /exam is English 60, other subjects 40. */
const biggestSet = (s: PracticeSettings, subject: string) => (s.exam === 'UTME' ? Math.max(s.size, subject === 'English' ? 60 : 40) : s.size);

/** Published practice questions a subject needs so past questions never fill more than their share. */
const practiceNeeded = (s: PracticeSettings, subject: string) => {
  const size = biggestSet(s, subject);
  return size - pastIn(s, size);
};

/* -------------------------------------------------------------- Settings */

const SettingsCard: React.FC<{
  value: PracticeSettings;
  onSave: (s: PracticeSettings) => Promise<void>;
}> = ({ value, onSave }) => {
  const [draft, setDraft] = useState(value);
  const [saving, setSaving] = useState(false);
  const dirty = JSON.stringify(draft) !== JSON.stringify(value);
  const set = (patch: Partial<PracticeSettings>) => setDraft((d) => ({ ...d, ...patch }));

  const past = pastIn(draft, draft.size);
  const practice = draft.size - past;
  const mockLine = (subjects: string, size: number) => `${subjects} ${size} = ${size - pastIn(draft, size)} practice + ${pastIn(draft, size)} past`;
  const name = EXAM_LABEL[draft.exam];

  return (
    <section className="adm-px__card" aria-labelledby="px-settings">
      <header className="adm-px__card-head">
        <Shuffle size={18} aria-hidden />
        <div>
          <h2 id="px-settings">How {name} students get practice sets</h2>
          <p>Every time a student practises, they get a fresh random set, spread across the syllabus topics. No two visits are the same.</p>
        </div>
      </header>

      <div className="adm-px__row">
        <span className="adm-px__label">Questions come from</span>
        <div className="adm-px__seg" role="radiogroup" aria-label="Questions come from">
          {SOURCES.map((s) => (
            <button key={s.id} type="button" role="radio" aria-checked={draft.source === s.id} className={draft.source === s.id ? 'is-on' : ''} onClick={() => set({ source: s.id })} title={s.help}>
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {draft.source === 'mix' && (
        <div className="adm-px__row">
          <span className="adm-px__label">Share of past questions</span>
          <div className="adm-px__slider">
            <input
              type="range"
              min={0}
              max={100}
              step={5}
              value={draft.pastShare}
              onChange={(e) => set({ pastShare: Number(e.target.value) })}
              aria-label="Share of past questions"
            />
            <b>{draft.pastShare}%</b>
          </div>
        </div>
      )}

      <div className="adm-px__row">
        <span className="adm-px__label">Questions in a set</span>
        <div className="adm-px__seg" role="radiogroup" aria-label="Questions in a set">
          {[20, 30, 40, 50, 60].map((size) => (
            <button key={size} type="button" role="radio" aria-checked={draft.size === size} className={draft.size === size ? 'is-on' : ''} onClick={() => set({ size })}>
              {size}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-px__row">
        <span className="adm-px__label">Syllabus</span>
        <div className="adm-px__seg" role="radiogroup" aria-label="Syllabus">
          {(['jamb', 'waec', 'both'] as SyllabusChoice[]).map((s) => (
            <button key={s} type="button" role="radio" aria-checked={draft.syllabus === s} className={draft.syllabus === s ? 'is-on' : ''} onClick={() => set({ syllabus: s })}>
              {s === 'jamb' ? 'JAMB' : s === 'waec' ? 'WAEC/NECO' : 'Both, merged'}
            </button>
          ))}
        </div>
      </div>

      {/* What one set will look like. */}
      <div className="adm-px__preview" aria-live="polite">
        <div className="adm-px__bar" aria-hidden>
          <i style={{ width: `${(practice / draft.size) * 100}%` }} />
        </div>
        <p>
          Each set of <b>{draft.size}</b>: <b>{practice}</b> from the practice bank + <b>{past}</b> {name} past questions. If one side runs short,
          the other fills the gap. Topics follow the {SYLLABUS_LABEL[draft.syllabus]}.
        </p>
        {draft.exam === 'UTME' && (
          <p>
            The JAMB mock exam on /exam uses the same share in JAMB’s format: {mockLine('English', 60)}; {mockLine('other subjects', 40)}.
          </p>
        )}
      </div>

      <div className="adm-px__actions">
        {dirty && (
          <button type="button" className="adm-btn" onClick={() => setDraft(value)} disabled={saving}>
            Undo changes
          </button>
        )}
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          disabled={!dirty || saving}
          onClick={() => {
            setSaving(true);
            void onSave(draft).finally(() => setSaving(false));
          }}
        >
          {saving ? 'Saving…' : dirty ? 'Save settings' : 'Saved'}
        </button>
      </div>
    </section>
  );
};

/* ------------------------------------------------------------------ Page */

export const AdminPractice: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const exams = useExams();
  const [target, setTarget] = useState<'' | RealExam>('UTME');
  // An exam switched off in Settings → Exams can't be worked on here: move to the first one that's on.
  useEffect(() => {
    if (target && !isLiveExam(target)) setTarget(liveExams()[0]?.id ?? '');
  }, [target, exams]);
  const [subject, setSubject] = useState<CmsSubject>('English');
  const [settings, setSettings] = useState<PracticeSettings[]>([]);
  const [summary, setSummary] = useState<SubjectCount[]>([]);
  const [data, setData] = useState<PracticePage | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [version, setVersion] = useState(0);
  const reload = () => setVersion((v) => v + 1);

  // Topics ticked for the AI, and the topic whose questions are listed.
  const [picked, setPicked] = useState<string[]>([]);
  const [viewing, setViewing] = useState<string>(ALL);
  const [status, setStatus] = useState<'' | 'draft' | 'published'>('');
  const [query, setQuery] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CmsQuestion | 'new' | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [instruction, setInstruction] = useState('');
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState('');
  const [aiError, setAiError] = useState('');
  const [listening, setListening] = useState(false);
  const recRef = useRef<Recogniser | null>(null);
  const spokeRef = useRef(false);

  useEffect(() => () => recRef.current?.abort(), []);

  // The exam's settings decide the syllabus; shared questions use both.
  const setting = target ? settings.find((s) => s.exam === target) : undefined;
  const syllabus: SyllabusChoice = target ? (setting?.syllabus ?? (isCertLike(target) ? 'waec' : 'jamb')) : 'both';
  const topics = syllabusTopics(subject, syllabus);
  const allPicked = topics.length > 0 && picked.length === topics.length;
  const examName = target ? EXAM_LABEL[target] : 'All exams';

  useEffect(() => {
    getPracticeSettings()
      .then(setSettings)
      .catch((e: Error) => setLoadError(e.message));
  }, []);

  // Search waits until the admin stops typing.
  useEffect(() => {
    const t = window.setTimeout(() => {
      setSearch(query);
      setPage(1);
    }, 350);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    let live = true;
    setLoading(true);
    const t: Target = target;
    Promise.all([
      listPractice({
        target: t,
        subject,
        ...(viewing === ALL ? {} : viewing === OTHER ? { notTopics: topics } : { topic: viewing }),
        q: search,
        status: status || undefined,
        page,
        size: PAGE,
      }),
      practiceSummary(t),
    ])
      .then(([d, s]) => {
        if (!live) return;
        setData(d);
        setSummary(s);
        setLoadError('');
        if (page > d.pages) setPage(d.pages);
      })
      .catch((e: Error) => live && setLoadError(e.message))
      .finally(() => live && setLoading(false));
    return () => {
      live = false;
    };
    // topics follows subject + syllabus, which are listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, subject, syllabus, viewing, search, status, page, version]);

  const rows = data?.rows ?? [];
  const topicCount = (t: string) => data?.topics.find((x) => x.topic === t);
  const listed = new Set(topics);
  const otherTotal = (data?.topics ?? []).filter((x) => !listed.has(x.topic)).reduce((sum, x) => sum + x.total, 0);
  const subjectTotal = (data?.topics ?? []).reduce((sum, x) => sum + x.total, 0);
  const viewName = viewing === ALL ? `All ${subject} topics` : viewing === OTHER ? 'Other topics' : viewing;
  const newTopic = viewing === ALL || viewing === OTHER ? (picked.length === 1 ? picked[0] : '') : viewing;

  const resetScope = () => {
    setPicked([]);
    setViewing(ALL);
    setSelected(new Set());
    setAiError('');
    setPage(1);
  };
  const pickTarget = (t: '' | RealExam) => {
    setTarget(t);
    resetScope();
  };
  const pickSubject = (s: CmsSubject) => {
    setSubject(s);
    resetScope();
  };
  const togglePick = (t: string) => setPicked((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleAllPicked = () => setPicked(allPicked ? [] : [...topics]);

  /** Runs a change, then reloads the list (and says what went wrong, if anything). */
  const change = async (work: Promise<unknown>, done?: string) => {
    try {
      await work;
      if (done) nav.notify(done);
    } catch (e) {
      nav.notify((e as Error).message);
    }
    setSelected(new Set());
    reload();
  };

  /* ------------------------------------------------------- Import a file */

  // A document of practice questions (PDF, Word, Excel, text or a photo) read
  // into this exam and subject as drafts. Answers the AI had to work out are
  // double-checked by a second AI.
  const fileRef = useRef<HTMLInputElement>(null);
  const [importing, setImporting] = useState('');
  const importFile = async (file: File) => {
    setImporting(`Reading ${file.name}…`);
    try {
      const text = /\.txt$/i.test(file.name) ? await file.text() : '';
      const result = await organiseWithAI({
        subject,
        examType: target || 'UTME',
        year: null,
        source: `Imported: ${file.name}`,
        text,
        file: text ? null : file,
      });
      if (!result.questions.length) {
        nav.notify('No questions found in that file. Check it has numbered questions with options.');
        return;
      }
      setImporting(`Checking ${result.questions.length} questions…`);
      const drafts: QuestionDraft[] = result.questions.map((q) => ({
        subject,
        examType: PRACTICE,
        target,
        year: null,
        // The syllabus topic it names, or the topic being viewed.
        topic: matchTopic(subject, q.topic, syllabus) || (viewing !== ALL && viewing !== OTHER ? viewing : q.topic) || '',
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation,
        answerSource: q.answerSource,
        source: `Imported: ${file.name}`.slice(0, 120),
        status: 'draft',
        needsReview: q.needsReview,
        reviewNote: q.reviewNote,
      }));
      const fromAi = drafts.filter((d) => d.answerSource === 'ai');
      const checked = fromAi.length ? await doubleCheckDrafts(fromAi) : [];
      const ready = drafts.map((d) => (d.answerSource === 'ai' ? (checked[fromAi.indexOf(d)] ?? d) : d));
      await addPractice(ready, `Imported ${ready.length} ${subject} practice questions from ${file.name}.`);
      const review = ready.filter((d) => d.needsReview).length;
      nav.notify(
        `Imported ${ready.length} ${examName} ${subject} questions as drafts${review ? `; ${review} need${review === 1 ? 's' : ''} a look (marked “needs review”)` : ''}. Check them, then publish.`,
      );
      reload();
    } catch (e) {
      nav.notify((e as Error).message);
    } finally {
      setImporting('');
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  /* ------------------------------------------------------------ AI writer */

  const willWrite = countFrom(instruction, picked.length);

  const run = async (text = instruction) => {
    if (!picked.length) {
      setAiError('Tick at least one topic first (or Select all).');
      return;
    }
    const count = countFrom(text, picked.length);
    if (!count) {
      setAiError('Say or type how many questions you want, e.g. “set 25 questions”.');
      if (spokeRef.current) speakText('How many questions do you want?');
      return;
    }
    setBusy(true);
    setAiError('');
    setProgress(`0 of ${count} written…`);
    const result = await writePracticeQuestions({
      subject,
      topics: picked,
      count,
      note: noteFrom(text),
      existing: rows,
      exam: target,
      syllabus,
      // Saved batch by batch; the list refreshes as they arrive.
      save: async (drafts, label) => {
        await addPractice(drafts, label);
        reload();
      },
      onProgress: (done, of) => setProgress(`${done} of ${of} written…`),
    });
    setBusy(false);
    setProgress('');
    const where = allPicked ? `all ${subject} topics` : `${picked.length} topic${picked.length === 1 ? '' : 's'}`;
    const message = result.error
      ? `Stopped after ${result.written}: ${result.error} The ${result.written} written are saved as drafts.`
      : `Done: ${result.written} ${examName} ${subject} questions on ${where} added as drafts. Check them, then publish.`;
    if (result.error) setAiError(message);
    else {
      nav.notify(message);
      setInstruction('');
    }
    if (spokeRef.current) speakText(message);
    reload();
  };

  // Speak the instruction; it fills the box and runs when you stop talking.
  const toggleListen = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = recogniserCtor();
    if (!Ctor) {
      nav.notify('Voice needs Chrome or Edge. You can still type.');
      return;
    }
    if (canSpeak()) window.speechSynthesis.cancel();
    const rec = new Ctor();
    rec.lang = 'en-NG';
    rec.interimResults = true;
    rec.continuous = false;
    let said = '';
    rec.onresult = (e) => {
      said = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(' ')
        .trim();
      setInstruction(said);
    };
    rec.onerror = (e) => {
      if (e.error === 'not-allowed') nav.notify('Allow the microphone in your browser to speak to the AI.');
    };
    rec.onend = () => {
      setListening(false);
      recRef.current = null;
      if (said) {
        spokeRef.current = true;
        void run(said);
      }
    };
    recRef.current = rec;
    setListening(true);
    rec.start();
  };

  /* ----------------------------------------------------------- Selection */

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = rows.length > 0 && rows.every((q) => selected.has(q.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(rows.map((q) => q.id)));

  // Questions with a missing answer or option can't go live. AI-written ones
  // can, once the admin confirms they've checked the answers.
  const bulkPublish = () => {
    const chosen = rows.filter((q) => selected.has(q.id));
    const complete = chosen.filter((q) => publishProblems(q).length === 0);
    const incomplete = chosen.length - complete.length;
    const aiWritten = complete.filter((q) => q.answerSource === 'ai').length;
    if (!complete.length) {
      nav.notify('None of these can be published yet: each needs a question, options and a correct answer.');
      return;
    }
    if (
      aiWritten &&
      !window.confirm(`${aiWritten} of these ${aiWritten === 1 ? 'has an answer' : 'have answers'} written by the AI. Publish only if you’ve checked them. Publish now?`)
    )
      return;
    void change(
      setPracticeStatus(
        complete.map((q) => q.id),
        'published',
      ),
      `Published ${complete.length} question${complete.length === 1 ? '' : 's'}${incomplete ? `. ${incomplete} skipped: open ${incomplete === 1 ? 'it' : 'them'} to add the missing answer or option` : ''}.`,
    );
  };

  // A second AI solves the selected questions without their answers; disagreements are flagged for review.
  const [checking, setChecking] = useState(false);
  const bulkCheck = async () => {
    const chosen = rows.filter((q) => selected.has(q.id) && q.correctAnswer);
    if (!chosen.length) return nav.notify('Choose questions that have an answer to check.');
    setChecking(true);
    try {
      const checked = await doubleCheckDrafts(chosen);
      if (checked === chosen) return nav.notify('Answers can only be checked on the live site, with the AI switched on.');
      await Promise.all(checked.map((q) => updatePractice(q.id, { needsReview: q.needsReview, reviewNote: q.reviewNote })));
      const flagged = checked.filter((q) => q.needsReview).length;
      nav.notify(
        flagged
          ? `Checked ${checked.length}: ${flagged} need${flagged === 1 ? 's' : ''} a look (marked “needs review”, with the reason).`
          : `Checked ${checked.length}: the second AI agrees with every answer.`,
      );
    } catch (e) {
      nav.notify((e as Error).message);
    } finally {
      setChecking(false);
      setSelected(new Set());
      reload();
    }
  };

  const from = data && data.total ? (data.page - 1) * PAGE + 1 : 0;
  const to = data ? Math.min(data.page * PAGE, data.total) : 0;

  return (
    <div className="adm-page">
      <PageHead
        title="Practice questions"
        sub="A bank for each exam, separate from past papers, with no limit on size. Every time a student practises, they get a fresh random set."
      />

      {/* --------------------------------------------------------- Exams */}
      <nav className="adm-px__exams" aria-label="Exam">
        {tabsFor(exams).map((t) => (
          <button
            key={t.id || 'shared'}
            type="button"
            className={`${target === t.id ? 'is-on' : ''}${t.off ? ' is-off' : ''}`}
            onClick={() => pickTarget(t.id)}
            disabled={t.off}
            title={t.off ? `${t.label}: ${OFF_NOTE}` : t.full}
            aria-pressed={target === t.id}
          >
            {t.label}
            {t.off && <small> · off</small>}
          </button>
        ))}
      </nav>

      {target && setting ? (
        <SettingsCard
          key={target}
          value={setting}
          onSave={async (s) => {
            try {
              const saved = await savePracticeSettings(s);
              setSettings((list) => list.map((x) => (x.exam === saved.exam ? saved : x)));
              nav.notify(`${EXAM_LABEL[saved.exam]} practice settings saved.`);
            } catch (e) {
              nav.notify((e as Error).message);
            }
          }}
        />
      ) : !target ? (
        <p className="adm-px__note">
          <Info size={16} aria-hidden /> Shared questions suit every exam (for example, core Maths or English). Every exam’s practice sets use them alongside that
          exam’s own questions. They follow both syllabuses, merged.
        </p>
      ) : null}

      {loadError && <p className="adm-users__error">{loadError}</p>}

      <label className="adm-field adm-scope__pick adm-pr__subject">
        <span>Subject</span>
        <select className="adm-input" value={subject} onChange={(e) => pickSubject(e.target.value as CmsSubject)}>
          {CMS_SUBJECTS.map((s) => {
            const row = summary.find((x) => x.subject === s);
            const live = row?.published ?? 0;
            const total = row?.total ?? 0;
            return (
              <option key={s} value={s}>
                {s}: {n(live)} practice{total > live ? ` (+${n(total - live)} draft)` : ''}
                {target ? ` · ${n(row?.past ?? 0)} past` : ''}
              </option>
            );
          })}
        </select>
      </label>

      {(() => {
        // Where past questions are filling more than their share, because the practice bank is too small.
        if (!target || !setting) return null;
        const row = summary.find((x) => x.subject === subject);
        const live = row?.published ?? 0;
        const past = row?.past ?? 0;
        const needed = practiceNeeded(setting, subject);
        const short = summary
          .filter((x) => (x.past ?? 0) + x.total > 0 && x.published < practiceNeeded(setting, x.subject))
          .sort((a, b) => order(a.subject) - order(b.subject));
        return (
          <>
            {live < needed && (
              <p className="adm-px__note">
                <Info size={16} aria-hidden />
                {past
                  ? `A ${examName} ${subject} set needs ${n(needed)} practice questions, and ${n(live)} ${live === 1 ? 'is' : 'are'} published. Until there are more, past questions fill the other ${n(needed - live)}, so students get more past questions than your share.`
                  : `A ${examName} ${subject} set needs ${n(needed)} practice questions, and ${n(live)} ${live === 1 ? 'is' : 'are'} published. There are no ${examName} ${subject} past questions to fill the gap, so sets will be short until you add more.`}
              </p>
            )}
            {short.length > 0 && (
              <div className="adm-px__short" aria-label="Subjects that need more practice questions">
                <span>Need more practice questions:</span>
                {short.map((x) => (
                  <button key={x.subject} type="button" className={x.subject === subject ? 'is-on' : ''} onClick={() => pickSubject(x.subject as CmsSubject)}>
                    {x.subject} <small>{n(x.published)}/{n(practiceNeeded(setting, x.subject))}</small>
                  </button>
                ))}
              </div>
            )}
          </>
        );
      })()}

      {/* ------------------------------------------------------- AI writer */}
      <section className="adm-pr__ai" aria-labelledby="pr-ai-title">
        <div className="adm-pr__ai-head">
          <Sparkles size={18} aria-hidden />
          <strong id="pr-ai-title">
            AI question writer · {examName} {subject} · {SYLLABUS_LABEL[syllabus]}
          </strong>
        </div>

        <div className="adm-pr__picked" aria-live="polite">
          {picked.length === 0 ? (
            <span className="adm-muted">No topics selected. Tick topics below, or Select all.</span>
          ) : allPicked ? (
            <span className="adm-pr__chip is-all">
              All {topics.length} {subject} topics
              <button type="button" onClick={() => setPicked([])} aria-label="Clear topics">
                <X size={13} aria-hidden />
              </button>
            </span>
          ) : (
            picked.map((t) => (
              <span key={t} className="adm-pr__chip">
                {t}
                <button type="button" onClick={() => togglePick(t)} aria-label={`Remove ${t}`}>
                  <X size={13} aria-hidden />
                </button>
              </span>
            ))
          )}
        </div>

        <form
          className="adm-pr__ai-row"
          onSubmit={(e) => {
            e.preventDefault();
            spokeRef.current = false;
            void run();
          }}
        >
          <button
            type="button"
            className={`adm-pr__mic${listening ? ' is-on' : ''}`}
            onClick={toggleListen}
            disabled={busy}
            aria-pressed={listening}
            aria-label={listening ? 'Stop listening' : 'Speak your instruction'}
            title={listening ? 'Listening… tap to stop' : 'Speak your instruction'}
          >
            {listening ? <Square size={15} aria-hidden /> : <Mic size={18} aria-hidden />}
          </button>
          <input
            className="adm-input"
            value={instruction}
            onChange={(e) => setInstruction(e.target.value)}
            placeholder={listening ? 'Listening…' : `Tell the AI what to set, e.g. “set 100 questions” or “20 on each topic, harder ones”`}
            aria-label="Instruction for the AI"
            disabled={busy}
          />
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || !picked.length}>
            {busy ? <LoaderCircle size={18} className="adm-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
            {busy ? progress || 'Writing…' : willWrite ? `Write ${willWrite}` : 'Write'}
          </button>
        </form>

        <p className="adm-muted">
          Written in {examName}’s style, up to 500 at a time, spread across the ticked topics. They arrive as drafts as each batch is written. Check the answers, then
          publish. Students only ever see published questions.
        </p>
        {aiError && <p className="adm-users__error">{aiError}</p>}
      </section>

      <section className="adm-px__import" aria-labelledby="px-import">
        <div>
          <strong id="px-import">
            <Upload size={16} aria-hidden /> Import questions from a file
          </strong>
          <p className="adm-muted">
            PDF, Word, Excel, text or a photo, into {examName} {subject}. An Excel sheet with columns <b>Question · A · B · C · D · Answer · Topic</b> is read
            exactly. They arrive as drafts to check.
          </p>
        </div>
        <input
          ref={fileRef}
          type="file"
          hidden
          accept=".pdf,.docx,.xlsx,.txt,image/jpeg,image/png,image/webp"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void importFile(f);
          }}
        />
        <button type="button" className="adm-btn" onClick={() => fileRef.current?.click()} disabled={Boolean(importing)}>
          {importing ? <LoaderCircle size={16} className="adm-spin" aria-hidden /> : <Upload size={16} aria-hidden />} {importing || 'Choose a file'}
        </button>
      </section>

      <div className="adm-pr">
        {/* ------------------------------------------------------- Topics */}
        <nav className="adm-pr__topics" aria-label={`${subject} topics`}>
          <button type="button" className="adm-pr__all" onClick={toggleAllPicked} aria-pressed={allPicked}>
            {allPicked ? <CheckSquare size={16} aria-hidden /> : <Square size={16} aria-hidden />}
            {allPicked ? 'Clear all' : 'Select all topics'}
          </button>
          <button
            type="button"
            className={`adm-pr__view${viewing === ALL ? ' is-on' : ''}`}
            onClick={() => {
              setViewing(ALL);
              setPage(1);
            }}
          >
            <span>Show all questions</span>
            <small>{n(subjectTotal)}</small>
          </button>
          {topics.map((t) => {
            const c = topicCount(t);
            const on = picked.includes(t);
            return (
              <div key={t} className={`adm-pr__topic${viewing === t ? ' is-on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => togglePick(t)} aria-label={`Select ${t} for the AI`} />
                <button
                  type="button"
                  onClick={() => {
                    setViewing(t);
                    setPage(1);
                  }}
                  className={c?.total ? '' : 'is-empty'}
                >
                  <span>{t}</span>
                  <small title={`${c?.published ?? 0} published of ${c?.total ?? 0}`}>{c?.total ? `${n(c.published)}/${n(c.total)}` : '0'}</small>
                </button>
              </div>
            );
          })}
          {otherTotal > 0 && (
            <button
              type="button"
              className={`adm-pr__view${viewing === OTHER ? ' is-on' : ''}`}
              onClick={() => {
                setViewing(OTHER);
                setPage(1);
              }}
            >
              <span>Other topics</span>
              <small>{n(otherTotal)}</small>
            </button>
          )}
        </nav>

        {/* ---------------------------------------------------- Questions */}
        <section className="adm-pr__main">
          <div className="adm-scope__title">
            <h2>{viewName}</h2>
            <span className="adm-muted">
              {n(data?.total ?? 0)} question{data?.total === 1 ? '' : 's'} · {n(data?.published ?? 0)} published
            </span>
            <button type="button" className="adm-link" onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> Type one in
            </button>
          </div>

          <div className="adm-px__filters">
            <label className="adm-input adm-input--icon adm-search">
              <Search size={18} aria-hidden />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={`Search ${examName} ${subject} practice questions`}
                aria-label="Search practice questions"
              />
            </label>
            <select
              className="adm-input"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(1);
              }}
              aria-label="Status"
            >
              <option value="">Published and drafts</option>
              <option value="published">Published only</option>
              <option value="draft">Drafts only</option>
            </select>
          </div>

          {loading && !data ? (
            <p className="adm-muted" aria-busy="true">
              <LoaderCircle size={16} className="adm-spin" aria-hidden /> Loading questions…
            </p>
          ) : rows.length === 0 ? (
            <div className="adm-empty">
              <h3>{search ? 'Nothing matches that search' : 'No practice questions here yet'}</h3>
              <p>{search ? 'Try a different word.' : 'Tick topics and tell the AI writer above what to set, or type a question in.'}</p>
            </div>
          ) : (
            <>
              <div className={`adm-table${loading ? ' is-loading' : ''}`} role="table" aria-label="Practice questions">
                <div className="adm-table__head" role="row">
                  <label className="adm-check">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all questions on this page" />
                  </label>
                  <span role="columnheader">Question</span>
                  <span role="columnheader">Topic</span>
                  <span role="columnheader">Answer</span>
                  <span role="columnheader">Status</span>
                </div>
                {rows.map((q) => (
                  <div key={q.id} role="row" className={`adm-row${selected.has(q.id) ? ' is-selected' : ''}`}>
                    <label className="adm-check" onClick={(e) => e.stopPropagation()}>
                      <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} aria-label="Select question" />
                    </label>
                    <button type="button" className="adm-row__main" onClick={() => setEditing(q)}>
                      <span className="adm-row__q">{q.question || <em>Untitled question</em>}</span>
                      <span className="adm-row__meta">
                        {target === '' || !q.target ? 'Shared · ' : ''}
                        {q.answerSource === 'ai' ? 'AI-written · check the answer' : q.source}
                      </span>
                    </button>
                    <span className="adm-row__subject">{q.topic || '—'}</span>
                    <span className={`adm-answer${q.correctAnswer ? '' : ' is-missing'}`}>{q.correctAnswer || '—'}</span>
                    <StatusChip status={q.status} review={q.needsReview} />
                  </div>
                ))}
              </div>

              <div className="adm-px__pager">
                <span className="adm-muted">
                  Showing {n(from)}–{n(to)} of {n(data?.total ?? 0)}
                </span>
                <button type="button" className="adm-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={!data || data.page <= 1}>
                  <ChevronLeft size={16} aria-hidden /> Previous
                </button>
                <span className="adm-px__pageno">
                  Page {data?.page ?? 1} of {data?.pages ?? 1}
                </span>
                <button type="button" className="adm-btn" onClick={() => setPage((p) => p + 1)} disabled={!data || data.page >= data.pages}>
                  Next <ChevronRight size={16} aria-hidden />
                </button>
              </div>
            </>
          )}
        </section>
      </div>

      {selected.size > 0 && (
        <div className="adm-bulk" role="region" aria-label="Bulk actions">
          <strong>{selected.size} selected</strong>
          <button type="button" className="adm-btn adm-btn--primary" onClick={bulkPublish}>
            Publish
          </button>
          <button type="button" className="adm-btn" onClick={() => void bulkCheck()} disabled={checking} title="A second AI solves them without the answers">
            {checking ? <LoaderCircle size={16} className="adm-spin" aria-hidden /> : <CheckSquare size={16} aria-hidden />} {checking ? 'Checking…' : 'Double-check answers'}
          </button>
          <button type="button" className="adm-btn" onClick={() => void change(setPracticeStatus([...selected], 'draft'), 'Moved to drafts.')}>
            Move to drafts
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--danger-ghost"
            onClick={() => {
              if (!window.confirm(`Delete ${selected.size} practice question${selected.size === 1 ? '' : 's'}? This can’t be undone.`)) return;
              void change(deletePractice([...selected]), 'Deleted.');
            }}
          >
            <Trash2 size={16} aria-hidden /> Delete
          </button>
          <button type="button" className="adm-link" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {editing && (
        <QuestionEditor
          practice
          initial={editing === 'new' ? blank(subject, newTopic, target) : editing}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={(draft, publish) => {
            // Choosing the answer by hand means it has been checked.
            const q = {
              ...draft,
              examType: PRACTICE,
              target: editing === 'new' ? target : (editing.target ?? ''),
              year: null,
              ...(publish ? { answerSource: draft.answerSource === 'ai' ? ('manual' as const) : draft.answerSource } : {}),
            };
            setEditing(null);
            void change(
              editing === 'new' ? addPractice([q], `Added a ${q.subject} practice question on ${q.topic || 'no topic'}.`) : updatePractice(editing.id, q),
              publish ? 'Published: students can practise it now.' : 'Saved as a draft.',
            );
          }}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  const id = editing.id;
                  setEditing(null);
                  void change(deletePractice([id]), 'Deleted.');
                }
          }
        />
      )}
    </div>
  );
};
