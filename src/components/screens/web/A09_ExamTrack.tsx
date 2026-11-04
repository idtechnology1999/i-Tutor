import React from 'react';
import { liveExamNames } from '../../../lib/exams';
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
    screen="track"
    step={1}
    title="Which exams are you preparing for?"
    lede="Tick all that apply. We’ll show you the right past questions and practice exams for each one. You can change this later."
    aside={
      <p className="onboard__hint">
        {/* The exams switched on in Admin → Settings → Exams. */}
        Tick every exam you’re sitting this year: <strong>{liveExamNames()}</strong>.
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
