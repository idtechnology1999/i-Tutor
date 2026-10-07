import { useEffect, useState } from 'react';
import type { UserProfile } from './types';
import { Navbar } from './components/web/Navbar';
import { initMotion } from './lib/motion';
import { useRouter, pathForView, isAccountFlowView } from './lib/router';
import type { AppView } from './lib/router';
import { HomePageView } from './components/web/HomePageView';
import { DashboardView } from './components/web/DashboardView';
import { CBTExamView } from './components/web/CBTExamView';
import { SyllabusView } from './components/web/SyllabusView';
import { SetupWizardView } from './components/web/SetupWizardView';
import { AITutorDrawer } from './components/web/AITutorDrawer';
import { RegistrationFlow } from './components/screens/web/RegistrationFlow';

const DEFAULT_PROFILE: UserProfile = {
  fullName: 'Amina Chinedu',
  phoneOrEmail: '0801 234 5678',
  track: 'both',
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
};

export function App() {
  const { view: activeView, navigate } = useRouter();
  const [profile, setProfile] = useState<UserProfile>(DEFAULT_PROFILE);
  // The demo profile is pre-filled, so onboarding has to be gated on whether a
  // candidate actually went through A04/A05 rather than on the profile being
  // non-empty.
  const [hasAccount, setHasAccount] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const isCbt = activeView === 'cbt';

  const goTo = (view: AppView) => navigate(pathForView(view));

  // The CBT hall owns the viewport while it is running — a shared header that
  // scrolls away mid-paper costs the candidate the timer and palette.
  useEffect(() => {
    document.documentElement.classList.toggle('is-cbt', isCbt);
    document.body.classList.toggle('cbt-active', isCbt);
    return () => {
      document.documentElement.classList.remove('is-cbt');
      document.body.classList.remove('cbt-active');
    };
  }, [isCbt]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => initMotion());
    return () => cancelAnimationFrame(frame);
  }, [activeView]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [activeView]);

  useEffect(() => {
    const titles: Record<AppView, string> = {
      home: 'i-Teacher — UTME & Post-UTME practice that teaches',
      cbt: 'CBT Simulation — i-Teacher',
      syllabus: 'Syllabus & Past Questions — i-Teacher',
      dashboard: 'Student Portal — i-Teacher',
      setup: 'Candidate Profile — i-Teacher',
      signup: 'Create your account — i-Teacher',
      otp: 'Verify your contact — i-Teacher',
      login: 'Log in — i-Teacher',
      forgot: 'Reset your password — i-Teacher',
      reset: 'Set a new password — i-Teacher',
      track: 'Step 1 · Exam track — i-Teacher',
      subjects: 'Step 2 · Subjects — i-Teacher',
      institution: 'Step 3 · Institution & course — i-Teacher',
      goals: 'Step 4 · Exam date & goal — i-Teacher',
      permissions: 'Step 5 · Reminders & offline — i-Teacher',
      baseline: 'Step 6 · Placement test — i-Teacher',
    };
    document.title = titles[activeView];
  }, [activeView]);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
  };

  return (
    <div className="app-container">
      <Navbar
        activeView={activeView}
        onChangeView={goTo}
        profile={profile}
        isTutorOpen={isTutorOpen}
        onToggleTutor={() => setIsTutorOpen(!isTutorOpen)}
      />

      <main>
        {isCbt && (
          <CBTExamView profile={profile} onExit={() => goTo('dashboard')} />
        )}

        {activeView === 'home' && (
          <HomePageView
            onLaunchCBT={() => goTo('cbt')}
            onOpenSyllabus={() => goTo('syllabus')}
            onGoToDashboard={() => goTo('dashboard')}
            onOpenTutor={() => setIsTutorOpen(true)}
          />
        )}

        {activeView === 'dashboard' && (
          <DashboardView
            profile={profile}
            onLaunchCBT={() => goTo('cbt')}
            onOpenSyllabus={() => goTo('syllabus')}
            onOpenTutor={() => setIsTutorOpen(true)}
          />
        )}

        {activeView === 'syllabus' && <SyllabusView />}

        {activeView === 'setup' && (
          <SetupWizardView
            profile={profile}
            onUpdateProfile={handleUpdateProfile}
            onFinish={() => goTo('dashboard')}
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

      <AITutorDrawer isOpen={isTutorOpen} onClose={() => setIsTutorOpen(false)} />

      {activeView !== 'home' && (
        <footer className="app-footer">
          <div className="container app-footer__inner">
            <div>
              <strong>i-Teacher</strong> &middot; Study platform for Nigerian
              WAEC, NECO, UTME and Post-UTME candidates
            </div>
            <div className="footer-compliance-tags" style={{ color: 'var(--slate-400)' }}>
              <span>2,400+ worked questions</span>
              <span>Offline capable</span>
              <span>Syllabus aligned 2024&ndash;2026</span>
            </div>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
