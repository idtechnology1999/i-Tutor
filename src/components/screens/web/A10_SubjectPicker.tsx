import React from 'react';
import { CheckIcon, LockIcon, AlertCircleIcon, BookOpenIcon } from '../../Icons';
import { OnboardingShell, StepActions } from './shared';
import { ENGLISH, JAMB_CHOICES, JAMB_SUBJECTS } from '../../../data/nigerian-curriculum';

interface Props {
  selectedSubjects: string[];
  onToggleSubject: (name: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

const TOTAL = JAMB_CHOICES + 1;

export const A10_SubjectPicker: React.FC<Props> = ({
  selectedSubjects,
  onToggleSubject,
  onContinue,
  onBack,
}) => {
  const chosen = selectedSubjects.filter((s) => s !== ENGLISH);
  const isFull = chosen.length >= JAMB_CHOICES;
  const isValid = chosen.length === JAMB_CHOICES;

  return (
    <OnboardingShell
      step={2}
      title="Choose your subjects"
      lede="JAMB is 4 subjects: English plus the 3 you choose. We use this to build your question bank and to work out which topics need attention first."
      aside={
        <div className="onboard__counter">
          <div className="onboard__counter-head">
            <span>Subjects selected</span>
            <strong>
              {chosen.length + 1} <span>/ {TOTAL}</span>
            </strong>
          </div>
          <div className="onboard__counter-bar">
            <i
              style={{ width: `${((chosen.length + 1) / TOTAL) * 100}%` }}
            />
          </div>
          <p className="onboard__counter-note">
            English is compulsory and counted automatically. Choose 3 more.
          </p>
        </div>
      }
    >
      <ul className="subject-list">
        {JAMB_SUBJECTS.map((row) => {
          const isLocked = !!row.isCompulsory;
          const isSelected = isLocked || selectedSubjects.includes(row.name);
          const disabled = isLocked || (!isSelected && isFull);

          return (
            <li key={row.name}>
              <button
                type="button"
                className={`subject${isSelected ? ' is-selected' : ''}${isLocked ? ' is-locked' : ''}`}
                onClick={() => onToggleSubject(row.name)}
                disabled={disabled}
                aria-pressed={isSelected}
              >
                <span className="subject__check" aria-hidden="true">
                  {isSelected ? <CheckIcon size={14} /> : null}
                </span>
                <span className="subject__body">
                  <span className="subject__name">{row.label ?? row.name}</span>
                  <span className="subject__note">{row.note}</span>
                </span>
                <span className="subject__tag">
                  {isLocked ? (
                    <>
                      <LockIcon size={12} /> Required
                    </>
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
          You have your {TOTAL} subjects. Remove one to swap it for another.
        </p>
      ) : null}

      <StepActions
        onBack={onBack}
        backLabel="Back to exam track"
        note={isValid ? undefined : `Choose ${JAMB_CHOICES - chosen.length} more to continue.`}
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
