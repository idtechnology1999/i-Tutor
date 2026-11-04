import { isBySchool, isJambLike, isLiveExam, liveExams, onExamsChange } from './exams';
import type { ExamTrack, SchoolCert, StudentExam, UserProfile } from '../types';

/** Exams a student can register for: the ones switched on in Admin →
    Settings → Exams, in the admin's order (kept in step by lib/exams.ts). */
export const STUDENT_EXAMS: Array<{ id: StudentExam; name: string; full: string; desc: string }> = [];

/** Exams that need a class (Science/Arts/Commercial) and 7–9 subjects: WAEC, NECO, … and any added like them. */
export const SCHOOL_CERT_EXAMS: StudentExam[] = [];

onExamsChange((exams) => {
  STUDENT_EXAMS.splice(
    0,
    STUDENT_EXAMS.length,
    ...exams.filter((e) => e.enabled).map((e) => ({ id: e.id, name: e.label, full: e.name, desc: e.desc })),
  );
  SCHOOL_CERT_EXAMS.splice(0, SCHOOL_CERT_EXAMS.length, ...exams.filter((e) => e.kind === 'cert').map((e) => e.id));
});

/** The exam to fall back on: JAMB if it's on, otherwise the first exam that is. */
export const defaultExam = (): StudentExam => (isLiveExam('UTME') ? 'UTME' : (liveExams()[0]?.id ?? 'UTME'));

/** Exams on the profile; older profiles only had a track. */
export const examsOf = (profile: Pick<UserProfile, 'exams' | 'track'>): StudentExam[] =>
  // Exams switched off in Admin → Settings → Exams are hidden until they're switched back on.
  (profile.exams ?? (profile.track === 'jamb' ? ['UTME'] : profile.track === 'post-jamb' ? ['Post-UTME'] : ['UTME', 'Post-UTME'])).filter(isLiveExam);

/** Keeps the older JAMB/Post-UTME track in step with the exams chosen. */
export const trackFor = (exams: StudentExam[]): ExamTrack => {
  const utme = exams.includes('UTME');
  const post = exams.includes('Post-UTME');
  return utme && post ? 'both' : post ? 'post-jamb' : 'jamb';
};

export const examsLabel = (exams: StudentExam[]) =>
  exams.length ? STUDENT_EXAMS.filter((e) => exams.includes(e.id)).map((e) => e.name).join(', ') : 'No exam chosen';

/** Tick or untick one exam, returning the profile update. */
export const toggleExam = (current: StudentExam[], exam: StudentExam) => {
  const exams = current.includes(exam) ? current.filter((e) => e !== exam) : [...current, exam];
  return { exams, track: trackFor(exams) };
};

/* --------------------------------------------------------- School certificate */

export const hasSchoolCert = (exams: StudentExam[]) => exams.some((e) => SCHOOL_CERT_EXAMS.includes(e));
export const SCHOOL_CERT_MIN = 7;
export const SCHOOL_CERT_MAX = 9;
/** Compulsory in every class. */
export const SCHOOL_CERT_CORE = ['English', 'Mathematics'];

export const isSchoolCertValid = (value?: SchoolCert) =>
  Boolean(value?.className) &&
  (value?.subjects.length ?? 0) >= SCHOOL_CERT_MIN &&
  (value?.subjects.length ?? 0) <= SCHOOL_CERT_MAX;

/* ------------------------------------------------------------ Onboarding steps */

export type OnboardingStep = 'track' | 'schoolcert' | 'subjects' | 'institution' | 'goals' | 'permissions' | 'baseline';

const STEP_LABEL: Record<OnboardingStep, string> = {
  track: 'Your exams',
  schoolcert: 'Class & subjects',
  subjects: 'JAMB subjects',
  institution: 'School & course',
  goals: 'Date & goal',
  permissions: 'Permissions',
  baseline: 'Baseline',
};

/** Only the steps that apply to the exams chosen, in order. */
export const onboardingSteps = (exams: StudentExam[]): OnboardingStep[] => {
  // By kind, so an added exam gets the same steps as the exams it works like.
  const utme = exams.some(isJambLike);
  const post = exams.some(isBySchool);
  return [
    'track',
    ...(hasSchoolCert(exams) ? (['schoolcert'] as const) : []),
    ...(utme ? (['subjects'] as const) : []),
    ...(utme || post ? (['institution'] as const) : []),
    'goals',
    'permissions',
    'baseline',
  ];
};

export const onboardingLabels = (steps: OnboardingStep[]) => steps.map((s) => STEP_LABEL[s]);

/* ------------------------------------------------------- Registered subjects */

/** Profile names → question-bank names ("English Language" → "English"). */
const bankSubject = (s: string) => (s === 'English Language' || s === 'Use of English' ? 'English' : s);

/**
 * The subjects the student registered for one exam: JAMB is English plus
 * their three, the school-certificate exams are their class subjects. Null
 * when the exam has no subject list of its own (Post-UTME follows the school).
 */
export const subjectsFor = (
  profile: Pick<UserProfile, 'selectedSubjects' | 'schoolCert'>,
  exam: string,
): string[] | null => {
  const picked =
    isJambLike(exam)
      ? ['English', ...profile.selectedSubjects]
      : SCHOOL_CERT_EXAMS.includes(exam as StudentExam)
        ? (profile.schoolCert?.subjects ?? [])
        : [];
  const list = [...new Set(picked.map(bankSubject))];
  return list.length ? list : null;
};
