import React from 'react';
import { ArrowLeftIcon, BellIcon, CloudCheckIcon, ArrowRightIcon } from '../Icons';

interface Props {
  notificationsEnabled: boolean;
  offlineCacheEnabled: boolean;
  onToggleNotifications: () => void;
  onToggleOfflineCache: () => void;
  onEnableAndContinue: () => void;
  onNotNow: () => void;
  onBack: () => void;
}

export const A13_PermissionsPrimer: React.FC<Props> = ({
  notificationsEnabled,
  offlineCacheEnabled,
  onToggleNotifications,
  onToggleOfflineCache,
  onEnableAndContinue,
  onNotNow,
  onBack,
}) => {
  return (
    <div
      style={{
        flex: 1,
        background: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
      }}
    >
      {/* Top Header & 100% Progress Bar */}
      <div style={{ padding: '12px 20px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
          <button
            type="button"
            onClick={onBack}
            className="btn-icon-touch"
            style={{ width: '40px', height: '40px', minWidth: '40px', minHeight: '40px' }}
            aria-label="Back"
          >
            <ArrowLeftIcon size={20} color="var(--neutral-900)" />
          </button>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--teal-700)' }}>
            Step 5 of 5
          </span>
          <div style={{ width: '40px' }} />
        </div>

        {/* 100% Teal Progress Bar */}
        <div
          style={{
            height: '4px',
            width: '100%',
            background: 'var(--neutral-200)',
            borderRadius: '2px',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              width: '100%',
              background: 'var(--teal-900)',
              borderRadius: '2px',
            }}
          />
        </div>
      </div>

      <div
        style={{
          flex: 1,
          padding: '24px 24px 32px',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div style={{ marginBottom: '28px' }}>
          <h1 className="text-heading-1" style={{ color: 'var(--neutral-900)', marginBottom: '8px' }}>
            Prepare your study setup
          </h1>
          <p className="text-body-reg" style={{ color: 'var(--neutral-600)', fontSize: '15px' }}>
            Configure essential features for seamless online & offline learning.
          </p>
        </div>

        {/* Permission Value Explanation 1: Study Reminders (Notifications) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', flex: 1 }}>
          <div
            onClick={onToggleNotifications}
            style={{
              padding: '16px',
              borderRadius: '16px',
              border: notificationsEnabled ? '2px solid var(--teal-900)' : '1.5px solid var(--neutral-200)',
              backgroundColor: notificationsEnabled ? 'var(--teal-50)' : 'var(--white)',
              cursor: 'pointer',
              display: 'flex',
              gap: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: notificationsEnabled ? 'var(--teal-900)' : 'var(--neutral-100)',
                color: notificationsEnabled ? '#FFFFFF' : 'var(--neutral-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BellIcon size={22} color={notificationsEnabled ? '#FFFFFF' : 'var(--neutral-600)'} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--neutral-900)' }}>
                  Study Reminders
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: notificationsEnabled ? 'var(--teal-900)' : 'var(--neutral-500)' }}>
                  {notificationsEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--neutral-600)', lineHeight: '19px' }}>
                Never break your streak. Get reminder prompts based on your daily 1-hour goal and urgent JAMB updates.
              </p>
            </div>
          </div>

          {/* Permission Value Explanation 2: Offline Cache (Storage) */}
          <div
            onClick={onToggleOfflineCache}
            style={{
              padding: '16px',
              borderRadius: '16px',
              border: offlineCacheEnabled ? '2px solid var(--teal-900)' : '1.5px solid var(--neutral-200)',
              backgroundColor: offlineCacheEnabled ? 'var(--teal-50)' : 'var(--white)',
              cursor: 'pointer',
              display: 'flex',
              gap: '14px',
              transition: 'all 0.2s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '12px',
                background: offlineCacheEnabled ? 'var(--teal-900)' : 'var(--neutral-100)',
                color: offlineCacheEnabled ? '#FFFFFF' : 'var(--neutral-600)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <CloudCheckIcon size={22} color={offlineCacheEnabled ? '#FFFFFF' : 'var(--neutral-600)'} />
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                <span style={{ fontSize: '16px', fontWeight: 600, color: 'var(--neutral-900)' }}>
                  Offline Cache
                </span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: offlineCacheEnabled ? 'var(--teal-900)' : 'var(--neutral-500)' }}>
                  {offlineCacheEnabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <p style={{ fontSize: '13px', color: 'var(--neutral-600)', lineHeight: '19px' }}>
                Store practice questions and notes locally so you can study without consuming mobile data.
              </p>
            </div>
          </div>

          {/* Architectural Note */}
          <div
            style={{
              background: 'var(--neutral-50)',
              border: '1px solid var(--neutral-200)',
              borderRadius: '12px',
              padding: '12px 14px',
              fontSize: '12px',
              color: 'var(--neutral-600)',
              lineHeight: '17px',
            }}
          >
            🔒 <strong>Privacy First:</strong> Microphone access is deferred until you activate AI Voice Mode in the tutor tab.
          </div>
        </div>

        {/* Action CTAs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: 'auto' }}>
          <button
            type="button"
            onClick={onEnableAndContinue}
            className="btn-primary"
            style={{ minHeight: '48px', height: '48px' }}
          >
            Enable & Continue
            <ArrowRightIcon size={18} color="#FFFFFF" />
          </button>

          <button
            type="button"
            onClick={onNotNow}
            className="btn-secondary"
            style={{ minHeight: '48px', height: '48px', borderColor: 'transparent', color: 'var(--neutral-600)' }}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};
