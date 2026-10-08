import React, { useEffect, useState } from 'react';
import { CircleAlert, Plus, Trash2, X } from 'lucide-react';
import { CMS_SUBJECTS, EXAM_LABEL, EXAM_TYPES, SCHOOLS, needsSchool } from '../../lib/cms';
import type { CmsQuestion, QuestionDraft } from '../../lib/cms';
import { publishProblems } from '../../lib/question-rules';

interface Props {
  initial: CmsQuestion | QuestionDraft;
  isNew: boolean;
  onClose: () => void;
  onSave: (q: QuestionDraft, publish: boolean) => void;
  onDelete?: () => void;
}

export const QuestionEditor: React.FC<Props> = ({ initial, isNew, onClose, onSave, onDelete }) => {
  const [q, setQ] = useState<QuestionDraft>(() => {
    const { ...draft } = initial as CmsQuestion;
    return draft;
  });
  const [tried, setTried] = useState(false);
  const problems = publishProblems(q);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = <K extends keyof QuestionDraft>(key: K, value: QuestionDraft[K]) => setQ((prev) => ({ ...prev, [key]: value }));

  const setOption = (i: number, text: string) =>
    setQ((prev) => ({ ...prev, options: prev.options.map((o, j) => (j === i ? { ...o, text } : o)) }));

  const addOption = () =>
    setQ((prev) =>
      prev.options.length >= 5 ? prev : { ...prev, options: [...prev.options, { label: 'ABCDE'[prev.options.length], text: '' }] },
    );

  const removeOption = (i: number) =>
    setQ((prev) => {
      const options = prev.options.filter((_, j) => j !== i).map((o, j) => ({ ...o, label: 'ABCDE'[j] }));
      const removed = prev.options[i].label;
      const correct =
        prev.correctAnswer === removed ? '' : prev.correctAnswer > removed ? 'ABCDE'['ABCDE'.indexOf(prev.correctAnswer) - 1] : prev.correctAnswer;
      return { ...prev, options, correctAnswer: correct };
    });

  const pickAnswer = (label: string) =>
    setQ((prev) => ({ ...prev, correctAnswer: label, answerSource: prev.answerSource === 'ai' ? 'manual' : prev.answerSource }));

  const save = (publish: boolean) => {
    setTried(true);
    if (publish && problems.length) return;
    onSave({ ...q, status: publish ? 'published' : 'draft', needsReview: publish ? false : q.needsReview }, publish);
  };

  return (
    <div className="adm-drawer" onClick={onClose}>
      <aside className="adm-drawer__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit question">
        <header className="adm-drawer__head">
          <h2>{isNew ? 'New question' : 'Edit question'}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="adm-drawer__body">
          {q.answerSource === 'ai' && q.correctAnswer && (
            <div className="adm-note is-warn">
              <CircleAlert size={18} aria-hidden />
              <div>
                <strong>AI-suggested answer ({q.correctAnswer}).</strong> Check it, then tap the right option to confirm.
              </div>
            </div>
          )}
          {q.reviewNote && <div className="adm-note">{q.reviewNote}</div>}

          <div className="adm-grid-3">
            <label className="adm-field">
              <span>Subject</span>
              <select className="adm-input" value={q.subject} onChange={(e) => set('subject', e.target.value as QuestionDraft['subject'])}>
                {CMS_SUBJECTS.map((s) => (
                  <option key={s}>{s}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>Exam</span>
              <select className="adm-input" value={q.examType} onChange={(e) => set('examType', e.target.value as QuestionDraft['examType'])}>
                {EXAM_TYPES.map((s) => (
                  <option key={s} value={s}>
                    {EXAM_LABEL[s]}
                  </option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>Year</span>
              <input
                className="adm-input"
                inputMode="numeric"
                value={q.year ?? ''}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                  set('year', v ? Number(v) : null);
                }}
                placeholder="2024"
              />
            </label>
          </div>

          {needsSchool(q.examType) && (
            <label className="adm-field">
              <span>School</span>
              <select className="adm-input" value={q.school ?? ''} onChange={(e) => set('school', e.target.value)}>
                <option value="">Choose the school</option>
                {SCHOOLS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.id})
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="adm-field">
            <span>Topic</span>
            <input className="adm-input" value={q.topic} onChange={(e) => set('topic', e.target.value)} placeholder="e.g. Kinematics" />
          </label>

          <label className="adm-field">
            <span>Question</span>
            <textarea className="adm-input adm-textarea" rows={4} value={q.question} onChange={(e) => set('question', e.target.value)} />
          </label>

          <fieldset className="adm-field">
            <span>Options · tap the circle for the right answer</span>
            <div className="adm-options">
              {q.options.map((o, i) => (
                <div key={o.label} className={`adm-option${q.correctAnswer === o.label ? ' is-correct' : ''}`}>
                  <button
                    type="button"
                    className="adm-option__key"
                    onClick={() => pickAnswer(o.label)}
                    aria-label={`Mark ${o.label} as correct`}
                    aria-pressed={q.correctAnswer === o.label}
                  >
                    {o.label}
                  </button>
                  <input className="adm-option__input" value={o.text} onChange={(e) => setOption(i, e.target.value)} placeholder={`Option ${o.label}`} />
                  {q.options.length > 2 && (
                    <button type="button" className="adm-icon-btn" onClick={() => removeOption(i)} aria-label={`Remove option ${o.label}`}>
                      <X size={16} aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {q.options.length < 5 && (
              <button type="button" className="adm-link" onClick={addOption}>
                <Plus size={16} aria-hidden /> Add option
              </button>
            )}
          </fieldset>

          <label className="adm-field">
            <span>Explanation (shown after the student answers)</span>
            <textarea className="adm-input adm-textarea" rows={4} value={q.explanation} onChange={(e) => set('explanation', e.target.value)} />
          </label>

          <label className="adm-field">
            <span>Source</span>
            <input className="adm-input" value={q.source} onChange={(e) => set('source', e.target.value)} placeholder="e.g. JAMB 2019 Physics paper" />
          </label>

          {tried && problems.length > 0 && (
            <div className="adm-note is-error">
              <strong>Before publishing:</strong> {problems.join(' ')}
            </div>
          )}
        </div>

        <footer className="adm-drawer__foot">
          {!isNew && onDelete && (
            <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={onDelete}>
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          )}
          <span className="adm-spacer" />
          <button type="button" className="adm-btn" onClick={() => save(false)}>
            Save draft
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => save(true)}>
            Publish
          </button>
        </footer>
      </aside>
    </div>
  );
};
