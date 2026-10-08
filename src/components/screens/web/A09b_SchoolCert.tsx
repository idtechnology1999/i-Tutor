import React from 'react';
import { ArrowRight } from 'lucide-react';
import { OnboardingShell, StepActions } from './shared';
import type { SchoolCert, StudentExam } from '../../../types';
import { SCHOOL_CERT_EXAMS, isSchoolCertValid } from '../../../lib/student-exams';
import { SchoolCertPicker } from '../../web/SchoolCertPicker';

interface Props {
  exams: StudentExam[];
  value?: SchoolCert;
  onChange: (value: SchoolCert) => void;
  onContinue: () => void;
  onBack: () => void;
}

/** WAEC / NECO / GCE / NABTEB: class first, then the subjects you'll sit. */
export const A09b_SchoolCert: React.FC<Props> = ({ exams, value, onChange, onContinue, onBack }) => {
  const which = SCHOOL_CERT_EXAMS.filter((e) => exams.includes(e));
  const names = which.join(' and ').replace(/ and (?=.* and )/g, ', ');

  return (
    <OnboardingShell
      step={2}
      title={`Your ${names} class`}
      lede={`Choose your class, then check the subjects you’ll sit. We’ll give you ${names} past questions for each one.`}
      aside={
        <p className="onboard__hint">
          Most candidates sit <strong>8 or 9 subjects</strong>. English and Mathematics are compulsory.
        </p>
      }
    >
      <SchoolCertPicker value={value} onChange={onChange} />

      <StepActions onBack={onBack} backLabel="Your exams">
        <button type="button" className="btn btn--primary" onClick={onContinue} disabled={!isSchoolCertValid(value)}>
          Continue
          <ArrowRight size={16} aria-hidden />
        </button>
      </StepActions>
    </OnboardingShell>
  );
};

export default A09b_SchoolCert;
