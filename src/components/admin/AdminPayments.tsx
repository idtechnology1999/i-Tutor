import React, { useEffect, useState } from 'react';
import { Check, CreditCard, LoaderCircle, X } from 'lucide-react';
import { getPaymentMode, setPaymentMode } from '../../services/system';
import type { PaymentModeInfo } from '../../services/system';
import type { AdminNav } from './AdminApp';
import { ConfirmDialog } from './AdminSystem';

/* Admin → Settings → Payments: switch Paystack between Test (no real money)
   and Live (real payments). The secret keys stay in the server's .env; this
   card only shows whether each one is installed. Switching needs the super
   admin password, and going live also needs LIVE typed. */

const WEBHOOK = 'https://api.i-tutor.com.ng/api/payments/webhook';

export const PaymentsCard: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const [info, setInfo] = useState<PaymentModeInfo | null>(null);
  const [error, setError] = useState('');
  const [switchTo, setSwitchTo] = useState<'test' | 'live' | null>(null);

  useEffect(() => {
    getPaymentMode()
      .then(setInfo)
      .catch((e: Error) => setError(e.message));
  }, []);

  const live = info?.mode === 'live';
  const key = (ok: boolean, name: string) => (
    <li className={ok ? 'is-ok' : 'is-missing'}>
      {ok ? <Check size={15} aria-hidden /> : <X size={15} aria-hidden />} {name} {ok ? 'installed' : 'not on the server yet'}
    </li>
  );

  return (
    <section className="adm-card pay-mode" aria-labelledby="pay-mode-title">
      <h2 className="adm-card__title" id="pay-mode-title">
        <CreditCard size={18} aria-hidden /> Payments
      </h2>

      {!info && !error && (
        <p className="adm-muted">
          <LoaderCircle size={14} className="adm-spin" aria-hidden /> Checking…
        </p>
      )}
      {error && <p className="adm-error">{error}</p>}

      {info && (
        <>
          <div className={`pay-mode__now ${live ? 'is-live' : 'is-test'}`}>
            <span className="pay-mode__badge">{live ? 'LIVE' : 'TEST'}</span>
            <p>
              {live ? (
                <>
                  <b>Live:</b> students pay real money, and Premium switches on when they pay.
                </>
              ) : (
                <>
                  <b>Test:</b> no real money is taken. Use Paystack’s test cards to try the payment steps.
                </>
              )}
            </p>
          </div>

          <div className="pay-mode__switch" role="radiogroup" aria-label="Payment mode">
            <button
              type="button"
              role="radio"
              aria-checked={!live}
              className={!live ? 'is-on' : ''}
              disabled={!live}
              onClick={() => setSwitchTo('test')}
            >
              Test
            </button>
            <button
              type="button"
              role="radio"
              aria-checked={live}
              className={live ? 'is-on is-live' : ''}
              disabled={live}
              onClick={() => setSwitchTo('live')}
            >
              Live
            </button>
          </div>

          <ul className="pay-mode__keys">
            {key(info.testKey, 'Test key')}
            {key(info.liveKey, 'Live key')}
          </ul>
          <p className="adm-muted">
            Keys are kept only on the server (<code>PAYSTACK_SECRET_KEY_TEST</code> and <code>PAYSTACK_SECRET_KEY_LIVE</code> in its .env file), never in
            the admin. In Paystack, set the webhook for both Test and Live to <code>{WEBHOOK}</code>.
          </p>
          {info.changedAt && (
            <p className="adm-muted">
              Last changed by {info.changedBy || 'an admin'} on {new Date(info.changedAt).toLocaleString('en-NG')}.
            </p>
          )}
        </>
      )}

      {switchTo && (
        <ConfirmDialog
          title={switchTo === 'live' ? 'Switch payments to Live' : 'Switch payments to Test'}
          message={
            switchTo === 'live'
              ? 'From now on students pay real money through Paystack. Make sure you have tried a test payment first.'
              : 'From now on no real money is taken. Students who try to pay will only see Paystack’s test checkout.'
          }
          word={switchTo === 'live' ? 'LIVE' : undefined}
          action={switchTo === 'live' ? 'Go live' : 'Switch to Test'}
          danger={switchTo === 'live'}
          onClose={() => setSwitchTo(null)}
          onConfirm={async (password) => {
            const next = await setPaymentMode(switchTo, password);
            setInfo(next);
            setSwitchTo(null);
            nav.notify(next.mode === 'live' ? 'Payments are now LIVE.' : 'Payments are now in TEST mode.');
          }}
        />
      )}
    </section>
  );
};
