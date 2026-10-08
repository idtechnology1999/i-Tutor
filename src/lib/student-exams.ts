import type { ExamTrack, SchoolCert, StudentExam, UserProfile } from '../types';

/** Exams a student can prepare for, in the order students think of them. */
export const STUDENT_EXAMS: Array<{ id: StudentExam; name: string; full: string; desc: string }> = [
  {
    id: 'UTME',
    name: 'JAMB (UTME)',
    full: 'Unified Tertiary Matriculation Examination',
    desc: 'The CBT exam for university admission: English plus three subjects for your course.',
  },
  {
    id: 'Post-UTME',
    name: 'Post-UTME',
    full: 'University screening',
    desc: 'Your chosen school’s own screening test. You’ll pick the school in a later step.',
  },
  {
    id: 'WAEC',
    name: 'WAEC (WASSCE)',
    full: 'West African Senior School Certificate Examination',
    desc: 'Your final secondary school exam, May/June or private candidates.',
  },
  {
    id: 'NECO',
    name: 'NECO (SSCE)',
    full: 'National Examinations Council',
    desc: 'The national senior school certificate exam, June/July or Nov/Dec.',
  },
  {
    id: 'GCE',
    name: 'GCE',
    full: 'General Certificate Examination',
    desc: 'WAEC or NECO for private candidates, usually to improve a result.',
  },
  {
    id: 'NABTEB',
    name: 'NABTEB',
    full: 'National Business and Technical Examinations Board',
    desc: 'Technical and business certificate exams.',
  },
];

const NAME = Object.fromEntries(STUDENT_EXAMS.map((e) => [e.id, e.name])) as Record<StudentExam, string>;

/** Exams on the profile; older profiles only had a track. */
export const examsOf = (profile: Pick<UserProfile, 'exams' | 'track'>): StudentExam[] =>
  profile.exams ??
  (profile.track === 'jamb' ? ['UTME'] : profile.track === 'post-jamb' ? ['Post-UTME'] : ['UTME', 'Post-UTME']);

/** Keeps the older JAMB/Post-UTME track in step with the exams chosen. */
export const trackFor = (exams: StudentExam[]): ExamTrack => {
  const utme = exams.includes('UTME');
  const post = exams.includes('Post-UTME');
  return utme && post ? 'both' : post ? 'post-jamb' : 'jamb';
};

export const examsLabel = (exams: StudentExam[]) =>
  exams.length ? STUDENT_EXAMS.filter((e) => exams.includes(e.id)).map((e) => NAME[e.id]).join(', ') : 'No exam chosen';

/** Tick or untick one exam, returning the profile update. */
export const toggleExam = (current: StudentExam[], exam: StudentExam) => {
  const exams = current.includes(exam) ? current.filter((e) => e !== exam) : [...current, exam];
  return { exams, track: trackFor(exams) };
};

/* --------------------------------------------------------- School certificate */

/** Exams that need a class (Science/Arts/Commercial) and 7–9 subjects. */
export const SCHOOL_CERT_EXAMS: StudentExam[] = ['WAEC', 'NECO', 'GCE', 'NABTEB'];
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
  const utme = exams.includes('UTME');
  const post = exams.includes('Post-UTME');
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
