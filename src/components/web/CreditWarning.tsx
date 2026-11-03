import React, { useEffect } from 'react';
import { TriangleAlert, X } from 'lucide-react';
import { dismissCreditNotice, useCreditNotice, useCredits } from '../../services/credits';

/* The running-low notice for the AI allowance: once when the ring turns
   orange and once when it turns red (services/credits.ts decides when).
   It closes by itself after 15 seconds. */

export const CreditWarning: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => {
  const notice = useCreditNotice();
  const credits = useCredits();

  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(dismissCreditNotice, 15_000);
    return () => window.clearTimeout(t);
  }, [notice]);

  if (!notice) return null;
  return (
    <div className={`credit-warn credit-warn--${notice.level}`} role="status">
      <TriangleAlert size={20} aria-hidden className="credit-warn__icon" />
      <p>{notice.text}</p>
      <button
        type="button"
        className="credit-warn__go"
        onClick={() => {
          dismissCreditNotice();
          onUpgrade();
        }}
      >
        {credits?.plan === 'free' ? 'Subscribe' : 'Renew now'}
      </button>
      <button type="button" className="credit-warn__close" onClick={dismissCreditNotice} aria-label="Close">
        <X size={18} aria-hidden />
      </button>
    </div>
  );
};
