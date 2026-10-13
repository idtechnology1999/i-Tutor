import React, { useMemo, useState } from 'react';
import { LoaderCircle, Plus, Search, Sparkles, Trash2 } from 'lucide-react';
import { CMS_SUBJECTS, PRACTICE, cms, useCms } from '../../lib/cms';
import type { CmsQuestion, CmsSubject, QuestionDraft } from '../../lib/cms';
import { jambTopics } from '../../data/jamb-syllabus';
import { writePracticeQuestions } from '../../lib/practice-writer';
import { publishProblems } from '../../lib/question-rules';
import { QuestionEditor } from './QuestionEditor';
import type { AdminNav } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';

/* Practice questions: a bank separate from past papers. Admins set questions
   per subject and JAMB syllabus topic (typed in, or written by the AI and
   checked), and students practise them from their dashboard. */

const ALL = '__all';
const OTHER = '__other';
const COUNTS = [10, 20, 50, 100];

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

export const AdminPractice: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const { questions } = useCms();
  const [subject, setSubject] = useState<CmsSubject>('English');
  const [topic, setTopic] = useState<string>(ALL);
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<CmsQuestion | 'new' | null>(null);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [aiCount, setAiCount] = useState(10);
  const [aiNote, setAiNote] = useState('');
  const [aiBusy, setAiBusy] = useState(false);
  const [aiError, setAiError] = useState('');
  const [aiProgress, setAiProgress] = useState('');

  const practice = useMemo(() => questions.filter((q) => q.examType === PRACTICE), [questions]);
  const inSubject = practice.filter((q) => q.subject === subject);
  const topics = jambTopics(subject);
  const listed = new Set(topics);
  const otherCount = inSubject.filter((q) => !listed.has(q.topic)).length;

  const inTopic =
    topic === ALL ? inSubject : topic === OTHER ? inSubject.filter((q) => !listed.has(q.topic)) : inSubject.filter((q) => q.topic === topic);
  const term = search.trim().toLowerCase();
  const list = term ? inTopic.filter((q) => `${q.question} ${q.topic}`.toLowerCase().includes(term)) : inTopic;
  const published = inTopic.filter((q) => q.status === 'published').length;
  const topicName = topic === ALL ? `All ${subject} topics` : topic === OTHER ? 'Other topics' : topic;
  const realTopic = topic === ALL || topic === OTHER ? '' : topic;

  const pickSubject = (s: CmsSubject) => {
    setSubject(s);
    setTopic(ALL);
    setSelected(new Set());
  };
  const pickTopic = (t: string) => {
    setTopic(t);
    setSelected(new Set());
    setAiError('');
  };

  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const allSelected = list.length > 0 && list.every((q) => selected.has(q.id));
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((q) => q.id)));

  const bulkPublish = () => {
    const chosen = practice.filter((q) => selected.has(q.id));
    const ready = chosen.filter((q) => publishProblems(q).length === 0 && q.answerSource !== 'ai');
    if (ready.length) cms.setStatus(ready.map((q) => q.id), 'published');
    const held = chosen.length - ready.length;
    nav.notify(
      held
        ? `Published ${ready.length}. ${held} need${held === 1 ? 's' : ''} a check first (open it and confirm the answer).`
        : `Published ${ready.length} question${ready.length === 1 ? '' : 's'}.`,
    );
    setSelected(new Set());
  };

  // The AI writes JAMB-standard questions on the chosen topic; they arrive as
  // drafts so an admin checks every answer before students see them.
  const writeWithAI = async () => {
    if (!realTopic) return;
    setAiBusy(true);
    setAiError('');
    const result = await writePracticeQuestions({
      subject,
      topics: [realTopic],
      count: aiCount,
      note: aiNote,
      existing: practice,
      onProgress: (done, of) => setAiProgress(`${done} of ${of} written…`),
    });
    setAiBusy(false);
    setAiProgress('');
    if (result.error) setAiError(`Stopped after ${result.written}: ${result.error}`);
    else {
      nav.notify(`${result.written} questions added as drafts. Open each one, check the answer, then publish.`);
      setAiNote('');
    }
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

      <div className="adm-pr">
        <nav className="adm-pr__topics" aria-label={`${subject} topics`}>
          <button type="button" className={topic === ALL ? 'is-on' : ''} onClick={() => pickTopic(ALL)}>
            <span>All topics</span>
            <small>{inSubject.length}</small>
          </button>
          {topics.map((t) => {
            const n = inSubject.filter((q) => q.topic === t);
            const live = n.filter((q) => q.status === 'published').length;
            return (
              <button key={t} type="button" className={`${topic === t ? 'is-on' : ''}${n.length ? '' : ' is-empty'}`} onClick={() => pickTopic(t)}>
                <span>{t}</span>
                <small title={`${live} published of ${n.length}`}>{n.length ? `${live}/${n.length}` : '0'}</small>
              </button>
            );
          })}
          {otherCount > 0 && (
            <button type="button" className={topic === OTHER ? 'is-on' : ''} onClick={() => pickTopic(OTHER)}>
              <span>Other topics</span>
              <small>{otherCount}</small>
            </button>
          )}
        </nav>

        <section className="adm-pr__main">
          <div className="adm-scope__title">
            <h2>{topicName}</h2>
            <span className="adm-muted">
              {inTopic.length} question{inTopic.length === 1 ? '' : 's'} · {published} published
            </span>
            <button type="button" className="adm-link" onClick={() => setEditing('new')}>
              <Plus size={16} aria-hidden /> Type one in
            </button>
          </div>

          {realTopic ? (
            <div className="adm-pr__ai">
              <div className="adm-pr__ai-head">
                <Sparkles size={18} aria-hidden />
                <strong>Write questions on this topic with AI</strong>
              </div>
              <div className="adm-pr__ai-row">
                <div className="adm-tabs" role="radiogroup" aria-label="How many">
                  {COUNTS.map((n) => (
                    <button key={n} type="button" role="radio" aria-checked={aiCount === n} className={aiCount === n ? 'is-on' : ''} onClick={() => setAiCount(n)}>
                      {n}
                    </button>
                  ))}
                </div>
                <input
                  className="adm-input"
                  value={aiNote}
                  onChange={(e) => setAiNote(e.target.value)}
                  placeholder="Anything to focus on? (optional)"
                  aria-label="Focus for the AI"
                />
                <button type="button" className="adm-btn adm-btn--primary" onClick={() => void writeWithAI()} disabled={aiBusy}>
                  {aiBusy ? <LoaderCircle size={18} className="adm-spin" aria-hidden /> : <Sparkles size={18} aria-hidden />}
                  {aiBusy ? aiProgress || 'Writing…' : `Write ${aiCount}`}
                </button>
              </div>
              <p className="adm-muted">They arrive as drafts. Check each answer, then publish — students only see published questions.</p>
              {aiError && <p className="adm-users__error">{aiError}</p>}
            </div>
          ) : (
            <p className="adm-muted">Pick a topic on the left to write questions for it with AI.</p>
          )}

          <label className="adm-input adm-input--icon adm-search">
            <Search size={18} aria-hidden />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder={`Search ${subject} practice questions`} aria-label="Search practice questions" />
          </label>

          {list.length === 0 ? (
            <div className="adm-empty">
              <h3>{search ? 'Nothing matches that search' : 'No practice questions here yet'}</h3>
              <p>{search ? 'Try a different word.' : 'Type a question in, or let the AI write a set for you to check.'}</p>
            </div>
          ) : (
            <div className="adm-table" role="table" aria-label="Practice questions">
              <div className="adm-table__head" role="row">
                <label className="adm-check">
                  <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
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
          initial={editing === 'new' ? blank(subject, realTopic) : editing}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={(draft, publish) => {
            const q = { ...draft, examType: PRACTICE, year: null };
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
