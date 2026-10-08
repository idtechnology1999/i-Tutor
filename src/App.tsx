import { useEffect, useState } from 'react';
import type { DiagnosticQuestion, UserProfile } from './types';
import { Navbar } from './components/web/Navbar';
import { initMotion } from './lib/motion';
import { useRouter, pathForView, isAccountFlowView, isAppView } from './lib/router';
import type { AppView } from './lib/router';
import { HomePageView } from './components/web/HomePageView';
import { DashboardView } from './components/web/DashboardView';
import { CBTExamView } from './components/web/CBTExamView';
import { SyllabusView } from './components/web/SyllabusView';
import { ProfileView } from './components/web/ProfileView';
import { UpgradeView } from './components/web/UpgradeView';
import { AITutorDrawer } from './components/web/AITutorDrawer';
import { RegistrationFlow } from './components/screens/web/RegistrationFlow';
import { AdminApp } from './components/admin/AdminApp';
import { CourseView } from './components/web/CourseView';
import { PostUtmeView } from './components/web/PostUtmeView';
import type { ExamType } from './lib/cms';

const PLAN_KEY = 'itutor-plan';

const storedPlan = (): UserProfile['plan'] => {
  try {
    return window.localStorage.getItem(PLAN_KEY) === 'premium' ? 'premium' : 'free';
  } catch {
    return 'free';
  }
};

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Amina Chinedu',
  phoneOrEmail: '0801 234 5678',
  track: 'both',
  exams: ['UTME', 'Post-UTME'],
  selectedSubjects: ['English Language', 'Mathematics', 'Physics', 'Chemistry'],
  targetInstitution: 'University of Lagos (UNILAG)',
  targetInstitutionType: 'Federal',
  targetCourse: 'Medicine & Surgery',
  targetFaculty: 'College of Medicine',
  examMonth: 'April 2026',
  targetScore: 285,
  dailyCommitment: '1hour',
  notificationsEnabled: true,
  offlineCacheEnabled: true,
  diagnosticCompleted: true,
  diagnosticScore: 78,
  plan: 'free',
};

const TITLES: Record<AppView, string> = {
  home: 'i-Tutor — UTME & Post-UTME practice that teaches',
  cbt: 'Practice exam — i-Tutor',
  syllabus: 'Past questions — i-Tutor',
  dashboard: 'Home — i-Tutor',
  setup: 'My profile — i-Tutor',
  upgrade: 'Upgrade — i-Tutor',
  admin: 'Admin — i-Tutor',
  course: 'Practise for your course — i-Tutor',
  postutme: 'Post-UTME by school — i-Tutor',
  signup: 'Create your account — i-Tutor',
  otp: 'Verify your contact — i-Tutor',
  login: 'Log in — i-Tutor',
  forgot: 'Reset your password — i-Tutor',
  reset: 'Set a new password — i-Tutor',
  track: 'Step 1 · Your exams — i-Tutor',
  schoolcert: 'Your class & subjects — i-Tutor',
  subjects: 'Step 2 · Subjects — i-Tutor',
  institution: 'Step 3 · Institution & course — i-Tutor',
  goals: 'Step 4 · Exam date & goal — i-Tutor',
  permissions: 'Step 5 · Reminders & offline — i-Tutor',
  baseline: 'Step 6 · Placement test — i-Tutor',
};

export function App() {
  const { view: activeView, path, navigate } = useRouter();
  const [profile, setProfile] = useState<UserProfile>(() => ({ ...DEFAULT_PROFILE, plan: storedPlan() }));
  // The demo profile is pre-filled, so onboarding has to be gated on whether a
  // candidate actually went through A04/A05 rather than on the profile being
  // non-empty.
  const [hasAccount, setHasAccount] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  // Subject the student tapped before opening the exam (pre-selected in setup).
  const [examSubject, setExamSubject] = useState<DiagnosticQuestion['subject'] | undefined>();
  const [examCourse, setExamCourse] = useState<{ name: string; subjects: string[]; exam?: string; school?: string } | undefined>();
  const isCbt = activeView === 'cbt';
  const isAdmin = activeView === 'admin';
  const inApp = isAppView(activeView);

  const goTo = (view: AppView) => navigate(pathForView(view));
  const openTutor = () => setIsTutorOpen(true);
  const launchExam = (subject?: DiagnosticQuestion['subject']) => {
    setExamSubject(subject);
    setExamCourse(undefined);
    goTo('cbt');
  };
  // Past questions opened from the Post-UTME page land on that school.
  const [pq, setPq] = useState<{ exam?: ExamType; school?: string }>({});
  const launchCourseExam = (course: { name: string; subjects: string[]; exam?: string; school?: string }) => {
    setExamSubject(undefined);
    setExamCourse(course);
    goTo('cbt');
  };

  // The exam owns the whole screen: no site header, no footer, no exits
  // except its own (which ask first).
  useEffect(() => {
    document.documentElement.classList.toggle('is-cbt', isCbt);
    document.body.classList.toggle('cbt-active', isCbt);
    return () => {
      document.documentElement.classList.remove('is-cbt');
      document.body.classList.remove('cbt-active');
    };
  }, [isCbt]);

  useEffect(() => {
    document.documentElement.classList.toggle('has-tabbar', inApp);
  }, [inApp]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => initMotion());
    return () => cancelAnimationFrame(frame);
  }, [activeView]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  useEffect(() => {
    document.title = TITLES[activeView];
  }, [activeView]);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  const activatePremium = () => {
    handleUpdateProfile({ plan: 'premium' });
    try {
      window.localStorage.setItem(PLAN_KEY, 'premium');
    } catch {
      /* not persisted when storage is blocked */
    }
  };

  if (isAdmin) return <AdminApp path={path} navigate={navigate} onExit={() => goTo('home')} />;

  return (
    <div className="app-container">
      {!isCbt && (
        <Navbar
          activeView={activeView}
          onChangeView={goTo}
          profile={profile}
          isTutorOpen={isTutorOpen}
          onToggleTutor={() => setIsTutorOpen(!isTutorOpen)}
        />
      )}

      <main>
        {isCbt && (
          <CBTExamView
            key={examCourse ? `${examCourse.exam ?? 'UTME'}-${examCourse.school ?? ''}-${examCourse.name}` : (examSubject ?? 'any')}
            profile={profile}
            presetSubject={examSubject}
            presetCourse={examCourse}
            onExit={() => {
              setExamSubject(undefined);
              setExamCourse(undefined);
              goTo('dashboard');
            }}
            onOpenTutor={openTutor}
          />
        )}

        {activeView === 'home' && (
          <HomePageView
            onLaunchCBT={() => launchExam()}
            onOpenSyllabus={() => goTo('syllabus')}
            onGoToDashboard={() => goTo('dashboard')}
            onOpenTutor={openTutor}
            onUpgrade={() => goTo('upgrade')}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            profile={profile}
            onLaunchCBT={launchExam}
            onOpenSyllabus={() => goTo('syllabus')}
            onOpenTutor={openTutor}
            onUpgrade={() => goTo('upgrade')}
            onEditGoal={() => goTo('setup')}
            onOpenCourse={() => goTo('course')}
            onOpenPostUtme={() => goTo('postutme')}
            onStartPractice={launchCourseExam}
            onOpenPastQuestions={(exam) => {
              setPq({ exam });
              goTo('syllabus');
            }}
          />
        )}

        {activeView === 'syllabus' && (
          <SyllabusView
            key={`${pq.exam ?? 'any'}-${pq.school ?? ''}`}
            onOpenTutor={openTutor}
            initialExam={pq.exam}
            initialSchool={pq.school}
          />
        )}

        {activeView === 'postutme' && (
          <PostUtmeView
            profile={profile}
            onStart={launchCourseExam}
            onBrowse={(school) => {
              setPq({ exam: 'Post-UTME', school });
              goTo('syllabus');
            }}
            onChangeSchool={() => goTo('setup')}
          />
        )}

        {activeView === 'course' && (
          <CourseView profile={profile} onStart={launchCourseExam} onUpdateProfile={handleUpdateProfile} />
        )}

        {activeView === 'upgrade' && (
          <UpgradeView
            profile={profile}
            onActivated={activatePremium}
            onOpenTutor={openTutor}
            onGoHome={() => goTo('dashboard')}
          />
        )}

        {activeView === 'setup' && (
          <ProfileView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onUpgrade={() => goTo('upgrade')}
            onLogOut={() => {
              setHasAccount(false);
              goTo('home');
            }}
          />
        )}

        {isAccountFlowView(activeView) && (
          <RegistrationFlow
            view={activeView}
            profile={profile}
            hasAccount={hasAccount}
            onNavigate={goTo}
            onUpdateProfile={handleUpdateProfile}
            onAccountReady={() => setHasAccount(true)}
            onFinish={() => goTo('dashboard')}
          />
        )}
      </main>

      <AITutorDrawer
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        isPremium={profile.plan === 'premium'}
        onUpgrade={() => goTo('upgrade')}
        studentName={profile.fullName.split(' ')[0]}
        onNavigate={(view) => (view === 'cbt' ? launchExam() : goTo(view))}
      />

      {!isCbt && activeView !== 'home' && (
        <footer className="app-footer">
          <div className="container app-footer__inner">
            <span>
              <strong>i-Tutor</strong> · UTME &amp; Post-UTME practice
            </span>
            <span>© 2026 i-Tutor · Not affiliated with JAMB</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
