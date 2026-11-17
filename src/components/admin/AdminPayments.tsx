import React, { useEffect, useState } from 'react';
import { Check, CreditCard, LoaderCircle, Tag, X } from 'lucide-react';
import { getPaymentMode, getPlanPricesAdmin, savePlanPrices, setPaymentMode } from '../../services/system';
import type { PaymentModeInfo } from '../../services/system';
import { DEFAULT_PRICES, nairaText, setLocalPlanPrices } from '../../services/plans';
import type { PlanPrices } from '../../services/plans';
import type { AdminNav } from './AdminApp';
import { ConfirmDialog } from './AdminSystem';

/* Admin → Settings → Plans & prices: what Premium costs and the AI credits each
   plan gives, plus the free prompts. Checkout charges these prices, payments
   give these credits, and every page that shows them follows. Saving needs the
   super admin password. */
type PlanKey = keyof PlanPrices;
const RANGE: Record<PlanKey, [number, number]> = {
  monthly: [100, 1_000_000],
  quarter: [100, 1_000_000],
  monthlyCredits: [1, 100_000],
  quarterCredits: [1, 100_000],
  freePrompts: [0, 1_000],
};
const KEYS = Object.keys(RANGE) as PlanKey[];
const asText = (p: PlanPrices) => Object.fromEntries(KEYS.map((k) => [k, String(p[k])])) as Record<PlanKey, string>;

export const PricesCard: React.FC<{ nav: AdminNav; live: boolean }> = ({ nav, live }) => {
  const [saved, setSaved] = useState<PlanPrices>(DEFAULT_PRICES);
  const [form, setForm] = useState<Record<PlanKey, string>>(asText(DEFAULT_PRICES));
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!live) return;
    getPlanPricesAdmin()
      .then((p) => {
        const full = { ...DEFAULT_PRICES, ...p };
        setSaved(full);
        setForm(asText(full));
      })
      .catch((e: Error) => setError(e.message));
  }, [live]);

  const v = Object.fromEntries(KEYS.map((k) => [k, Number(form[k].replace(/[^\d]/g, ''))])) as unknown as PlanPrices;
  const valid = KEYS.every((k) => form[k].trim() !== '' && v[k] >= RANGE[k][0] && v[k] <= RANGE[k][1]);
  const changed = KEYS.some((k) => v[k] !== saved[k]);
  const saving = v.monthly * 3 - v.quarter;
  const perCredit = (naira: number, credits: number) => (credits > 0 ? `about ${nairaText(naira / credits)} per credit` : '');

  const field = (k: PlanKey, label: string, unit: 'naira' | 'credits' | 'prompts', hint: string) => (
    <label className="adm-field prices__field">
      <span>{label}</span>
      <div className="adm-input adm-input--icon prices__input">
        {unit === 'naira' && <b aria-hidden>₦</b>}
        <input
          inputMode="numeric"
          value={form[k]}
          onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value.replace(/[^\d,]/g, '') }))}
          aria-label={`${label}${unit === 'naira' ? ' in naira' : ''}`}
        />
        {unit !== 'naira' && <small className="prices__unit">{unit}</small>}
      </div>
      <small className="adm-muted">{hint}</small>
    </label>
  );

  return (
    <section className="adm-card prices" aria-labelledby="prices-title">
      <h2 className="adm-card__title" id="prices-title">
        <Tag size={18} aria-hidden /> Plans, prices and AI credits
      </h2>
      <p className="adm-muted">
        What students pay for Premium and the AI credits they get. Checkout charges these prices, a payment gives these credits, and the upgrade
        page, home page plans, credits card and tutor all show them. Past questions and mock exams stay unlimited on every plan.
      </p>

      <h3 className="prices__group">1 month</h3>
      <div className="adm-grid-2">
        {field('monthly', 'Price', 'naira', 'Shown as the monthly price.')}
        {field('monthlyCredits', 'AI credits', 'credits', perCredit(v.monthly, v.monthlyCredits) || 'Credits for 30 days.')}
      </div>

      <h3 className="prices__group">3 months</h3>
      <div className="adm-grid-2">
        {field('quarter', 'Price', 'naira', saving > 0 ? `Students save ${nairaText(saving)} against 3 single months.` : 'No saving against 3 single months.')}
        {field('quarterCredits', 'AI credits', 'credits', `${perCredit(v.quarter, v.quarterCredits)}${v.quarterCredits !== v.monthlyCredits * 3 ? ` · 3 single months give ${v.monthlyCredits * 3}` : ' · same as 3 single months'}`)}
      </div>

      <h3 className="prices__group">Free accounts</h3>
      <div className="adm-grid-2">
        {field('freePrompts', 'Free AI prompts', 'prompts', 'In total, to try the tutor. They don’t renew.')}
      </div>

      {!valid && <p className="adm-error">Prices must be ₦100–₦1,000,000, credits 1–100,000 and free prompts 0–1,000.</p>}
      {error && <p className="adm-error">{error}</p>}
      {!live ? (
        <p className="adm-muted">Demo mode: plans are saved on the live site only.</p>
      ) : (
        <div className="adm-row-actions">
          <button type="button" className="adm-btn adm-btn--primary" disabled={!valid || !changed} onClick={() => setConfirming(true)}>
            Save plans
          </button>
          {changed && (
            <button type="button" className="adm-btn" onClick={() => setForm(asText(saved))}>
              Undo
            </button>
          )}
        </div>
      )}
      <p className="adm-muted prices__note">
        Students who already paid keep what they paid for. New prices and credits apply to the next payment; a change to free prompts applies to
        free accounts at once.
      </p>

      {confirming && (
        <ConfirmDialog
          title="Change plans"
          message={`From now on: 1 month ${nairaText(v.monthly)} with ${v.monthlyCredits} AI credits; 3 months ${nairaText(v.quarter)} with ${v.quarterCredits} AI credits; ${v.freePrompts} free AI prompts.`}
          action="Save plans"
          onClose={() => setConfirming(false)}
          onConfirm={async (password) => {
            const next = { ...DEFAULT_PRICES, ...(await savePlanPrices(v, password)) };
            setSaved(next);
            setForm(asText(next));
            setLocalPlanPrices(next);
            setConfirming(false);
            nav.notify('Plans saved. The site shows them now.');
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
