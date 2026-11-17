import React from 'react';
import { Flag } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { CmsAnchor } from '../../cms/text';
import { liveExamNames, useExams } from '../../lib/exams';

/* The full website footer, under the homepage and every CMS page. */

const SUBJECTS = ['Use of English', 'Mathematics', 'Physics', 'Chemistry', 'Biology', 'Economics', 'Government', 'Literature'];

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
  {
    heading: 'Subjects',
    items: [
      { label: 'Use of English', href: '/syllabus' },
      { label: 'Mathematics', href: '/syllabus' },
      { label: 'Physics', href: '/syllabus' },
      { label: 'Chemistry', href: '/syllabus' },
    ],
  },
];

export const SiteFooter: React.FC = () => {
  // Only the exams switched on in Admin → Settings → Exams.
  useExams();
  const exams = liveExamNames() || 'JAMB';
  return (
  <footer className="lp-footer">
    <div className="lp-wrap">
      <div className="lp-footer__grid">
        <div className="lp-footer__brand">
          <BrandMark />
          <p>Exam practice and tutoring for {exams} candidates. Built in Lagos.</p>
          <ul className="lp-footer__subjects">
            {SUBJECTS.map((s) => (
              <li key={s}>{s}</li>
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
