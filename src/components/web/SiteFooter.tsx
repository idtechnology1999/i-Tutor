import React from 'react';
import { Flag } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { CmsAnchor } from '../../cms/text';
import { liveExams, liveExamNames, useExams } from '../../lib/exams';
import { CMS_SUBJECTS, useCms } from '../../lib/cms';
import { slugify } from '../../lib/router';

/* The full website footer, under the homepage and every CMS page. */

/** Shown until the question bank loads. */
const FALLBACK_SUBJECTS = ['English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature'];

const FOOTER_COLUMNS: Array<{ heading: string; items: Array<{ label: string; href: string }> }> = [
  {
    heading: 'Practice',
    items: [
      { label: 'CBT mock exam', href: 'action:cbt' },
      { label: 'Past questions', href: '/syllabus' },
      { label: 'JAMB syllabus', href: '/syllabus' },
      { label: 'Study tutor', href: 'action:tutor' },
    ],
  },
  {
    heading: 'Your account',
    items: [
      { label: 'Dashboard', href: '/dashboard' },
      { label: 'Progress', href: '/dashboard' },
      { label: 'Admission updates', href: '/dashboard' },
    ],
  },
];

export const SiteFooter: React.FC = () => {
  // Only the exams switched on in Admin → Settings → Exams.
  useExams();
  const exams = liveExamNames() || 'JAMB';
  // Every JAMB subject that has published questions, in the usual order.
  const { questions } = useCms();
  const jamb = liveExams().find((e) => e.kind === 'jamb');
  const withQuestions = new Set(questions.filter((q) => q.examType === (jamb?.id ?? 'UTME')).map((q) => q.subject as string));
  const subjects = withQuestions.size ? CMS_SUBJECTS.filter((x) => withQuestions.has(x)) : FALLBACK_SUBJECTS;
  const subjectHref = (x: string) => `/past-questions/${slugify(jamb?.label ?? 'JAMB')}/${slugify(x)}`;
  return (
  <footer className="lp-footer">
    <div className="lp-wrap">
      <div className="lp-footer__grid">
        <div className="lp-footer__brand">
          <BrandMark />
          <p>Exam practice and tutoring for {exams} candidates. Built in Lagos.</p>
          <ul className="lp-footer__subjects">
            {subjects.map((x) => (
              <li key={x}>
                <CmsAnchor href={subjectHref(x)}>{x === 'English' ? 'Use of English' : x}</CmsAnchor>
              </li>
            ))}
          </ul>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h3>{column.heading}</h3>
            <ul>
              {column.items.map((item) => (
                <li key={item.label}>
                  <CmsAnchor href={item.href}>{item.label}</CmsAnchor>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </div>
      <div className="lp-footer__base">
        <span>&copy; {new Date().getFullYear()} i-Tutor, a subsidiary of IDTECH</span>
        <span>
          <Flag size={14} aria-hidden /> Not affiliated with JAMB
        </span>
        {/* Required by the photo's licence (CC BY-SA): the CBT-lab classroom photos
            are James Rhoda's. Pexels and Unsplash photos need no credit. */}
        <span className="lp-footer__credit">
          Some photos:{' '}
          <a href="https://commons.wikimedia.org/wiki/Category:Reading_Wikipedia_in_the_Classroom" target="_blank" rel="noreferrer">
            James Rhoda
          </a>
          , CC BY-SA 4.0
        </span>
      </div>
    </div>
  </footer>
  );
};
