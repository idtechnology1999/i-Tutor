import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CheckSquare, LoaderCircle, Mic, Plus, Search, Sparkles, Square, Trash2, X } from 'lucide-react';
import { CMS_SUBJECTS, PRACTICE, cms, useCms } from '../../lib/cms';
import type { CmsQuestion, CmsSubject, QuestionDraft } from '../../lib/cms';
import { jambTopics } from '../../data/jamb-syllabus';
import { writePracticeQuestions } from '../../lib/practice-writer';
import { publishProblems } from '../../lib/question-rules';
import { canSpeak, recogniserCtor, speakText } from '../../lib/speech';
import type { Recogniser } from '../../lib/speech';
import { QuestionEditor } from './QuestionEditor';
import type { AdminNav } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';

/* Practice questions: a bank separate from past papers, organised by subject
   and JAMB syllabus topic. At the top, the AI writer works on the whole
   subject: tick any topics (or all), and the ticked topics appear in the AI
   box; then tell it what to do — typed or spoken — e.g. "set 30 questions".
   What it writes arrives as drafts; the admin checks and publishes. */

const ALL = '__all';
const OTHER = '__other';
const EXAMPLES = ['Set 30 questions', 'Set 10 questions on each topic', 'Set 20 harder questions with calculations'];

const blank = (subject: CmsSubject, topic: string): QuestionDraft => ({
  subject,
  examType: PRACTICE,
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

/** "set 10 questions on each topic" → 10 per topic; "set 30 questions" → 30 in total (20 if no number). */
const countFrom = (instruction: string, topics: number) => {
  const n = Number(instruction.match(/\d+/)?.[0] ?? 20);
  const each = /\b(each|every|per)\b/i.test(instruction);
  return Math.max(1, Math.min(200, each ? n * Math.max(1, topics) : n));
};

/** What's left of the instruction once the count is taken out ("harder ones with calculations"), as extra guidance for the AI. */
const noteFrom = (instruction: string) =>
  instruction
    .replace(/\b(please\s+)?(set|write|generate|make|create|give( me)?)\b/gi, ' ')
    .replace(/\b\d+\b/g, ' ')
    .replace(/\b(in|on|for)\s+(this|the|these)\s+topics?(\s+selected)?\b/gi, ' ')
    .replace(/\b(on|for|in|from|across|based on)\s+(each|every|all|the|these|those|selected|this|the selected)(\s+(selected|chosen))?\s+topics?(\s+selected)?\b/gi, ' ')
    .replace(/\b(each|per|every)\s+topic\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .replace(/^[\s,.;:-]+|[\s,.;:-]+$/g, '')
    .replace(/^(more\s+|new\s+)?(practice\s+)?questions?$/i, '')
    .trim();

export const AdminPractice: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const { questions } = useCms();
  const [subject, setSubject] = useState<CmsSubject>('English');
  // Topics ticked for the AI, and the topic whose questions are listed.
  const [picked, setPicked] = useState<string[]>([]);
  const [viewing, setViewing] = useState<string>(ALL);
  const [search, setSearch] = useState('');
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

  const practice = useMemo(() => questions.filter((q) => q.examType === PRACTICE), [questions]);
  const inSubject = practice.filter((q) => q.subject === subject);
  const topics = jambTopics(subject);
  const listed = new Set(topics);
  const otherCount = inSubject.filter((q) => !listed.has(q.topic)).length;
  const allPicked = topics.length > 0 && picked.length === topics.length;

  const inView =
    viewing === ALL ? inSubject : viewing === OTHER ? inSubject.filter((q) => !listed.has(q.topic)) : inSubject.filter((q) => q.topic === viewing);
  const term = search.trim().toLowerCase();
  const list = term ? inView.filter((q) => `${q.question} ${q.topic}`.toLowerCase().includes(term)) : inView;
  const published = inView.filter((q) => q.status === 'published').length;
  const viewName = viewing === ALL ? `All ${subject} topics` : viewing === OTHER ? 'Other topics' : viewing;
  const newTopic = viewing === ALL || viewing === OTHER ? (picked.length === 1 ? picked[0] : '') : viewing;

  const pickSubject = (s: CmsSubject) => {
    setSubject(s);
    setPicked([]);
    setViewing(ALL);
    setSelected(new Set());
    setAiError('');
  };
  const togglePick = (t: string) => setPicked((prev) => (prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]));
  const toggleAllPicked = () => setPicked(allPicked ? [] : [...topics]);

  /* ------------------------------------------------------------ AI writer */

  const willWrite = countFrom(instruction, picked.length);

  const run = async (text = instruction) => {
    if (!picked.length) {
      setAiError('Tick at least one topic first (or Select all).');
      return;
    }
    const count = countFrom(text, picked.length);
    setBusy(true);
    setAiError('');
    setProgress(`0 of ${count} written…`);
    const result = await writePracticeQuestions({
      subject,
      topics: picked,
      count,
      note: noteFrom(text),
      existing: practice,
      onProgress: (done, of) => setProgress(`${done} of ${of} written…`),
    });
    setBusy(false);
    setProgress('');
    const where = allPicked ? `all ${subject} topics` : `${picked.length} topic${picked.length === 1 ? '' : 's'}`;
    const message = result.error
      ? `Stopped after ${result.written}: ${result.error} The ${result.written} written are saved as drafts.`
      : `Done — ${result.written} ${subject} questions on ${where} added as drafts. Check them, then publish.`;
    if (result.error) setAiError(message);
    else {
      nav.notify(message);
      setInstruction('');
    }
    if (spokeRef.current) speakText(message);
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
  const allSelected = list.length > 0 && list.every((q) => selected.has(q.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((q) => q.id)));

  // Questions with a missing answer or option can't go live. AI-written ones
  // can, once the admin confirms they've checked the answers.
  const bulkPublish = () => {
    const chosen = practice.filter((q) => selected.has(q.id));
    const complete = chosen.filter((q) => publishProblems(q).length === 0);
    const incomplete = chosen.length - complete.length;
    const aiWritten = complete.filter((q) => q.answerSource === 'ai').length;
    if (!complete.length) {
      nav.notify('None of these can be published yet — each needs a question, options and a correct answer.');
      return;
    }
    if (
      aiWritten &&
      !window.confirm(
        `${aiWritten} of these ${aiWritten === 1 ? 'has an answer' : 'have answers'} written by the AI. Publish only if you’ve checked them. Publish now?`,
      )
    )
      return;
    cms.setStatus(
      complete.map((q) => q.id),
      'published',
    );
    nav.notify(
      `Published ${complete.length} question${complete.length === 1 ? '' : 's'}${incomplete ? `. ${incomplete} skipped — open ${incomplete === 1 ? 'it' : 'them'} to add the missing answer or option` : ''}.`,
    );
    setSelected(new Set());
  };

  return (
    <div className="adm-page">
      <PageHead
        title="Practice questions"
        sub="Questions students practise by subject and syllabus topic — separate from past questions. Published questions appear when a student taps Practise."
      />

      <label className="adm-field adm-scope__pick adm-pr__subject">
        <span>Subject</span>
        <select className="adm-input" value={subject} onChange={(e) => pickSubject(e.target.value as CmsSubject)}>
          {CMS_SUBJECTS.map((s) => {
            const n = practice.filter((q) => q.subject === s);
            const live = n.filter((q) => q.status === 'published').length;
            return (
              <option key={s} value={s}>
                {s} — {live} live{n.length > live ? `, ${n.length - live} draft` : ''}
              </option>
            );
          })}
        </select>
      </label>

      {/* ------------------------------------------------------- AI writer */}
      <section className="adm-pr__ai" aria-labelledby="pr-ai-title">
        <div className="adm-pr__ai-head">
          <Sparkles size={18} aria-hidden />
          <strong id="pr-ai-title">AI question writer · {allPicked ? `All ${subject} topics` : subject}</strong>
        </div>

        <div className="adm-pr__picked" aria-live="polite">
          {picked.length === 0 ? (
            <span className="adm-muted">No topics selected — tick topics below, or Select all.</span>
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
            placeholder={listening ? 'Listening…' : 'Tell the AI what to do with these topics, e.g. “set 30 questions”'}
            aria-label="Instruction for the AI"
            disabled={busy}
          />
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy || !picked.length}>
            {busy ? <LoaderCircle size={18} className="adm-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
            {busy ? progress || 'Writing…' : `Write ${willWrite}`}
          </button>
        </form>

        <div className="adm-pr__examples">
          {EXAMPLES.map((ex) => (
            <button key={ex} type="button" onClick={() => setInstruction(ex)} disabled={busy}>
              {ex}
            </button>
          ))}
        </div>
        <p className="adm-muted">
          They arrive as drafts, spread across the ticked topics. Check the answers, then publish — students only see published questions.
        </p>
        {aiError && <p className="adm-users__error">{aiError}</p>}
      </section>

      <div className="adm-pr">
        {/* ------------------------------------------------------- Topics */}
        <nav className="adm-pr__topics" aria-label={`${subject} topics`}>
          <button type="button" className="adm-pr__all" onClick={toggleAllPicked} aria-pressed={allPicked}>
            {allPicked ? <CheckSquare size={16} aria-hidden /> : <Square size={16} aria-hidden />}
            {allPicked ? 'Clear all' : 'Select all topics'}
          </button>
          <button type="button" className={`adm-pr__view${viewing === ALL ? ' is-on' : ''}`} onClick={() => setViewing(ALL)}>
            <span>Show all questions</span>
            <small>{inSubject.length}</small>
          </button>
          {topics.map((t) => {
            const n = inSubject.filter((q) => q.topic === t);
            const live = n.filter((q) => q.status === 'published').length;
            const on = picked.includes(t);
            return (
              <div key={t} className={`adm-pr__topic${viewing === t ? ' is-on' : ''}`}>
                <input type="checkbox" checked={on} onChange={() => togglePick(t)} aria-label={`Select ${t} for the AI`} />
                <button type="button" onClick={() => setViewing(t)} className={n.length ? '' : 'is-empty'}>
                  <span>{t}</span>
                  <small title={`${live} published of ${n.length}`}>{n.length ? `${live}/${n.length}` : '0'}</small>
                </button>
              </div>
            );
          })}
          {otherCount > 0 && (
            <button type="button" className={`adm-pr__view${viewing === OTHER ? ' is-on' : ''}`} onClick={() => setViewing(OTHER)}>
              <span>Other topics</span>
              <small>{otherCount}</small>
            </button>
          )}
        </nav>

        {/* ---------------------------------------------------- Questions */}
        <section className="adm-pr__main">
          <div className="adm-scope__title">
            <h2>{viewName}</h2>
            <span className="adm-muted">
              {inView.length} question{inView.length === 1 ? '' : 's'} · {published} published
            </span>
            <button type="button" className="adm-link" onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> Type one in
            </button>
          </div>

          <label className="adm-input adm-input--icon adm-search">
            <Search size={18} aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${subject} practice questions`} aria-label="Search practice questions" />
          </label>

          {list.length === 0 ? (
            <div className="adm-empty">
              <h3>{search ? 'Nothing matches that search' : 'No practice questions here yet'}</h3>
              <p>{search ? 'Try a different word.' : 'Tick topics and tell the AI writer above what to set, or type a question in.'}</p>
            </div>
          ) : (
            <div className="adm-table" role="table" aria-label="Practice questions">
              <div className="adm-table__head" role="row">
                <label className="adm-check">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all questions" />
                </label>
                <span role="columnheader">Question</span>
                <span role="columnheader">Topic</span>
                <span role="columnheader">Answer</span>
                <span role="columnheader">Status</span>
              </div>
              {list.map((q) => (
                <div key={q.id} role="row" className={`adm-row${selected.has(q.id) ? ' is-selected' : ''}`}>
                  <label className="adm-check" onClick={(e) => e.stopPropagation()}>
                    <input type="checkbox" checked={selected.has(q.id)} onChange={() => toggle(q.id)} aria-label="Select question" />
                  </label>
                  <button type="button" className="adm-row__main" onClick={() => setEditing(q)}>
                    <span className="adm-row__q">{q.question || <em>Untitled question</em>}</span>
                    <span className="adm-row__meta">{q.answerSource === 'ai' ? 'AI-written · check the answer' : q.source}</span>
                  </button>
                  <span className="adm-row__subject">{q.topic || '—'}</span>
                  <span className={`adm-answer${q.correctAnswer ? '' : ' is-missing'}`}>{q.correctAnswer || '—'}</span>
                  <StatusChip status={q.status} review={q.needsReview} />
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected.size > 0 && (
        <div className="adm-bulk" role="region" aria-label="Bulk actions">
          <strong>{selected.size} selected</strong>
          <button type="button" className="adm-btn adm-btn--primary" onClick={bulkPublish}>
            Publish
          </button>
          <button
            type="button"
            className="adm-btn"
            onClick={() => {
              cms.setStatus([...selected], 'draft');
              setSelected(new Set());
            }}
          >
            Move to drafts
          </button>
          <button
            type="button"
            className="adm-btn adm-btn--danger-ghost"
            onClick={() => {
              if (!window.confirm(`Delete ${selected.size} practice question${selected.size === 1 ? '' : 's'}? This can’t be undone.`)) return;
              cms.deleteQuestions([...selected]);
              setSelected(new Set());
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
          initial={editing === 'new' ? blank(subject, newTopic) : editing}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={(draft, publish) => {
            // Choosing the answer by hand means it has been checked.
            const q = { ...draft, examType: PRACTICE, year: null, ...(publish ? { answerSource: draft.answerSource === 'ai' ? ('manual' as const) : draft.answerSource } : {}) };
            if (editing === 'new') cms.addQuestions([q], `Added a ${q.subject} practice question on ${q.topic || 'no topic'}.`);
            else cms.updateQuestion(editing.id, q);
            nav.notify(publish ? 'Published — students can practise it now.' : 'Saved as a draft.');
            setEditing(null);
          }}
          onDelete={
            editing === 'new'
              ? undefined
              : () => {
                  cms.deleteQuestions([editing.id]);
                  setEditing(null);
                }
          }
        />
      )}
    </div>
  );
};
