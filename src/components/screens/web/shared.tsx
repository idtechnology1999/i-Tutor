import React from 'react';
import { CheckIcon, ShieldCheckIcon, LockIcon, CloudCheckIcon } from '../../Icons';

export interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  valid?: boolean;
  children: React.ReactNode;
}

/** Label + control + helper/error text, with the error wired up via aria. */
export const FormField: React.FC<FormFieldProps> = ({
  id,
  label,
  hint,
  error,
  valid,
  children,
}) => (
  <div className="form-field">
    <div className="form-field__head">
      <label className="form-field__label" htmlFor={id}>
        {label}
      </label>
      {/* The tick sits in the label row so nothing below moves when it
          appears — a shift there made the submit button dodge clicks. */}
      {valid ? (
        <span className="form-field__ok" id={`${id}-ok`}>
          <CheckIcon size={13} />
          {id === 'phoneOrEmail' ? 'Looks good' : 'Verified'}
        </span>
      ) : hint ? (
        <span className="form-field__hint">{hint}</span>
      ) : null}
    </div>
    {children}
    {error ? (
      <p className="form-field__error" id={`${id}-error`} role="alert">
        {error}
      </p>
    ) : null}
  </div>
);

interface AuthShellProps {
  eyebrow: string;
  title: string;
  lede?: string;
  aside: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  narrow?: boolean;
  /** Split-screen layout: form on the left, a full-height photo on the right. */
  photo?: boolean;
}

/**
 * Two-column website layout for the account screens: the form on the left,
 * a persistent reassurance panel on the right. On narrow viewports the aside
 * drops below the form rather than being hidden, so the trust signals survive
 * on mobile too.
 */
export const AuthShell: React.FC<AuthShellProps> = ({
  eyebrow,
  title,
  lede,
  aside,
  children,
  footer,
  narrow,
  photo,
}) => (
  <div className={`auth${photo ? ' auth--photo' : ''}`}>
    <div className="auth__frame">
      <div className="auth__main">
        <header className={`auth__head${narrow ? ' auth__head--narrow' : ''}`}>
          <p className="auth__eyebrow">{eyebrow}</p>
          <h1 className="auth__title">{title}</h1>
          {lede ? <p className="auth__lede">{lede}</p> : null}
        </header>
        {children}
        {footer ? <div className="auth__foot">{footer}</div> : null}
      </div>
      <aside className="auth__aside">{aside}</aside>
    </div>
  </div>
);

export const TrustList: React.FC<{ items: string[] }> = ({ items }) => (
  <ul className="auth__trust">
    {items.map((item) => (
      <li key={item}>
        <CheckIcon size={14} />
        <span>{item}</span>
      </li>
    ))}
  </ul>
);

export const DefaultAside: React.FC<{
  heading: string;
  body: string;
  points: string[];
  footnote?: React.ReactNode;
}> = ({ heading, body, points, footnote }) => (
  <div className="auth__panel">
    <h2 className="auth__panel-title">{heading}</h2>
    <p className="auth__panel-body">{body}</p>
    <TrustList items={points} />
    <dl className="auth__facts">
      <div>
        <dt>
          <LockIcon size={14} /> Passwords
        </dt>
        <dd>Hashed with a per-account salt. Never readable by us.</dd>
      </div>
      <div>
        <dt>
          <ShieldCheckIcon size={14} /> Verification
        </dt>
        <dd>A one-time code confirms your phone or email before the account opens.</dd>
      </div>
      <div>
        <dt>
          <CloudCheckIcon size={14} /> Your data
        </dt>
        <dd>Study records stay on your device and in your own candidate portal.</dd>
      </div>
    </dl>
    {footnote ? <div className="auth__panel-footnote">{footnote}</div> : null}
  </div>
);

/**
 * Photo panel for the split-screen account pages. Real photographs from a
 * Nigerian school CBT lab (James Rhoda, Wikimedia Commons, CC BY-SA 4.0).
 */
export const PhotoAside: React.FC<{
  src: string;
  alt: string;
  caption: string;
  stats?: Array<{ value: string; label: string }>;
}> = ({ src, alt, caption, stats }) => (
  <figure className="auth-photo">
    <img src={src} alt={alt} width={1280} height={960} decoding="async" />
    <figcaption className="auth-photo__caption">
      <p>{caption}</p>
      {stats ? (
        <dl className="auth-photo__stats">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt>{stat.value}</dt>
              <dd>{stat.label}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <span className="auth-photo__credit">Photo: James Rhoda / Wikimedia Commons, CC BY-SA 4.0</span>
    </figcaption>
  </figure>
);

/** Segmented progress rail for the onboarding sequence. */
export const StepRail: React.FC<{
  current: number;
  steps: string[];
  total: number;
}> = ({ current, steps, total }) => (
  <div className="step-rail">
    <div className="step-rail__head">
      <span>
        Step {current} of {total}
      </span>
      <span className="step-rail__pct">
        {Math.round((current / total) * 100)}% complete
      </span>
    </div>
    <ol className="step-rail__list">
      {steps.map((label, index) => {
        const position = index + 1;
        const state =
          position < current ? 'done' : position === current ? 'current' : 'todo';
        return (
          <li key={label} className={`step-rail__item is-${state}`}>
            <span className="step-rail__dot">
              {state === 'done' ? <CheckIcon size={12} /> : position}
            </span>
            <span className="step-rail__label">{label}</span>
          </li>
        );
      })}
    </ol>
  </div>
);

const ONBOARDING_STEPS = [
  'Your exams',
  'Subjects',
  'Institution & course',
  'Date & goal',
  'Permissions',
  'Baseline',
];

interface OnboardingShellProps {
  step: number;
  title: string;
  lede: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
  /** Defaults to the six onboarding step names. */
  steps?: string[];
}

export const ONBOARDING_TOTAL = ONBOARDING_STEPS.length;

/** Page frame for A09–A14: rail on the left, step content in the middle. */
export const OnboardingShell: React.FC<OnboardingShellProps> = ({
  step,
  title,
  lede,
  children,
  aside,
  steps = ONBOARDING_STEPS,
}) => (
  <div className="onboard">
    <div className="onboard__frame">
      <aside className="onboard__rail">
        <StepRail current={step} steps={steps} total={steps.length} />
        <div className="onboard__rail-note">
          <p>
            Answers here calibrate your question bank. You can change any of this
            later in Settings.
          </p>
        </div>
      </aside>
      <div className="onboard__main">
        <header className="onboard__head">
          <h1 className="onboard__title">{title}</h1>
          <p className="onboard__lede">{lede}</p>
        </header>
        {children}
        {aside ? <aside className="onboard__aside">{aside}</aside> : null}
      </div>
    </div>
  </div>
);

/** Consistent footer/back row for every step in a sequence. */
export const StepActions: React.FC<{
  onBack?: () => void;
  backLabel?: string;
  children: React.ReactNode;
  note?: string;
}> = ({ onBack, backLabel = 'Back', children, note }) => (
  <div className="step-actions">
    {onBack ? (
      <button type="button" className="step-actions__back" onClick={onBack}>
        {backLabel}
      </button>
    ) : (
      <span />
    )}
    <div className="step-actions__main">
      {children}
      {note ? <p className="step-actions__note">{note}</p> : null}
    </div>
  </div>
);
