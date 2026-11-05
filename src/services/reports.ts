import { api } from './api';

/* Admin → Reports (backend routes/admin/reports.ts). Any admin can look at a
   report; downloading one sends the super admin password, and the server
   logs the download. Dates are Lagos days, yyyy-mm-dd. */

export type LogKind = 'action' | 'login' | 'login-failed' | 'logout' | 'download';

export interface LogRow {
  at: string;
  text: string;
  kind: LogKind;
  /** The admin's name; empty for the system (e.g. the AI tutor). */
  who: string;
  email: string;
  role: 'superadmin' | 'admin' | '';
  ip: string;
}

export interface LogsReport {
  from: string;
  to: string;
  truncated: boolean;
  admins: Array<{ id: string; name: string; email: string; role: string }>;
  rows: LogRow[];
}

export interface LoginsReport {
  from: string;
  to: string;
  admins: Array<{ id: string; name: string; email: string; role: string; status: string; lastLoginAt: string | null; signIns: number; failed: number }>;
  unknownFailed: number;
  rows: LogRow[];
}

export interface SubjectCoverage {
  subject: string;
  done: number[];
  review: number[];
  published: number;
  drafts: number;
  noYear: number;
}

export interface ContentReport {
  generatedAt: string;
  exams: Array<{
    id: string;
    label: string;
    name: string;
    enabled: boolean;
    kind: string;
    subjects: SubjectCoverage[];
    schools: Array<{ school: string; subjects: SubjectCoverage[] }>;
  }>;
  practice: Array<{ subject: string; published: number; drafts: number }>;
}

export interface SystemTotals {
  students: number;
  verified: number;
  premium: number;
  everPaid: number;
  payments: number;
  revenueNaira: number;
  questionsPublished: number;
  questionsDraft: number;
  needsReview: number;
  papers: number;
  news: number;
  pages: number;
  images: number;
  courses: number;
  admins: number;
  practiceSessions: number;
  aiRequests: number;
  aiFailed: number;
  aiNaira: number;
}

export interface DayRow {
  date: string;
  newStudents: number;
  payments: number;
  revenueNaira: number;
  questionsAdded: number;
  practiceSessions: number;
  activeStudents: number;
  aiRequests: number;
  aiNaira: number;
  adminActions: number;
  signIns: number;
}

export interface SystemReport {
  generatedAt: string;
  from: string;
  to: string;
  totals: SystemTotals;
  period: Omit<DayRow, 'date' | 'activeStudents'>;
  /** Newest first. */
  days: DayRow[];
}

export interface DayReport {
  generatedAt: string;
  date: string;
  summary: DayRow;
  students: Array<{ name: string; at: string; verified: boolean; exams: string[] }>;
  payments: Array<{ name: string; plan: string; naira: number; at: string }>;
  papers: Array<{ exam: string; subject: string; year: number; school: string; published: number; drafts: number }>;
  activity: LogRow[];
}

export interface UsersReport {
  generatedAt: string;
  months: Array<{ month: string; joined: number; verified: number; paidStudents: number; payments: number; revenueNaira: number }>;
  totals: { students: number; verified: number; premium: number; everPaid: number; revenueNaira: number; active30: number; paidRate: number };
  byExam: Array<{ exam: string; count: number }>;
  /** Downloads only. */
  students?: Array<{ name: string; contact: string; verified: boolean; plan: string; exams: string; course: string; school: string; joined: string; lastActive: string }>;
}

export interface ReportMap {
  logs: LogsReport;
  logins: LoginsReport;
  content: ContentReport;
  system: SystemReport;
  day: DayReport;
  users: UsersReport;
}
export type ReportName = keyof ReportMap;

const query = (o: Record<string, string | number | undefined>) => {
  const q = Object.entries(o)
    .filter(([, v]) => v !== undefined && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&');
  return q ? `?${q}` : '';
};

/** One report, to look at on screen. */
export const loadReport = <K extends ReportName>(name: K, options: Record<string, string | number | undefined> = {}) =>
  api<ReportMap[K]>(`/api/admin/reports/${name}${query(options)}`, { timeout: 60_000 });

/** The same report for downloading: needs the super admin password (and is logged). */
export const downloadReport = <K extends ReportName>(name: K, password: string, options: Record<string, string | number | undefined> = {}) =>
  api<ReportMap[K]>('/api/admin/reports/download', {
    method: 'POST',
    body: { password, report: name, options: Object.fromEntries(Object.entries(options).filter(([, v]) => v !== undefined && v !== '')) },
    timeout: 90_000,
  });
