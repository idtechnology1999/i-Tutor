export type ScreenId =
  | 'A01_SPLASH'
  | 'A02_ONBOARDING'
  | 'A03_WELCOME'
  | 'A04_SIGNUP'
  | 'A05_OTP'
  | 'A06_LOGIN'
  | 'A07_FORGOT_PW'
  | 'A08_RESET_PW'
  | 'A09_EXAM_TRACK'
  | 'A10_SUBJECTS'
  | 'A11_INSTITUTION'
  | 'A12_GOALS'
  | 'A13_PERMISSIONS'
  | 'A14_DIAGNOSTIC'
  | 'DIAGNOSTIC_QUIZ'
  | 'HOME_DASHBOARD';

export type ExamTrack = 'jamb' | 'post-jamb' | 'both';

export type DailyCommitment = '30min' | '1hour' | '2hours' | '3hours';

export interface UserProfile {
  fullName: string;
  phoneOrEmail: string;
  track: ExamTrack;
  selectedSubjects: string[];
  targetInstitution: string;
  targetInstitutionType: 'Federal' | 'State' | 'Private';
  targetCourse: string;
  targetFaculty: string;
  examMonth: string;
  targetScore: number;
  dailyCommitment: DailyCommitment;
  notificationsEnabled: boolean;
  offlineCacheEnabled: boolean;
  diagnosticCompleted: boolean;
  diagnosticScore: number;
  /** Premium unlocks unlimited AI tutor help. Missing means free. */
  plan?: 'free' | 'premium';
}

export type NetworkMode = '4G' | 'SLOW_3G' | 'OFFLINE';

export type DeviceMode = 'iphone' | 'fluid';

export interface DiagnosticQuestion {
  id: number;
  subject: 'Physics' | 'Chemistry' | 'Mathematics' | 'English';
  topic: string;
  question: string;
  options: { label: string; text: string }[];
  correctAnswer: string;
  explanation: string;
}

export interface Institution {
  id: string;
  name: string;
  shortName: string;
  type: 'Federal' | 'State' | 'Private';
  location: string;
  minCutOff: number;
}

export interface Course {
  id: string;
  name: string;
  faculty: string;
  benchmarkScore: number;
  requiredSubjects: string[];
}
