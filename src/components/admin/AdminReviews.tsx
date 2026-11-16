import React, { useCallback, useEffect, useState } from 'react';
import { Check, EyeOff, LoaderCircle, Star, Trash2, Undo2 } from 'lucide-react';
import { deleteReview, listAdminReviews, setReviewStatus } from '../../services/reviews';
import type { AdminReview } from '../../services/reviews';
import { StudentAvatar } from '../web/StudentAvatar';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Admin → Reviews: students rate i-Tutor after an exam. Nothing reaches the
   website until it's approved here; "Hide" takes an approved one down again. */

type Status = AdminReview['status'];
const TABS: Array<{ id: Status; label: string }> = [
  { id: 'pending', label: 'Waiting' },
  { id: 'approved', label: 'On the website' },
  { id: 'hidden', label: 'Hidden' },
];

export const AdminReviews: React.FC<{ nav: AdminNav; mode: 'live' | 'demo' }> = ({ nav, mode }) => {
  const [tab, setTab] = useState<Status>('pending');
  const [rows, setRows] = useState<AdminReview[] | null>(null);
  const [counts, setCounts] = useState<Partial<Record<Status, number>>>({});
  const [error, setError] = useState('');
  const [busy, setBusy] = useState('');

  const load = useCallback(() => {
    if (mode !== 'live') return setRows([]);
    setRows(null);
    listAdminReviews(tab)
      .then((r) => {
        setRows(r.reviews);
        setCounts(r.counts);
      })
      .catch((e: Error) => setError(e.message));
  }, [tab, mode]);

  useEffect(load, [load]);

  const act = async (r: AdminReview, what: Status | 'delete') => {
    if (what === 'delete' && !window.confirm(`Delete ${r.name}’s review for good?`)) return;
    setBusy(r.id);
    try {
      if (what === 'delete') await deleteReview(r.id);
      else await setReviewStatus(r.id, what);
      nav.notify(what === 'approved' ? 'Review approved. It’s on the website now.' : what === 'hidden' ? 'Review hidden.' : what === 'delete' ? 'Review deleted.' : 'Moved back to waiting.');
      load();
    } catch (e) {
      nav.notify((e as Error).message);
    } finally {
      setBusy('');
    }
  };

  return (
    <div className="adm-page">
      <PageHead
        title="Reviews"
        sub="Students rate i-Tutor after an exam. Approve the ones you’re happy to show; only approved reviews appear in the home page carousel."
      />

      <div className="rvx-tabs" role="tablist" aria-label="Review status">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={tab === t.id ? 'is-on' : ''} onClick={() => setTab(t.id)}>
            {t.label}
            {counts[t.id] ? <span className="rvx-tabs__n">{counts[t.id]}</span> : null}
          </button>
        ))}
      </div>

      {mode !== 'live' && <p className="adm-muted">Reviews come from students on the live site, so there are none in demo mode.</p>}
      {error && <p className="adm-error">{error}</p>}
      {rows === null && !error && (
        <p className="adm-muted">
          <LoaderCircle size={14} className="adm-spin" aria-hidden /> Loading…
        </p>
      )}
      {rows?.length === 0 && mode === 'live' && (
        <div className="adm-card rvx-empty">
          {tab === 'pending' ? 'No reviews waiting. New ones appear here after students finish an exam.' : tab === 'approved' ? 'No reviews on the website yet.' : 'No hidden reviews.'}
        </div>
      )}

      <div className="rvx-list">
        {rows?.map((r) => (
          <article className="adm-card rvx" key={r.id}>
            <header className="rvx__who">
              <StudentAvatar photo={r.photo} gender={r.gender} name={r.name} size={44} />
              <div>
                <strong>{r.fullName}</strong>
                <small>
                  Shows as “{r.name}” · {new Date(r.date).toLocaleDateString('en-NG', { day: 'numeric', month: 'short', year: 'numeric' })}
                </small>
              </div>
              <span className="rvx__stars" aria-label={`${r.rating} out of 5 stars`}>
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} size={16} className={i <= r.rating ? 'is-on' : ''} aria-hidden />
                ))}
              </span>
            </header>
            <p className="rvx__text">{r.text}</p>
            <div className="adm-row-actions">
              {r.status !== 'approved' && (
                <button type="button" className="adm-btn adm-btn--primary" disabled={busy === r.id} onClick={() => void act(r, 'approved')}>
                  <Check size={16} aria-hidden /> Approve
                </button>
              )}
              {r.status !== 'hidden' && (
                <button type="button" className="adm-btn" disabled={busy === r.id} onClick={() => void act(r, 'hidden')}>
                  <EyeOff size={16} aria-hidden /> Hide
                </button>
              )}
              {r.status === 'hidden' && (
                <button type="button" className="adm-btn" disabled={busy === r.id} onClick={() => void act(r, 'pending')}>
                  <Undo2 size={16} aria-hidden /> Back to waiting
                </button>
              )}
              <button type="button" className="adm-btn adm-btn--danger-ghost" disabled={busy === r.id} onClick={() => void act(r, 'delete')}>
                <Trash2 size={16} aria-hidden /> Delete
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
};
