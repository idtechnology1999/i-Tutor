import React from 'react';
import { Award, BadgeCheck, Check, ClipboardList, Landmark, School, Wrench } from 'lucide-react';
import type { StudentExam } from '../../types';
import { STUDENT_EXAMS } from '../../lib/student-exams';

const ICON: Record<StudentExam, typeof Check> = {
  UTME: ClipboardList,
  'Post-UTME': Landmark,
  WAEC: School,
  NECO: Award,
  GCE: BadgeCheck,
  NABTEB: Wrench,
};

interface Props {
  selected: StudentExam[];
  onToggle: (exam: StudentExam) => void;
}

/** Tick every exam you're sitting — most students do more than one. */
export const ExamPicker: React.FC<Props> = ({ selected, onToggle }) => (
  <div className="exam-pick" role="group" aria-label="Exams">
    {STUDENT_EXAMS.map((e) => {
      const on = selected.includes(e.id);
      const Icon = ICON[e.id];
      return (
        <button
          key={e.id}
          type="button"
          className={`exam-pick__card${on ? ' is-on' : ''}`}
          aria-pressed={on}
          onClick={() => onToggle(e.id)}
        >
          <span className="exam-pick__icon">
            <Icon size={22} aria-hidden />
          </span>
          <span className="exam-pick__text">
            <strong>{e.name}</strong>
            <small>{e.full}</small>
            <span>{e.desc}</span>
          </span>
          <span className="exam-pick__tick" aria-hidden>
            {on && <Check size={14} strokeWidth={3} />}
          </span>
        </button>
      );
    })}
  </div>
);
