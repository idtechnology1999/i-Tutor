import React, { useState } from 'react';
import { examsLabel, examsOf } from '../../lib/student-exams';
import { ArrowLeft, BadgeCheck, Bell, GraduationCap, LockOpen, LogOut, PencilLine, Target } from 'lucide-react';
import { setReminders, useProgress } from '../../services/progress';
import type { UserProfile } from '../../types';
import { SetupWizardView } from './SetupWizardView';

interface Props {
  profile: UserProfile;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onUpgrade: () => void;
  onLogOut: () => void;
}

/** "Me" tab: a plain summary first; the step-by-step editor only on request. */
export const ProfileView: React.FC<Props> = ({ profile, onUpdateProfile, onUpgrade, onLogOut }) => {
  const [editing, setEditing] = useState(false);
  const isPremium = profile.plan === 'premium';
  const progress = useProgress();

  if (editing) {
    return (
      <div className="profile-edit">
        <div className="ui-page profile-edit__bar">
          <button type="button" className="ui-link" onClick={() => setEditing(false)}>
            <ArrowLeft size={18} aria-hidden /> Back to my profile
          </button>
        </div>
        <SetupWizardView
          profile={profile}
          onUpdateProfile={onUpdateProfile}
          onFinish={() => setEditing(false)}
        />
      </div>
    );
  }

  return (
    <div className="ui-page profile">
      <header className="profile__head">
        <span className="profile__avatar" aria-hidden>
          {profile.fullName.charAt(0).toUpperCase()}
        </span>
        <div>
          <h1>{profile.fullName}</h1>
          <p>{profile.phoneOrEmail}</p>
        </div>
      </header>

      <section className={`ui-card profile__plan${isPremium ? ' is-premium' : ''}`}>
        <div>
          <span className="profile__label">Your plan</span>
          <strong>
            {isPremium ? (
              <>
                <BadgeCheck size={18} aria-hidden /> Premium
              </>
            ) : (
              'Free'
            )}
          </strong>
          <p>{isPremium ? '300 AI tutor credits every month.' : '5 free AI tutor prompts to try it.'}</p>
        </div>
        {!isPremium && (
          <button type="button" className="ui-btn ui-btn--primary" onClick={onUpgrade}>
            <LockOpen size={18} aria-hidden /> Upgrade
          </button>
        )}
      </section>

      <section className="ui-card profile__goal">
        <div className="profile__goal-head">
          <h2>
            <Target size={18} aria-hidden /> My goal
          </h2>
          <button type="button" className="ui-btn ui-btn--ghost" onClick={() => setEditing(true)}>
            <PencilLine size={16} aria-hidden /> Change
          </button>
        </div>
        <dl>
          <div>
            <dt>Course</dt>
            <dd>{profile.targetCourse}</dd>
          </div>
          <div>
            <dt>School</dt>
            <dd>{profile.targetInstitution}</dd>
          </div>
          <div>
            <dt>Target score</dt>
            <dd>{profile.targetScore} / 400</dd>
          </div>
          <div>
            <dt>Exam</dt>
            <dd>
              {examsLabel(examsOf(profile))} · {profile.examMonth}
            </dd>
          </div>
        </dl>
      </section>

      <section className="ui-card">
        <h2 className="profile__h2">
          <GraduationCap size={18} aria-hidden /> My subjects
        </h2>
        <ul className="profile__subjects">
          {profile.selectedSubjects.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      </section>

      {/* The daily "you haven't practised today" reminder (only for saved, signed-in progress). */}
      {progress?.synced && (
        <section className="ui-card profile__remind">
          <div>
            <h2 className="profile__h2">
              <Bell size={18} aria-hidden /> Daily reminder
            </h2>
            <p>An evening reminder on days you haven’t practised yet{progress.streak.current > 1 ? `, to keep your ${progress.streak.current}-day streak` : ''}.</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={progress.remindersOn !== false}
            className={`profile__switch${progress.remindersOn !== false ? ' is-on' : ''}`}
            onClick={() => void setReminders(progress.remindersOn === false)}
          >
            <i aria-hidden />
            <span>{progress.remindersOn !== false ? 'On' : 'Off'}</span>
          </button>
        </section>
      )}

      <button type="button" className="ui-btn ui-btn--ghost profile__logout" onClick={onLogOut}>
        <LogOut size={18} aria-hidden /> Log out
      </button>
    </div>
  );
};
