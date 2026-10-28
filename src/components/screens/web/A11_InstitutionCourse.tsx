import React, { useEffect, useMemo, useState } from 'react';
import { SearchIcon, CheckIcon, TargetIcon, CheckSquareIcon, AlertCircleIcon } from '../../Icons';
import {
  ALL_COURSES,
  ENGLISH,
  findInstitution,
  matchesSearch,
  searchInstitutions,
  toJambSubject,
} from '../../../data/nigerian-curriculum';
import { checkAdmission } from '../../../services/admissions';
import type { AdmissionCheck } from '../../../services/admissions';
import { OnboardingShell, StepActions } from './shared';
import type { Institution } from '../../../types';

interface Props {
  selectedInstitution: string;
  selectedCourse: string;
  selectedSubjects: string[];
  onSelectInstitution: (name: string, type?: Institution['type']) => void;
  onSelectCourse: (name: string, faculty: string) => void;
  onUseSubjects: (subjects: string[]) => void;
  onContinue: () => void;
  onBack: () => void;
}

type Kind = 'All' | Institution['kind'];
const KINDS: Array<{ id: Kind; label: string }> = [
  { id: 'All', label: 'All' },
  { id: 'University', label: 'Universities' },
  { id: 'Polytechnic', label: 'Polytechnics' },
  { id: 'College of Education', label: 'Colleges of Education' },
];
const SHOW = 40;


/** The AI's cut-off and subject check for a school + course. Also used in the profile setup wizard. */
export const CutoffCard: React.FC<{
  school: string;
  kind: Institution['kind'];
  course: string;
  selectedSubjects: string[];
  onUseSubjects: (subjects: string[]) => void;
}> = ({ school, kind, course, selectedSubjects, onUseSubjects }) => {
  const [result, setResult] = useState<AdmissionCheck | null>(null);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setResult(null);
    setError('');
    checkAdmission(school, kind, course)
      ?.then((r) => !cancelled && setResult(r))
      .catch((err: Error) => !cancelled && setError(err.message));
    return () => {
      cancelled = true;
    };
  }, [school, kind, course, attempt]);

  const pending = !result && !error;
  // Offer the school's subjects only when all of them are ones students can pick.
  const theirs = (result?.utmeSubjects ?? []).map(toJambSubject);
  const usable = theirs.length === 4 && theirs.every(Boolean) ? (theirs as string[]) : null;
  const mine = new Set([ENGLISH, ...selectedSubjects]);
  const differs = usable ? usable.some((s) => !mine.has(s)) : false;

  return (
    <section className="cutoff" aria-live="polite">
      <header className="cutoff__head">
        <h2>Cut-off check</h2>
        <p>
          {course} at {school}
        </p>
      </header>

      {pending ? (
        <p className="cutoff__loading">
          <span className="cutoff__spinner" aria-hidden /> Checking the latest cut-off marks and subject requirements…
        </p>
      ) : error ? (
        <div className="cutoff__error" role="alert">
          <AlertCircleIcon size={15} />
          <span>{error}</span>
          <button type="button" className="link-inline" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      ) : result ? (
        <>
          {result.offered === false ? (
            <p className="cutoff__warn">
              <AlertCircleIcon size={15} /> We couldn’t find {course} among this school’s current courses. Check the school’s website, or pick
              another course.
            </p>
          ) : null}

          {result.live ? (
            <dl className="cutoff__marks">
              <div>
                <dt>JAMB minimum</dt>
                <dd>{result.jambMinimum ?? '—'}</dd>
              </div>
              <div>
                <dt>School cut-off</dt>
                <dd>{result.schoolCutoff ?? '—'}</dd>
              </div>
              <div>
                <dt>Course cut-off</dt>
                <dd className={result.courseCutoff ? '' : 'is-none'}>{result.courseCutoff || 'Not published'}</dd>
              </div>
            </dl>
          ) : (
            <p className="cutoff__warn">
              <AlertCircleIcon size={15} /> We couldn’t check live sources right now, so no cut-off marks are shown. These are the usual
              requirements — confirm them on the school’s website.
            </p>
          )}
          {result.live && result.session ? <p className="cutoff__session">Figures for the {result.session} session.</p> : null}

          {result.utmeSubjects.length ? (
            <div className="cutoff__row">
              <h3>UTME subjects</h3>
              <ul className="cutoff__subjects">
                {result.utmeSubjects.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
              {usable && differs ? (
                <p className="cutoff__swap">
                  Your subjects don’t match this.{' '}
                  <button type="button" className="link-inline" onClick={() => onUseSubjects(usable)}>
                    Use these subjects instead
                  </button>
                </p>
              ) : usable ? (
                <p className="cutoff__ok">
                  <CheckIcon size={13} /> Matches the subjects you chose.
                </p>
              ) : null}
            </div>
          ) : null}

          {result.olevel ? (
            <div className="cutoff__row">
              <h3>O’level</h3>
              <p>{result.olevel}</p>
            </div>
          ) : null}
          {result.notes ? <p className="cutoff__notes">{result.notes}</p> : null}

          {result.sources.length ? (
            <div className="cutoff__row">
              <h3>Sources</h3>
              <ul className="cutoff__sources">
                {result.sources.map((s) => (
                  <li key={s.url}>
                    <a href={s.url} target="_blank" rel="noreferrer noopener">
                      {s.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <p className="cutoff__fine">Cut-off marks change every year. Always confirm on JAMB’s and the school’s official websites.</p>
        </>
      ) : null}
    </section>
  );
};

export const A11_InstitutionCourse: React.FC<Props> = ({
  selectedInstitution,
  selectedCourse,
  selectedSubjects,
  onSelectInstitution,
  onSelectCourse,
  onUseSubjects,
  onContinue,
  onBack,
}) => {
  const [kind, setKind] = useState<Kind>('All');
  const [institutionQuery, setInstitutionQuery] = useState('');
  const [courseQuery, setCourseQuery] = useState('');

  const chosenSchool = findInstitution(selectedInstitution);

  const institutions = useMemo(() => searchInstitutions(institutionQuery, kind), [kind, institutionQuery]);

  const courses = useMemo(
    () => (courseQuery.trim() ? ALL_COURSES.filter((c) => matchesSearch(`${c.name} ${c.faculty}`, courseQuery)) : ALL_COURSES),
    [courseQuery],
  );

  const typedSchool = institutionQuery.trim();
  const typedCourse = courseQuery.trim();
  const isValid = Boolean(selectedInstitution) && Boolean(selectedCourse);

  return (
    <OnboardingShell
      screen="institution"
      step={3}
      title="Where are you aiming?"
      lede="Pick your school and course. We’ll check the latest cut-off marks and the subjects they ask for, and prepare you with the school’s Post-UTME questions."
      aside={
        <p className="onboard__hint">
          Not sure yet? Skip it — your diagnostic will still show what to work on, and you can set a target whenever it becomes clear.
        </p>
      }
    >
      <div className="pick-grid">
        <section className="pick-col">
          <div className="pick-col__head">
            <h2 className="pick-col__title">
              <TargetIcon size={15} /> Target institution
            </h2>
            {selectedInstitution ? (
              <span className="pick-col__set">
                <CheckIcon size={12} /> Chosen
              </span>
            ) : null}
          </div>

          <div className="control control--search">
            <SearchIcon size={16} className="control__icon" />
            <input
              type="search"
              value={institutionQuery}
              onChange={(e) => setInstitutionQuery(e.target.value)}
              placeholder="Search by name, short name or town, e.g. YABATECH"
              className="control__input"
              aria-label="Search target institutions"
            />
          </div>

          <div className="chips" role="group" aria-label="Filter by type of institution">
            {KINDS.map((option) => (
              <button
                key={option.id}
                type="button"
                onClick={() => setKind(option.id)}
                className={`chip${kind === option.id ? ' is-on' : ''}`}
                aria-pressed={kind === option.id}
              >
                {option.label}
              </button>
            ))}
          </div>

          <ul className="pick-list">
            {institutions.slice(0, SHOW).map((inst) => {
              const isSelected = chosenSchool?.id === inst.id;
              return (
                <li key={inst.id}>
                  <button
                    type="button"
                    onClick={() => onSelectInstitution(inst.name, inst.type)}
                    className={`pick-row${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <span className="pick-row__check" aria-hidden="true">
                      {isSelected ? <CheckIcon size={13} /> : null}
                    </span>
                    <span className="pick-row__body">
                      <span className="pick-row__name">{inst.name}</span>
                      <span className="pick-row__meta">
                        {inst.location} · {inst.type} {inst.kind.toLowerCase()}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
            {typedSchool && institutions.length === 0 ? (
              <li className="pick-list__empty">
                No school matches “{typedSchool}”.{' '}
                <button type="button" className="link-inline" onClick={() => onSelectInstitution(typedSchool)}>
                  Use “{typedSchool}” as my school
                </button>
              </li>
            ) : null}
            {selectedInstitution && !chosenSchool ? (
              <li className="pick-list__empty">
                <CheckIcon size={12} /> Your school: <strong>{selectedInstitution}</strong>
              </li>
            ) : null}
          </ul>
          {institutions.length > SHOW ? (
            <p className="pick-list__more">
              Showing {SHOW} of {institutions.length}. Type your school’s name or town to find it.
            </p>
          ) : null}
        </section>

        <section className="pick-col">
          <div className="pick-col__head">
            <h2 className="pick-col__title">
              <CheckSquareIcon size={15} /> Target course
            </h2>
            {selectedCourse ? (
              <span className="pick-col__set">
                <CheckIcon size={12} /> Chosen
              </span>
            ) : null}
          </div>

          <div className="control control--search">
            <SearchIcon size={16} className="control__icon" />
            <input
              type="search"
              value={courseQuery}
              onChange={(e) => setCourseQuery(e.target.value)}
              placeholder="Search courses, e.g. Nursing or Law"
              className="control__input"
              aria-label="Search target courses"
            />
          </div>

          <ul className="pick-list">
            {courses.slice(0, 80).map((course) => {
              const isSelected = selectedCourse === course.name;
              return (
                <li key={course.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course.name, course.faculty)}
                    className={`pick-row${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <span className="pick-row__check" aria-hidden="true">
                      {isSelected ? <CheckIcon size={13} /> : null}
                    </span>
                    <span className="pick-row__body">
                      <span className="pick-row__name">{course.name}</span>
                      <span className="pick-row__meta">{course.faculty}</span>
                    </span>
                  </button>
                </li>
              );
            })}
            {typedCourse && !courses.some((c) => c.name.toLowerCase() === typedCourse.toLowerCase()) ? (
              <li className="pick-list__empty">
                {courses.length === 0 ? `No course matches “${typedCourse}”. ` : 'Not listed? '}
                <button type="button" className="link-inline" onClick={() => onSelectCourse(typedCourse, '')}>
                  Use “{typedCourse}” as my course
                </button>
              </li>
            ) : null}
            {selectedCourse && !ALL_COURSES.some((c) => c.name === selectedCourse) ? (
              <li className="pick-list__empty">
                <CheckIcon size={12} /> Your course: <strong>{selectedCourse}</strong>
              </li>
            ) : null}
          </ul>
        </section>
      </div>

      {isValid ? (
        <CutoffCard
          school={chosenSchool?.name ?? selectedInstitution}
          kind={chosenSchool?.kind ?? 'University'}
          course={selectedCourse}
          selectedSubjects={selectedSubjects}
          onUseSubjects={onUseSubjects}
        />
      ) : null}

      <StepActions onBack={onBack} backLabel="Back to subjects" note="You can change your target at any time from Settings.">
        <button type="button" className="btn btn--ghost" onClick={onContinue}>
          I’m not sure yet
        </button>
        <button type="button" className="btn btn--primary" onClick={onContinue} disabled={!isValid}>
          Continue
        </button>
      </StepActions>
    </OnboardingShell>
  );
};

export default A11_InstitutionCourse;
