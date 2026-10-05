import React from 'react';
import { TrendingUpIcon, CheckIcon, ClockIcon, ArrowRightIcon } from '../../Icons';
import { OnboardingShell, StepActions } from './shared';

interface Props {
  subjectCount: number;
  trackLabel: string;
  targetScore: number;
  onStart: () => void;
  onSkip: () => void;
  onBack: () => void;
}

export const A14_PlacementDiagnostic: React.FC<Props> = ({
  subjectCount,
  trackLabel,
  targetScore,
  onStart,
  onSkip,
  onBack,
}) => (
  <OnboardingShell
    step={6}
    title="One last step: a short placement test"
    lede="Twenty questions across your subjects. It is the fastest way for i-Tutor to know which topics to show you first — and which ones to leave alone for now."
    aside={
      <div className="offer">
        <h2 className="offer__title">What you get back</h2>
        <ul className="offer__list">
          <li>
            <span className="offer__mark">
              <TrendingUpIcon size={14} />
            </span>
            <span>
              <strong>A mastery score per topic</strong>
              <em>
                Not just a total — we show which sub-topics are weak so you know
                where to start.
              </em>
            </span>
          </li>
          <li>
            <span className="offer__mark">
              <ClockIcon size={14} />
            </span>
            <span>
              <strong>A study order</strong>
              <em>
                The first three things to work on, based on your answers and your
                {' '}{targetScore}-point target.
              </em>
            </span>
          </li>
          <li>
            <span className="offer__mark">
              <CheckIcon size={14} />
            </span>
            <span>
              <strong>A plan that updates as you practise</strong>
              <em>
                Every mock you sit refines the same matrix, so the plan gets
                sharper over time.
              </em>
            </span>
          </li>
        </ul>
        <p className="offer__foot">
          20 questions · about 15 minutes · can be paused and resumed
        </p>
      </div>
    }
  >
    <div className="offer-lead">
      <p className="offer-lead__line">
        You have set up <strong>{trackLabel}</strong> with{' '}
        <strong>
          {subjectCount} subject{subjectCount === 1 ? '' : 's'}
        </strong>
        . The placement test covers the same subjects, so it is worth the
        fifteen minutes.
      </p>
      <p className="offer-lead__skip">
        You can skip it and take the diagnostic later, but i-Tutor will not be
        able to prioritise your topics until you do.
      </p>
    </div>

    <StepActions
      onBack={onBack}
      backLabel="Back to settings"
      note="No questions are recorded against your name until you start."
    >
      <button type="button" className="btn btn--ghost" onClick={onSkip}>
        Skip for now
      </button>
      <button type="button" className="btn btn--primary" onClick={onStart}>
        Start the placement test
        <ArrowRightIcon size={16} />
      </button>
    </StepActions>
  </OnboardingShell>
);

export default A14_PlacementDiagnostic;
