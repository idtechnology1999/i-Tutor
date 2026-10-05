import React, { useMemo, useState } from 'react';
import { SearchIcon, CheckIcon, TargetIcon, CheckSquareIcon } from '../../Icons';
import { NIGERIAN_INSTITUTIONS, POPULAR_COURSES } from '../../../data/nigerian-curriculum';
import { OnboardingShell, StepActions } from './shared';
import type { Institution, Course } from '../../../types';

interface Props {
  selectedInstitution: string;
  selectedCourse: string;
  onSelectInstitution: (institution: Institution) => void;
  onSelectCourse: (course: Course) => void;
  onContinue: () => void;
  onBack: () => void;
}

type Filter = 'All' | Institution['type'];

const FILTERS: Filter[] = ['All', 'Federal', 'State', 'Private'];

export const A11_InstitutionCourse: React.FC<Props> = ({
  selectedInstitution,
  selectedCourse,
  onSelectInstitution,
  onSelectCourse,
  onContinue,
  onBack,
}) => {
  const [filter, setFilter] = useState<Filter>('All');
  const [institutionQuery, setInstitutionQuery] = useState('');
  const [courseQuery, setCourseQuery] = useState('');

  const institutions = useMemo(() => {
    const query = institutionQuery.trim().toLowerCase();
    return NIGERIAN_INSTITUTIONS.filter((inst) => {
      const matchesFilter = filter === 'All' || inst.type === filter;
      if (!matchesFilter) return false;
      if (!query) return true;
      return (
        inst.name.toLowerCase().includes(query) ||
        inst.shortName.toLowerCase().includes(query) ||
        inst.location.toLowerCase().includes(query)
      );
    });
  }, [filter, institutionQuery]);

  const courses = useMemo(() => {
    const query = courseQuery.trim().toLowerCase();
    if (!query) return POPULAR_COURSES;
    return POPULAR_COURSES.filter(
      (course) =>
        course.name.toLowerCase().includes(query) ||
        course.faculty.toLowerCase().includes(query),
    );
  }, [courseQuery]);

  const isValid = Boolean(selectedInstitution) && Boolean(selectedCourse);

  return (
    <OnboardingShell
      step={3}
      title="Where are you aiming?"
      lede="Tell us your target institution and course so we can benchmark your scores and prioritise the topics that carry the most weight in your admission."
      aside={
        <p className="onboard__hint">
          Not sure yet? Skip it — your diagnostic will still show what to work on,
          and you can set a target whenever it becomes clear.
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
              placeholder="Search universities, e.g. UNILAG or Ibadan"
              className="control__input"
              aria-label="Search target institutions"
            />
          </div>

          <div className="chips" role="group" aria-label="Filter by institution type">
            {FILTERS.map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setFilter(option)}
                className={`chip${filter === option ? ' is-on' : ''}`}
                aria-pressed={filter === option}
              >
                {option}
              </button>
            ))}
          </div>

          <ul className="pick-list">
            {institutions.length === 0 ? (
              <li className="pick-list__empty">
                No institution matches “{institutionQuery}”.
              </li>
            ) : null}
            {institutions.slice(0, 8).map((inst) => {
              const isSelected = selectedInstitution === inst.name;
              return (
                <li key={inst.id}>
                  <button
                    type="button"
                    onClick={() => onSelectInstitution(inst)}
                    className={`pick-row${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                  >
                    <span className="pick-row__check" aria-hidden="true">
                      {isSelected ? <CheckIcon size={13} /> : null}
                    </span>
                    <span className="pick-row__body">
                      <span className="pick-row__name">{inst.name}</span>
                      <span className="pick-row__meta">
                        {inst.location} · {inst.type}
                      </span>
                    </span>
                    <span className="pick-row__cut">Cut-off {inst.minCutOff}</span>
                  </button>
                </li>
              );
            })}
          </ul>
          {institutions.length > 8 ? (
            <p className="pick-list__more">
              Showing 8 of {institutions.length}. Refine your search to narrow the
              list.
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
              placeholder="Search courses, e.g. Medicine or Computer Science"
              className="control__input"
              aria-label="Search target courses"
            />
          </div>

          <ul className="pick-list">
            {courses.length === 0 ? (
              <li className="pick-list__empty">
                No course matches “{courseQuery}”.
              </li>
            ) : null}
            {courses.map((course) => {
              const isSelected = selectedCourse === course.name;
              return (
                <li key={course.id}>
                  <button
                    type="button"
                    onClick={() => onSelectCourse(course)}
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
                    <span className="pick-row__cut">
                      Bench {course.benchmarkScore}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

      <StepActions
        onBack={onBack}
        backLabel="Back to subjects"
        note="You can change your target at any time from Settings."
      >
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onContinue}
        >
          I’m not sure yet
        </button>
        <button
          type="button"
          className="btn btn--primary"
          onClick={onContinue}
          disabled={!isValid}
        >
          Continue
        </button>
      </StepActions>
    </OnboardingShell>
  );
};

export default A11_InstitutionCourse;
