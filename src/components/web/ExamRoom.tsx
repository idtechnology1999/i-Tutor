import React from 'react';
import { ArrowRight, BookOpenCheck, CalendarDays, Pencil, Play } from 'lucide-react';
import { EXAM_LABEL, useCms } from '../../lib/cms';
import type { ExamType } from '../../lib/cms';
import type { SchoolCert, StudentExam } from '../../types';
import { STUDENT_EXAMS } from '../../lib/student-exams';

/** When each school-certificate exam usually runs. */
const WHEN: Partial<Record<StudentExam, string>> = {
  WAEC: 'School candidates: May/June · Private candidates: Nov/Dec',
  NECO: 'School candidates: June/July · Private candidates: Nov/Dec',
  GCE: 'For private candidates — WAEC GCE and NECO GCE, usually Nov/Dec',
  NABTEB: 'May/June and Nov/Dec series',
};

interface Props {
  exam: StudentExam;
  cert?: SchoolCert;
  onStart: (practice: { name: string; subjects: string[]; exam: string }) => void;
  onPastQuestions: (exam: ExamType) => void;
  /** Opens the profile to set class and subjects. */
  onEdit: () => void;
}

/** A WAEC / NECO / GCE / NABTEB "room": this exam's subjects and practice. */
export const ExamRoom: React.FC<Props> = ({ exam, cert, onStart, onPastQuestions, onEdit }) => {
  const { questions } = useCms();
  const info = STUDENT_EXAMS.find((e) => e.id === exam);
  const label = EXAM_LABEL[exam as ExamType] ?? exam;
  const inExam = questions.filter((q) => q.status === 'published' && q.examType === exam);
  const countFor = (s: string) => inExam.filter((q) => q.subject === s).length;

  if (!cert) {
    return (
      <section className="room room--empty">
        <h2>Set up your {label}</h2>
        <p>Choose your class (Science, Arts or Commercial) and the subjects you’ll sit, and we’ll build your {label} practice.</p>
        <button type="button" className="ui-btn ui-btn--primary" onClick={onEdit}>
          Choose class & subjects
        </button>
      </section>
    );
  }

  const ready = cert.subjects.reduce((n, s) => n + countFor(s), 0);

  return (
    <div className="room">
      <section className="room__hero">
        <p className="room__eyebrow">
          {info?.name ?? label} · {cert.className} class
        </p>
        <h2>Your {label} room</h2>
        <p className="room__when">
          <CalendarDays size={16} aria-hidden /> {WHEN[exam] ?? info?.full}
        </p>
        <div className="room__stats">
          <span>
            <b>{cert.subjects.length}</b> subjects
          </span>
          <span>
            <b>{ready}</b> questions ready
          </span>
        </div>
        <div className="room__actions">
          <button
            type="button"
            className="room__start"
            disabled={ready === 0}
            onClick={() => onStart({ name: `${label} ${cert.className}`, subjects: cert.subjects, exam })}
          >
            <Play size={18} aria-hidden /> Start {label} practice
          </button>
          <button type="button" className="room__ghost" onClick={() => onPastQuestions(exam as ExamType)}>
            <BookOpenCheck size={18} aria-hidden /> Past questions
          </button>
        </div>
        {ready === 0 && <p className="room__soon">{label} questions are being added — check back soon.</p>}
      </section>

      <section className="ui-card room__subjects">
        <header>
          <h3>My {label} subjects</h3>
          <button type="button" className="ui-link" onClick={onEdit}>
            <Pencil size={14} aria-hidden /> Change
          </button>
        </header>
        <ul>
          {cert.subjects.map((s) => {
            const n = countFor(s);
            return (
              <li key={s}>
                <span className="room__subject">{s}</span>
                <span className="room__n">{n ? `${n} question${n === 1 ? '' : 's'}` : 'Coming soon'}</span>
                <button
                  type="button"
                  disabled={n === 0}
                  onClick={() => onStart({ name: `${label} ${s}`, subjects: [s], exam })}
                  aria-label={`Practise ${label} ${s}`}
                >
                  Practise <ArrowRight size={14} aria-hidden />
                </button>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
};
