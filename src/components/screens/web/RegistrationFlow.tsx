import React, { useCallback, useState } from 'react';
import type {
  Course,
  ExamTrack,
  Institution,
  UserProfile,
} from '../../../types';
import { A04_SignUp } from './A04_SignUp';
import { A05_OTP } from './A05_OTP';
import { A06_Login } from './A06_Login';
import { A07_ForgotPassword } from './A07_ForgotPassword';
import { A08_ResetPassword } from './A08_ResetPassword';
import { A09_ExamTrack } from './A09_ExamTrack';
import { A10_SubjectPicker } from './A10_SubjectPicker';
import { A11_InstitutionCourse } from './A11_InstitutionCourse';
import { A12_ExamDateGoals } from './A12_ExamDateGoals';
import { A13_PermissionsPrimer } from './A13_PermissionsPrimer';
import { A14_PlacementDiagnostic } from './A14_PlacementDiagnostic';
import type { AppView } from '../../../lib/router';

type FlowView = Extract<
  AppView,
  | 'signup'
  | 'otp'
  | 'login'
  | 'forgot'
  | 'reset'
  | 'track'
  | 'subjects'
  | 'institution'
  | 'goals'
  | 'permissions'
  | 'baseline'
>;

interface Props {
  view: FlowView;
  profile: UserProfile;
  hasAccount: boolean;
  onNavigate: (view: AppView) => void;
  onUpdateProfile: (updated: Partial<UserProfile>) => void;
  onAccountReady: () => void;
  onFinish: () => void;
}

const ONBOARDING_VIEWS: FlowView[] = [
  'track',
  'subjects',
  'institution',
  'goals',
  'permissions',
  'baseline',
];

const TRACK_LABELS: Record<ExamTrack, string> = {
  jamb: 'JAMB / UTME',
  'post-jamb': 'Post-UTME',
  both: 'JAMB / UTME and Post-UTME',
};

/**
 * Owns the A04–A14 sequence and keeps the candidate's answers in the shared
 * profile. Each screen stays presentational; this file holds the transitions,
 * the resume guard and the redirect back out of the flow.
 */
export const RegistrationFlow: React.FC<Props> = ({
  view,
  profile,
  hasAccount,
  onNavigate,
  onUpdateProfile,
  onAccountReady,
  onFinish,
}) => {
  const [pendingContact, setPendingContact] = useState('');

  const goHome = useCallback(() => onNavigate('home'), [onNavigate]);

  const enterOnboarding = useCallback(() => {
    onNavigate('track');
  }, [onNavigate]);

  const toggleSubject = (name: string) => {
    const has = profile.selectedSubjects.includes(name);
    if (has) {
      if (name === 'English Language') return;
      onUpdateProfile({
        selectedSubjects: profile.selectedSubjects.filter(
          (subject: string) => subject !== name,
        ),
      });
      return;
    }
    if (profile.selectedSubjects.length >= 4) return;
    onUpdateProfile({
      selectedSubjects: [...profile.selectedSubjects, name],
    });
  };

  // Someone can land directly on /onboarding/goals without an account. The
  // onboarding steps all write to a candidate record, so gate them.
  if (!hasAccount && ONBOARDING_VIEWS.includes(view)) {
    return (
      <div className="flow-gate">
        <div className="flow-gate__card">
          <h1>Let us start with your account</h1>
          <p>
            These steps build your study plan, so they need a candidate record
            first. Registration takes under a minute.
          </p>
          <button
            type="button"
            className="btn btn--primary"
            onClick={() => onNavigate('signup')}
          >
            Create an account
          </button>
          <button
            type="button"
            className="btn btn--ghost"
            onClick={() => onNavigate('login')}
          >
            I already have one
          </button>
        </div>
      </div>
    );
  }

  switch (view) {
    case 'signup':
      return (
        <A04_SignUp
          onBack={goHome}
          onSignInInstead={() => onNavigate('login')}
          onSubmit={({ fullName, phoneOrEmail }) => {
            onUpdateProfile({ fullName, phoneOrEmail });
            setPendingContact(phoneOrEmail);
            onNavigate('otp');
          }}
          isLoading={false}
        />
      );

    case 'otp':
      return (
        <A05_OTP
          phoneOrEmail={pendingContact || profile.phoneOrEmail}
          onChangeNumber={() => onNavigate('signup')}
          onVerified={() => {
            onUpdateProfile({ phoneOrEmail: pendingContact || profile.phoneOrEmail });
            onAccountReady();
            enterOnboarding();
          }}
        />
      );

    case 'login':
      return (
        <A06_Login
          onBack={goHome}
          onForgotPassword={() => onNavigate('forgot')}
          onSignUpInstead={() => onNavigate('signup')}
          onBiometricAuth={() => {
            onAccountReady();
            onFinish();
          }}
          onSuccess={() => {
            onAccountReady();
            onFinish();
          }}
        />
      );

    case 'forgot':
      return (
        <A07_ForgotPassword
          onBack={() => onNavigate('login')}
          onSendCode={(destination) => setPendingContact(destination)}
          onConfirm={() => onNavigate('reset')}
        />
      );

    case 'reset':
      return (
        <A08_ResetPassword
          onBack={() => onNavigate('forgot')}
          onGoToLogin={() => onNavigate('login')}
          onSuccess={() => {
            onNavigate('login');
          }}
        />
      );

    case 'track':
      return (
        <A09_ExamTrack
          selectedTrack={profile.track}
          onSelectTrack={(track) => onUpdateProfile({ track })}
          onBack={() => onNavigate('signup')}
          onContinue={() => onNavigate('subjects')}
        />
      );

    case 'subjects':
      return (
        <A10_SubjectPicker
          selectedSubjects={profile.selectedSubjects}
          onToggleSubject={toggleSubject}
          onBack={() => onNavigate('track')}
          onContinue={() => onNavigate('institution')}
        />
      );

    case 'institution':
      return (
        <A11_InstitutionCourse
          selectedInstitution={profile.targetInstitution}
          selectedCourse={profile.targetCourse}
          onSelectInstitution={(institution: Institution) =>
            onUpdateProfile({
              targetInstitution: institution.name,
              targetInstitutionType: institution.type,
            })
          }
          onSelectCourse={(course: Course) =>
            onUpdateProfile({
              targetCourse: course.name,
              targetFaculty: course.faculty,
            })
          }
          onBack={() => onNavigate('subjects')}
          onContinue={() => onNavigate('goals')}
        />
      );

    case 'goals':
      return (
        <A12_ExamDateGoals
          examMonth={profile.examMonth}
          onChangeExamMonth={(examMonth) => onUpdateProfile({ examMonth })}
          targetScore={profile.targetScore}
          onChangeTargetScore={(targetScore) => onUpdateProfile({ targetScore })}
          dailyCommitment={profile.dailyCommitment}
          onChangeDailyCommitment={(dailyCommitment) =>
            onUpdateProfile({ dailyCommitment })
          }
          trackLabel={TRACK_LABELS[profile.track]}
          subjectCount={profile.selectedSubjects.length}
          onBack={() => onNavigate('institution')}
          onContinue={() => onNavigate('permissions')}
        />
      );

    case 'permissions':
      return (
        <A13_PermissionsPrimer
          notificationsEnabled={profile.notificationsEnabled}
          onChangeNotifications={(notificationsEnabled) =>
            onUpdateProfile({ notificationsEnabled })
          }
          offlineCacheEnabled={profile.offlineCacheEnabled}
          onChangeOfflineCache={(offlineCacheEnabled) =>
            onUpdateProfile({ offlineCacheEnabled })
          }
          onBack={() => onNavigate('goals')}
          onContinue={() => onNavigate('baseline')}
        />
      );

    case 'baseline':
      return (
        <A14_PlacementDiagnostic
          subjectCount={profile.selectedSubjects.length}
          trackLabel={TRACK_LABELS[profile.track]}
          targetScore={profile.targetScore}
          onBack={() => onNavigate('permissions')}
          onStart={() => onNavigate('diagnostic')}
          onSkip={onFinish}
        />
      );

    default:
      return null;
  }
};

export default RegistrationFlow;
