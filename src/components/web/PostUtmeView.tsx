import React, { useRef, useState } from 'react';
import { BookOpenCheck, ChevronRight, Landmark, MapPin, Play, Search } from 'lucide-react';
import { useCms } from '../../lib/cms';
import { NIGERIAN_INSTITUTIONS } from '../../data/nigerian-curriculum';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onStart: (practice: { name: string; subjects: string[]; exam: string; school: string }) => void;
  onBrowse: (school: string) => void;
}

const TYPES = ['All', 'Federal', 'State', 'Private'] as const;

/** Post-UTME practice, organised by school. */
export const PostUtmeView: React.FC<Props> = ({ profile, onStart, onBrowse }) => {
  const { questions } = useCms();
  const postUtme = questions.filter((q) => q.status === 'published' && q.examType === 'Post-UTME');
  const countFor = (school: string) => postUtme.filter((q) => q.school === school).length;

  // Start on the student's target school when we can match it.
  const target = NIGERIAN_INSTITUTIONS.find(
    (i) => profile.targetInstitution.includes(i.shortName) || profile.targetInstitution.includes(i.name),
  );
  const [picked, setPicked] = useState(target?.shortName ?? '');
  const [type, setType] = useState<(typeof TYPES)[number]>('All');
  const [search, setSearch] = useState('');
  const cardRef = useRef<HTMLElement>(null);

  const term = search.trim().toLowerCase();
  const list = NIGERIAN_INSTITUTIONS.filter(
    (i) =>
      (type === 'All' || i.type === type) &&
      (!term || `${i.name} ${i.shortName} ${i.location}`.toLowerCase().includes(term)),
  ).sort((a, b) => countFor(b.shortName) - countFor(a.shortName) || a.name.localeCompare(b.name));

  const school = NIGERIAN_INSTITUTIONS.find((i) => i.shortName === picked);
  const schoolQs = postUtme.filter((q) => q.school === picked);
  const subjects = [...new Set(schoolQs.map((q) => q.subject))].sort();
  const years = [...new Set(schoolQs.map((q) => q.year).filter((y): y is number => y !== null))].sort((a, b) => b - a);

  const choose = (id: string) => {
    setPicked(id);
    if (window.matchMedia('(max-width: 860px)').matches) {
      window.requestAnimationFrame(() => cardRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  return (
    <div className="ui-page course">
      <header className="pq__head">
        <h1>Post-UTME</h1>
        <p>Every school sets its own Post-UTME. Choose your school to practise its past questions.</p>
      </header>

      <label className="pq__search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search schools, e.g. UNILAG or Ibadan"
          aria-label="Search schools"
        />
      </label>

      <div className="pq__exams" role="tablist" aria-label="School type">
        {TYPES.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={type === t}
            className={type === t ? 'is-on' : ''}
            onClick={() => setType(t)}
          >
            {t === 'All' ? 'All schools' : t}
          </button>
        ))}
      </div>

      <div className="course__grid">
        <section className="course__list course__step" aria-label="Schools">
          <h2 className="course__step-title">
            <span className="course__step-num">1</span> Choose your school
          </h2>
          {list.length === 0 && <p className="course__empty">No school matches “{search}”.</p>}
          <ul>
            {list.map((i) => {
              const n = countFor(i.shortName);
              const on = picked === i.shortName;
              return (
                <li key={i.id}>
                  <button
                    type="button"
                    className={`course__item${on ? ' is-on' : ''}`}
                    aria-pressed={on}
                    onClick={() => choose(i.shortName)}
                  >
                    <span className="course__class-icon">
                      <Landmark size={20} aria-hidden />
                    </span>
                    <span className="course__item-text">
                      <strong>
                        {i.name} ({i.shortName})
                      </strong>
                      <small>
                        {i.type} · {i.location}
                      </small>
                    </span>
                    {n > 0 ? (
                      <span className="ui-chip ui-chip--good">{n} Qs</span>
                    ) : (
                      <ChevronRight size={18} className="course__chev" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {school ? (
          <aside className="course__card" key={school.id} ref={cardRef} aria-live="polite">
            <span className="course__icon">
              <Landmark size={26} aria-hidden />
            </span>
            <p className="course__faculty-name">
              <MapPin size={14} aria-hidden /> {school.location} · {school.type}
            </p>
            <h2>{school.name}</h2>
            <p className="course__lead">{school.shortName} Post-UTME questions:</p>
            {subjects.length ? (
              <ul className="course__subjects">
                {subjects.map((s, i) => {
                  const n = schoolQs.filter((q) => q.subject === s).length;
                  return (
                    <li key={s}>
                      <span className="course__num">{i + 1}</span>
                      <strong>{s}</strong>
                      <span>
                        {n} question{n === 1 ? '' : 's'}
                      </span>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="course__note">No {school.shortName} Post-UTME questions yet — check back soon.</p>
            )}
            {years.length > 0 && <p className="course__fine">Papers: {years.join(', ')}</p>}
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block"
              disabled={schoolQs.length === 0}
              onClick={() =>
                onStart({ name: `${school.shortName} Post-UTME`, subjects, exam: 'Post-UTME', school: school.shortName })
              }
            >
              <Play size={18} aria-hidden /> Start {school.shortName} practice
            </button>
            <button
              type="button"
              className="ui-link course__mine"
              disabled={schoolQs.length === 0}
              onClick={() => onBrowse(school.shortName)}
            >
              <BookOpenCheck size={16} aria-hidden /> Browse {school.shortName} past questions
            </button>
            <p className="course__fine">
              Check {school.shortName}’s official Post-UTME notice for the date, format and cut-off mark.
            </p>
          </aside>
        ) : (
          <aside className="course__card course__card--empty" ref={cardRef}>
            <span className="course__icon">
              <Landmark size={26} aria-hidden />
            </span>
            <h2>Pick a school</h2>
            <p className="course__lead">You’ll see its Post-UTME subjects and years here.</p>
          </aside>
        )}
      </div>
    </div>
  );
};
