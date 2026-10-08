import React, { useEffect, useState } from 'react';
import { Layers, Pencil, Plus, Search, Trash2, X } from 'lucide-react';
import { CMS_SUBJECTS, EXAM_FULL_NAME, EXAM_LABEL, cms, useCms } from '../../lib/cms';
import type { CmsCourse, FacultySet } from '../../lib/cms';
import { COURSE_EXAMS, FACULTIES } from '../../data/courses';
import type { CourseExam } from '../../data/courses';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

const blank = (exam: CourseExam): CmsCourse =>
  exam === 'UTME'
    ? { id: '', name: '', faculty: 'Engineering', subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'], note: '', exam }
    : { id: '', name: '', faculty: '', subjects: ['English', 'Mathematics'], note: '', exam };

const facultyOrder = (f: string) => {
  const i = (FACULTIES as readonly string[]).indexOf(f);
  return i < 0 ? 99 : i;
};

/* ------------------------------------------------------------------ Editor */

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
  const isUtme = c.exam === 'UTME';
  const kind = isUtme ? 'course' : 'class';

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
  const addSubject = () =>
    setC((prev) => ({
      ...prev,
      subjects: [...prev.subjects, CMS_SUBJECTS.find((s) => !prev.subjects.includes(s)) ?? CMS_SUBJECTS[0]],
    }));
  const removeSubject = (i: number) => setC((prev) => ({ ...prev, subjects: prev.subjects.filter((_, j) => j !== i) }));

  const save = () => {
    const name = c.name.trim();
    if (!name) return setError(`Give the ${kind} a name.`);
    if (isUtme && !c.faculty) return setError('Choose the faculty this course belongs to.');
    const id = isNew ? `${isUtme ? '' : `${c.exam.toLowerCase()}-`}${slug(name)}` : c.id;
    if (isNew && taken.has(id)) return setError(`A ${kind} with this name already exists for ${EXAM_LABEL[c.exam]}.`);
    if (new Set(c.subjects).size !== c.subjects.length) return setError('Each subject can only be listed once.');
    if (isUtme && c.subjects.length !== 4) return setError('JAMB courses need exactly four subjects.');
    if (!isUtme && c.subjects.length < 3) return setError('Add at least three subjects.');
    onSave({ ...c, id, name, note: c.note.trim() });
  };

  return (
    <div className="adm-drawer" onClick={onClose}>
      <aside className="adm-drawer__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label={`Edit ${kind}`}>
        <header className="adm-drawer__head">
          <h2>{isNew ? `New ${EXAM_LABEL[c.exam]} ${kind}` : `${EXAM_LABEL[c.exam]} · ${c.name}`}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="adm-drawer__body">
          <div className={isUtme ? 'adm-grid-2' : ''}>
            <label className="adm-field">
              <span>{isUtme ? 'Course name' : 'Class name'}</span>
              <input
                className="adm-input"
                value={c.name}
                onChange={(e) => setC({ ...c, name: e.target.value })}
                placeholder={isUtme ? 'e.g. Computer Engineering' : 'e.g. Science'}
              />
            </label>
            {isUtme && (
              <label className="adm-field">
                <span>Faculty</span>
                <select className="adm-input" value={c.faculty} onChange={(e) => setC({ ...c, faculty: e.target.value })}>
                  <option value="">Choose a faculty</option>
                  {[...new Set([...FACULTIES, ...(c.faculty ? [c.faculty] : [])])].map((f) => (
                    <option key={f}>{f}</option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <fieldset className="adm-field">
            <span>{isUtme ? 'JAMB subjects (four)' : `${EXAM_LABEL[c.exam]} subjects`}</span>
            <div className="adm-course-subjects">
              {c.subjects.map((s, i) => (
                <div key={i} className="adm-course-subject">
                  <label className="adm-field">
                    <small className="adm-muted">{i === 0 ? 'Compulsory' : `Subject ${i + 1}`}</small>
                    <select className="adm-input" value={s} disabled={i === 0} onChange={(e) => setSubject(i, e.target.value)}>
                      {CMS_SUBJECTS.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>
                  {!isUtme && i > 1 && (
                    <button type="button" className="adm-icon-btn" onClick={() => removeSubject(i)} aria-label={`Remove ${s}`}>
                      <X size={16} aria-hidden />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {!isUtme && c.subjects.length < 10 && (
              <button type="button" className="adm-link" onClick={addSubject}>
                <Plus size={16} aria-hidden /> Add subject
              </button>
            )}
          </fieldset>

          <label className="adm-field">
            <span>Note for students (optional)</span>
            <textarea
              className="adm-input adm-textarea"
              rows={3}
              value={c.note}
              onChange={(e) => setC({ ...c, note: e.target.value })}
              placeholder={isUtme ? 'e.g. Some schools accept Biology as the fourth subject.' : 'e.g. IRS can replace CRS.'}
            />
          </label>
          <p className="adm-muted">
            {isUtme
              ? 'Check requirements against the current JAMB brochure before saving.'
              : 'Subjects vary by school; list the ones most students in this class sit.'}
          </p>
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
            Save {kind}
          </button>
        </footer>
      </aside>
    </div>
  );
};

/* ----------------------------------------------------- Faculty practice set */

const FacultySetEditor: React.FC<{
  initial: FacultySet;
  onClose: () => void;
  onSave: (f: FacultySet) => void;
}> = ({ initial, onClose, onSave }) => {
  const [f, setF] = useState<FacultySet>(initial);
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
    setF((prev) => ({ ...prev, subjects: prev.subjects.map((s, j) => (j === i ? value : s)) }));

  const save = () => {
    if (new Set(f.subjects).size !== f.subjects.length) return setError('Each subject can only be listed once.');
    onSave({ ...f, note: f.note.trim() });
  };

  return (
    <div className="adm-drawer" onClick={onClose}>
      <aside className="adm-drawer__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Faculty practice">
        <header className="adm-drawer__head">
          <h2>{f.faculty} · faculty practice</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="adm-drawer__body">
          <p className="adm-muted">
            Most {f.faculty} courses share these four JAMB subjects. Every {f.faculty} student sees this combination
            and can take it as one practice exam.
          </p>
          <fieldset className="adm-field">
            <span>JAMB subjects (four)</span>
            <div className="adm-course-subjects">
              {f.subjects.map((s, i) => (
                <div key={i} className="adm-course-subject">
                  <label className="adm-field">
                    <small className="adm-muted">{i === 0 ? 'Compulsory' : `Subject ${i + 1}`}</small>
                    <select className="adm-input" value={s} disabled={i === 0} onChange={(e) => setSubject(i, e.target.value)}>
                      {CMS_SUBJECTS.map((opt) => (
                        <option key={opt}>{opt}</option>
                      ))}
                    </select>
                  </label>
                </div>
              ))}
            </div>
          </fieldset>
          <label className="adm-field">
            <span>Note for students (optional)</span>
            <textarea
              className="adm-input adm-textarea"
              rows={3}
              value={f.note}
              onChange={(e) => setF({ ...f, note: e.target.value })}
              placeholder="e.g. Some schools accept Geography in place of Chemistry."
            />
          </label>
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="adm-drawer__foot">
          <span className="adm-spacer" />
          <button type="button" className="adm-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={save}>
            Save faculty practice
          </button>
        </footer>
      </aside>
    </div>
  );
};

/* -------------------------------------------------------------------- Page */

export const AdminCourses: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const { courses, questions, facultySets } = useCms();
  const [editingSet, setEditingSet] = useState<FacultySet | null>(null);
  const [exam, setExam] = useState<CourseExam>('UTME');
  const [editing, setEditing] = useState<CmsCourse | 'new' | null>(null);
  const [search, setSearch] = useState('');
  const isUtme = exam === 'UTME';
  const kind = isUtme ? 'course' : 'class';

  const published = questions.filter((q) => q.status === 'published' && q.examType === exam);
  const countFor = (subject: string) => published.filter((q) => q.subject === subject).length;
  const term = search.trim().toLowerCase();
  const inExam = courses.filter((c) => (c.exam ?? 'UTME') === exam);
  const list = inExam.filter((c) => !term || `${c.name} ${c.faculty}`.toLowerCase().includes(term));
  const groups = isUtme
    ? [...new Set(inExam.map((c) => c.faculty || 'Other'))].sort((a, b) => facultyOrder(a) - facultyOrder(b) || a.localeCompare(b))
    : [''];

  const facultyCard = (g: string) => {
    const set = facultySets.find((f) => f.faculty === g) ?? {
      faculty: g,
      subjects: ['English', 'Mathematics', 'Physics', 'Chemistry'],
      note: '',
    };
    const total = set.subjects.reduce((n, s) => n + countFor(s), 0);
    return (
      <button type="button" className="adm-facset" onClick={() => setEditingSet(set)}>
        <span className="adm-facset__icon">
          <Layers size={18} aria-hidden />
        </span>
        <span className="adm-facset__text">
          <strong>Faculty practice · {g}</strong>
          <span className="adm-courses__subjects">
            {set.subjects.map((s) => {
              const n = countFor(s);
              return (
                <span key={s} className={`adm-courses__subject${n ? '' : ' is-empty'}`}>
                  {s}
                  <b>{n}</b>
                </span>
              );
            })}
          </span>
          <small className="adm-muted">
            Shown to every {g} student · {total} questions ready
          </small>
        </span>
        <span className="adm-facset__edit">
          <Pencil size={16} aria-hidden /> Edit
        </span>
      </button>
    );
  };

  const card = (c: CmsCourse) => {
    const total = c.subjects.reduce((n, s) => n + countFor(s), 0);
    const missing = c.subjects.filter((s) => countFor(s) === 0);
    return (
      <li key={c.id}>
        <button type="button" onClick={() => setEditing(c)}>
          <span className="adm-courses__top">
            <strong>{c.name}</strong>
            <span className="adm-muted">
              {isUtme ? c.faculty : `${c.subjects.length} subjects`}
            </span>
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
              ? `No ${EXAM_LABEL[exam]} questions yet for ${missing.join(', ')}.`
              : `${total} ${EXAM_LABEL[exam]} questions ready.`}
          </span>
        </button>
      </li>
    );
  };

  return (
    <div className="adm-page">
      <PageHead
        title="Courses"
        sub="What students practise for. JAMB is by faculty and course (four subjects each); WAEC, NECO and GCE are by class — Science, Arts, Commercial."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Plus size={18} aria-hidden /> Add {EXAM_LABEL[exam]} {kind}
          </button>
        }
      />

      <div className="adm-tabs" role="tablist" aria-label="Exam">
        {COURSE_EXAMS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={exam === t}
            className={exam === t ? 'is-on' : ''}
            onClick={() => {
              setExam(t);
              setSearch('');
            }}
            title={EXAM_FULL_NAME[t]}
          >
            {EXAM_LABEL[t]}
            <small>{courses.filter((c) => (c.exam ?? 'UTME') === t).length}</small>
          </button>
        ))}
      </div>

      <label className="adm-input adm-input--icon adm-search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isUtme ? 'Search JAMB courses or faculties' : `Search ${EXAM_LABEL[exam]} classes`}
          aria-label="Search"
        />
      </label>

      {list.length === 0 && (
        <div className="adm-empty">
          <h3>No {EXAM_LABEL[exam]} {isUtme ? 'courses' : 'classes'} here</h3>
          <p>Add one so students can practise for it.</p>
        </div>
      )}

      {groups.map((g) => {
        const group = isUtme ? list.filter((c) => (c.faculty || 'Other') === g) : list;
        if (!group.length) return null;
        return (
          <section key={g || 'classes'} className="adm-faculty">
            {isUtme && (
              <h2 className="adm-faculty__title">
                {g} <span className="adm-muted">{group.length} course{group.length === 1 ? '' : 's'}</span>
              </h2>
            )}
            {isUtme && facultyCard(g)}
            <ul className="adm-courses">{group.map(card)}</ul>
          </section>
        );
      })}

      {editingSet && (
        <FacultySetEditor
          initial={editingSet}
          onClose={() => setEditingSet(null)}
          onSave={(set) => {
            cms.saveFacultySet(set);
            nav.notify(`Saved ${set.faculty} faculty practice.`);
            setEditingSet(null);
          }}
        />
      )}

      {editing && (
        <CourseEditor
          initial={editing === 'new' ? blank(exam) : editing}
          isNew={editing === 'new'}
          taken={new Set(courses.map((c) => c.id))}
          onClose={() => setEditing(null)}
          onSave={(course) => {
            cms.saveCourse(course);
            nav.notify(`Saved ${EXAM_LABEL[course.exam]} ${course.name}.`);
            setEditing(null);
          }}
          onDelete={
            editing !== 'new'
              ? () => {
                  if (!window.confirm(`Delete ${editing.name}?`)) return;
                  cms.deleteCourse(editing.id);
                  nav.notify('Deleted.');
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
