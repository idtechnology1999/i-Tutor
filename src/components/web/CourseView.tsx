import React, { useRef, useState } from 'react';
import { Check, GraduationCap, Info, Play, Search } from 'lucide-react';
import { useCms } from '../../lib/cms';
import type { CmsCourse } from '../../lib/cms';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onStart: (course: { name: string; subjects: string[] }) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const normal = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');

/** Student page: pick a course, get a JAMB practice exam from its four subjects. */
export const CourseView: React.FC<Props> = ({ profile, onStart, onUpdateProfile }) => {
  const { courses, questions } = useCms();
  const mine = courses.find((c) => normal(c.name) === normal(profile.targetCourse)) ?? null;
  const [picked, setPicked] = useState<CmsCourse | null>(mine ?? courses[0] ?? null);
  const [search, setSearch] = useState('');
  const cardRef = useRef<HTMLElement>(null);

  // On phones the course panel sits above the list: bring it into view.
  const choose = (c: CmsCourse) => {
    setPicked(c);
    if (window.matchMedia('(max-width: 860px)').matches) {
      window.requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const jamb = questions.filter((q) => q.status === 'published' && q.examType === 'UTME');
  const countFor = (subject: string) => jamb.filter((q) => q.subject === subject).length;
  const term = search.trim().toLowerCase();
  const list = courses.filter((c) => !term || `${c.name} ${c.faculty}`.toLowerCase().includes(term));
  const total = picked ? picked.subjects.reduce((n, s) => n + countFor(s), 0) : 0;
  const isMine = picked && normal(picked.name) === normal(profile.targetCourse);

  return (
    <div className="ui-page course">
      <header className="pq__head">
        <h1>Practise for your course</h1>
        <p>Pick the course you want to study. We’ll build a JAMB practice exam from the four subjects it needs.</p>
      </header>

      <div className="course__grid">
        <section className="course__list" aria-label="Courses">
          <label className="pq__search">
            <Search size={18} aria-hidden />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courses, e.g. Computer Engineering"
              aria-label="Search courses"
            />
          </label>
          {list.length === 0 && <p className="course__empty">No course matches “{search}”.</p>}
          <ul>
            {list.map((c) => {
              const on = picked?.id === c.id;
              return (
                <li key={c.id}>
                  <button
                    type="button"
                    className={`course__item${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => choose(c)}
                  >
                    <span className="course__item-text">
                      <strong>{c.name}</strong>
                      <small>{c.subjects.join(' · ')}</small>
                    </span>
                    {mine?.id === c.id && <span className="ui-chip ui-chip--good">Your course</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {picked && (
          <aside className="course__card" key={picked.id} ref={cardRef} aria-live="polite">
            <span className="course__icon">
              <GraduationCap size={26} aria-hidden />
            </span>
            <p className="course__faculty">{picked.faculty}</p>
            <h2>{picked.name}</h2>
            <p className="course__lead">JAMB subjects for this course:</p>
            <ul className="course__subjects">
              {picked.subjects.map((s, i) => {
                const n = countFor(s);
                return (
                  <li key={s}>
                    <span className="course__num">{i + 1}</span>
                    <strong>{s}</strong>
                    <span className={n ? '' : 'is-empty'}>{n ? `${n} question${n === 1 ? '' : 's'}` : 'coming soon'}</span>
                  </li>
                );
              })}
            </ul>
            {picked.note && (
              <p className="course__note">
                <Info size={16} aria-hidden /> {picked.note}
              </p>
            )}
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block"
              onClick={() => onStart({ name: picked.name, subjects: picked.subjects })}
              disabled={total === 0}
            >
              <Play size={18} aria-hidden /> Start {picked.name} practice
            </button>
            {total === 0 && <p className="course__fine">No questions for these subjects yet — check back soon.</p>}
            {!isMine && (
              <button
                type="button"
                className="ui-link course__mine"
                onClick={() =>
                  onUpdateProfile({
                    targetCourse: picked.name,
                    targetFaculty: picked.faculty,
                    selectedSubjects: picked.subjects.map((s) => (s === 'English' ? 'English Language' : s)),
                  })
                }
              >
                <Check size={16} aria-hidden /> Make this my course
              </button>
            )}
            <p className="course__fine">Requirements can differ by school. Always confirm in the current JAMB brochure.</p>
          </aside>
        )}
      </div>
    </div>
  );
};
