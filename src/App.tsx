import { Suspense, lazy, useEffect, useState } from 'react';
import type { DiagnosticQuestion, UserProfile } from './types';
import { Navbar } from './components/web/Navbar';
import { isLiveExam, liveExamNames, loadExams, useExams } from './lib/exams';
import { initMotion } from './lib/motion';
import { useRouter, pathForView, isAccountFlowView, isAppView } from './lib/router';
import type { AppView } from './lib/router';
import { HomePageView } from './components/web/HomePageView';
import { CmsContext } from './cms/read';
import { CreditWarning } from './components/web/CreditWarning';
import type { CmsEnv } from './cms/read';
import { syncQuestions } from './lib/cms';
import type { ExamType } from './lib/cms';
import { tutorById } from './data/tutors';
import { loadProfile, saveProfile } from './services/profile';
import { isLive } from './services/api';
import { examsOf, subjectsFor } from './lib/student-exams';
import { logOut } from './services/auth';
import { canUse, setCreditsPlan } from './services/credits';
import type { SolveRequest } from './data/tutors';

/* Each page's code downloads when it's first opened, so the homepage (what
   most visitors see first) loads quickly on slow mobile data. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- any props, kept exact through M[K]
const page = <K extends string, M extends Record<K, React.ComponentType<any>>>(load: () => Promise<M>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })));
const DashboardView = page(() => import('./components/web/DashboardView'), 'DashboardView');
const CBTExamView = page(() => import('./components/web/CBTExamView'), 'CBTExamView');
const SyllabusView = page(() => import('./components/web/SyllabusView'), 'SyllabusView');
const ProfileView = page(() => import('./components/web/ProfileView'), 'ProfileView');
const UpgradeView = page(() => import('./components/web/UpgradeView'), 'UpgradeView');
const AITutorDrawer = page(() => import('./components/web/AITutorDrawer'), 'AITutorDrawer');
const RegistrationFlow = page(() => import('./components/screens/web/RegistrationFlow'), 'RegistrationFlow');
const AdminApp = page(() => import('./components/admin/AdminApp'), 'AdminApp');
const CourseView = page(() => import('./components/web/CourseView'), 'CourseView');
const PostUtmeView = page(() => import('./components/web/PostUtmeView'), 'PostUtmeView');
const ClassroomView = page(() => import('./components/web/ClassroomView'), 'ClassroomView');
const CmsPageView = page(() => import('./components/web/CmsPageView'), 'CmsPageView');

const PLAN_KEY = 'itutor-plan';
const TUTOR_KEY = 'itutor-tutor';

/* Demo mode only: with a backend, the plan comes from the server alone, so a
   "premium" left in this browser can never unlock another account. */
const storedPlan = (): UserProfile['plan'] => {
  if (isLive) return 'free';
  try {
    return window.localStorage.getItem(PLAN_KEY) === 'premium' ? 'premium' : 'free';
  } catch {
    return 'free';
  }
};

const storedTutor = () => {
  try {
    return window.localStorage.getItem(TUTOR_KEY) ?? undefined;
  } catch {
    return undefined;
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
  home: 'i-Tutor — JAMB, WAEC, NECO & Post-UTME practice that teaches',
  cbt: 'Practice exam — i-Tutor',
  syllabus: 'Past questions — i-Tutor',
  dashboard: 'Home — i-Tutor',
  setup: 'My profile — i-Tutor',
  upgrade: 'Upgrade — i-Tutor',
  admin: 'Admin — i-Tutor',
  course: 'Practise for your course — i-Tutor',
  postutme: 'Post-UTME by school — i-Tutor',
  classroom: 'My classroom — i-Tutor',
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
  page: 'i-Tutor',
};

export function App() {
  const { view: activeView, path, navigate } = useRouter();
  const [profile, setProfile] = useState<UserProfile>(() => ({ ...DEFAULT_PROFILE, plan: storedPlan(), tutorId: storedTutor() }));
  // The demo profile is pre-filled, so onboarding has to be gated on whether a
  // candidate actually went through A04/A05 rather than on the profile being
  // non-empty.
  const [hasAccount, setHasAccount] = useState(false);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  // The tutor drawer's code is fetched on first open and kept after that.
  const [tutorLoaded, setTutorLoaded] = useState(false);
  if (isTutorOpen && !tutorLoaded) setTutorLoaded(true);
  // Subject the student tapped before opening the exam (pre-selected in setup).
  const [examSubject, setExamSubject] = useState<DiagnosticQuestion['subject'] | undefined>();
  const [examCourse, setExamCourse] = useState<{ name: string; subjects: string[]; exam?: string; school?: string } | undefined>();
  const isCbt = activeView === 'cbt';
  const isAdmin = activeView === 'admin';
  const inApp = isAppView(activeView);

  const goTo = (view: AppView) => navigate(pathForView(view));

  // The exams switched on in Admin → Settings → Exams (admins load all of them in AdminApp).
  const examList = useExams();
  useEffect(() => {
    if (!isAdmin) void loadExams();
  }, [isAdmin]);
  // Post-UTME switched off: its pages go back to the home page.
  const postUtmeOff = !isLiveExam('Post-UTME');
  useEffect(() => {
    if (postUtmeOff && activeView === 'postutme') navigate(pathForView('home'));
  }, [postUtmeOff, activeView, navigate]);
  const openTutor = () => setIsTutorOpen(true);
  const isPremium = profile.plan === 'premium';
  // The AI allowance ring follows the plan (and the account signed in).
  useEffect(() => {
    setCreditsPlan(isPremium);
  }, [isPremium, profile.phoneOrEmail]);
  const tutor = isPremium ? tutorById(profile.tutorId) : undefined;
  // "Solve this with my tutor": Premium opens a fresh session on that question.
  const [solve, setSolve] = useState<{ req?: SolveRequest; n: number } | null>(null);
  // Free students can ask too, from their 5 free prompts; the server takes the allowance.
  const solveWithTutor = (req: SolveRequest) => {
    // With nothing left the tutor opens on the subscribe / renew prompt instead.
    const allowed = canUse(req.mode === 'hint' ? 'hint' : 'explain');
    setSolve((prev) => (allowed ? { req, n: (prev?.n ?? 0) + 1 } : { n: (prev?.n ?? 0) + 1 }));
    setIsTutorOpen(true);
  };
  const solveLabel = isPremium ? `Solve with ${tutor?.name ?? 'my tutor'}` : 'Explain with AI';
  const askLabel = isPremium ? `Ask ${tutor?.name ?? 'my tutor'}` : 'Ask AI';
  const chooseTutor = (tutorId: string) => {
    handleUpdateProfile({ tutorId });
    try {
      window.localStorage.setItem(TUTOR_KEY, tutorId);
    } catch {
      /* not persisted when storage is blocked */
    }
  };
  // Weak-topic practice: one subject, one topic.
  const [examTopic, setExamTopic] = useState<string | undefined>();
  const launchExam = (subject?: DiagnosticQuestion['subject'], topic?: string) => {
    setExamSubject(subject);
    setExamTopic(subject ? topic : undefined);
    setExamCourse(undefined);
    goTo('cbt');
  };
  // Past questions opened from the Post-UTME page land on that school.
  const [pq, setPq] = useState<{ exam?: ExamType; school?: string }>({});
  const launchCourseExam = (course: { name: string; subjects: string[]; exam?: string; school?: string }) => {
    setExamSubject(undefined);
    setExamTopic(undefined);
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
    // CMS pages set their own title once loaded.
    // The home title names the exams that are switched on (Admin → Settings → Exams).
    if (activeView !== 'page') document.title = activeView === 'home' ? `i-Tutor — ${liveExamNames() || 'Exam'} practice that teaches` : TITLES[activeView];
  }, [activeView, examList]);

  const handleUpdateProfile = (updated: Partial<UserProfile>) => {
    setProfile((prev) => ({ ...prev, ...updated }));
    // With a backend, changes are saved to the student's account (demo: no-op).
    saveProfile(updated).catch(() => {
      /* kept locally; the next change retries */
    });
  };

  // With a backend, the signed-in student (incl. their real plan) comes from the server.
  const refreshProfile = () =>
    loadProfile().then((me) => {
      if (me) {
        setProfile(me);
        setHasAccount(true);
      }
    });

  useEffect(() => {
    if (isLive) {
      // Clear any plan an older version saved in this browser.
      try {
        window.localStorage.removeItem(PLAN_KEY);
      } catch {
        /* storage blocked */
      }
    }
    void refreshProfile();
    // The admin loads its own copy (drafts too) when an admin signs in.
    if (!window.location.pathname.startsWith('/admin')) void syncQuestions('student');
  }, []);

  const activatePremium = () => {
    if (isLive) {
      // The server has confirmed the payment; read the plan back from it.
      void refreshProfile();
      return;
    }
    handleUpdateProfile({ plan: 'premium' });
    try {
      window.localStorage.setItem(PLAN_KEY, 'premium');
    } catch {
      /* not persisted when storage is blocked */
    }
  };

  // Buttons and links on CMS-built pages (the homepage included).
  const cmsEnv: CmsEnv = {
    editing: false,
    run: (href) => {
      if (href === 'action:cbt') return launchExam();
      if (href === 'action:tutor') return openTutor();
      if (href.startsWith('action:')) return;
      if (/^(https?:|mailto:|tel:)/i.test(href)) {
        window.open(href, '_blank', 'noopener');
        return;
      }
      const [to, hash] = href.split('#');
      if (to) navigate(to);
      if (hash) window.setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: 'smooth' }), to ? 400 : 0);
    },
  };

  if (isAdmin)
    return (
      <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
        <AdminApp path={path} navigate={navigate} onExit={() => goTo('home')} />
      </Suspense>
    );

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

      <CmsContext.Provider value={cmsEnv}>
      <main>
        <Suspense fallback={<div className="page-loading" aria-busy="true" />}>
        {isCbt && (
          <CBTExamView
            onSolve={solveWithTutor}
            solveLabel={solveLabel}
            askLabel={askLabel}
            key={examCourse ? `${examCourse.exam ?? 'UTME'}-${examCourse.school ?? ''}-${examCourse.name}` : `${examSubject ?? 'any'}-${examTopic ?? ''}`}
            profile={profile}
            presetSubject={examSubject}
            presetTopic={examTopic}
            presetCourse={examCourse}
            onExit={() => {
              setExamSubject(undefined);
              setExamCourse(undefined);
              goTo('dashboard');
            }}
            onOpenTutor={openTutor}
            onUpgrade={() => goTo('upgrade')}
            onRoute={(to) => navigate(to, { replace: true })}
          />
        )}

        {activeView === 'home' && <HomePageView />}

        {activeView === 'page' && <CmsPageView key={path} slug={path.replace(/^\/+|\/+$/g, '').toLowerCase()} onHome={() => goTo('home')} />}

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
            tutor={tutor}
            onOpenPastQuestions={(exam) => {
              setPq({ exam });
              goTo('syllabus');
            }}
          />
        )}

        {activeView === 'syllabus' && (
          <SyllabusView
            onSolve={solveWithTutor}
            solveLabel={solveLabel}
            askLabel={askLabel}
            key={`${pq.exam ?? 'any'}-${pq.school ?? ''}`}
            onOpenTutor={openTutor}
            initialExam={pq.exam}
            initialSchool={pq.school}
            exams={examsOf(profile)}
            subjectsFor={(exam) => subjectsFor(profile, exam)}
            tutor={tutor}
            firstName={profile.fullName.split(' ')[0] || 'there'}
            onUpgrade={() => goTo('upgrade')}
          />
        )}

        {activeView === 'classroom' && (
          <ClassroomView profile={profile} isPremium={isPremium} tutor={tutor} onUpgrade={() => goTo('upgrade')} />
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
            tutorId={profile.tutorId}
            onChooseTutor={chooseTutor}
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
              logOut().catch(() => {
                /* signed out locally either way */
              });
              setHasAccount(false);
              // Forget this student so the next person on this device starts clean.
              setProfile({ ...DEFAULT_PROFILE, plan: storedPlan() });
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
            onAccountReady={() => {
              setHasAccount(true);
              // Signed in: load the real account (and its real plan) from the server.
              void refreshProfile();
            }}
            onFinish={() => goTo('dashboard')}
          />
        )}
        </Suspense>
      </main>
      </CmsContext.Provider>

      {/* Running-low notice for the AI allowance; not during a timed exam. */}
      {!isCbt && <CreditWarning onUpgrade={() => goTo('upgrade')} />}

      {/* Its code loads the first time it opens, then it stays (keeping the chat). */}
      {tutorLoaded && (
      <Suspense fallback={null}>
      <AITutorDrawer
        key={solve?.n ?? 0}
        solve={solve?.req}
        tutor={tutor}
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        isPremium={isPremium}
        onUpgrade={() => goTo('upgrade')}
        studentName={profile.fullName.split(' ')[0]}
        onNavigate={(view) => (view === 'cbt' ? launchExam() : goTo(view))}
      />
      </Suspense>
      )}

      {!isCbt && activeView !== 'home' && activeView !== 'page' && (
        <footer className="app-footer">
          <div className="container app-footer__inner">
            <span>
              <strong>i-Tutor</strong> · JAMB, WAEC, NECO &amp; Post-UTME practice
            </span>
            <span>© 2026 i-Tutor · Not affiliated with JAMB</span>
          </div>
        </footer>
      )}
    </div>
  );
}

export default App;
