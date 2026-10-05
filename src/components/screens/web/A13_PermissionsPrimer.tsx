import React from 'react';
import { BellIcon, CloudCheckIcon, CheckIcon, ShieldCheckIcon } from '../../Icons';
import { OnboardingShell, StepActions } from './shared';

interface Props {
  notificationsEnabled: boolean;
  onChangeNotifications: (enabled: boolean) => void;
  offlineCacheEnabled: boolean;
  onChangeOfflineCache: (enabled: boolean) => void;
  onContinue: () => void;
  onBack: () => void;
}

interface ToggleProps {
  id: string;
  icon: React.ReactNode;
  title: string;
  why: string;
  detail: string;
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  badge?: string;
}

const Toggle: React.FC<ToggleProps> = ({
  id,
  icon,
  title,
  why,
  detail,
  enabled,
  onChange,
  badge,
}) => (
  <label className={`perm${enabled ? ' is-on' : ''}`} htmlFor={id}>
    <span className="perm__icon" aria-hidden="true">
      {icon}
    </span>
    <span className="perm__body">
      <span className="perm__head">
        <span className="perm__title">{title}</span>
        {badge ? <span className="perm__badge">{badge}</span> : null}
      </span>
      <span className="perm__why">{why}</span>
      <span className="perm__detail">{detail}</span>
    </span>
    <span className="perm__switch">
      <input
        id={id}
        type="checkbox"
        role="switch"
        checked={enabled}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="perm__track" aria-hidden="true">
        <span className="perm__knob" />
      </span>
    </span>
  </label>
);

export const A13_PermissionsPrimer: React.FC<Props> = ({
  notificationsEnabled,
  onChangeNotifications,
  offlineCacheEnabled,
  onChangeOfflineCache,
  onContinue,
  onBack,
}) => {
  const enabledCount =
    (notificationsEnabled ? 1 : 0) + (offlineCacheEnabled ? 1 : 0);

  return (
    <OnboardingShell
      step={5}
      title="Two settings that make i-Tutor work on a weak network"
      lede="Both are optional and both can be changed later in Settings. Nothing here requires a payment card or a phone number."
      aside={
        <div className="perm-summary">
          <h2 className="perm-summary__title">
            <ShieldCheckIcon size={15} /> What stays private
          </h2>
          <ul className="perm-summary__list">
            <li>
              <CheckIcon size={13} />
              Reminders are sent only to this device.
            </li>
            <li>
              <CheckIcon size={13} />
              Offline papers are cached in your browser, not on our servers.
            </li>
            <li>
              <CheckIcon size={13} />
              We never read your messages or contacts.
            </li>
          </ul>
          <p className="perm-summary__foot">
            Voice Mode asks for microphone access only when you tap the mic, and
            it works entirely in the browser.
          </p>
        </div>
      }
    >
      <div className="perm-list">
        <Toggle
          id="permNotifications"
          icon={<BellIcon size={18} />}
          title="Study reminders"
          why="Stay on the study plan you just set."
          detail="A daily nudge at the time you pick. Turn it off and nothing is sent."
          enabled={notificationsEnabled}
          onChange={onChangeNotifications}
          badge="Recommended"
        />
        <Toggle
          id="permOffline"
          icon={<CloudCheckIcon size={18} />}
          title="Offline question bank"
          why="Practise on 2G, or with no data at all."
          detail="Downloads the papers for your subjects to this device so they open without a connection."
          enabled={offlineCacheEnabled}
          onChange={onChangeOfflineCache}
          badge="Recommended"
        />
      </div>

      <p className="onboard__note">
        {enabledCount === 2
          ? 'Both enabled. i-Tutor will work even when the network does not.'
          : enabledCount === 1
            ? 'One enabled. You can turn the other on at any time from Settings.'
            : 'Both off. Everything still works — it just needs a connection.'}
      </p>

      <StepActions onBack={onBack} backLabel="Back to study goal">
        <button
          type="button"
          className="btn btn--ghost"
          onClick={onContinue}
        >
          Not now
        </button>
        <button type="button" className="btn btn--primary" onClick={onContinue}>
          Save and continue
        </button>
      </StepActions>
    </OnboardingShell>
  );
};

export default A13_PermissionsPrimer;
