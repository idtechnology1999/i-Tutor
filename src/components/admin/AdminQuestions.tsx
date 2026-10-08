import React, { useState } from 'react';
import { Plus, ScanText, Search, Trash2 } from 'lucide-react';
import { CMS_SUBJECTS, cms, useCms } from '../../lib/cms';
import type { CmsQuestion, CmsSubject, QuestionDraft } from '../../lib/cms';
import type { AdminNav, BankScope, QuestionFilter } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';
import { QuestionEditor } from './QuestionEditor';
import { blankQuestion, publishProblems } from '../../lib/question-rules';

const FILTERS: Array<{ id: QuestionFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'review', label: 'Needs review' },
];

const THIS_YEAR = new Date().getFullYear();
// Papers from 2000 to last year, newest first.
const YEARS = Array.from({ length: THIS_YEAR - 2000 }, (_, i) => THIS_YEAR - 1 - i);

export const AdminQuestions: React.FC<{
  nav: AdminNav;
  filter: QuestionFilter;
  onFilter: (f: QuestionFilter) => void;
  scope: BankScope;
  onScope: (s: BankScope) => void;
}> = ({ nav, filter, onFilter, scope, onScope }) => {
  const { questions } = useCms();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<CmsQuestion | 'new' | null>(null);

  const subject = scope.subject;
  const year = scope.year;
  const inSubject = questions.filter((q) => subject === 'All' || q.subject === subject);
  const inScope = inSubject.filter((q) => year === null || q.year === year);

  const term = search.trim().toLowerCase();
  const list = inScope.filter((q) => {
    if (filter === 'published' && q.status !== 'published') return false;
    if (filter === 'draft' && q.status !== 'draft') return false;
    if (filter === 'review' && !(q.needsReview || q.status === 'draft')) return false;
    if (term && !`${q.question} ${q.topic} ${q.source} ${q.year ?? ''}`.toLowerCase().includes(term)) return false;
    return true;
  });

  const counts = {
    all: inScope.length,
    published: inScope.filter((q) => q.status === 'published').length,
    draft: inScope.filter((q) => q.status === 'draft').length,
    review: inScope.filter((q) => q.needsReview || q.status === 'draft').length,
  };

  const yearCount = (y: number) => inSubject.filter((q) => q.year === y).length;
  const undated = inSubject.filter((q) => q.year === null).length;
  const label = `${subject === 'All' ? 'All subjects' : subject}${year ? ` ${year}` : ''}`;
  const addLabel = subject === 'All' ? 'Add past questions' : `Add past questions to ${subject}${year ? ` ${year}` : ''}`;

  const openImport = () =>
    nav.go('import', {
      preset: subject === 'All' ? null : { subject: subject as CmsSubject, year },
    });

  const setScope = (patch: Partial<BankScope>) => {
    setSelected(new Set());
    onScope({ ...scope, ...patch });
  };

  const allSelected = list.length > 0 && list.every((q) => selected.has(q.id));
  const toggle = (id: number) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(allSelected ? new Set() : new Set(list.map((q) => q.id)));

  const bulkPublish = () => {
    const chosen = questions.filter((q) => selected.has(q.id));
    const ready = chosen.filter((q) => publishProblems(q).length === 0);
    if (ready.length) cms.setStatus(ready.map((q) => q.id), 'published');
    const skipped = chosen.length - ready.length;
    nav.notify(
      skipped
        ? `Published ${ready.length}. ${skipped} need an answer or options first.`
        : `Published ${ready.length} question${ready.length === 1 ? '' : 's'}.`,
    );
    setSelected(new Set());
  };

  const bulkDraft = () => {
    cms.setStatus([...selected], 'draft');
    nav.notify(`Moved ${selected.size} to drafts.`);
    setSelected(new Set());
  };

  const bulkDelete = () => {
    if (!window.confirm(`Delete ${selected.size} question${selected.size === 1 ? '' : 's'}? This can’t be undone.`)) return;
    cms.deleteQuestions([...selected]);
    nav.notify(`Deleted ${selected.size}.`);
    setSelected(new Set());
  };

  const saveEdit = (draft: QuestionDraft, publish: boolean) => {
    if (editing === 'new') {
      cms.addQuestions([draft], `Added a ${draft.subject} question by hand.`);
    } else if (editing) {
      cms.updateQuestion(editing.id, draft);
    }
    nav.notify(publish ? 'Question published.' : 'Draft saved.');
    setEditing(null);
  };

  return (
    <div className="adm-page">
      <PageHead title="Past questions" sub="Choose a subject and year, then add that year’s paper — the AI arranges it for you." />

      <section className="adm-card adm-scope">
        <div className="adm-field">
          <span>Subject</span>
          <div className="adm-pills" role="radiogroup" aria-label="Subject">
            {['All', ...CMS_SUBJECTS].map((s) => {
              const n = s === 'All' ? questions.length : questions.filter((q) => q.subject === s).length;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={subject === s}
                  className={subject === s ? 'is-on' : ''}
                  onClick={() => setScope({ subject: s, year: null })}
                >
                  {s === 'All' ? 'All subjects' : s}
                  <small>{n}</small>
                </button>
              );
            })}
          </div>
        </div>

        <div className="adm-scope__row">
          <label className="adm-field adm-scope__year">
            <span>Year</span>
            <select
              className="adm-input"
              value={year ?? ''}
              onChange={(e) => setScope({ year: e.target.value ? Number(e.target.value) : null })}
            >
              <option value="">All years ({inSubject.length})</option>
              {YEARS.map((y) => {
                const n = yearCount(y);
                return (
                  <option key={y} value={y}>
                    {y}
                    {n ? ` — ${n} question${n === 1 ? '' : 's'}` : ' — none yet'}
                  </option>
                );
              })}
            </select>
          </label>

          <button type="button" className="adm-btn adm-btn--primary adm-btn--lg adm-scope__add" onClick={openImport}>
            <ScanText size={20} aria-hidden /> {addLabel}
          </button>
        </div>
        {undated > 0 && year === null && (
          <p className="adm-muted">{undated} question{undated === 1 ? ' has' : 's have'} no year yet — open one to add it.</p>
        )}
      </section>

      <div className="adm-scope__title">
        <h2>{label}</h2>
        <span className="adm-muted">
          {counts.all} question{counts.all === 1 ? '' : 's'} · {counts.published} published
        </span>
        <button type="button" className="adm-link" onClick={() => setEditing('new')}>
          <Plus size={16} aria-hidden /> Type one in
        </button>
      </div>

      <div className="adm-toolbar">
        <label className="adm-input adm-input--icon adm-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={`Search ${label} questions`}
            aria-label="Search questions"
          />
        </label>
      </div>

      <div className="adm-tabs" role="tablist" aria-label="Status">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={filter === f.id}
            className={filter === f.id ? 'is-on' : ''}
            onClick={() => onFilter(f.id)}
          >
            {f.label}
            <small>{counts[f.id]}</small>
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="adm-empty">
          <h3>{search ? 'Nothing matches that search' : `No ${label} questions yet`}</h3>
          <p>
            {search
              ? 'Try a different word.'
              : 'Paste the whole paper for this year (or just the questions you want) and the AI will arrange them for you to check and publish.'}
          </p>
          {!search && (
            <button type="button" className="adm-btn adm-btn--primary" onClick={openImport}>
              <ScanText size={18} aria-hidden /> {addLabel}
            </button>
          )}
        </div>
      ) : (
        <div className="adm-table" role="table" aria-label="Questions">
          <div className="adm-table__head" role="row">
            <label className="adm-check">
              <input type="checkbox" checked={allSelected} onChange={toggleAll} aria-label="Select all" />
            </label>
            <span role="columnheader">Question</span>
            <span role="columnheader">Subject</span>
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
                <span className="adm-row__meta">
                  {q.examType}
                  {q.year ? ` ${q.year}` : ''}
                  {q.topic ? ` · ${q.topic}` : ''}
                  {q.answerSource === 'ai' ? ' · AI-suggested answer' : ''}
                </span>
              </button>
              <span className="adm-row__subject">{q.subject}</span>
              <span className={`adm-answer${q.correctAnswer ? '' : ' is-missing'}`}>{q.correctAnswer || '—'}</span>
              <StatusChip status={q.status} review={q.needsReview} />
            </div>
          ))}
        </div>
      )}

      {selected.size > 0 && (
        <div className="adm-bulk" role="region" aria-label="Bulk actions">
          <strong>{selected.size} selected</strong>
          <button type="button" className="adm-btn adm-btn--primary" onClick={bulkPublish}>
            Publish
          </button>
          <button type="button" className="adm-btn" onClick={bulkDraft}>
            Move to drafts
          </button>
          <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={bulkDelete}>
            <Trash2 size={16} aria-hidden /> Delete
          </button>
          <button type="button" className="adm-link" onClick={() => setSelected(new Set())}>
            Clear
          </button>
        </div>
      )}

      {editing && (
        <QuestionEditor
          initial={
            editing === 'new'
              ? { ...blankQuestion(), ...(subject !== 'All' ? { subject: subject as CmsSubject } : {}), ...(year ? { year } : {}) }
              : editing
          }
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={saveEdit}
          onDelete={
            editing !== 'new'
              ? () => {
                  if (!window.confirm('Delete this question?')) return;
                  cms.deleteQuestions([editing.id]);
                  nav.notify('Question deleted.');
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
