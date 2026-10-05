import React from 'react';
import { CalendarIcon, TargetIcon, ClockIcon } from '../../Icons';
import { OnboardingShell, StepActions } from './shared';
import type { DailyCommitment } from '../../../types';

interface Props {
  examMonth: string;
  onChangeExamMonth: (month: string) => void;
  targetScore: number;
  onChangeTargetScore: (score: number) => void;
  dailyCommitment: DailyCommitment;
  onChangeDailyCommitment: (commitment: DailyCommitment) => void;
  trackLabel: string;
  subjectCount: number;
  onContinue: () => void;
  onBack: () => void;
}

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const COMMITMENTS: { value: DailyCommitment; label: string; detail: string }[] = [
  { value: '30min', label: '30 minutes', detail: 'Light revision' },
  { value: '1hour', label: '1 hour', detail: 'Steady daily practice' },
  { value: '2hours', label: '2 hours', detail: 'Serious preparation' },
  { value: '3hours', label: '3+ hours', detail: 'Intensive prep' },
];

const SCORE_BANDS = [
  { min: 160, label: 'Below many cut-offs' },
  { min: 220, label: 'Competitive for most state universities' },
  { min: 260, label: 'Strong for federal universities' },
  { min: 300, label: 'Top-band target' },
];

const bandFor = (score: number) =>
  [...SCORE_BANDS].reverse().find((band) => score >= band.min)?.label ?? '';

export const A12_ExamDateGoals: React.FC<Props> = ({
  examMonth,
  onChangeExamMonth,
  targetScore,
  onChangeTargetScore,
  dailyCommitment,
  onChangeDailyCommitment,
  trackLabel,
  subjectCount,
  onContinue,
  onBack,
}) => {
  const band = bandFor(targetScore);

  return (
    <OnboardingShell
      step={4}
      title="When is your exam, and what score are you aiming for?"
      lede="We use your exam month and target score to build a study plan that fits the time you actually have."
      aside={
        <div className="goal-summary">
          <h2 className="goal-summary__title">Your plan so far</h2>
          <dl className="goal-summary__list">
            <div>
              <dt>Exam track</dt>
              <dd>{trackLabel}</dd>
            </div>
            <div>
              <dt>Subjects</dt>
              <dd>{subjectCount} registered</dd>
            </div>
            <div>
              <dt>Exam month</dt>
              <dd>{examMonth || 'Not set'}</dd>
            </div>
            <div>
              <dt>Target score</dt>
              <dd>{targetScore} / 400</dd>
            </div>
            <div>
              <dt>Daily study time</dt>
              <dd>
                {COMMITMENTS.find((c) => c.value === dailyCommitment)?.label}
              </dd>
            </div>
          </dl>
        </div>
      }
    >
      <div className="goal-grid">
        <section className="field-block">
          <h2 className="field-block__title">
            <CalendarIcon size={15} /> Exam month
          </h2>
          <p className="field-block__lede">
            Pick the month you sit the exam. Your plan runs backwards from it.
          </p>
          <div className="control control--search">
            <select
              value={examMonth}
              onChange={(e) => onChangeExamMonth(e.target.value)}
              className="control__input"
              aria-label="Exam month"
            >
              <option value="">Select a month</option>
              {MONTHS.map((month) => (
                <option key={month} value={month}>
                  {month}
                </option>
              ))}
            </select>
          </div>
        </section>

        <section className="field-block">
          <div className="field-block__head">
            <h2 className="field-block__title">
              <TargetIcon size={15} /> Target score
            </h2>
            <span className="field-block__value">
              {targetScore}
              <small>/400</small>
            </span>
          </div>
          <input
            type="range"
            min={160}
            max={360}
            step={10}
            value={targetScore}
            onChange={(e) => onChangeTargetScore(Number(e.target.value))}
            className="slider"
            aria-label="Target score out of 400"
            aria-valuetext={`${targetScore} out of 400`}
          />
          <div className="slider__scale" aria-hidden="true">
            <span>160</span>
            <span>260</span>
            <span>360</span>
          </div>
          <p className="field-block__lede">{band}</p>
        </section>

        <section className="field-block field-block--wide">
          <h2 className="field-block__title">
            <ClockIcon size={15} /> Time you can study each day
          </h2>
          <p className="field-block__lede">
            Be honest here. A plan you keep beats a plan that is ambitious on day
            one and abandoned by week two.
          </p>
          <div className="chips chips--lg" role="group" aria-label="Daily study time">
            {COMMITMENTS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => onChangeDailyCommitment(option.value)}
                className={`chip chip--lg${dailyCommitment === option.value ? ' is-on' : ''}`}
                aria-pressed={dailyCommitment === option.value}
              >
                <span className="chip--lg__label">{option.label}</span>
                <span className="chip--lg__detail">{option.detail}</span>
              </button>
            ))}
          </div>
        </section>
      </div>

      <StepActions
        onBack={onBack}
        backLabel="Back to institution"
        note="We will show the same questions either way — the target only changes what we recommend first."
      >
        <button type="button" className="btn btn--primary" onClick={onContinue}>
          Continue
        </button>
      </StepActions>
    </OnboardingShell>
  );
};

export default A12_ExamDateGoals;
