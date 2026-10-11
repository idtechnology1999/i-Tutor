import React, { useEffect, useState } from 'react';
import { BadgeCheck, Crown, Search, UsersRound } from 'lucide-react';
import { listUsers } from '../../services/admin';
import type { UserList } from '../../services/admin';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Users: everyone who has registered, newest first, with a search box.
   Read-only — plans only change through payments. */

const day = (iso: string) => new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const ago = (iso: string) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return `${hours} h ago`;
  const days = Math.round(hours / 24);
  return days < 31 ? `${days} d ago` : day(iso);
};

const EXAM_NAME: Record<string, string> = { UTME: 'JAMB' };

export const AdminUsers: React.FC<{ nav: AdminNav; mode: 'live' | 'demo' }> = ({ mode }) => {
  const [query, setQuery] = useState('');
  const [data, setData] = useState<UserList | null>(null);
  const [error, setError] = useState('');

  // Search as the admin types, a moment after they stop.
  useEffect(() => {
    let cancelled = false;
    const t = window.setTimeout(() => {
      listUsers(query.trim())
        .then((d) => !cancelled && (setData(d), setError('')))
        .catch((err: Error) => !cancelled && setError(err.message));
    }, 250);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [query]);

  return (
    <div className="adm-page">
      <PageHead title="Users" sub="Everyone who has registered on i-Tutor, newest first." />

      {mode === 'demo' ? (
        <div className="adm-empty">
          <h3>Connect the backend to see users</h3>
          <p>Demo mode has no real accounts. Sign in with the admin key while the server is running.</p>
        </div>
      ) : (
        <>
          <div className="adm-users__stats">
            <div>
              <UsersRound size={20} aria-hidden />
              <b>{data?.total ?? '–'}</b>
              <span>registered</span>
            </div>
            <div>
              <BadgeCheck size={20} aria-hidden />
              <b>{data?.verified ?? '–'}</b>
              <span>verified</span>
            </div>
            <div>
              <Crown size={20} aria-hidden />
              <b>{data?.premium ?? '–'}</b>
              <span>on Premium</span>
            </div>
          </div>

          <label className="adm-users__search">
            <Search size={18} aria-hidden />
            <input
              className="adm-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, phone or email"
              aria-label="Search users"
            />
          </label>

          {error && <p className="adm-users__error">{error}</p>}

          {data && data.users.length === 0 ? (
            <div className="adm-empty">
              <h3>{query ? 'No one matches that search' : 'No users yet'}</h3>
              <p>{query ? 'Try part of a name, phone number or email.' : 'Students appear here as soon as they register.'}</p>
            </div>
          ) : (
            <div className="adm-users__table" role="table" aria-label="Users">
              <div className="adm-users__row adm-users__row--head" role="row">
                <span role="columnheader">Student</span>
                <span role="columnheader">Exams</span>
                <span role="columnheader">Plan</span>
                <span role="columnheader">Joined</span>
                <span role="columnheader">Last active</span>
              </div>
              {data?.users.map((u) => (
                <div key={u.id} className="adm-users__row" role="row">
                  <span role="cell" className="adm-users__who">
                    <i aria-hidden>{u.fullName.charAt(0).toUpperCase()}</i>
                    <span>
                      <strong>
                        {u.fullName}
                        {u.verified ? (
                          <BadgeCheck size={15} className="adm-users__ok" aria-label="Verified" />
                        ) : (
                          <em className="adm-users__pending">Not verified</em>
                        )}
                      </strong>
                      <small>{u.phoneOrEmail}</small>
                    </span>
                  </span>
                  <span role="cell" className="adm-users__exams">
                    {u.exams.length ? u.exams.map((e) => <em key={e}>{EXAM_NAME[e] ?? e}</em>) : <small>Not set</small>}
                  </span>
                  <span role="cell">
                    {u.plan === 'premium' ? (
                      <span className="adm-users__plan is-premium">
                        Premium
                        {u.planExpiresAt && <small>until {day(u.planExpiresAt)}</small>}
                      </span>
                    ) : (
                      <span className="adm-users__plan">Free</span>
                    )}
                  </span>
                  <span role="cell">{day(u.createdAt)}</span>
                  <span role="cell">{ago(u.lastActiveAt)}</span>
                </div>
              ))}
            </div>
          )}
          {data && data.users.length === 500 && <p className="adm-muted">Showing the newest 500. Search to find someone older.</p>}
        </>
      )}
    </div>
  );
};
