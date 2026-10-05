import React from 'react';
import { CheckIcon, LockIcon, AlertCircleIcon, BookOpenIcon } from '../../Icons';
import { OnboardingShell, StepActions } from './shared';

interface Props {
  selectedSubjects: string[];
  onToggleSubject: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const MAX_SUBJECTS = 4;

type Row = {
  name: string;
  note: string;
  state: 'locked' | 'active' | 'soon';
};

const ROWS: Row[] = [
  {
    name: 'English Language',
    note: 'Compulsory for every UTME candidate. Already included.',
    state: 'locked',
  },
  { name: 'Mathematics', note: 'Required for science and commercial courses.', state: 'active' },
  { name: 'Physics', note: 'Required for engineering and most science courses.', state: 'active' },
  { name: 'Chemistry', note: 'Required for medicine, pharmacy and engineering.', state: 'active' },
  { name: 'Commercial subjects', note: 'Economics, Accounting, Commerce, Further Maths.', state: 'soon' },
  { name: 'Arts subjects', note: 'Literature, Government, History, Geography.', state: 'soon' },
];

export const A10_SubjectPicker: React.FC<Props> = ({
  selectedSubjects,
  onToggleSubject,
  onContinue,
  onBack,
}) => {
  const chosen = selectedSubjects.filter((s) => s !== 'English Language');
  const isFull = chosen.length >= MAX_SUBJECTS;
  const isValid = chosen.length > 0;

  return (
    <OnboardingShell
      step={2}
      title="Choose your subjects"
      lede="Pick the subjects you will sit in the exam. We use this to build your question bank and to work out which topics need attention first."
      aside={
        <div className="onboard__counter">
          <div className="onboard__counter-head">
            <span>Subjects selected</span>
            <strong>
              {chosen.length + 1} <span>/ {MAX_SUBJECTS}</span>
            </strong>
          </div>
          <div className="onboard__counter-bar">
            <i
              style={{ width: `${((chosen.length + 1) / MAX_SUBJECTS) * 100}%` }}
            />
          </div>
          <p className="onboard__counter-note">
            English is compulsory and counted automatically.
          </p>
        </div>
      }
    >
      <ul className="subject-list">
        {ROWS.map((row) => {
          const isLocked = row.state === 'locked';
          const isSoon = row.state === 'soon';
          const isSelected = selectedSubjects.includes(row.name);
          const disabled = isLocked || isSoon || (!isSelected && isFull);

          return (
            <li key={row.name}>
              <button
                type="button"
                className={`subject${isSelected ? ' is-selected' : ''}${isSoon ? ' is-soon' : ''}${isLocked ? ' is-locked' : ''}`}
                onClick={() => onToggleSubject(row.name)}
                disabled={disabled}
                aria-pressed={isSelected}
              >
                <span className="subject__check" aria-hidden="true">
                  {isSelected ? <CheckIcon size={14} /> : null}
                </span>
                <span className="subject__body">
                  <span className="subject__name">{row.name}</span>
                  <span className="subject__note">{row.note}</span>
                </span>
                <span className="subject__tag">
                  {isLocked ? (
                    <>
                      <LockIcon size={12} /> Required
                    </>
                  ) : isSoon ? (
                    'Coming soon'
                  ) : isSelected ? (
                    <>
                      <CheckIcon size={12} /> Selected
                    </>
                  ) : null}
                </span>
              </button>
            </li>
          );
        })}
      </ul>

      {isFull ? (
        <p className="onboard__note is-error" role="alert">
          <AlertCircleIcon size={14} />
          You have chosen {MAX_SUBJECTS} subjects. Remove one to swap it for
          another.
        </p>
      ) : null}

      <StepActions
        onBack={onBack}
        backLabel="Back to exam track"
        note="Commercial and arts subject banks ship in the next release."
      >
        <button
          type="button"
          className="btn btn--primary"
          onClick={onContinue}
          disabled={!isValid}
        >
          <BookOpenIcon size={16} />
          Continue
        </button>
      </StepActions>
    </OnboardingShell>
  );
};

export default A10_SubjectPicker;
