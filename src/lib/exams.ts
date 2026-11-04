import { useSyncExternalStore } from 'react';
import { api, isLive } from '../services/api';

/* The exams on i-Tutor (JAMB, WAEC, NECO, …), managed in Admin → Settings →
   Exams and loaded from the server when the site opens (backend
   lib/exams.ts). An exam can be switched off (hidden from students: not in
   registration, the dashboard, past questions or practice) and back on, and
   admins can add exams. Pages never check an exam's name for how it works,
   only its kind, so an added exam works like the others of its kind:
   - 'jamb'   English + 3 subjects, CBT (JAMB UTME)
   - 'cert'   a class + 7–9 subjects (WAEC, NECO, GCE, NABTEB, …)
   - 'school' papers by university (Post-UTME)
   Until the server answers, the built-in list below stands in. */

export type ExamKind = 'jamb' | 'cert' | 'school';

export interface ExamInfo {
  /** The code on papers and profiles: 'UTME', 'WAEC', 'JUPEB', … */
  id: string;
  /** Short name: 'JAMB', 'WAEC', … */
  label: string;
  /** Full name: 'JAMB UTME', 'WAEC WASSCE', … */
  name: string;
  desc: string;
  /** When it usually runs. */
  when: string;
  kind: ExamKind;
  enabled: boolean;
  order: number;
  builtIn: boolean;
}

export const BUILT_IN_EXAMS: ExamInfo[] = [
  { id: 'UTME', label: 'JAMB', name: 'JAMB UTME', desc: 'The CBT exam for university admission: English plus three subjects for your course.', when: 'Usually April/May', kind: 'jamb', enabled: true, order: 1, builtIn: true },
  { id: 'Post-UTME', label: 'Post-UTME', name: 'University Post-UTME', desc: 'Your chosen school’s own screening test. You’ll pick the school in a later step.', when: 'After JAMB results, by school', kind: 'school', enabled: true, order: 2, builtIn: true },
  { id: 'WAEC', label: 'WAEC', name: 'WAEC WASSCE', desc: 'Your final secondary school exam, May/June or private candidates.', when: 'School candidates: May/June · Private candidates: Nov/Dec', kind: 'cert', enabled: true, order: 3, builtIn: true },
  { id: 'NECO', label: 'NECO', name: 'NECO SSCE', desc: 'The national senior school certificate exam, June/July or Nov/Dec.', when: 'School candidates: June/July · Private candidates: Nov/Dec', kind: 'cert', enabled: true, order: 4, builtIn: true },
  { id: 'GCE', label: 'GCE', name: 'WAEC/NECO GCE', desc: 'WAEC or NECO for private candidates, usually to improve a result.', when: 'For private candidates, usually Nov/Dec', kind: 'cert', enabled: true, order: 5, builtIn: true },
  { id: 'NABTEB', label: 'NABTEB', name: 'NABTEB', desc: 'Technical and business certificate exams.', when: 'May/June and Nov/Dec series', kind: 'cert', enabled: true, order: 6, builtIn: true },
];

/* ------------------------------------------------------------------ Store */

let all: ExamInfo[] = BUILT_IN_EXAMS;
let version = 0;
const listeners = new Set<() => void>();
const changeHooks: Array<(exams: ExamInfo[]) => void> = [];

/** Lets other modules keep their own lists in step (cms.ts, student-exams.ts). */
export function onExamsChange(hook: (exams: ExamInfo[]) => void) {
  changeHooks.push(hook);
  hook(all);
}

function setExams(next: ExamInfo[]) {
  all = [...next].sort((a, b) => a.order - b.order);
  version += 1;
  for (const hook of changeHooks) hook(all);
  for (const l of listeners) l();
}

/** Every exam, switched on or off (students' pages show only the ones that are on). */
export const allExams = () => all;
/** The exams students see. */
export const liveExams = () => all.filter((e) => e.enabled);
export const isLiveExam = (id: string) => all.some((e) => e.id === id && e.enabled);
/** Shown on an admin's exam button that can't be used because the exam is off. */
export const OFF_NOTE = 'switched off in Settings → Exams. Switch it on there to work on it.';
export const examInfo = (id: string) => all.find((e) => e.id === id);
export const kindOf = (id: string): ExamKind | undefined => examInfo(id)?.kind;
export const isJambLike = (id: string) => kindOf(id) === 'jamb';
export const isCertLike = (id: string) => kindOf(id) === 'cert';
export const isBySchool = (id: string) => kindOf(id) === 'school';
export const examLabel = (id: string) => (id === 'Practice' ? 'Practice' : (examInfo(id)?.label ?? id));
/** "JAMB, WAEC and NECO": the switched-on exams, for page text. */
export const liveExamNames = () => {
  const names = liveExams().map((e) => e.label);
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
};

/** Re-renders when the exam list changes. */
export function useExams(): ExamInfo[] {
  useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    () => version,
  );
  return all;
}

/* ------------------------------------------------------------- Loading */

const DEMO_KEY = 'itutor-exams';

const demoExams = (): ExamInfo[] => {
  try {
    const saved = JSON.parse(window.localStorage.getItem(DEMO_KEY) ?? 'null') as ExamInfo[] | null;
    if (Array.isArray(saved) && saved.length) return saved;
  } catch {
    /* built-in */
  }
  return BUILT_IN_EXAMS;
};

const saveDemo = (exams: ExamInfo[]) => {
  try {
    window.localStorage.setItem(DEMO_KEY, JSON.stringify(exams));
  } catch {
    /* not kept when storage is blocked */
  }
};

/** Every exam and whether it's on. Called when the site opens. */
export async function loadExams() {
  if (!isLive) return setExams(demoExams());
  try {
    const exams = await api<ExamInfo[]>('/api/exams');
    if (exams.length) setExams(exams);
  } catch {
    /* keep the built-in list */
  }
}

/* --------------------------------------------------------------- Admin */

/** Admins: every exam, on or off. */
export async function loadAdminExams(): Promise<ExamInfo[]> {
  const exams = isLive ? await api<ExamInfo[]>('/api/admin/exams') : demoExams();
  setExams(exams);
  return all;
}

export async function editExam(id: string, patch: Partial<Pick<ExamInfo, 'label' | 'name' | 'desc' | 'when' | 'order'>>): Promise<ExamInfo[]> {
  if (!isLive) {
    const next = demoExams().map((e) => (e.id === id ? { ...e, ...patch } : e));
    saveDemo(next);
    setExams(next);
    return all;
  }
  setExams(await api<ExamInfo[]>(`/api/admin/exams/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch }));
  return all;
}

/** On or off (needs the super admin password when live). */
export async function switchExam(id: string, enabled: boolean, password: string): Promise<ExamInfo[]> {
  if (!isLive) {
    const next = demoExams().map((e) => (e.id === id ? { ...e, enabled } : e));
    if (!next.some((e) => e.enabled)) throw new Error('At least one exam has to stay on, or students would have nothing to register for.');
    saveDemo(next);
    setExams(next);
    return all;
  }
  setExams(await api<ExamInfo[]>(`/api/admin/exams/${encodeURIComponent(id)}/switch`, { method: 'POST', body: { enabled, password } }));
  return all;
}

export interface NewExam {
  label: string;
  name: string;
  desc: string;
  when: string;
  kind: 'jamb' | 'cert';
  enabled: boolean;
}

/** Adds an exam that works like JAMB or like WAEC/NECO (needs the super admin password when live). */
export async function addExam(exam: NewExam, password: string): Promise<ExamInfo[]> {
  if (!isLive) {
    const id = exam.label.replace(/[^A-Za-z0-9-]+/g, '-').replace(/^-+|-+$/g, '').toUpperCase().slice(0, 20);
    const list = demoExams();
    if (!id) throw new Error('Use letters or numbers in the short name.');
    if (id === 'PRACTICE' || list.some((e) => e.id.toLowerCase() === id.toLowerCase() || e.label.toLowerCase() === exam.label.toLowerCase()))
      throw new Error(`There's already an exam called ${exam.label}.`);
    const next = [...list, { ...exam, id, order: Math.max(0, ...list.map((e) => e.order)) + 1, builtIn: false }];
    saveDemo(next);
    setExams(next);
    return all;
  }
  setExams(await api<ExamInfo[]>('/api/admin/exams', { method: 'POST', body: { ...exam, password } }));
  return all;
}
