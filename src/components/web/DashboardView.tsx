import React, { useState } from 'react';
import {
  ArrowRight,
  BookOpenCheck,
  Check,
  ClipboardList,
  Flame,
  MessageSquareText,
  Play,
  LockOpen,
  Target,
  GraduationCap,
  Landmark,
} from 'lucide-react';
import type { DiagnosticQuestion, UserProfile } from '../../types';
import { useCms } from '../../lib/cms';
import { NIGERIAN_INSTITUTIONS } from '../../data/nigerian-curriculum';
import type { ExamType } from '../../lib/cms';
import type { StudentExam } from '../../types';
import { SCHOOL_CERT_EXAMS, examsOf } from '../../lib/student-exams';
import { ExamRoom } from './ExamRoom';
import type { TutorPersona } from '../../data/tutors';

/** Short tab names for each exam room. */
const ROOM_NAME: Record<StudentExam, string> = {
  UTME: 'JAMB',
  'Post-UTME': 'Post-UTME',
  WAEC: 'WAEC',
  NECO: 'NECO',
  GCE: 'GCE',
  NABTEB: 'NABTEB',
};

type Subject = DiagnosticQuestion['subject'];

interface Props {
  profile: UserProfile;
  onLaunchCBT: (subject?: Subject) => void;
  onOpenSyllabus: () => void;
  onOpenTutor: () => void;
  onUpgrade: () => void;
  onEditGoal: () => void;
  onOpenCourse: () => void;
  /** The student's school's Post-UTME page. */
  onOpenPostUtme: () => void;
  /** Start a practice exam for one exam body (WAEC, NECO…). */
  onStartPractice: (practice: { name: string; subjects: string[]; exam: string }) => void;
  onOpenPastQuestions: (exam: ExamType) => void;
  onOpenClassroom: () => void;
  /** Premium: the student's personal tutor. */
  tutor?: TutorPersona;
}

const SUBJECTS = [
  { name: 'Use of English', exam: 'English' as Subject, mastery: 84, weak: 'Stress patterns' },
  { name: 'Mathematics', exam: 'Mathematics' as Subject, mastery: 78, weak: 'Matrices' },
  { name: 'Physics', exam: 'Physics' as Subject, mastery: 72, weak: 'Magnetic induction' },
  { name: 'Chemistry', exam: 'Chemistry' as Subject, mastery: 58, weak: 'Organic isomers' },
];

const TASKS = [
  { text: 'Physics: 20 questions on motion', subject: 'Physics' as Subject, done: true },
  { text: 'English: 15 vocabulary questions', subject: 'English' as Subject, done: true },
  { text: 'Chemistry: 15 questions on organic isomers', subject: 'Chemistry' as Subject, done: false },
];

// Plain-language level, always shown next to the colour.
const level = (pct: number) =>
  pct >= 80 ? { label: 'Strong', tone: 'good' } : pct >= 65 ? { label: 'Good', tone: 'ok' } : { label: 'Needs work', tone: 'weak' };

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
};

export const DashboardView: React.FC<Props> = ({
  profile,
  onLaunchCBT,
  onOpenSyllabus,
  onOpenTutor,
  onUpgrade,
  onOpenCourse,
  onOpenPostUtme,
  onStartPractice,
  onOpenPastQuestions,
  onEditGoal,
  tutor,
  onOpenClassroom,
}) => {
  // One "room" per exam the student chose; tabs switch between them.
  const exams = examsOf(profile);
  const [room, setRoom] = useState<StudentExam>(exams[0] ?? 'UTME');
  const current = exams.includes(room) ? room : (exams[0] ?? 'UTME');
  const { questions } = useCms();
  // The school picked at registration sets the student's Post-UTME.
  const school = NIGERIAN_INSTITUTIONS.find(
    (i) => profile.targetInstitution.includes(i.shortName) || profile.targetInstitution.includes(i.name),
  );
  const schoolQs = school
    ? questions.filter((q) => q.status === 'published' && q.examType === 'Post-UTME' && q.school === school.shortName)
    : [];
  const schoolSubjects = [...new Set(schoolQs.map((q) => q.subject))];
  const firstName = profile.fullName.split(' ')[0] || 'there';
  const projected = Math.round(160 + (profile.diagnosticScore / 100) * 200);
  const gap = profile.targetScore - projected;
  const doneCount = TASKS.filter((t) => t.done).length;
  const nextTask = TASKS.find((t) => !t.done);
  const isPremium = profile.plan === 'premium';

  return (
    <div className="ui-page dash">
      {/* ------------------------------------------------------------ Hello */}
      <header className="dash__hello">
        <div>
          <p className="dash__eyebrow">{greeting()},</p>
          <h1>{firstName}</h1>
        </div>
        <span className="dash__streak" title="Days in a row you have practised">
          <Flame size={16} aria-hidden /> 4-day streak
        </span>
      </header>

      {/* ------------------------------------------------ Personal classroom */}
      <button type="button" className="dash__class" onClick={onOpenClassroom}>
        <span className="dash__class-board" aria-hidden>
          <i>x² − 5x + 6 = 0</i>
          <i>(x − 2)(x − 3) = 0</i>
        </span>
        <span className="dash__class-text">
          <strong>My classroom</strong>
          <span>
            {tutor ? `${tutor.name} teaches` : 'Your AI teacher teaches'} you on a whiteboard, topic by topic from your
            syllabus.
          </span>
        </span>
        <span className="dash__class-go">
          Enter <ArrowRight size={18} aria-hidden />
        </span>
      </button>

      {exams.length > 1 && (
        <nav className="dash__rooms" role="tablist" aria-label="Your exams">
          {exams.map((e) => (
            <button
              key={e}
              type="button"
              role="tab"
              aria-selected={current === e}
              className={current === e ? 'is-on' : ''}
              onClick={() => setRoom(e)}
            >
              {ROOM_NAME[e]}
            </button>
          ))}
        </nav>
      )}

      {current === 'UTME' && (
        <>
      {/* --------------------------------------------------- Today (primary) */}
      <section className="dash__today">
        <div className="dash__today-top">
          <span className="dash__label">Today’s practice</span>
          <span className="dash__count">
            {doneCount} of {TASKS.length} done
          </span>
        </div>
        <div className="dash__bar" aria-hidden>
          <i style={{ width: `${(doneCount / TASKS.length) * 100}%` }} />
        </div>

        {nextTask ? (
          <>
            <h2 className="dash__next">{nextTask.text}</h2>
            <p className="dash__next-sub">About 15 minutes. Finish it to keep your streak.</p>
            <button
              type="button"
              className="ui-btn ui-btn--light ui-btn--lg"
              onClick={() => onLaunchCBT(nextTask.subject)}
            >
              <Play size={18} aria-hidden /> Start now
            </button>
          </>
        ) : (
          <h2 className="dash__next">All done for today. Well done!</h2>
        )}

        <ul className="dash__tasks">
          {TASKS.map((t) => (
            <li key={t.text} className={t.done ? 'is-done' : ''}>
              <span className="dash__tick" aria-hidden>
                {t.done && <Check size={13} />}
              </span>
              {t.text}
            </li>
          ))}
        </ul>
      </section>

      {/* ----------------------------------------------------- Quick actions */}
      <nav className="dash__actions" aria-label="Quick actions">
        <button type="button" onClick={() => onLaunchCBT()}>
          <span className="dash__action-icon">
            <ClipboardList size={22} aria-hidden />
          </span>
          <strong>Practice exam</strong>
          <small>Timed, like the real CBT</small>
        </button>
        <button type="button" onClick={onOpenSyllabus}>
          <span className="dash__action-icon">
            <BookOpenCheck size={22} aria-hidden />
          </span>
          <strong>Past questions</strong>
          <small>Try and check answers</small>
        </button>
        <button type="button" onClick={onOpenTutor}>
          <span className="dash__action-icon">
            <MessageSquareText size={22} aria-hidden />
          </span>
          <strong>Ask the tutor</strong>
          <small>Get help with any question</small>
        </button>
        <button type="button" onClick={onOpenCourse}>
          <span className="dash__action-icon">
            <GraduationCap size={22} aria-hidden />
          </span>
          <strong>Practise for my course</strong>
          <small>{profile.targetCourse || 'Pick your course'}</small>
        </button>
      </nav>

      <div className="dash__cols">
        {/* ------------------------------------------------------- Score */}
        <section className="ui-card dash__score">
          <h3>
            <Target size={18} aria-hidden /> Your score
          </h3>
          <div className="dash__score-row">
            <div>
              <span className="dash__big">{projected}</span>
              <span className="dash__of">/ 400</span>
              <p>Likely score today</p>
            </div>
            <div className="dash__goal">
              <span className="dash__big dash__big--muted">{profile.targetScore}</span>
              <p>Your goal</p>
            </div>
          </div>
          <div className="dash__meter" aria-hidden>
            <i style={{ width: `${Math.min(100, (projected / 400) * 100)}%` }} />
            <b style={{ left: `${(profile.targetScore / 400) * 100}%` }} />
          </div>
          <p className={`dash__verdict ${gap > 0 ? 'is-behind' : 'is-ahead'}`}>
            {gap > 0
              ? `${gap} more marks to reach your goal for ${profile.targetCourse}.`
              : `You’re above your goal for ${profile.targetCourse}. Keep it up.`}
          </p>
        </section>

        {/* ---------------------------------------------------- Subjects */}
        <section className="ui-card dash__subjects">
          <h3>My subjects</h3>
          <ul>
            {SUBJECTS.map((s) => {
              const l = level(s.mastery);
              return (
                <li key={s.name}>
                  <div className="dash__subj-top">
                    <strong>{s.name}</strong>
                    <span className={`ui-chip ui-chip--${l.tone}`}>{l.label}</span>
                  </div>
                  <div className={`dash__subj-bar is-${l.tone}`} aria-hidden>
                    <i style={{ width: `${s.mastery}%` }} />
                  </div>
                  <div className="dash__subj-foot">
                    <span>
                      {s.mastery}% · work on: {s.weak}
                    </span>
                    <button type="button" onClick={() => onLaunchCBT(s.exam)}>
                      Practise <ArrowRight size={14} aria-hidden />
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      </div>

        </>
      )}

      {current === 'Post-UTME' && (
        <>
      {/* ------------------------------------------------- Your Post-UTME */}
      <section className="dash__pu">
        <span className="dash__pu-icon">
          <Landmark size={24} aria-hidden />
        </span>
        <div className="dash__pu-text">
          <span className="dash__label">Your Post-UTME</span>
          <h2>{school ? `${school.name} (${school.shortName})` : 'Choose your school'}</h2>
          <p>
            {!school
              ? 'Each school sets its own Post-UTME. Pick yours to practise its past questions.'
              : schoolQs.length
                ? `${schoolQs.length} past question${schoolQs.length === 1 ? '' : 's'} ready · ${schoolSubjects.join(', ')}`
                : `${school.shortName} past questions are coming soon. Meanwhile, keep practising for JAMB.`}
          </p>
        </div>
        <button type="button" className="ui-btn ui-btn--primary dash__pu-btn" onClick={onOpenPostUtme}>
          {school && schoolQs.length ? `Practise ${school.shortName} Post-UTME` : school ? 'See Post-UTME' : 'Choose school'}
          <ArrowRight size={18} aria-hidden />
        </button>
      </section>

        </>
      )}

      {SCHOOL_CERT_EXAMS.includes(current) && (
        <ExamRoom
          key={current}
          exam={current}
          cert={profile.schoolCert}
          onStart={onStartPractice}
          onPastQuestions={onOpenPastQuestions}
          onEdit={onEditGoal}
        />
      )}

      {/* ------------------------------------------------- Personal tutor */}
      {isPremium && (
        <section className="dash__mytutor">
          {tutor ? (
            <span className={`tutor-avatar tutor-avatar--${tutor.id}`} aria-hidden>
              {tutor.name.charAt(0)}
            </span>
          ) : (
            <span className="tutor-avatar" aria-hidden>
              ?
            </span>
          )}
          <div>
            <strong>{tutor ? `${tutor.name}, your personal tutor` : 'Choose your personal tutor'}</strong>
            <p>
              {tutor
                ? `${tutor.style}. Stuck on a question? Tap “Solve with ${tutor.name}” under it.`
                : 'Pick the AI tutor who’ll help you solve every question.'}
            </p>
          </div>
          <button type="button" className="ui-btn ui-btn--primary" onClick={tutor ? onOpenTutor : onUpgrade}>
            {tutor ? `Ask ${tutor.name}` : 'Choose tutor'}
          </button>
        </section>
      )}

      {/* --------------------------------------------------------- Upgrade */}
      {!isPremium && (
        <section className="dash__upgrade">
          <span className="dash__upgrade-icon">
            <LockOpen size={20} aria-hidden />
          </span>
          <div>
            <strong>Get your own personal AI tutor</strong>
            <p>They’ll solve any question with you, step by step. Free accounts get 5 tutor questions a day. Premium from ₦2,500 a month.</p>
          </div>
          <button type="button" className="ui-btn ui-btn--primary" onClick={onUpgrade}>
            Upgrade
          </button>
        </section>
      )}
    </div>
  );
};
