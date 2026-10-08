import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, CircleDashed, LoaderCircle, SendHorizontal, Workflow, X } from 'lucide-react';
import { cms, useCms } from '../../lib/cms';
import { AUDIENCES, STARTERS } from '../../lib/auto-agent';
import { planAuto, sendStudentEmail } from '../../services/admin';
import { isLive } from '../../services/api';
import type { Audience, AutoAction, AutoPlan } from '../../lib/auto-agent';
import type { AdminNav } from './AdminApp';

type RunState = 'ready' | 'running' | 'done' | 'cancelled';

interface Turn {
  id: number;
  who: 'you' | 'auto';
  text: string;
  plan?: AutoPlan;
  run?: RunState;
  /** Steps ticked so far while running. */
  ticked?: number;
  result?: string;
}

/** Actions that only move around the panel run straight away when tapped. */
const isNavigation = (a: AutoAction) => a.kind === 'open' || a.kind === 'import';

interface Props {
  open: boolean;
  onClose: () => void;
  nav: AdminNav;
}

export const AdminAuto: React.FC<Props> = ({ open, onClose, nav }) => {
  const { questions, news } = useCms();
  const [turns, setTurns] = useState<Turn[]>([
    {
      id: 0,
      who: 'auto',
      text: 'Hi, I’m i-Auto. I know how this admin panel works. Tell me what to do — publish news, email students, upload a paper — and I’ll show you the plan before anything changes.',
      plan: { reply: '', suggestions: STARTERS },
    },
  ]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const idRef = useRef(1);

  useEffect(() => {
    logRef.current?.scrollTo({
      top: logRef.current.scrollHeight,
      behavior: 'smooth',
    });
  }, [turns, thinking]);

  useEffect(() => {
    if (open) window.setTimeout(() => inputRef.current?.focus(), 250);
  }, [open]);

  if (!open) return null;

  const patch = (id: number, p: Partial<Turn>) =>
    setTurns((prev) => prev.map((t) => (t.id === id ? { ...t, ...p } : t)));
  const patchAction = (id: number, p: Partial<Extract<AutoAction, { kind: 'email' }>>) =>
    setTurns((prev) =>
      prev.map((t) =>
        t.id === id && t.plan?.action?.kind === 'email'
          ? { ...t, plan: { ...t.plan, action: { ...t.plan.action, ...p } } }
          : t,
      ),
    );

  const ask = (message: string) => {
    const m = message.trim();
    if (!m || thinking) return;
    setText('');
    const youId = idRef.current++;
    setTurns((prev) => [...prev, { id: youId, who: 'you', text: m }]);
    setThinking(true);
    planAuto(m, { questions, news })
      .then((plan) => {
        const id = idRef.current++;
        setTurns((prev) => [
          ...prev,
          {
            id,
            who: 'auto',
            text: plan.reply,
            plan,
            run: plan.action ? 'ready' : undefined,
          },
        ]);
      })
      .catch((err: Error) => {
        const id = idRef.current++;
        setTurns((prev) => [...prev, { id, who: 'auto', text: `Sorry — ${err.message}` }]);
      })
      .finally(() => setThinking(false));
  };

  const narrow = () => window.matchMedia('(max-width: 860px)').matches;

  /** Do the action for real. Returns what to say afterwards. */
  const perform = (a: AutoAction): string | Promise<string> => {
    switch (a.kind) {
      case 'open':
        nav.go(a.section, { filter: a.filter, scope: a.scope });
        if (narrow()) onClose();
        return 'Opened.';
      case 'import':
        nav.go('import', { preset: a.preset });
        if (narrow()) onClose();
        return 'Importer is open — paste or upload the paper.';
      case 'publishNews':
        cms.publishNews(a.ids);
        nav.notify(`Published ${a.ids.length === 1 ? `“${a.titles[0]}”` : `${a.ids.length} articles`}.`);
        return a.ids.length === 1
          ? `“${a.titles[0]}” is live on the website.`
          : `${a.ids.length} articles are live on the website.`;
      case 'draftNews': {
        const today = new Date().toISOString().slice(0, 10);
        cms.saveNews({
          id: `news-${Date.now()}`,
          category: 'i-Tutor update',
          title: a.title,
          summary: a.summary,
          date: today,
          readMinutes: 2,
          image: '/images/student-cbt-focus.jpg',
          imageAlt: 'A student concentrating at a computer',
          body: [a.summary],
          status: 'draft',
        });
        nav.go('news');
        if (narrow()) onClose();
        return 'Draft created and News is open. Add the full story, then publish.';
      }
      case 'setStatus':
        cms.setStatus(a.ids, a.status);
        return `${a.status === 'published' ? 'Published' : 'Unpublished'} ${a.ids.length} question${a.ids.length === 1 ? '' : 's'}.`;
      case 'email':
        return sendStudentEmail(a.audience, a.subject, a.body).then(({ queued }) => {
          nav.notify(`Email queued for ${a.audience.toLowerCase()}.`);
          return isLive
            ? `Queued for ${queued} student${queued === 1 ? '' : 's'} and logged in Activity.`
            : 'Queued and logged in Activity. Emails go out once the mail server is connected — in demo mode nothing is actually sent.';
        });
    }
  };

  const finish = (id: number, action: AutoAction) =>
    Promise.resolve()
      .then(() => perform(action))
      .then((result) => patch(id, { run: 'done', result }))
      .catch((err: Error) => patch(id, { run: 'done', result: `That didn’t work: ${err.message}` }));

  const run = (turn: Turn) => {
    const action = turn.plan?.action;
    if (!action) return;
    if (isNavigation(action) && !turn.plan?.steps) {
      finish(turn.id, action);
      return;
    }
    const steps = turn.plan?.steps ?? [];
    patch(turn.id, { run: 'running', ticked: 0 });
    // Tick the steps off one by one, then do the work.
    steps.forEach((_, i) => window.setTimeout(() => patch(turn.id, { ticked: i + 1 }), 380 * (i + 1)));
    window.setTimeout(() => finish(turn.id, action), 380 * steps.length + 200);
  };

  return (
    <>
      <div className="auto-backdrop" onClick={onClose} aria-hidden />
      <aside className="auto" role="dialog" aria-label="i-Auto">
        <header className="auto__head">
          <span className="auto__logo">
            <Workflow size={18} aria-hidden />
          </span>
          <div className="auto__title">
            <strong>i-Auto</strong>
            <small>Admin automation · knows your panel</small>
          </div>
          <kbd className="auto__kbd">Ctrl K</kbd>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close i-Auto">
            <X size={20} aria-hidden />
          </button>
        </header>

        <div className="auto__log" ref={logRef} aria-live="polite">
          {turns.map((turn) => {
            const a = turn.plan?.action;
            const steps = turn.plan?.steps ?? [];
            return (
              <div key={turn.id} className={`auto__turn auto__turn--${turn.who}`}>
                {turn.text && <p className="auto__bubble">{turn.text}</p>}

                {a && turn.who === 'auto' && (
                  <div className={`auto__plan is-${turn.run}`}>
                    {steps.length > 0 && (
                      <ol className="auto__steps">
                        {steps.map((s, i) => {
                          const done = turn.run === 'done' || (turn.ticked ?? 0) > i;
                          const now = turn.run === 'running' && (turn.ticked ?? 0) === i;
                          return (
                            <li key={i} className={done ? 'is-done' : now ? 'is-now' : ''}>
                              {done ? (
                                <Check size={15} aria-hidden />
                              ) : now ? (
                                <LoaderCircle size={15} className="auto__spin" aria-hidden />
                              ) : (
                                <CircleDashed size={15} aria-hidden />
                              )}
                              {s}
                            </li>
                          );
                        })}
                      </ol>
                    )}

                    {a.kind === 'email' && (
                      <div className="auto__email">
                        <label className="adm-field">
                          <small className="adm-muted">To</small>
                          <select
                            className="adm-input"
                            value={a.audience}
                            disabled={turn.run !== 'ready'}
                            onChange={(e) =>
                              patchAction(turn.id, {
                                audience: e.target.value as Audience,
                                label: `Send to ${e.target.value.toLowerCase()}`,
                              })
                            }
                          >
                            {AUDIENCES.map((x) => (
                              <option key={x}>{x}</option>
                            ))}
                          </select>
                        </label>
                        <label className="adm-field">
                          <small className="adm-muted">Subject</small>
                          <input
                            className="adm-input"
                            value={a.subject}
                            disabled={turn.run !== 'ready'}
                            onChange={(e) => patchAction(turn.id, { subject: e.target.value })}
                          />
                        </label>
                        <label className="adm-field">
                          <small className="adm-muted">Message</small>
                          <textarea
                            className="adm-input adm-textarea"
                            rows={6}
                            value={a.body}
                            disabled={turn.run !== 'ready'}
                            onChange={(e) => patchAction(turn.id, { body: e.target.value })}
                          />
                        </label>
                      </div>
                    )}

                    {turn.run === 'ready' && (
                      <div className="auto__actions">
                        <button type="button" className="adm-btn adm-btn--primary" onClick={() => run(turn)}>
                          {isNavigation(a) ? a.label : `Run · ${a.label}`}
                          <ArrowRight size={16} aria-hidden />
                        </button>
                        {!isNavigation(a) && (
                          <button
                            type="button"
                            className="adm-btn"
                            onClick={() => patch(turn.id, { run: 'cancelled' })}
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    )}
                    {turn.run === 'cancelled' && <p className="auto__result is-muted">Cancelled — nothing changed.</p>}
                    {turn.run === 'done' && turn.result && (
                      <p className="auto__result">
                        <Check size={16} aria-hidden /> {turn.result}
                      </p>
                    )}
                  </div>
                )}

                {turn.plan?.suggestions && (
                  <div className="auto__chips">
                    {turn.plan.suggestions.map((s) => (
                      <button key={s} type="button" onClick={() => ask(s)}>
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {thinking && (
            <div className="auto__turn auto__turn--auto">
              <p className="auto__bubble auto__thinking" aria-label="i-Auto is working it out">
                <i />
                <i />
                <i />
              </p>
            </div>
          )}
        </div>

        <form
          className="auto__input"
          onSubmit={(e) => {
            e.preventDefault();
            ask(text);
          }}
        >
          <input
            ref={inputRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Tell i-Auto what to do…"
            aria-label="Tell i-Auto what to do"
          />
          <button type="submit" disabled={!text.trim() || thinking} aria-label="Send">
            <SendHorizontal size={18} aria-hidden />
          </button>
        </form>
      </aside>
    </>
  );
};
