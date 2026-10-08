import React, { useMemo, useState } from 'react';
import { Plus, ScanText, Search, Trash2 } from 'lucide-react';
import { CMS_SUBJECTS, cms, useCms } from '../../lib/cms';
import type { CmsQuestion, QuestionDraft } from '../../lib/cms';
import type { AdminNav, QuestionFilter } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';
import { QuestionEditor } from './QuestionEditor';
import { blankQuestion, publishProblems } from '../../lib/question-rules';

const FILTERS: Array<{ id: QuestionFilter; label: string }> = [
  { id: 'all', label: 'All' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'review', label: 'Needs review' },
];

export const AdminQuestions: React.FC<{
  nav: AdminNav;
  filter: QuestionFilter;
  onFilter: (f: QuestionFilter) => void;
}> = ({ nav, filter, onFilter }) => {
  const { questions } = useCms();
  const [subject, setSubject] = useState<string>('All');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [editing, setEditing] = useState<CmsQuestion | 'new' | null>(null);

  const list = useMemo(() => {
    const term = search.trim().toLowerCase();
    return questions.filter((q) => {
      if (subject !== 'All' && q.subject !== subject) return false;
      if (filter === 'published' && q.status !== 'published') return false;
      if (filter === 'draft' && q.status !== 'draft') return false;
      if (filter === 'review' && !(q.needsReview || q.status === 'draft')) return false;
      if (term && !`${q.question} ${q.topic} ${q.source} ${q.year ?? ''}`.toLowerCase().includes(term)) return false;
      return true;
    });
  }, [questions, subject, filter, search]);

  const counts = {
    all: questions.length,
    published: questions.filter((q) => q.status === 'published').length,
    draft: questions.filter((q) => q.status === 'draft').length,
    review: questions.filter((q) => q.needsReview || q.status === 'draft').length,
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
      <PageHead
        title="Past questions"
        sub={`${counts.published} published · ${counts.review} waiting for review`}
        actions={
          <>
            <button type="button" className="adm-btn" onClick={() => setEditing('new')}>
              <Plus size={18} aria-hidden /> Add one
            </button>
            <button type="button" className="adm-btn adm-btn--primary" onClick={() => nav.go('import')}>
              <ScanText size={18} aria-hidden /> Import a paper
            </button>
          </>
        }
      />

      <div className="adm-toolbar">
        <label className="adm-input adm-input--icon adm-search">
          <Search size={18} aria-hidden />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search questions, topics, sources"
            aria-label="Search questions"
          />
        </label>
        <select className="adm-input adm-select" value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject">
          <option>All</option>
          {CMS_SUBJECTS.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
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
          <h3>No questions here</h3>
          <p>{search ? 'Try a different search.' : 'Import a paper and the AI will organise it into questions for you.'}</p>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => nav.go('import')}>
            <ScanText size={18} aria-hidden /> Import a paper
          </button>
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
          initial={editing === 'new' ? blankQuestion() : editing}
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
