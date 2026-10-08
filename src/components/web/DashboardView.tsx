import React from 'react';
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
} from 'lucide-react';
import type { DiagnosticQuestion, UserProfile } from '../../types';

type Subject = DiagnosticQuestion['subject'];

interface Props {
  profile: UserProfile;
  onLaunchCBT: (subject?: Subject) => void;
  onOpenSyllabus: () => void;
  onOpenTutor: () => void;
  onUpgrade: () => void;
  onEditGoal: () => void;
  onOpenCourse: () => void;
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
}) => {
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

      {/* --------------------------------------------------------- Upgrade */}
      {!isPremium && (
        <section className="dash__upgrade">
          <span className="dash__upgrade-icon">
            <LockOpen size={20} aria-hidden />
          </span>
          <div>
            <strong>Get unlimited help from the AI tutor</strong>
            <p>Free accounts get 5 tutor questions a day. Premium from ₦2,500 a month.</p>
          </div>
          <button type="button" className="ui-btn ui-btn--primary" onClick={onUpgrade}>
            Upgrade
          </button>
        </section>
      )}
    </div>
  );
};
