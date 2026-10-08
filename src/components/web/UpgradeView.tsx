import React, { useMemo, useState } from 'react';
import {
  ArrowLeft,
  Building2,
  Check,
  CircleCheckBig,
  Copy,
  CreditCard,
  Hash,
  Infinity as InfinityIcon,
  LoaderCircle,
  Lock,
  MessageSquareText,
  Mic,
  CalendarCheck,
  ChartNoAxesColumnIncreasing,
} from 'lucide-react';
import type { UserProfile } from '../../types';

interface Props {
  profile: UserProfile;
  onActivated: () => void;
  onOpenTutor: () => void;
  onGoHome: () => void;
}

/* -----------------------------------------------------------------------------
   Upgrade & payment (H01–H05). Runs in TEST MODE: nothing is charged and no
   card details leave the browser. To take real money, replace `confirmPayment`
   with a Paystack (or Flutterwave) checkout and verify it on the server via
   webhook before calling `onActivated` — never trust the client alone.
   -------------------------------------------------------------------------- */

type PlanId = 'monthly' | 'quarter';
type Method = 'card' | 'transfer' | 'ussd';
type Step = 'plan' | 'pay' | 'processing' | 'done';

const PLANS: Record<PlanId, { name: string; price: number; per: string; note: string; tag?: string }> = {
  monthly: { name: '1 month', price: 2500, per: 'per month', note: 'Cancel anytime' },
  quarter: {
    name: '3 months',
    price: 6500,
    per: 'for 3 months',
    note: 'Covers a full exam season · save ₦1,000',
    tag: 'Best value',
  },
};

const BENEFITS = [
  { icon: InfinityIcon, text: 'Unlimited questions to the AI tutor' },
  { icon: MessageSquareText, text: 'Step-by-step help on every past question' },
  { icon: CalendarCheck, text: 'A personal weekly study plan' },
  { icon: ChartNoAxesColumnIncreasing, text: 'Detailed reports on your weak topics' },
  { icon: Mic, text: '60 minutes of voice tutoring each month' },
];

const BANKS_USSD = [
  { bank: 'GTBank', code: '*737*000*{amount}#' },
  { bank: 'Access Bank', code: '*901*000*{amount}#' },
  { bank: 'Zenith Bank', code: '*966*000*{amount}#' },
  { bank: 'UBA', code: '*919*000*{amount}#' },
  { bank: 'First Bank', code: '*894*000*{amount}#' },
];

const naira = (n: number) => `₦${n.toLocaleString('en-NG')}`;

const cardBrand = (digits: string) => {
  if (/^4/.test(digits)) return 'Visa';
  if (/^(5[1-5]|2[2-7])/.test(digits)) return 'Mastercard';
  if (/^(506[0-1]|507[89]|6500)/.test(digits)) return 'Verve';
  return '';
};

// Luhn check so typos are caught before "paying".
const luhn = (digits: string) => {
  let sum = 0;
  for (let i = 0; i < digits.length; i += 1) {
    let d = Number(digits[digits.length - 1 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return digits.length >= 16 && sum % 10 === 0;
};

const CopyButton: React.FC<{ value: string }> = ({ value }) => {
  const [copied, setCopied] = useState(false);
  return (
    <button
      type="button"
      className="pay-copy"
      onClick={() => {
        void navigator.clipboard?.writeText(value).catch(() => undefined);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 1600);
      }}
    >
      {copied ? <Check size={16} aria-hidden /> : <Copy size={16} aria-hidden />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
};

export const UpgradeView: React.FC<Props> = ({ profile, onActivated, onOpenTutor, onGoHome }) => {
  const isPremium = profile.plan === 'premium';
  const [step, setStep] = useState<Step>('plan');
  const [plan, setPlan] = useState<PlanId>('quarter');
  const [method, setMethod] = useState<Method>('card');

  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardTouched, setCardTouched] = useState(false);
  const [ussdBank, setUssdBank] = useState(0);
  const [today] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() + 1 };
  });

  const amount = PLANS[plan].price;
  const digits = cardNumber.replace(/\D/g, '');
  const brand = cardBrand(digits);

  const expiryValid = useMemo(() => {
    const m = /^(\d{2})\/(\d{2})$/.exec(expiry);
    if (!m) return false;
    const month = Number(m[1]);
    const year = 2000 + Number(m[2]);
    if (month < 1 || month > 12) return false;
    return year > today.year || (year === today.year && month >= today.month);
  }, [expiry, today]);

  const cardErrors = {
    number: luhn(digits) ? '' : 'Check your card number',
    expiry: expiryValid ? '' : 'Use MM/YY, e.g. 08/28',
    cvv: /^\d{3,4}$/.test(cvv) ? '' : '3 digits on the back',
  };
  const cardOk = !cardErrors.number && !cardErrors.expiry && !cardErrors.cvv;

  const [reference] = useState(
    () => `ITUT-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
  );

  const confirmPayment = () => {
    setStep('processing');
    // Test mode: simulate the gateway + webhook round trip.
    window.setTimeout(() => {
      onActivated();
      setStep('done');
    }, 2200);
  };

  const onPayCard = (event: React.FormEvent) => {
    event.preventDefault();
    setCardTouched(true);
    if (cardOk) confirmPayment();
  };

  /* ------------------------------------------------------------ Already on */
  if (isPremium && step !== 'done') {
    return (
      <div className="pay">
        <div className="pay__card pay__card--center">
          <span className="pay__success-icon">
            <CircleCheckBig size={36} aria-hidden />
          </span>
          <h1>You’re on Premium</h1>
          <p>The AI tutor is fully unlocked. Ask it as many questions as you like.</p>
          <div className="pay__actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={onOpenTutor}>
              <MessageSquareText size={18} aria-hidden /> Ask the tutor
            </button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onGoHome}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------------ Done */
  if (step === 'done') {
    return (
      <div className="pay">
        <div className="pay__card pay__card--center pay__card--celebrate">
          <span className="pay__success-icon">
            <CircleCheckBig size={40} aria-hidden />
          </span>
          <h1>AI tutor activated</h1>
          <p>
            Payment of <strong>{naira(amount)}</strong> received. You now have unlimited help
            from the tutor for {PLANS[plan].name}.
          </p>
          <p className="pay__ref">Reference: {reference}</p>
          <div className="pay__actions">
            <button type="button" className="ui-btn ui-btn--primary" onClick={onOpenTutor}>
              <MessageSquareText size={18} aria-hidden /> Ask your first question
            </button>
            <button type="button" className="ui-btn ui-btn--ghost" onClick={onGoHome}>
              Back to home
            </button>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------------------------------------ Processing */
  if (step === 'processing') {
    return (
      <div className="pay">
        <div className="pay__card pay__card--center" role="status" aria-live="polite">
          <LoaderCircle size={40} className="pay__spinner" aria-hidden />
          <h1>Confirming your payment…</h1>
          <p>This takes a few seconds. Please don’t close this page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pay">
      <div className="pay__steps" aria-label="Progress">
        <span className={step === 'plan' ? 'is-on' : 'is-done'}>
          <i>{step === 'plan' ? 1 : <Check size={12} aria-hidden />}</i> Choose plan
        </span>
        <span className="pay__steps-line" aria-hidden />
        <span className={step === 'pay' ? 'is-on' : ''}>
          <i>2</i> Pay
        </span>
        <span className="pay__steps-line" aria-hidden />
        <span>
          <i>3</i> Done
        </span>
      </div>

      {step === 'plan' && (
        <div className="pay__grid">
          <section className="pay__card">
            <h1>Unlock the AI tutor</h1>
            <p className="pay__lead">
              Free accounts get 5 tutor questions a day. Premium gives you unlimited help.
            </p>

            <div className="pay__plans" role="radiogroup" aria-label="Choose a plan">
              {(Object.keys(PLANS) as PlanId[]).map((id) => {
                const p = PLANS[id];
                const on = plan === id;
                return (
                  <button
                    key={id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    className={`pay__plan${on ? ' is-on' : ''}`}
                    onClick={() => setPlan(id)}
                  >
                    <span className="pay__radio" aria-hidden />
                    <span className="pay__plan-text">
                      <strong>{p.name}</strong>
                      <small>{p.note}</small>
                    </span>
                    <span className="pay__plan-price">
                      {naira(p.price)}
                      <small>{p.per}</small>
                    </span>
                    {p.tag && <span className="pay__tag">{p.tag}</span>}
                  </button>
                );
              })}
            </div>

            <button type="button" className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg" onClick={() => setStep('pay')}>
              Continue to payment · {naira(amount)}
            </button>
            <p className="pay__fine">
              <Lock size={14} aria-hidden /> Pay with card, bank transfer or USSD.
            </p>
          </section>

          <aside className="pay__card pay__benefits">
            <h2>What you get</h2>
            <ul>
              {BENEFITS.map(({ icon: Icon, text }) => (
                <li key={text}>
                  <span>
                    <Icon size={18} aria-hidden />
                  </span>
                  {text}
                </li>
              ))}
            </ul>
          </aside>
        </div>
      )}

      {step === 'pay' && (
        <section className="pay__card pay__checkout">
          <button type="button" className="pay__back" onClick={() => setStep('plan')}>
            <ArrowLeft size={16} aria-hidden /> Change plan
          </button>

          <div className="pay__summary">
            <span>
              i-Tutor Premium · {PLANS[plan].name}
            </span>
            <strong>{naira(amount)}</strong>
          </div>

          <div className="pay__test" role="note">
            Test mode — no real money is taken.
          </div>

          <h2 className="pay__h2">How would you like to pay?</h2>
          <div className="pay__methods" role="tablist" aria-label="Payment method">
            {(
              [
                ['card', CreditCard, 'Card'],
                ['transfer', Building2, 'Bank transfer'],
                ['ussd', Hash, 'USSD'],
              ] as const
            ).map(([id, Icon, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={method === id}
                className={method === id ? 'is-on' : ''}
                onClick={() => setMethod(id)}
              >
                <Icon size={20} aria-hidden />
                {label}
              </button>
            ))}
          </div>

          {method === 'card' && (
            <form className="pay__form" onSubmit={onPayCard} noValidate>
              <label className="pay__field">
                <span>Card number</span>
                <div className="pay__input">
                  <input
                    inputMode="numeric"
                    autoComplete="cc-number"
                    placeholder="0000 0000 0000 0000"
                    value={cardNumber}
                    maxLength={23}
                    onChange={(e) =>
                      setCardNumber(
                        e.target.value
                          .replace(/\D/g, '')
                          .slice(0, 19)
                          .replace(/(\d{4})(?=\d)/g, '$1 '),
                      )
                    }
                    aria-invalid={cardTouched && Boolean(cardErrors.number)}
                  />
                  {brand && <span className="pay__brand">{brand}</span>}
                </div>
                {cardTouched && cardErrors.number && <em>{cardErrors.number}</em>}
              </label>
              <div className="pay__row">
                <label className="pay__field">
                  <span>Expiry</span>
                  <div className="pay__input">
                    <input
                      inputMode="numeric"
                      autoComplete="cc-exp"
                      placeholder="MM/YY"
                      value={expiry}
                      maxLength={5}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, '').slice(0, 4);
                        setExpiry(v.length > 2 ? `${v.slice(0, 2)}/${v.slice(2)}` : v);
                      }}
                      aria-invalid={cardTouched && Boolean(cardErrors.expiry)}
                    />
                  </div>
                  {cardTouched && cardErrors.expiry && <em>{cardErrors.expiry}</em>}
                </label>
                <label className="pay__field">
                  <span>CVV</span>
                  <div className="pay__input">
                    <input
                      inputMode="numeric"
                      autoComplete="cc-csc"
                      placeholder="123"
                      type="password"
                      value={cvv}
                      maxLength={4}
                      onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                      aria-invalid={cardTouched && Boolean(cardErrors.cvv)}
                    />
                  </div>
                  {cardTouched && cardErrors.cvv && <em>{cardErrors.cvv}</em>}
                </label>
              </div>
              <button type="submit" className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg">
                <Lock size={18} aria-hidden /> Pay {naira(amount)}
              </button>
              <p className="pay__fine">Test card: 4084 0840 8408 4081 · any future date · any CVV</p>
            </form>
          )}

          {method === 'transfer' && (
            <div className="pay__form">
              <p className="pay__help">
                Send exactly <strong>{naira(amount)}</strong> from your bank app to this account.
                It confirms automatically.
              </p>
              <dl className="pay__details">
                <div>
                  <dt>Bank</dt>
                  <dd>Test Bank</dd>
                </div>
                <div>
                  <dt>Account number</dt>
                  <dd>
                    0000000000 <CopyButton value="0000000000" />
                  </dd>
                </div>
                <div>
                  <dt>Account name</dt>
                  <dd>i-Tutor Checkout</dd>
                </div>
                <div>
                  <dt>Amount</dt>
                  <dd>
                    {naira(amount)} <CopyButton value={String(amount)} />
                  </dd>
                </div>
              </dl>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg" onClick={confirmPayment}>
                I’ve sent the money
              </button>
            </div>
          )}

          {method === 'ussd' && (
            <div className="pay__form">
              <p className="pay__help">Choose your bank, then dial the code on the phone linked to your account.</p>
              <div className="pay__banks" role="radiogroup" aria-label="Your bank">
                {BANKS_USSD.map((b, i) => (
                  <button
                    key={b.bank}
                    type="button"
                    role="radio"
                    aria-checked={ussdBank === i}
                    className={ussdBank === i ? 'is-on' : ''}
                    onClick={() => setUssdBank(i)}
                  >
                    {b.bank}
                  </button>
                ))}
              </div>
              <div className="pay__ussd">
                <span>Dial</span>
                <strong>{BANKS_USSD[ussdBank].code.replace('{amount}', String(amount))}</strong>
                <CopyButton value={BANKS_USSD[ussdBank].code.replace('{amount}', String(amount))} />
              </div>
              <button type="button" className="ui-btn ui-btn--primary ui-btn--block ui-btn--lg" onClick={confirmPayment}>
                I’ve completed the USSD payment
              </button>
            </div>
          )}
        </section>
      )}
    </div>
  );
};
