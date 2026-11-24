import React, { useEffect, useState } from 'react';
import { api, isLive } from '../../services/api';
import type { AdminNav } from './AdminApp';
import { PageHead } from './AdminApp';

/* Admin → Notifications: browser pop-ups (free, like a WhatsApp message).
   Backend: routes/admin/notifications.ts. Automatic ones are
     • "Finish setting up" nudges (not verified / no exam chosen)
     • the evening "you haven't practised today" reminder
   and go to nobody, the test accounts only, or every student. */

type Mode = 'off' | 'test' | 'all';

interface TestStudent {
  account: string;
  found: boolean;
  name: string;
  devices: number;
  step: 'verify' | 'setup' | 'done' | '';
}

interface Overview {
  mode: Mode;
  testAccounts: string[];
  devices: number;
  students: number;
  testStudents: TestStudent[];
}

const STEP: Record<string, string> = {
  verify: 'Not verified: gets “Enter your code to finish”',
  setup: 'No exam chosen: gets “Choose your JAMB subjects”',
  done: 'Set up: gets only the daily practice reminder',
};

export const AdminNotifications: React.FC<{ nav: AdminNav }> = () => {
  const [data, setData] = useState<Overview | null>(null);
  const [mode, setMode] = useState<Mode>('test');
  const [accounts, setAccounts] = useState('');
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');
  const [saving, setSaving] = useState(false);

  const [testTo, setTestTo] = useState('');
  const [message, setMessage] = useState<'nudge' | 'practice' | 'custom'>('nudge');
  const [title, setTitle] = useState('');
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [result, setResult] = useState('');
  const [testError, setTestError] = useState('');

  const show = (d: Overview) => {
    setData(d);
    setMode(d.mode);
    setAccounts(d.testAccounts.join('\n'));
    if (!testTo && d.testAccounts[0]) setTestTo(d.testAccounts[0]);
  };

  useEffect(() => {
    if (!isLive) return;
    api<Overview>('/api/admin/notifications').then(show, (err: Error) => setError(err.message));
  }, []);

  const save = () => {
    if (mode === 'all' && !window.confirm('Send automatic notifications to EVERY student who allowed them? Test on your own account first.')) return;
    setSaving(true);
    setError('');
    setSaved('');
    const testAccounts = accounts
      .split(/[\n,]/)
      .map((a) => a.trim())
      .filter(Boolean);
    api<Overview>('/api/admin/notifications', { method: 'PUT', body: { mode, testAccounts } })
      .then((d) => {
        show(d);
        setSaved('Saved.');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setSaving(false));
  };

  const sendTest = () => {
    setSending(true);
    setResult('');
    setTestError('');
    api<{ sent: number; devices: number; title: string; body: string }>('/api/admin/notifications/test', {
      method: 'POST',
      body: { account: testTo, message, title, text },
    })
      .then((r) =>
        setResult(
          r.sent
            ? `Sent “${r.title}” to ${r.sent} of ${r.devices} browser${r.devices === 1 ? '' : 's'}. It should pop up within a few seconds.`
            : 'The browser didn’t accept it (notifications may have been turned off there). Open the site as the student and turn reminders on again.',
        ),
      )
      .catch((err: Error) => setTestError(err.message))
      .finally(() => setSending(false));
  };

  return (
    <div className="adm-page">
      <PageHead title="Notifications" sub="Free pop-ups on students’ phones and computers, like a WhatsApp message. No email or SMS cost." />

      {!isLive && <p className="adm-banner">Connect the backend to use notifications.</p>}
      {error && <p className="adm-error">{error}</p>}

      {data && (
        <>
          <div className="ai-usage__stats">
            <div className="ui-card">
              <small>Students who allowed notifications</small>
              <strong>{data.students.toLocaleString()}</strong>
            </div>
            <div className="ui-card">
              <small>Browsers (phones and computers)</small>
              <strong>{data.devices.toLocaleString()}</strong>
            </div>
          </div>

          <section className="ui-card notif-card">
            <h2>Who gets automatic notifications</h2>
            <p className="adm-muted">
              “Finish setting up” pop-ups (1 hour after a student leaves half-way, then once more a day or two later, 8 am–8 pm only) and the 6 pm
              “you haven’t practised today” reminder.
            </p>
            <div className="notif-modes" role="radiogroup" aria-label="Who gets them">
              {(
                [
                  ['off', 'Nobody', 'Everything automatic is paused.'],
                  ['test', 'Test accounts only', 'Only the accounts listed below. Use this to try it first.'],
                  ['all', 'Every student', 'Everyone who allowed notifications.'],
                ] as const
              ).map(([id, label, hint]) => (
                <label key={id} className={`notif-mode${mode === id ? ' is-on' : ''}`}>
                  <input type="radio" name="push-mode" checked={mode === id} onChange={() => setMode(id)} />
                  <span>
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </span>
                </label>
              ))}
            </div>

            <label className="adm-field">
              <span>Test accounts (one email or phone number per line)</span>
              <textarea className="adm-input notif-accounts" rows={3} value={accounts} onChange={(e) => setAccounts(e.target.value)} />
            </label>

            {data.testStudents.length > 0 && (
              <ul className="notif-tests">
                {data.testStudents.map((t) => (
                  <li key={t.account}>
                    <strong>{t.found ? t.name : t.account}</strong>{' '}
                    {!t.found ? (
                      <span className="is-bad">No student has this email or number.</span>
                    ) : (
                      <span>
                        {t.devices ? `${t.devices} browser${t.devices === 1 ? '' : 's'} allowed` : <em className="is-bad">hasn’t allowed notifications yet</em>} ·{' '}
                        {STEP[t.step]}
                      </span>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="notif-actions">
              <button type="button" className="adm-btn adm-btn--primary" onClick={save} disabled={saving}>
                {saving ? 'Saving…' : 'Save'}
              </button>
              {saved && <span className="adm-muted">{saved}</span>}
            </div>
          </section>

          <section className="ui-card notif-card">
            <h2>Send a test now</h2>
            <p className="adm-muted">Goes straight away to one student, whatever the setting above (no waiting for the 1-hour timer).</p>
            <label className="adm-field">
              <span>Student’s email or phone number</span>
              <input className="adm-input" value={testTo} onChange={(e) => setTestTo(e.target.value)} />
            </label>
            <label className="adm-field">
              <span>Message</span>
              <select className="adm-input" value={message} onChange={(e) => setMessage(e.target.value as typeof message)}>
                <option value="nudge">Finish setting up (the one for their step)</option>
                <option value="practice">Daily practice reminder</option>
                <option value="custom">My own message</option>
              </select>
            </label>
            {message === 'custom' && (
              <>
                <label className="adm-field">
                  <span>Title</span>
                  <input className="adm-input" maxLength={80} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Complete your i-Tutor setup" />
                </label>
                <label className="adm-field">
                  <span>Text</span>
                  <input className="adm-input" maxLength={200} value={text} onChange={(e) => setText(e.target.value)} placeholder="Tap to finish in under a minute." />
                </label>
              </>
            )}
            <div className="notif-actions">
              <button type="button" className="adm-btn adm-btn--primary" onClick={sendTest} disabled={sending || !testTo.trim()}>
                {sending ? 'Sending…' : 'Send test'}
              </button>
            </div>
            {result && <p className="adm-note">{result}</p>}
            {testError && <p className="adm-error">{testError}</p>}
          </section>
        </>
      )}
    </div>
  );
};
