import React, { useEffect, useState } from 'react';
import { MailCheck, BellRing, Send } from 'lucide-react';
import { api, isLive } from '../../services/api';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Admin → Notifications (backend routes/admin/notifications.ts).
   1. Not verified: email a one-tap "Verify my email" link (all, or one student).
   2. Verified but no exam chosen: "Continue setting up" by email, plus a pop-up
      where allowed (all, or one).
      They also see a "Continue setting up" card on their dashboard, and get
      the pop-up automatically 1 hour after leaving, then every day at 10 am until done.
   3. The automatic pop-ups switch, and any pop-up to one student. */

type Mode = 'off' | 'test' | 'all';

interface Overview {
  mode: Mode;
  testAccounts: string[];
  devices: number;
  students: number;
  unverified: number;
  unverifiedEmailable: number;
  noExam: number;
  noExamWithPush: number;
  noExamEmailable: number;
}

type Status = { ok?: string; error?: string; busy?: boolean };

/** All / one student picker with a send button. */
const Sender: React.FC<{
  allLabel: string;
  oneLabel: string;
  disabledAll?: boolean;
  status: Status;
  onSend: (to: 'all' | 'one', account: string) => void;
}> = ({ allLabel, oneLabel, disabledAll, status, onSend }) => {
  const [to, setTo] = useState<'all' | 'one'>('all');
  const [account, setAccount] = useState('');
  return (
    <>
      <div className="notif-modes" role="radiogroup">
        <label className={`notif-mode${to === 'all' ? ' is-on' : ''}`}>
          <input type="radio" checked={to === 'all'} onChange={() => setTo('all')} />
          <span>
            <strong>Send to all</strong>
          </span>
        </label>
        <label className={`notif-mode${to === 'one' ? ' is-on' : ''}`}>
          <input type="radio" checked={to === 'one'} onChange={() => setTo('one')} />
          <span>
            <strong>One student</strong>
          </span>
        </label>
      </div>
      {to === 'one' && (
        <label className="adm-field">
          <span>Student’s email</span>
          <input className="adm-input" type="email" value={account} onChange={(e) => setAccount(e.target.value)} placeholder="student@example.com" />
        </label>
      )}
      <div className="notif-actions">
        <button
          type="button"
          className="adm-btn adm-btn--primary"
          disabled={status.busy || (to === 'one' ? account.trim().length < 3 : disabledAll)}
          onClick={() => onSend(to, account.trim())}
        >
          <Send size={16} aria-hidden /> {status.busy ? 'Sending…' : to === 'all' ? allLabel : oneLabel}
        </button>
      </div>
      {status.ok && <p className="adm-note">{status.ok}</p>}
      {status.error && <p className="adm-error">{status.error}</p>}
    </>
  );
};

export const AdminNotifications: React.FC<{ nav: AdminNav }> = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState('');
  const [emailStatus, setEmailStatus] = useState<Status>({});
  const [popStatus, setPopStatus] = useState<Status>({});
  const [modeStatus, setModeStatus] = useState<Status>({});

  const [oneTo, setOneTo] = useState('');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [oneStatus, setOneStatus] = useState<Status>({});

  const load = () => api<Overview>('/api/admin/notifications').then(setData, (err: Error) => setError(err.message));
  useEffect(() => {
    if (isLive) void load();
  }, []);

  const emailUnverified = (to: 'all' | 'one', account: string) => {
    if (to === 'all' && !window.confirm(`Email the “Verify my email” link to ${data?.unverifiedEmailable ?? 0} unverified students?`)) return;
    setEmailStatus({ busy: true });
    api<{ queued: number }>('/api/admin/notifications/email-unverified', { method: 'POST', body: { to, account } })
      .then((r) => {
        setEmailStatus({ ok: to === 'one' ? 'Sent. They can tap “Verify my email” in their inbox (it may land in spam).' : `Sending to ${r.queued} students now. It can take a few minutes.` });
        void load();
      })
      .catch((err: Error) => setEmailStatus({ error: err.message }));
  };

  const popupSetup = (to: 'all' | 'one', account: string) => {
    if (to === 'all' && !window.confirm(`Email “Continue setting up” to ${data?.noExamEmailable ?? 0} students who haven’t chosen their exam?`)) return;
    setPopStatus({ busy: true });
    api<{ emailed: number }>('/api/admin/notifications/setup-popup', { method: 'POST', body: { to, account } })
      .then((r) => {
        setPopStatus({
          ok:
            to === 'one'
              ? 'Sent by email (and as a pop-up if they allowed it). The email may land in spam.'
              : `Sending to ${r.emailed} students now, by email and as a pop-up where allowed. It can take a few minutes.`,
        });
        void load();
      })
      .catch((err: Error) => setPopStatus({ error: err.message }));
  };

  const setMode = (mode: Mode) => {
    setModeStatus({ busy: true });
    api<Overview>('/api/admin/notifications', { method: 'PUT', body: { mode, testAccounts: data?.testAccounts ?? [] } })
      .then((d) => {
        setData(d);
        setModeStatus({ ok: mode === 'off' ? 'Automatic pop-ups are paused.' : 'Automatic pop-ups are on for every student.' });
      })
      .catch((err: Error) => setModeStatus({ error: err.message }));
  };

  const sendOne = () => {
    setOneStatus({ busy: true });
    api<{ sent: number; title: string }>('/api/admin/notifications/test', {
      method: 'POST',
      body: { account: oneTo, message: 'custom', title, text },
    })
      .then((r) => setOneStatus(r.sent ? { ok: `Sent “${r.title}”.` } : { error: 'Their phone didn’t accept it (they may have turned notifications off).' }))
      .catch((err: Error) => setOneStatus({ error: err.message }));
  };

  return (
    <div className="adm-page">
      <PageHead title="Notifications" sub="Bring back students who stopped half-way, and send pop-ups to their phones." />

      {!isLive && <p className="adm-banner">Connect the backend to use notifications.</p>}
      {error && <p className="adm-error">{error}</p>}

      {data && (
        <>
          <div className="ai-usage__stats">
            <div className="ui-card">
              <small>Haven’t verified their email</small>
              <strong>{data.unverified.toLocaleString()}</strong>
            </div>
            <div className="ui-card">
              <small>Verified, but haven’t chosen their exam</small>
              <strong>{data.noExam.toLocaleString()}</strong>
            </div>
            <div className="ui-card">
              <small>Students who allowed pop-ups</small>
              <strong>{data.students.toLocaleString()}</strong>
            </div>
          </div>

          <section className="ui-card notif-card">
            <h2>
              <MailCheck size={20} aria-hidden /> Email: “Verify my email”
            </h2>
            <p className="adm-muted">
              For students who signed up but never verified, so email is the only way to reach them. One tap on the button verifies their account and takes them to
              choose their exam. The link works for 7 days. “Send to all” skips anyone emailed in the last 3 days ({data.unverifiedEmailable.toLocaleString()} will get it
              now).
            </p>
            <Sender
              allLabel={`Email all ${data.unverifiedEmailable.toLocaleString()} unverified`}
              oneLabel="Email this student"
              disabledAll={!data.unverifiedEmailable}
              status={emailStatus}
              onSend={emailUnverified}
            />
          </section>

          <section className="ui-card notif-card">
            <h2>
              <BellRing size={20} aria-hidden /> Email + pop-up: “Continue setting up”
            </h2>
            <p className="adm-muted">
              For verified students who haven’t chosen their exam. They get an email with a “Set up my exam” button that opens exam setup, plus a pop-up if they
              allowed pop-ups ({data.noExamWithPush.toLocaleString()} of {data.noExam.toLocaleString()} have). They also get a “Continue setting up” box every time they
              open their dashboard until they finish. “Send to all” skips anyone emailed in the last 3 days ({data.noExamEmailable.toLocaleString()} will get it now).
            </p>
            <Sender allLabel={`Send to all ${data.noExamEmailable.toLocaleString()}`} oneLabel="Send to this student" disabledAll={!data.noExamEmailable} status={popStatus} onSend={popupSetup} />
          </section>

          <section className="ui-card notif-card">
            <h2>Automatic pop-ups</h2>
            <p className="adm-muted">
              “Continue setting up” (1 hour after leaving half-way, then every day at 10 am until they finish, for up to 14 days; tapping it opens their dashboard) and the 6 pm “you haven’t practised today” reminder. Now:{' '}
              <strong>{data.mode === 'off' ? 'paused' : data.mode === 'all' ? 'on for every student' : 'test accounts only'}</strong>.
            </p>
            <div className="notif-actions">
              {data.mode !== 'all' && (
                <button type="button" className="adm-btn adm-btn--primary" disabled={modeStatus.busy} onClick={() => setMode('all')}>
                  Turn on for every student
                </button>
              )}
              {data.mode !== 'off' && (
                <button type="button" className="adm-btn" disabled={modeStatus.busy} onClick={() => setMode('off')}>
                  Pause
                </button>
              )}
            </div>
            {modeStatus.ok && <p className="adm-note">{modeStatus.ok}</p>}
            {modeStatus.error && <p className="adm-error">{modeStatus.error}</p>}
          </section>

          <section className="ui-card notif-card">
            <h2>Pop-up to one student</h2>
            <label className="adm-field">
              <span>Student’s email</span>
              <input className="adm-input" type="email" value={oneTo} onChange={(e) => setOneTo(e.target.value)} placeholder="student@example.com" />
            </label>
            <label className="adm-field">
              <span>Title</span>
              <input className="adm-input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Continue your i-Tutor setup" />
            </label>
            <label className="adm-field">
              <span>Message</span>
              <input className="adm-input" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tap to finish in under a minute." />
            </label>
            <div className="notif-actions">
              <button type="button" className="adm-btn adm-btn--primary" disabled={oneStatus.busy || oneTo.trim().length < 3 || !title.trim()} onClick={sendOne}>
                <Send size={16} aria-hidden /> {oneStatus.busy ? 'Sending…' : 'Send pop-up'}
              </button>
            </div>
            {oneStatus.ok && <p className="adm-note">{oneStatus.ok}</p>}
            {oneStatus.error && <p className="adm-error">{oneStatus.error}</p>}
          </section>
        </>
      )}
    </div>
  );
};
