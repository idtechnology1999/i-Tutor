import React from 'react';
import { ArrowRight } from 'lucide-react';
import { OnboardingShell, StepActions } from './shared';
import type { StudentExam } from '../../../types';
import { ExamPicker } from '../../web/ExamPicker';

interface Props {
  selected: StudentExam[];
  onToggle: (exam: StudentExam) => void;
  onContinue: () => void;
  onBack: () => void;
}

/** Step 1: every exam the student is sitting — JAMB, Post-UTME, WAEC, NECO… */
export const A09_ExamTrack: React.FC<Props> = ({ selected, onToggle, onContinue, onBack }) => (
  <OnboardingShell
    step={1}
    title="Which exams are you preparing for?"
    lede="Tick all that apply. We’ll show you the right past questions and practice exams for each one. You can change this later."
    aside={
      <p className="onboard__hint">
        Most students write <strong>JAMB (UTME)</strong>, their school’s <strong>Post-UTME</strong>, and{' '}
        <strong>WAEC</strong> or <strong>NECO</strong> in the same year.
      </p>
    }
  >
    <ExamPicker selected={selected} onToggle={onToggle} />

    <StepActions
      onBack={onBack}
      backLabel="Create account"
      note={selected.length ? undefined : 'Choose at least one exam to continue.'}
    >
      <button type="button" className="btn btn--primary" onClick={onContinue} disabled={selected.length === 0}>
        Continue
        <ArrowRight size={16} aria-hidden />
      </button>
    </StepActions>
  </OnboardingShell>
);

export default A09_ExamTrack;
