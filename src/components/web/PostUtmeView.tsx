import React from 'react';
import { BookOpenCheck, Landmark, MapPin, Pencil, Play } from 'lucide-react';
import { useCms } from '../../lib/cms';
import { NIGERIAN_INSTITUTIONS } from '../../data/nigerian-curriculum';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onStart: (practice: { name: string; subjects: string[]; exam: string; school: string }) => void;
  onBrowse: (school: string) => void;
  /** Opens the profile, where the student changes their school. */
  onChangeSchool: () => void;
}

/** Post-UTME for the one school the student chose at registration. */
export const PostUtmeView: React.FC<Props> = ({ profile, onStart, onBrowse, onChangeSchool }) => {
  const { questions } = useCms();
  const school = NIGERIAN_INSTITUTIONS.find(
    (i) => profile.targetInstitution.includes(i.shortName) || profile.targetInstitution.includes(i.name),
  );

  if (!school) {
    return (
      <div className="ui-page pu">
        <section className="pu__card pu__card--empty">
          <span className="pu__icon">
            <Landmark size={26} aria-hidden />
          </span>
          <h1>Choose your school</h1>
          <p>Post-UTME is set by each school. Tell us yours and we’ll show you its past questions.</p>
          <button type="button" className="ui-btn ui-btn--primary ui-btn--lg" onClick={onChangeSchool}>
            Choose my school
          </button>
        </section>
      </div>
    );
  }

  const qs = questions.filter((q) => q.status === 'published' && q.examType === 'Post-UTME' && q.school === school.shortName);
  const subjects = [...new Set(qs.map((q) => q.subject))].sort();
  const years = [...new Set(qs.map((q) => q.year).filter((y): y is number => y !== null))].sort((a, b) => b - a);

  return (
    <div className="ui-page pu">
      <header className="pu__head">
        <p>Your Post-UTME</p>
        <h1>{school.name}</h1>
        <span className="pu__where">
          <MapPin size={14} aria-hidden /> {school.location} · {school.type} · {school.shortName}
        </span>
      </header>

      <section className="pu__card">
        {qs.length ? (
          <>
            <h2>Past questions</h2>
            <ul className="pu__subjects">
              {subjects.map((s) => {
                const n = qs.filter((q) => q.subject === s).length;
                return (
                  <li key={s}>
                    <span>{s}</span>
                    <span>
                      {n} question{n === 1 ? '' : 's'}
                    </span>
                  </li>
                );
              })}
            </ul>
            {years.length > 0 && <p className="pu__years">Papers from {years.join(', ')}</p>}
            <button
              type="button"
              className="ui-btn ui-btn--primary ui-btn--lg ui-btn--block"
              onClick={() =>
                onStart({ name: `${school.shortName} Post-UTME`, subjects, exam: 'Post-UTME', school: school.shortName })
              }
            >
              <Play size={18} aria-hidden /> Start {school.shortName} practice
            </button>
            <button type="button" className="ui-btn ui-btn--ghost ui-btn--block" onClick={() => onBrowse(school.shortName)}>
              <BookOpenCheck size={18} aria-hidden /> Browse the questions
            </button>
          </>
        ) : (
          <div className="pu__soon">
            <span className="pu__icon">
              <Landmark size={26} aria-hidden />
            </span>
            <h2>{school.shortName} questions are coming soon</h2>
            <p>We’re adding {school.shortName}’s past Post-UTME papers. Meanwhile, keep practising for JAMB — it counts too.</p>
          </div>
        )}
      </section>

      <p className="pu__foot">
        Check {school.shortName}’s official notice for the date, format and cut-off mark.{' '}
        <button type="button" className="ui-link" onClick={onChangeSchool}>
          <Pencil size={14} aria-hidden /> Change school
        </button>
      </p>
    </div>
  );
};
