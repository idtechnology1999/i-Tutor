import React, { useRef, useState } from 'react';
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  Check,
  ChevronRight,
  Cog,
  FlaskConical,
  GraduationCap,
  Info,
  Palette,
  Play,
  Scale,
  School,
  Search,
  Sprout,
  Stethoscope,
  Users,
} from 'lucide-react';
import { EXAM_FULL_NAME, EXAM_LABEL, useCms } from '../../lib/cms';
import type { CmsCourse } from '../../lib/cms';
import { COURSE_EXAMS, FACULTIES } from '../../data/courses';
import type { CourseExam } from '../../data/courses';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onStart: (course: { name: string; subjects: string[]; exam: string }) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
}

const CLASS_ICON: Record<string, typeof Cog> = {
  Science: FlaskConical,
  Arts: Palette,
  Commercial: BriefcaseBusiness,
};

const FACULTY_ICON: Record<string, typeof Cog> = {
  Engineering: Cog,
  'Medicine & Health': Stethoscope,
  Science: FlaskConical,
  'Environmental Sciences': Building2,
  Law: Scale,
  'Social Sciences': Users,
  'Management Sciences': BriefcaseBusiness,
  Arts: Palette,
  Education: School,
  Agriculture: Sprout,
};

const normal = (s: string) => s.toLowerCase().replace(/[^a-z]/g, '');
const facultyOrder = (f: string) => {
  const i = (FACULTIES as readonly string[]).indexOf(f);
  return i < 0 ? 99 : i;
};

/** Student page: faculty → course → a JAMB practice exam from its four subjects. */
export const CourseView: React.FC<Props> = ({ profile, onStart, onUpdateProfile }) => {
  const { courses: allCourses, questions } = useCms();
  const [exam, setExam] = useState<CourseExam>('UTME');
  const isUtme = exam === 'UTME';
  const courses = allCourses.filter((c) => (c.exam ?? 'UTME') === exam);
  const mine = isUtme ? (courses.find((c) => normal(c.name) === normal(profile.targetCourse)) ?? null) : null;

  const faculties = [...new Set(courses.map((c) => c.faculty || 'Other'))].sort(
    (a, b) => facultyOrder(a) - facultyOrder(b) || a.localeCompare(b),
  );
  const [faculty, setFaculty] = useState<string>(mine?.faculty ?? faculties[0] ?? '');
  const [picked, setPicked] = useState<CmsCourse | null>(mine);
  const [search, setSearch] = useState('');
  const coursesRef = useRef<HTMLElement>(null);
  const cardRef = useRef<HTMLElement>(null);

  const examQs = questions.filter((q) => q.status === 'published' && q.examType === exam);
  const countFor = (subject: string) => examQs.filter((q) => q.subject === subject).length;
  const examName = EXAM_LABEL[exam];
  const term = search.trim().toLowerCase();
  const list = term
    ? courses.filter((c) => `${c.name} ${c.faculty}`.toLowerCase().includes(term))
    : isUtme
      ? courses.filter((c) => (c.faculty || 'Other') === faculty)
      : courses;

  const switchExam = (t: CourseExam) => {
    setExam(t);
    setSearch('');
    const first = allCourses.filter((c) => (c.exam ?? 'UTME') === t);
    const own = t === 'UTME' ? first.find((c) => normal(c.name) === normal(profile.targetCourse)) : undefined;
    setFaculty(own?.faculty ?? first[0]?.faculty ?? '');
    setPicked(own ?? null);
  };
  const total = picked ? picked.subjects.reduce((n, s) => n + countFor(s), 0) : 0;
  const isMine = picked && normal(picked.name) === normal(profile.targetCourse);

  // On phones each step sits below the last: bring the next one into view.
  const reveal = (ref: React.RefObject<HTMLElement | null>) => {
    if (window.matchMedia('(max-width: 860px)').matches) {
      window.requestAnimationFrame(() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
    }
  };

  const chooseFaculty = (f: string) => {
    setFaculty(f);
    setPicked(null);
    reveal(coursesRef);
  };

  const chooseCourse = (c: CmsCourse) => {
    setPicked(c);
    reveal(cardRef);
  };

  return (
    <div className="ui-page course">
      <header className="pq__head">
        <h1>Practise for your course</h1>
        <p>
          {isUtme
            ? 'Choose your faculty, then your course. We’ll build a JAMB practice exam from the four subjects it needs.'
            : `Choose your class. We’ll build a ${examName} practice exam from its subjects.`}
        </p>
      </header>

      <div className="pq__exams" role="tablist" aria-label="Exam">
        {COURSE_EXAMS.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={exam === t}
            className={exam === t ? 'is-on' : ''}
            onClick={() => switchExam(t)}
            title={EXAM_FULL_NAME[t]}
          >
            {EXAM_LABEL[t]}
          </button>
        ))}
      </div>

      <label className="pq__search">
        <Search size={18} aria-hidden />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={isUtme ? 'Or search any course, e.g. Computer Engineering' : `Search ${examName} classes`}
          aria-label="Search courses"
        />
      </label>

      {!term && isUtme && (
        <section className="course__step">
          <h2 className="course__step-title">
            <span className="course__step-num">1</span> Choose your faculty
          </h2>
          <div className="course__faculties" role="radiogroup" aria-label="Faculty">
            {faculties.map((f) => {
              const Icon = FACULTY_ICON[f] ?? BookOpen;
              const n = courses.filter((c) => (c.faculty || 'Other') === f).length;
              const on = faculty === f;
              return (
                <button
                  key={f}
                  type="button"
                  role="radio"
                  aria-checked={on}
                  className={`course__faculty${on ? ' is-on' : ''}`}
                  onClick={() => chooseFaculty(f)}
                >
                  <span className="course__faculty-icon">
                    <Icon size={22} aria-hidden />
                  </span>
                  <strong>{f}</strong>
                  <small>
                    {n} course{n === 1 ? '' : 's'}
                  </small>
                </button>
              );
            })}
          </div>
        </section>
      )}

      <div className="course__grid">
        <section className="course__list course__step" ref={coursesRef} aria-label="Courses">
          <h2 className="course__step-title">
            {term ? (
              <>Matching “{search}”</>
            ) : isUtme ? (
              <>
                <span className="course__step-num">2</span> Choose your course
                <span className="course__step-hint">in {faculty}</span>
              </>
            ) : (
              <>
                <span className="course__step-num">1</span> Choose your class
              </>
            )}
          </h2>
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
                    onClick={() => chooseCourse(c)}
                  >
                    {!isUtme && (
                      <span className="course__class-icon">
                        {React.createElement(CLASS_ICON[c.name] ?? BookOpen, { size: 20, 'aria-hidden': true })}
                      </span>
                    )}
                    <span className="course__item-text">
                      <strong>{c.name}</strong>
                      <small>
                        {term ? `${c.faculty} · ` : ''}
                        {c.subjects.join(' · ')}
                      </small>
                    </span>
                    {mine?.id === c.id ? (
                      <span className="ui-chip ui-chip--good">Your course</span>
                    ) : (
                      <ChevronRight size={18} className="course__chev" aria-hidden />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </section>

        {picked ? (
          <aside className="course__card" key={picked.id} ref={cardRef} aria-live="polite">
            <span className="course__icon">
              <GraduationCap size={26} aria-hidden />
            </span>
            <p className="course__faculty-name">{isUtme ? picked.faculty : `${examName} class`}</p>
            <h2>{picked.name}</h2>
            <p className="course__lead">{isUtme ? 'JAMB subjects for this course:' : `${examName} subjects for this class:`}</p>
            <ul className="course__subjects">
              {picked.subjects.map((s, i) => {
                const n = countFor(s);
                return (
                  <li key={s}>
                    <span className="course__num">{i + 1}</span>
                    <strong>{s}</strong>
                    <span className={n ? '' : 'is-empty'}>
                      {n ? `${n} question${n === 1 ? '' : 's'}` : 'coming soon'}
                    </span>
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
              onClick={() => onStart({ name: isUtme ? picked.name : `${examName} ${picked.name}`, subjects: picked.subjects, exam })}
              disabled={total === 0}
            >
              <Play size={18} aria-hidden /> Start {picked.name} practice
            </button>
            {total === 0 && <p className="course__fine">No questions for these subjects yet — check back soon.</p>}
            {isUtme && !isMine && (
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
            <p className="course__fine">
              {isUtme
                ? 'Requirements can differ by school. Always confirm in the current JAMB brochure.'
                : 'Subjects can differ by school — practise the ones you’re registered for.'}
            </p>
          </aside>
        ) : (
          <aside className="course__card course__card--empty" ref={cardRef}>
            <span className="course__icon">
              <GraduationCap size={26} aria-hidden />
            </span>
            <h2>{isUtme ? 'Pick a course' : 'Pick a class'}</h2>
            <p className="course__lead">
              {isUtme
                ? 'You’ll see its four JAMB subjects here, and can start a practice exam.'
                : `You’ll see its ${examName} subjects here, and can start a practice exam.`}
            </p>
          </aside>
        )}
      </div>
    </div>
  );
};
