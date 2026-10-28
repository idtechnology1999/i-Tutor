import React, { useCallback, useEffect, useState } from 'react';
import { ArrowLeft, ChevronRight, ExternalLink, RotateCcw, UserRound, Workflow } from 'lucide-react';
import { SCREENS, SCREEN_DEFS, SCREENS_SLUG, ScreenDraftContext, screenFields, screenText } from '../../cms/screens';
import type { ScreenDef } from '../../cms/screens';
import type { BlockData, CmsBlock } from '../../cms/types';
import { createPage, getPage, listPages, publishPage, savePage } from '../../services/pages';
import type { PageFull } from '../../services/pages';
import { AuthShell, OnboardingShell, PhotoAside } from '../screens/web/shared';
import { FieldList } from './Fields';
import { FieldContext } from './field-context';

/* /cms/screens: the text around the login, sign-up and onboarding forms.
   Every screen is saved in one CMS document, so Publish puts all screen
   changes live together. */

/** Loads the screens document (null until an admin first saves one). */
async function loadScreensDoc(): Promise<PageFull | null> {
  const hit = (await listPages()).find((p) => p.slug === SCREENS_SLUG);
  return hit ? getPage(hit.id) : null;
}

/** Example values for {placeholders} in the preview. */
const SAMPLE_VARS = { digits: 6, destination: 'am•••@gmail.com', names: 'WAEC and NECO' };

const stepOf = (def: ScreenDef) => Number(/Step (\d)/.exec(def.label)?.[1] ?? 1);

/* ------------------------------------------------------------------- List */

export const ScreensList: React.FC<{ onOpen: (id: string) => void; notify: (text: string) => void }> = ({ onOpen, notify }) => {
  const [doc, setDoc] = useState<PageFull | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    loadScreensDoc()
      .then(setDoc)
      .catch((err: Error) => setError(err.message));
  }, []);

  const edited = new Set((doc?.draft ?? []).map((b) => b.id));
  const live = new Set(doc?.status === 'published' ? doc.blocks.map((b) => b.id) : []);
  const pending = doc ? doc.hasDraft : false;

  const publish = () => {
    if (!doc) return;
    setBusy(true);
    publishPage(doc.id)
      .then((d) => {
        setDoc(d);
        notify('Screen changes are live.');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="cms-pagewrap">
      <header className="adm-head">
        <div>
          <h1>Screens</h1>
          <p>The words and photos on the login, sign-up and onboarding screens. The forms themselves stay as they are.</p>
        </div>
        {pending && (
          <div className="adm-head__actions">
            <button type="button" className="adm-btn adm-btn--primary" onClick={publish} disabled={busy}>
              {busy ? 'Publishing…' : 'Publish screen changes'}
            </button>
          </div>
        )}
      </header>
      {pending && <p className="adm-banner">You have saved screen changes that students can’t see yet. Publish to put them live.</p>}
      {error && <p className="adm-error">{error}</p>}

      {(['Account', 'Onboarding'] as const).map((group) => (
        <section key={group} className="cms-screens__group">
          <h2>
            {group === 'Account' ? <UserRound size={18} aria-hidden /> : <Workflow size={18} aria-hidden />}
            {group === 'Account' ? 'Account screens' : 'Onboarding steps'}
          </h2>
          <ul className="cms-pages">
            {SCREENS.filter((s) => s.group === group).map((s) => (
              <li key={s.id} className="cms-pages__row cms-screens__row">
                <button type="button" className="cms-pages__main" onClick={() => onOpen(s.id)}>
                  <strong>{s.label}</strong>
                  <small>{s.path}</small>
                </button>
                {edited.has(s.id) ? (
                  live.has(s.id) && !pending ? (
                    <span className="adm-chip is-live">Edited</span>
                  ) : (
                    <span className="adm-chip is-review">Edited · not published</span>
                  )
                ) : (
                  <span className="adm-chip is-draft">Original</span>
                )}
                <ChevronRight size={18} aria-hidden className="cms-screens__chev" />
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
};

/* ----------------------------------------------------------------- Editor */

export const ScreenEditor: React.FC<{ id: string; onBack: () => void; notify: (text: string) => void }> = ({ id, onBack, notify }) => {
  const def = SCREEN_DEFS[id];
  const [doc, setDoc] = useState<PageFull | null | undefined>(undefined);
  const [blocks, setBlocks] = useState<CmsBlock[]>([]);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<'' | 'save' | 'publish'>('');
  const [error, setError] = useState('');

  useEffect(() => {
    loadScreensDoc()
      .then((d) => {
        setDoc(d);
        setBlocks(d?.draft ?? []);
      })
      .catch((err: Error) => setError(err.message));
  }, []);

  const block = blocks.find((b) => b.id === id);
  const data: BlockData = { ...def?.defaults, ...block?.data };

  const setField = (key: string, value: unknown) => {
    const next = { ...data, [key]: value };
    setBlocks((list) => (list.some((b) => b.id === id) ? list.map((b) => (b.id === id ? { ...b, data: next } : b)) : [...list, { id, type: 'screen', data: next }]));
    setDirty(true);
  };

  const reset = () => {
    if (!window.confirm('Go back to the original wording and photo for this screen?')) return;
    setBlocks((list) => list.filter((b) => b.id !== id));
    setDirty(true);
  };

  const save = useCallback(async (): Promise<PageFull | null> => {
    setBusy('save');
    setError('');
    try {
      const saved = doc
        ? await savePage(doc.id, { title: doc.title, slug: SCREENS_SLUG, description: '', image: '', draft: blocks })
        : await createPage({ title: 'App screens', slug: SCREENS_SLUG, description: '', image: '', blocks });
      setDoc(saved);
      setDirty(false);
      return saved;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setBusy('');
    }
  }, [doc, blocks]);

  const publish = async () => {
    const saved = dirty || !doc ? await save() : doc;
    if (!saved) return;
    setBusy('publish');
    try {
      setDoc(await publishPage(saved.id));
      notify('Published. Students now see the new wording.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault();
        void save().then((p) => p && notify('Draft saved.'));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, notify]);

  useEffect(() => {
    if (!dirty) return;
    const warn = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  const leave = () => {
    if (dirty && !window.confirm('You have unsaved changes. Leave without saving?')) return;
    onBack();
  };

  if (!def) {
    return (
      <div className="cms-ed cms-ed--message">
        <p className="adm-error">There is no screen called “{id}”.</p>
        <button type="button" className="adm-btn" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden /> Back to screens
        </button>
      </div>
    );
  }
  if (doc === undefined && !error) return <div className="cms-ed cms-ed--message" aria-busy="true" />;

  const pending = dirty || Boolean(doc?.hasDraft);
  const draftMap = Object.fromEntries(blocks.map((b) => [b.id, b.data]));

  return (
    <FieldContext.Provider value={{ pages: [], notify }}>
      <div className="cms-ed">
        <header className="cms-ed__top">
          <button type="button" className="adm-btn" onClick={leave}>
            <ArrowLeft size={18} aria-hidden /> <span className="cms-hide-sm">Screens</span>
          </button>
          <div className="cms-ed__name">
            <strong>{def.label}</strong>
            <small>{def.path}</small>
          </div>
          <span className={`adm-chip ${block ? 'is-review' : 'is-draft'}`}>{block ? 'Edited' : 'Original'}</span>
          <span className="cms-ed__state cms-hide-sm">{dirty ? 'Unsaved changes' : pending ? 'Saved · not published yet' : 'All changes saved'}</span>
          <span className="adm-spacer" />
          <a className="adm-btn cms-hide-sm" href={def.path} target="_blank" rel="noreferrer">
            <ExternalLink size={16} aria-hidden /> Open screen
          </a>
          <button type="button" className="adm-btn" onClick={() => void save().then((p) => p && notify('Draft saved.'))} disabled={!!busy || !dirty}>
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => void publish()} disabled={!!busy || !pending}>
            {busy === 'publish' ? 'Publishing…' : pending ? 'Publish' : 'Published'}
          </button>
        </header>
        {error && <div className="cms-ed__error" role="alert">{error}</div>}

        <div className="cms-ed__body">
          <div className="cms-canvas cms-canvas--screen">
            <ScreenDraftContext.Provider value={draftMap}>
              <div className="cms-canvas__page cms-screen-preview">
                <ScreenPreview def={def} />
              </div>
            </ScreenDraftContext.Provider>
          </div>

          <aside className="cms-side has-block">
            <div className="cms-side__body">
              <div className="cms-side__blockhead">
                <div>
                  <strong>{def.label}</strong>
                  <small className="adm-muted">
                    {def.group === 'Account' ? 'Account screen' : 'Onboarding'} · the form on this screen can’t be changed here.
                  </small>
                </div>
              </div>
              <FieldList fields={screenFields(def)} data={data} onChange={setField} />
              <div className="cms-side__blockactions">
                <button type="button" className="adm-btn" onClick={reset} disabled={!block}>
                  <RotateCcw size={16} aria-hidden /> Back to original
                </button>
              </div>
              <p className="adm-muted">Publish puts every saved screen change live at once.</p>
            </div>
          </aside>
        </div>
      </div>
    </FieldContext.Provider>
  );
};

/** The real screen layout, with a stand-in where the form goes. */
const ScreenPreview: React.FC<{ def: ScreenDef }> = ({ def }) => {
  const d = def.defaults;
  const text = (key: string) => screenText(d[key], '', SAMPLE_VARS);
  const form = (
    <div className="cms-screen-form" aria-hidden>
      <span />
      <span />
      <b>The form stays here</b>
    </div>
  );

  if (def.kind === 'auth') {
    const img = (d.image ?? {}) as { src?: string; alt?: string };
    return (
      <AuthShell
        screen={def.id}
        vars={SAMPLE_VARS}
        photo={def.photo}
        narrow={!def.photo}
        eyebrow={text('eyebrow')}
        title={text('title')}
        lede={text('lede')}
        aside={
          def.photo ? (
            <PhotoAside
              screen={def.id}
              src={img.src ?? ''}
              alt={img.alt ?? ''}
              caption={text('caption')}
              badge={{ label: text('badgeLabel'), value: text('badgeValue'), note: text('badgeNote') }}
            />
          ) : (
            <div className="auth__panel">
              <p className="auth__panel-body">Help panel (stays as it is)</p>
            </div>
          )
        }
      >
        {form}
      </AuthShell>
    );
  }

  const shown = def.kind === 'note' ? SCREEN_DEFS.track! : def;
  return (
    <OnboardingShell
      screen={shown.id}
      vars={SAMPLE_VARS}
      step={stepOf(shown)}
      title={screenText(shown.defaults.title, '', SAMPLE_VARS)}
      lede={screenText(shown.defaults.lede, '', SAMPLE_VARS)}
    >
      {form}
    </OnboardingShell>
  );
};
