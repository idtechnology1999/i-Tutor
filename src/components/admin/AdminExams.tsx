import React, { useEffect, useState } from 'react';
import { ArrowDown, ArrowUp, KeyRound, Pencil, Plus, X } from 'lucide-react';
import { addExam, editExam, switchExam, useExams } from '../../lib/exams';
import type { ExamInfo, ExamKind, NewExam } from '../../lib/exams';
import { isLive } from '../../services/api';
import type { AdminNav } from './AdminApp';

/* Admin → Settings → Exams: every exam on i-Tutor. Switching one off hides
   it from students everywhere (registration, dashboard, past questions,
   practice, courses, the homepage), while admins keep working on it; switch
   it on when it's ready. An added exam works like the exams of its kind, so
   nothing new has to be built for it. Switching and adding change what every
   student sees, so they need the super admin password. */

const KIND: Record<ExamKind, { label: string; help: string }> = {
  jamb: { label: 'Like JAMB', help: 'English + 3 subjects, CBT, courses by faculty' },
  cert: { label: 'Like WAEC/NECO', help: 'A class (Science, Arts, Commercial) + 7–9 subjects' },
  school: { label: 'By university', help: 'Papers by school (Post-UTME)' },
};

const EMPTY: NewExam = { label: '', name: '', desc: '', when: '', kind: 'cert', enabled: false };

/** Asks for the super admin password (live only), then runs the change. */
const PasswordDialog: React.FC<{
  title: string;
  message: React.ReactNode;
  action: string;
  onConfirm: (password: string) => Promise<unknown>;
  onClose: () => void;
}> = ({ title, message, action, onConfirm, onClose }) => {
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLive && !password) return setError('Enter the super admin password to confirm.');
    setBusy(true);
    setError('');
    onConfirm(password)
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="cms-modal" onClick={onClose}>
      <form className="cms-modal__panel cms-modal__panel--narrow" role="dialog" aria-modal="true" aria-label={title} onClick={(e) => e.stopPropagation()} onSubmit={submit}>
        <header className="cms-modal__head">
          <h2>{title}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body cms-newpage">
          <p>{message}</p>
          {isLive && (
            <label className="adm-field">
              <span>Super admin password</span>
              <div className="adm-input adm-input--icon">
                <KeyRound size={18} aria-hidden />
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" autoFocus />
              </div>
            </label>
          )}
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="cms-modal__foot">
          <button type="button" className="adm-btn" onClick={onClose} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
            {busy ? 'Saving…' : action}
          </button>
        </footer>
      </form>
    </div>
  );
};

/** One exam's names and dates, edited in place (no password: they don't change what's on or off). */
const EditRow: React.FC<{ exam: ExamInfo; onDone: () => void; nav: AdminNav }> = ({ exam, onDone, nav }) => {
  const [d, setD] = useState({ label: exam.label, name: exam.name, desc: exam.desc, when: exam.when });
  const [busy, setBusy] = useState(false);
  const save = (e: React.FormEvent) => {
    e.preventDefault();
    if (!d.label.trim() || !d.name.trim()) return nav.notify('Give the exam a short name and a full name.');
    setBusy(true);
    editExam(exam.id, d)
      .then(() => {
        nav.notify(`${d.label} saved.`);
        onDone();
      })
      .catch((err: Error) => nav.notify(err.message))
      .finally(() => setBusy(false));
  };
  return (
    <form className="xm__form" onSubmit={save}>
      <div className="adm-grid-2 xm__grid">
        <label className="adm-field">
          <span>Short name</span>
          <input className="adm-input" value={d.label} onChange={(e) => setD({ ...d, label: e.target.value })} maxLength={30} />
        </label>
        <label className="adm-field">
          <span>Full name</span>
          <input className="adm-input" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} maxLength={80} />
        </label>
      </div>
      <label className="adm-field">
        <span>What students read in registration</span>
        <input className="adm-input" value={d.desc} onChange={(e) => setD({ ...d, desc: e.target.value })} maxLength={200} />
      </label>
      <label className="adm-field">
        <span>When it usually runs</span>
        <input className="adm-input" value={d.when} onChange={(e) => setD({ ...d, when: e.target.value })} maxLength={120} placeholder="e.g. May/June · Nov/Dec" />
      </label>
      <div className="xm__buttons">
        <button type="button" className="adm-btn" onClick={onDone} disabled={busy}>
          Cancel
        </button>
        <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
          {busy ? 'Saving…' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export const ExamsCard: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const exams = useExams();
  const [editing, setEditing] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<{ title: string; message: React.ReactNode; action: string; run: (password: string) => Promise<unknown> } | null>(null);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState<NewExam>(EMPTY);
  const on = exams.filter((e) => e.enabled).length;

  const askSwitch = (exam: ExamInfo) => {
    const turnOn = !exam.enabled;
    setConfirm({
      title: `Switch ${exam.label} ${turnOn ? 'on' : 'off'}?`,
      message: turnOn
        ? `Students will see ${exam.label} straight away: in registration, the dashboard, past questions, practice and on the homepage.`
        : `Students will stop seeing ${exam.label} in registration, the dashboard, past questions, practice and on the homepage. Nothing is deleted: its questions and settings stay, and you can keep working on them here. Switch it back on any time.`,
      action: turnOn ? `Switch ${exam.label} on` : `Switch ${exam.label} off`,
      run: async (password) => {
        await switchExam(exam.id, turnOn, password);
        setConfirm(null);
        nav.notify(`${exam.label} is ${turnOn ? 'on: students can see it now' : 'off: hidden from students'}.`);
      },
    });
  };

  const move = (exam: ExamInfo, by: -1 | 1) => {
    const i = exams.indexOf(exam);
    const other = exams[i + by];
    if (!other) return;
    // Swap the two exams' places (orders may repeat, so use the positions).
    void Promise.all([editExam(exam.id, { order: i + by }), editExam(other.id, { order: i })]).catch((err: Error) => nav.notify(err.message));
  };

  const askAdd = (e: React.FormEvent) => {
    e.preventDefault();
    const d = { ...draft, label: draft.label.trim(), name: draft.name.trim() };
    if (!d.label || !d.name) return nav.notify('Give the exam a short name (e.g. JUPEB) and its full name.');
    setConfirm({
      title: `Add ${d.label}?`,
      message: `${d.label} will work ${d.kind === 'jamb' ? 'like JAMB: English + 3 subjects, CBT' : 'like WAEC/NECO: a class + 7–9 subjects'}, with its own past questions, practice bank and settings. It starts switched ${d.enabled ? 'on, so students see it straight away' : 'off, so you can add its questions first'}.`,
      action: `Add ${d.label}`,
      run: async (password) => {
        await addExam(d, password);
        setConfirm(null);
        setDraft(EMPTY);
        setAdding(false);
        nav.notify(`${d.label} added${d.enabled ? '' : ': switched off until you switch it on'}.`);
      },
    });
  };

  return (
    <section className="adm-card xm" aria-labelledby="exams-title">
      <header className="xm__head">
        <div>
          <h2 id="exams-title">
            Exams <span className="xm__count">{on} of {exams.length} on</span>
          </h2>
          <p className="xm__lead">
            Students only see exams that are <b>on</b>, in registration, their dashboard, past questions, practice and the homepage. Keep an exam off while you
            prepare it; you’ll still see it everywhere in admin.
          </p>
        </div>
        {!adding && (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setAdding(true)}>
            <Plus size={16} aria-hidden /> Add exam
          </button>
        )}
      </header>

      {adding && (
        <form className="xm__form xm__add" onSubmit={askAdd}>
          <h3>Add an exam</h3>
          <div className="adm-grid-2 xm__grid">
            <label className="adm-field">
              <span>Short name</span>
              <input className="adm-input" value={draft.label} onChange={(e) => setDraft({ ...draft, label: e.target.value })} placeholder="e.g. JUPEB" maxLength={30} autoFocus />
            </label>
            <label className="adm-field">
              <span>Full name</span>
              <input
                className="adm-input"
                value={draft.name}
                onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                placeholder="e.g. Joint Universities Preliminary Examinations Board"
                maxLength={80}
              />
            </label>
          </div>
          <label className="adm-field">
            <span>What students read in registration</span>
            <input className="adm-input" value={draft.desc} onChange={(e) => setDraft({ ...draft, desc: e.target.value })} placeholder="One short line about the exam" maxLength={200} />
          </label>
          <label className="adm-field">
            <span>When it usually runs (optional)</span>
            <input className="adm-input" value={draft.when} onChange={(e) => setDraft({ ...draft, when: e.target.value })} placeholder="e.g. May/June · Nov/Dec" maxLength={120} />
          </label>
          <fieldset className="xm__kind">
            <legend>How it works</legend>
            {(['cert', 'jamb'] as const).map((k) => (
              <label key={k} className={draft.kind === k ? 'is-on' : ''}>
                <input type="radio" name="exam-kind" checked={draft.kind === k} onChange={() => setDraft({ ...draft, kind: k })} />
                <span>
                  <b>{KIND[k].label}</b>
                  <small>{KIND[k].help}</small>
                </span>
              </label>
            ))}
          </fieldset>
          <label className="xm__check">
            <input type="checkbox" checked={draft.enabled} onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })} />
            Switch it on straight away (leave off to add its questions first)
          </label>
          <div className="xm__buttons">
            <button
              type="button"
              className="adm-btn"
              onClick={() => {
                setAdding(false);
                setDraft(EMPTY);
              }}
            >
              Cancel
            </button>
            <button type="submit" className="adm-btn adm-btn--primary">
              <Plus size={16} aria-hidden /> Add exam
            </button>
          </div>
        </form>
      )}

      <ul className="xm__list">
        {exams.map((e, i) =>
          editing === e.id ? (
            <li key={e.id} className="xm__row xm__row--edit">
              <EditRow exam={e} nav={nav} onDone={() => setEditing(null)} />
            </li>
          ) : (
            <li key={e.id} className={`xm__row${e.enabled ? '' : ' is-off'}`}>
              <div className="xm__order">
                <button type="button" onClick={() => move(e, -1)} disabled={i === 0} aria-label={`Move ${e.label} up`}>
                  <ArrowUp size={15} aria-hidden />
                </button>
                <button type="button" onClick={() => move(e, 1)} disabled={i === exams.length - 1} aria-label={`Move ${e.label} down`}>
                  <ArrowDown size={15} aria-hidden />
                </button>
              </div>
              <span className="xm__badge" aria-hidden>
                {e.label.slice(0, 4).toUpperCase()}
              </span>
              <div className="xm__name">
                <strong>{e.label}</strong>
                <span>{e.name}</span>
                <span className="xm__tags">
                  <span className={`xm__tag xm__tag--${e.kind}`} title={KIND[e.kind].help}>
                    {KIND[e.kind].label}
                  </span>
                  {!e.builtIn && <span className="xm__tag">Added</span>}
                  {!e.enabled && <span className="xm__tag xm__tag--off">Hidden from students</span>}
                </span>
              </div>
              <div className="xm__actions">
                <button type="button" className="adm-link" onClick={() => setEditing(e.id)} aria-label={`Edit ${e.label}`}>
                  <Pencil size={15} aria-hidden /> Edit
                </button>
                <button
                  type="button"
                  role="switch"
                  aria-checked={e.enabled}
                  aria-label={`${e.label}: ${e.enabled ? 'on' : 'off'}`}
                  className={`adm-switch${e.enabled ? ' is-on' : ''}`}
                  onClick={() => askSwitch(e)}
                >
                  <i aria-hidden />
                  <span>{e.enabled ? 'On' : 'Off'}</span>
                </button>
              </div>
            </li>
          ),
        )}
      </ul>

      {confirm && <PasswordDialog title={confirm.title} message={confirm.message} action={confirm.action} onConfirm={confirm.run} onClose={() => setConfirm(null)} />}
    </section>
  );
};
