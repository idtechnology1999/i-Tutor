import React from 'react';
import {
  TargetIcon,
  CheckIcon,
  CompassIcon,
  AwardIcon,
  BookOpenIcon,
} from '../../Icons';
import { OnboardingShell, StepActions } from './shared';
import type { ExamTrack } from '../../../types';

interface Props {
  selectedTrack: ExamTrack;
  onSelectTrack: (track: ExamTrack) => void;
  onContinue: () => void;
  onBack: () => void;
}

const OPTIONS: {
  value: ExamTrack;
  title: string;
  sub: string;
  points: string[];
}[] = [
  {
    value: 'jamb',
    title: 'JAMB / UTME',
    sub: 'Four-year undergraduate programmes',
    points: [
      'Past UTME questions for every registered subject',
      'Cut-off benchmarks for 80+ institutions',
      'Four-subject CBT mock papers',
    ],
  },
  {
    value: 'post-jamb',
    title: 'Post-UTME',
    sub: 'Polytechnic, NCE and nursing intakes',
    points: [
      'Post-UTME past questions by institution',
      'JAMB score and O-level weighting shown together',
      'Single and double subject mock papers',
    ],
  },
  {
    value: 'both',
    title: 'Both',
    sub: 'Keep JAMB and Post-UTME in one account',
    points: [
      'Switch between tracks without losing progress',
      'One diagnostic covering both question styles',
      'Shared mastery matrix across all papers',
    ],
  },
];

export const A09_ExamTrack: React.FC<Props> = ({
  selectedTrack,
  onSelectTrack,
  onContinue,
  onBack,
}) => (
  <OnboardingShell
    step={1}
    title="Which exam are you preparing for?"
    lede="Your track decides which question bank, past papers and cut-off benchmarks we show you. Nothing here is locked in — you can switch later."
    aside={
      <p className="onboard__hint">
        Most candidates sitting JAMB choose <strong>JAMB / UTME</strong>. If you
        are aiming at a polytechnic or nursing intake, pick Post-UTME.
      </p>
    }
  >
    <div className="cards-3">
      {OPTIONS.map((option) => {
        const isSelected = selectedTrack === option.value;
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onSelectTrack(option.value)}
            className={`pick-card${isSelected ? ' is-selected' : ''}`}
            aria-pressed={isSelected}
          >
            <span className="pick-card__mark" aria-hidden="true">
              {isSelected ? <CheckIcon size={14} /> : null}
            </span>
            <span className="pick-card__icon" aria-hidden="true">
              {option.value === 'jamb' ? (
                <BookOpenIcon size={20} />
              ) : option.value === 'post-jamb' ? (
                <AwardIcon size={20} />
              ) : (
                <CompassIcon size={20} />
              )}
            </span>
            <span className="pick-card__title">{option.title}</span>
            <span className="pick-card__sub">{option.sub}</span>
            <ul className="pick-card__points">
              {option.points.map((point) => (
                <li key={point}>
                  <CheckIcon size={12} />
                  {point}
                </li>
              ))}
            </ul>
          </button>
        );
      })}
    </div>

    <StepActions onBack={onBack} backLabel="Create account">
      <button
        type="button"
        className="btn btn--primary"
        onClick={onContinue}
        disabled={!selectedTrack}
      >
        <TargetIcon size={16} />
        Continue
      </button>
    </StepActions>
  </OnboardingShell>
);

export default A09_ExamTrack;
