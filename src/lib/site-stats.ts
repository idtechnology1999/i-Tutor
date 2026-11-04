import { EXAM_LABEL, PRACTICE, useCms, useQuestionsReady } from './cms';
import type { CmsQuestion } from './cms';

/* Real numbers for the website, counted from the published question bank
   (already loaded for past questions and exams). CMS text can use them:

     {questions}  published past questions (not the AI practice bank)  1,234
     {jambYears}  oldest–newest JAMB year                              2005–2025
     {years}      how many years of papers                             12
     {subjects}   subjects with questions                              9
     {exams}      exams with questions                                 4
     {examNames}  those exams                                          JAMB, WAEC, NECO
     {schools}    Post-UTME schools with questions                     6
*/

export type SiteStats = Record<'questions' | 'jambYears' | 'years' | 'subjects' | 'exams' | 'examNames' | 'schools', string>;

const number = (n: number) => n.toLocaleString('en-NG');

export function siteStats(bank: CmsQuestion[]): SiteStats {
  const past = bank.filter((q) => q.status === 'published' && q.examType !== PRACTICE);
  const jamb = [...new Set(past.filter((q) => q.examType === 'UTME').map((q) => q.year).filter((y): y is number => !!y))].sort((a, b) => a - b);
  const exams = [...new Set(past.map((q) => q.examType))];
  return {
    questions: number(past.length),
    jambYears: !jamb.length ? '—' : jamb.length === 1 ? String(jamb[0]) : `${jamb[0]}–${jamb[jamb.length - 1]}`,
    years: number(new Set(past.map((q) => q.year).filter(Boolean)).size),
    subjects: number(new Set(past.map((q) => q.subject)).size),
    exams: number(exams.length),
    examNames: exams.map((e) => EXAM_LABEL[e] ?? e).join(', ') || '—',
    schools: number(new Set(past.filter((q) => q.school).map((q) => q.school)).size),
  };
}

/** The live numbers, or null while the bank is still loading. */
export function useSiteStats(): SiteStats | null {
  const { questions } = useCms();
  const ready = useQuestionsReady();
  return ready ? siteStats(questions) : null;
}

const TOKEN = /\{(questions|jambYears|years|subjects|exams|examNames|schools)\}/g;

/** Text with its {tokens} replaced (a dash while the bank loads). */
export const fillStats = (text: string, stats: SiteStats | null) => text.replace(TOKEN, (_, key: keyof SiteStats) => (stats ? stats[key] : '—'));
