import React, { useEffect, useState } from 'react';
import { Check, CreditCard, LoaderCircle, Tag, X } from 'lucide-react';
import { getPaymentMode, getPlanPricesAdmin, savePlanPrices, setPaymentMode } from '../../services/system';
import type { PaymentModeInfo } from '../../services/system';
import { DEFAULT_PRICES, nairaText, setLocalPlanPrices } from '../../services/plans';
import type { AdminNav } from './AdminApp';
import { ConfirmDialog } from './AdminSystem';

/* Admin → Settings → Plans & prices: what Premium costs. Checkout charges these
   and every page that shows a price follows them. Saving needs the super admin
   password. */
export const PricesCard: React.FC<{ nav: AdminNav; live: boolean }> = ({ nav, live }) => {
  const [saved, setSaved] = useState(DEFAULT_PRICES);
  const [monthly, setMonthly] = useState(String(DEFAULT_PRICES.monthly));
  const [quarter, setQuarter] = useState(String(DEFAULT_PRICES.quarter));
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!live) return;
    getPlanPricesAdmin()
      .then((p) => {
        setSaved(p);
        setMonthly(String(p.monthly));
        setQuarter(String(p.quarter));
      })
      .catch((e: Error) => setError(e.message));
  }, [live]);

  const m = Number(monthly.replace(/[^\d]/g, ''));
  const q = Number(quarter.replace(/[^\d]/g, ''));
  const valid = m >= 100 && q >= 100 && m <= 1_000_000 && q <= 1_000_000;
  const changed = m !== saved.monthly || q !== saved.quarter;
  const saving = m * 3 - q;

  const field = (label: string, value: string, set: (v: string) => void, hint: string) => (
    <label className="adm-field prices__field">
      <span>{label}</span>
      <div className="adm-input adm-input--icon prices__input">
        <b aria-hidden>₦</b>
        <input inputMode="numeric" value={value} onChange={(e) => set(e.target.value.replace(/[^\d,]/g, ''))} aria-label={`${label} in naira`} />
      </div>
      <small className="adm-muted">{hint}</small>
    </label>
  );

  return (
    <section className="adm-card prices" aria-labelledby="prices-title">
      <h2 className="adm-card__title" id="prices-title">
        <Tag size={18} aria-hidden /> Premium prices
      </h2>
      <p className="adm-muted">
        What students pay for Premium. Checkout charges these amounts, and the upgrade page, the home page plans, the credits card and the tutor all
        show them.
      </p>
      <div className="adm-grid-2">
        {field('1 month', monthly, setMonthly, 'Shown as the monthly price.')}
        {field('3 months', quarter, setQuarter, saving > 0 ? `Students save ${nairaText(saving)} against 3 single months.` : 'No saving against 3 single months.')}
      </div>
      {!valid && <p className="adm-error">Each price must be between ₦100 and ₦1,000,000.</p>}
      {error && <p className="adm-error">{error}</p>}
      {!live ? (
        <p className="adm-muted">Demo mode: prices are saved on the live site only.</p>
      ) : (
        <div className="adm-row-actions">
          <button type="button" className="adm-btn adm-btn--primary" disabled={!valid || !changed} onClick={() => setConfirming(true)}>
            Save prices
          </button>
          {changed && (
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                setMonthly(String(saved.monthly));
                setQuarter(String(saved.quarter));
              }}
            >
              Undo
            </button>
          )}
        </div>
      )}
      <p className="adm-muted prices__note">
        Students who already paid keep what they paid for. New prices apply to the next payment.
      </p>

      {confirming && (
        <ConfirmDialog
          title="Change Premium prices"
          message={`From now on: ${nairaText(m)} for 1 month and ${nairaText(q)} for 3 months.`}
          action="Save prices"
          onClose={() => setConfirming(false)}
          onConfirm={async (password) => {
            const next = await savePlanPrices({ monthly: m, quarter: q }, password);
            setSaved(next);
            setLocalPlanPrices(next);
            setConfirming(false);
            nav.notify('Prices saved. The site shows them now.');
          }}
        />
      )}
    </section>
  );
};

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
