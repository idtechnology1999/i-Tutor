import React, { useEffect, useState } from 'react';
import { Copy, ExternalLink, FilePlus2, House, SquarePen, Trash2, X } from 'lucide-react';
import { HOME_BLOCKS } from '../../cms/home';
import { blankData, newBlockId } from '../../cms/registry';
import type { CmsBlock } from '../../cms/types';
import { SCREENS_SLUG } from '../../cms/screens';
import { HOME_SLUG, createPage, deletePage, getPage, listPages, pagePath, slugify } from '../../services/pages';
import type { PageSummary } from '../../services/pages';

/* /cms: every page on the website. The homepage is always first; until it
   has been opened in the editor it shows the built-in design. */

const fresh = (types: string[]): CmsBlock[] => types.map((type) => ({ id: newBlockId(), type, data: blankData(type) }));

const TEMPLATES: Array<{ id: string; label: string; description: string; blocks: () => CmsBlock[] }> = [
  { id: 'blank', label: 'Blank page', description: 'Start with nothing and add blocks yourself.', blocks: () => [] },
  {
    id: 'landing',
    label: 'Landing page',
    description: 'Banner, image and text, cards, questions and a call to action.',
    blocks: () => fresh(['banner', 'split', 'cards', 'faq', 'cta']),
  },
  { id: 'about', label: 'About page', description: 'Banner, text, numbers, the team and a call to action.', blocks: () => fresh(['banner', 'text', 'stats', 'team', 'cta']) },
  { id: 'article', label: 'Simple text page', description: 'A heading and text, e.g. terms or privacy.', blocks: () => fresh(['text']) },
];

const when = (iso: string) => new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

export const PagesList: React.FC<{ onOpen: (id: string) => void; notify: (text: string) => void }> = ({ onOpen, notify }) => {
  const [pages, setPages] = useState<PageSummary[] | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [busy, setBusy] = useState('');

  const load = () =>
    listPages()
      .then(setPages)
      .catch((err: Error) => setError(err.message));

  useEffect(() => {
    void load();
  }, []);

  const home = pages?.find((p) => p.slug === HOME_SLUG);
  // The screens document is edited in the Screens tab.
  const others = (pages ?? []).filter((p) => p.slug !== HOME_SLUG && p.slug !== SCREENS_SLUG);

  const openHome = () => {
    if (home) return onOpen(home.id);
    // First edit: start from the homepage as it is today.
    setBusy('home');
    createPage({ title: 'Home', slug: HOME_SLUG, description: '', image: '', blocks: structuredClone(HOME_BLOCKS) })
      .then((p) => onOpen(p.id))
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(''));
  };

  const duplicate = (p: PageSummary) => {
    setBusy(p.id);
    getPage(p.id)
      .then((full) => {
        const taken = new Set((pages ?? []).map((x) => x.slug));
        const base = `${p.slug === HOME_SLUG ? 'home' : p.slug}-copy`;
        let slug = base;
        for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`;
        const blocks = full.draft.map((b) => ({ ...structuredClone(b), id: newBlockId() }));
        return createPage({ title: `${full.title} (copy)`, slug, description: full.description, image: full.image, blocks });
      })
      .then((copy) => {
        notify(`Copied to ${pagePath(copy.slug)} as a draft.`);
        return load();
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(''));
  };

  const remove = (p: PageSummary) => {
    const isHome = p.slug === HOME_SLUG;
    const ok = window.confirm(
      isHome
        ? 'Reset the homepage? Your edits are deleted and the site goes back to the built-in homepage.'
        : `Delete “${p.title}”? Its address ${pagePath(p.slug)} will stop working. This can’t be undone.`,
    );
    if (!ok) return;
    setBusy(p.id);
    deletePage(p.id)
      .then(() => {
        setPages((list) => (list ?? []).filter((x) => x.id !== p.id));
        notify(isHome ? 'Homepage reset to the built-in design.' : 'Page deleted.');
      })
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(''));
  };

  const status = (p: PageSummary) =>
    p.status === 'published' ? (
      p.hasDraft ? (
        <span className="adm-chip is-review">Published · changes not live</span>
      ) : (
        <span className="adm-chip is-live">Published</span>
      )
    ) : (
      <span className="adm-chip is-draft">Draft</span>
    );

  const row = (p: PageSummary) => (
    <li key={p.id} className="cms-pages__row">
      <button type="button" className="cms-pages__main" onClick={() => onOpen(p.id)}>
        <strong>{p.title}</strong>
        <small>{pagePath(p.slug)}</small>
      </button>
      {status(p)}
      <span className="adm-muted cms-hide-sm">{when(p.updatedAt)}</span>
      <span className="cms-pages__actions">
        <button type="button" className="adm-icon-btn" onClick={() => onOpen(p.id)} aria-label="Edit" title="Edit">
          <SquarePen size={17} aria-hidden />
        </button>
        <a
          className="adm-icon-btn"
          href={`${pagePath(p.slug)}${p.status === 'published' ? '' : '?preview=1'}`}
          target="_blank"
          rel="noreferrer"
          aria-label={p.status === 'published' ? 'View on the website' : 'Preview'}
          title={p.status === 'published' ? 'View on the website' : 'Preview'}
        >
          <ExternalLink size={17} aria-hidden />
        </a>
        <button type="button" className="adm-icon-btn" onClick={() => duplicate(p)} disabled={busy === p.id} aria-label="Duplicate" title="Duplicate">
          <Copy size={17} aria-hidden />
        </button>
        <button type="button" className="adm-icon-btn cms-danger" onClick={() => remove(p)} disabled={busy === p.id} aria-label="Delete" title="Delete">
          <Trash2 size={17} aria-hidden />
        </button>
      </span>
    </li>
  );

  return (
    <div className="cms-pagewrap">
      <header className="adm-head">
        <div>
          <h1>Pages</h1>
          <p>Build and edit website pages from blocks. Changes go live when you publish.</p>
        </div>
        <div className="adm-head__actions">
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
            <FilePlus2 size={18} aria-hidden /> New page
          </button>
        </div>
      </header>

      {error && <p className="adm-error">{error}</p>}

      <ul className="cms-pages">
        {home ? (
          row(home)
        ) : (
          <li className="cms-pages__row">
            <button type="button" className="cms-pages__main" onClick={openHome} disabled={busy === 'home'}>
              <strong>
                <House size={16} aria-hidden /> Home
              </strong>
              <small>/</small>
            </button>
            <span className="adm-chip is-live">Built-in design</span>
            <span className="adm-muted cms-hide-sm">Not edited yet</span>
            <span className="cms-pages__actions">
              <button type="button" className="adm-btn" onClick={openHome} disabled={busy === 'home'}>
                <SquarePen size={16} aria-hidden /> {busy === 'home' ? 'Opening…' : 'Edit homepage'}
              </button>
            </span>
          </li>
        )}
        {others.map(row)}
      </ul>

      {pages && others.length === 0 && (
        <div className="adm-empty">
          <h3>No other pages yet</h3>
          <p>Create an About page, a landing page for a campaign, or anything else, built from the same blocks as the homepage.</p>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setCreating(true)}>
            <FilePlus2 size={18} aria-hidden /> Create a page
          </button>
        </div>
      )}

      {creating && (
        <NewPageDialog
          taken={new Set((pages ?? []).map((p) => p.slug))}
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false);
            onOpen(id);
          }}
        />
      )}
    </div>
  );
};

const RESERVED = new Set(['home', 'screens', 'admin', 'cms', 'api', 'uploads', 'exam', 'syllabus', 'dashboard', 'setup', 'upgrade', 'practice', 'post-utme', 'classroom', 'register', 'login', 'verify', 'onboarding', 'images', 'assets']);

const NewPageDialog: React.FC<{ taken: Set<string>; onClose: () => void; onCreated: (id: string) => void }> = ({ taken, onClose, onCreated }) => {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugEdited, setSlugEdited] = useState(false);
  const [template, setTemplate] = useState('landing');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const address = slugEdited ? slug : slugify(title);
  const problem = !title.trim()
    ? 'Give the page a title.'
    : !address
      ? 'Choose an address for the page.'
      : RESERVED.has(address.split('/')[0]!)
        ? `/${address} is already used by the website. Choose another address.`
        : taken.has(address)
          ? `Another page already uses /${address}.`
          : '';

  const create = (e: React.FormEvent) => {
    e.preventDefault();
    if (problem) return setError(problem);
    setBusy(true);
    setError('');
    const blocks = TEMPLATES.find((t) => t.id === template)!.blocks();
    // Templates open with the page's own title in the banner.
    const first = blocks[0];
    if (first && (first.type === 'banner' || first.type === 'text')) first.data.title = title.trim();
    createPage({ title: title.trim(), slug: address, description: '', image: '', blocks })
      .then((p) => onCreated(p.id))
      .catch((err: Error) => setError(err.message))
      .finally(() => setBusy(false));
  };

  return (
    <div className="cms-modal" onClick={onClose}>
      <form className="cms-modal__panel cms-modal__panel--narrow" role="dialog" aria-modal="true" aria-label="New page" onClick={(e) => e.stopPropagation()} onSubmit={create}>
        <header className="cms-modal__head">
          <h2>New page</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body cms-newpage">
          <label className="adm-field">
            <span>Title</span>
            <input className="adm-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. About us" autoFocus />
          </label>
          <label className="adm-field">
            <span>Address</span>
            <span className="cms-slug">
              <b>{window.location.host}/</b>
              <input
                className="adm-input"
                value={address}
                onChange={(e) => {
                  setSlugEdited(true);
                  setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, '-'));
                }}
                placeholder="about-us"
              />
            </span>
          </label>
          <fieldset className="adm-field">
            <span>Start from</span>
            <div className="cms-templates">
              {TEMPLATES.map((t) => (
                <label key={t.id} className={`cms-template${template === t.id ? ' is-on' : ''}`}>
                  <input type="radio" name="template" value={t.id} checked={template === t.id} onChange={() => setTemplate(t.id)} />
                  <strong>{t.label}</strong>
                  <small>{t.description}</small>
                </label>
              ))}
            </div>
          </fieldset>
          {error && <p className="adm-error">{error}</p>}
        </div>
        <footer className="cms-modal__foot">
          <button type="button" className="adm-btn" onClick={onClose}>
            Cancel
          </button>
          <button type="submit" className="adm-btn adm-btn--primary" disabled={busy}>
            {busy ? 'Creating…' : 'Create and edit'}
          </button>
        </footer>
      </form>
    </div>
  );
};
