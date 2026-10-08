import React, { useEffect, useState } from 'react';
import { Plus, Search, Trash2, X } from 'lucide-react';
import { CMS_SUBJECTS, cms, useCms } from '../../lib/cms';
import type { CmsCourse } from '../../lib/cms';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const blank = (): CmsCourse => ({
  id: '',
  name: '',
  faculty: '',
  subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'],
  note: '',
});

const CourseEditor: React.FC<{
  initial: CmsCourse;
  isNew: boolean;
  taken: Set<string>;
  onClose: () => void;
  onSave: (c: CmsCourse) => void;
  onDelete?: () => void;
}> = ({ initial, isNew, taken, onClose, onSave, onDelete }) => {
  const [c, setC] = useState<CmsCourse>(initial);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const setSubject = (i: number, value: string) =>
    setC((prev) => ({ ...prev, subjects: prev.subjects.map((s, j) => (j === i ? value : s)) }));

  const save = () => {
    const name = c.name.trim();
    if (!name) return setError('Give the course a name.');
    const id = isNew ? slug(name) : c.id;
    if (isNew && taken.has(id)) return setError('A course with this name already exists.');
    if (new Set(c.subjects).size !== 4) return setError('Choose four different subjects.');
    onSave({ ...c, id, name, faculty: c.faculty.trim(), note: c.note.trim() });
  };

  return (
    <div className="adm-drawer" onClick={onClose}>
      <aside className="adm-drawer__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit course">
        <header className="adm-drawer__head">
          <h2>{isNew ? 'New course' : c.name}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="adm-drawer__body">
          <div className="adm-grid-2">
            <label className="adm-field">
              <span>Course name</span>
              <input className="adm-input" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} placeholder="e.g. Computer Engineering" />
            </label>
            <label className="adm-field">
              <span>Faculty</span>
              <input className="adm-input" value={c.faculty} onChange={(e) => setC({ ...c, faculty: e.target.value })} placeholder="e.g. Engineering" />
            </label>
          </div>

          <fieldset className="adm-field">
            <span>JAMB subjects (four)</span>
            <div className="adm-course-subjects">
              {c.subjects.map((s, i) => (
                <label key={i} className="adm-field">
                  <small className="adm-muted">{i === 0 ? 'Compulsory' : `Subject ${i + 1}`}</small>
                  <select className="adm-input" value={s} disabled={i === 0} onChange={(e) => setSubject(i, e.target.value)}>
                    {CMS_SUBJECTS.map((opt) => (
                      <option key={opt}>{opt}</option>
                    ))}
                  </select>
                </label>
              ))}
            </div>
          </fieldset>

          <label className="adm-field">
            <span>Note for students (optional)</span>
            <textarea
              className="adm-input adm-textarea"
              rows={3}
              value={c.note}
              onChange={(e) => setC({ ...c, note: e.target.value })}
              placeholder="e.g. Some schools accept Biology as the fourth subject."
            />
          </label>
          <p className="adm-muted">Check requirements against the current JAMB brochure before publishing changes.</p>
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="adm-drawer__foot">
          {!isNew && onDelete && (
            <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={onDelete}>
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          )}
          <span className="adm-spacer" />
          <button type="button" className="adm-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={save}>
            Save course
          </button>
        </footer>
      </aside>
    </div>
  );
};

export const AdminCourses: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const { courses, questions } = useCms();
  const [editing, setEditing] = useState<CmsCourse | 'new' | null>(null);
  const [search, setSearch] = useState('');

  const published = questions.filter((q) => q.status === 'published' && q.examType === 'UTME');
  const countFor = (subject: string) => published.filter((q) => q.subject === subject).length;
  const term = search.trim().toLowerCase();
  const list = courses.filter((c) => !term || `${c.name} ${c.faculty}`.toLowerCase().includes(term));

  return (
    <div className="adm-page">
      <PageHead
        title="Courses"
        sub="Students pick their course and get a JAMB practice exam from its four subjects. Numbers show how many published JAMB questions each subject has."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Plus size={18} aria-hidden /> Add course
          </button>
        }
      />

      <label className="adm-input adm-input--icon adm-search">
        <Search size={18} aria-hidden />
        <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search courses" aria-label="Search courses" />
      </label>

      <ul className="adm-courses">
        {list.map((c) => {
          const total = c.subjects.reduce((n, s) => n + countFor(s), 0);
          const missing = c.subjects.filter((s) => countFor(s) === 0);
          return (
            <li key={c.id}>
              <button type="button" onClick={() => setEditing(c)}>
                <span className="adm-courses__top">
                  <strong>{c.name}</strong>
                  <span className="adm-muted">{c.faculty}</span>
                </span>
                <span className="adm-courses__subjects">
                  {c.subjects.map((s) => {
                    const n = countFor(s);
                    return (
                      <span key={s} className={`adm-courses__subject${n ? '' : ' is-empty'}`}>
                        {s}
                        <b>{n}</b>
                      </span>
                    );
                  })}
                </span>
                <span className={`adm-courses__foot${missing.length ? ' is-warn' : ''}`}>
                  {missing.length
                    ? `Students can’t practise ${missing.join(', ')} yet — add questions.`
                    : `${total} questions ready for this course.`}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {editing && (
        <CourseEditor
          initial={editing === 'new' ? blank() : editing}
          isNew={editing === 'new'}
          taken={new Set(courses.map((c) => c.id))}
          onClose={() => setEditing(null)}
          onSave={(course) => {
            cms.saveCourse(course);
            nav.notify(`Saved ${course.name}.`);
            setEditing(null);
          }}
          onDelete={
            editing !== 'new'
              ? () => {
                  if (!window.confirm(`Delete ${editing.name}?`)) return;
                  cms.deleteCourse(editing.id);
                  nav.notify('Course deleted.');
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
