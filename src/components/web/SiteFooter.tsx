import React from 'react';
import { Flag } from 'lucide-react';
import { BrandMark } from './BrandMark';
import { CmsAnchor } from '../../cms/text';

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

export const SiteFooter: React.FC = () => (
  <footer className="lp-footer">
    <div className="lp-wrap">
      <div className="lp-footer__grid">
        <div className="lp-footer__brand">
          <BrandMark />
          <p>Exam practice and tutoring for JAMB, WAEC, NECO, GCE, NABTEB and Post-UTME candidates. Built in Lagos.</p>
          <ul className="lp-footer__subjects">
            {SUBJECTS.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        {FOOTER_COLUMNS.map((column) => (
          <nav key={column.heading} aria-label={column.heading}>
            <h4>{column.heading}</h4>
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
        <span>&copy; 2026 i-Tutor</span>
        <span>
          <Flag size={14} aria-hidden /> Not affiliated with JAMB
        </span>
        <span className="lp-footer__credit">
          Photos: James Rhoda,{' '}
          <a href="https://commons.wikimedia.org/wiki/Category:Reading_Wikipedia_in_the_Classroom" target="_blank" rel="noreferrer">
            Wikimedia Commons
          </a>
          , CC BY-SA 4.0
        </span>
      </div>
    </div>
  </footer>
);
