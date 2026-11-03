import React, { useEffect, useState } from 'react';
import { api, isLive } from '../../services/api';
import { KIND_LABEL } from '../../services/credits';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* AI usage: the real AI bill, from the token counts Gemini reports for every
   request (backend GET /api/admin/ai-usage). Naira figures use the prices and
   exchange rate in the server's settings (AI_PRICE_*, NAIRA_PER_DOLLAR). */

interface Usage {
  days: number;
  totalNaira: number;
  inputTokens: number;
  outputTokens: number;
  premiumStudents: number;
  freeStudentsUsedUp: number;
  kinds: { kind: string; requests: number; saved: number; failed: number; credits: number; naira: number; perRequest: number }[];
  prices: { inputPerM: number; outputPerM: number; nairaPerDollar: number };
}

const naira = (n: number) => `₦${Math.round(n).toLocaleString('en-NG')}`;
const LABELS: Record<string, string> = { ...KIND_LABEL, admissions: 'Admission checks (sign-up)' };

export const AdminAiUsage: React.FC<{ nav: AdminNav }> = () => {
  const [span, setSpan] = useState(30);
  const [data, setData] = useState<Usage | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isLive) return;
    let live = true;
    api<Usage>(`/api/admin/ai-usage?days=${span}`)
      .then((d) => live && setData(d))
      .catch((err: Error) => live && setError(err.message));
    return () => {
      live = false;
    };
  }, [span]);

  // What the AI costs per paying student over this period, against ₦2,500 a month.
  const perPremium = data && data.premiumStudents ? (data.totalNaira / data.premiumStudents) * (30 / data.days) : null;
  const saved = data?.kinds.reduce((n, k) => n + k.saved, 0) ?? 0;

  return (
    <div className="adm-page">
      <PageHead
        title="AI usage"
        sub="What the AI tutor really costs, from Gemini’s own token counts."
        actions={
          <select className="adm-input" value={span} onChange={(e) => setSpan(Number(e.target.value))} aria-label="Period">
            <option value={1}>Today</option>
            <option value={7}>Last 7 days</option>
            <option value={30}>Last 30 days</option>
            <option value={90}>Last 90 days</option>
          </select>
        }
      />

      {!isLive && <p className="adm-banner">Connect the backend to see the AI bill. Demo mode makes no AI requests.</p>}
      {error && <p className="adm-error">{error}</p>}

      {data && (
        <>
          <div className="ai-usage__stats">
            <div className="ui-card">
              <small>AI cost, {data.days === 1 ? 'today' : `last ${data.days} days`}</small>
              <strong>{naira(data.totalNaira)}</strong>
            </div>
            <div className="ui-card">
              <small>Premium students now</small>
              <strong>{data.premiumStudents.toLocaleString()}</strong>
            </div>
            <div className="ui-card">
              <small>AI cost per Premium student, a month</small>
              <strong>{perPremium === null ? '—' : naira(perPremium)}</strong>
              <em>of ₦2,500 paid</em>
            </div>
            <div className="ui-card">
              <small>Answers served from saved explanations (free)</small>
              <strong>{saved.toLocaleString()}</strong>
            </div>
          </div>

          <table className="adm-table ai-usage__table">
            <thead>
              <tr>
                <th>What</th>
                <th>Requests</th>
                <th>Saved (free)</th>
                <th>Failed</th>
                <th>Credits taken</th>
                <th>AI cost</th>
                <th>Per request</th>
              </tr>
            </thead>
            <tbody>
              {data.kinds.map((k) => (
                <tr key={k.kind}>
                  <td>{LABELS[k.kind] ?? k.kind}</td>
                  <td>{k.requests.toLocaleString()}</td>
                  <td>{k.saved.toLocaleString()}</td>
                  <td>{k.failed.toLocaleString()}</td>
                  <td>{k.credits.toLocaleString()}</td>
                  <td>{naira(k.naira)}</td>
                  <td>{naira(k.perRequest)}</td>
                </tr>
              ))}
              {!data.kinds.length && (
                <tr>
                  <td colSpan={7}>No AI requests in this period yet.</td>
                </tr>
              )}
            </tbody>
          </table>

          <p className="adm-muted">
            {data.freeStudentsUsedUp.toLocaleString()} free students have used all 5 free prompts. Prices used: ${data.prices.inputPerM} per million input
            tokens, ${data.prices.outputPerM} per million output tokens, ₦{data.prices.nairaPerDollar.toLocaleString()} to $1. Update them in the
            server’s settings when Google’s prices or the exchange rate change.
          </p>
        </>
      )}
    </div>
  );
};
