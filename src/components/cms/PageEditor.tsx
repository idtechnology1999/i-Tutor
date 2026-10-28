import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import {
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  GripVertical,
  Layers,
  Plus,
  Redo2,
  Search,
  Settings2,
  SquarePen,
  Trash2,
  Undo2,
  X,
} from 'lucide-react';
import { BLOCKS, BLOCK_DEFS, CATEGORIES, blankData, blockSummary, newBlockId } from '../../cms/registry';
import { BlockView } from '../../cms/render';
import { CmsContext, mediaSrc } from '../../cms/read';
import type { CmsEnv } from '../../cms/read';
import type { CmsBlock } from '../../cms/types';
import { HOME_SLUG, deletePage, discardDraft, getPage, listPages, pagePath, publishPage, savePage, slugify, unpublishPage } from '../../services/pages';
import type { PageFull, PageInput, PageSummary } from '../../services/pages';
import { ConfirmDelete } from './ConfirmDelete';
import { FieldList, Switch } from './Fields';
import { FieldContext } from './field-context';
import { MediaPicker } from './MediaLibrary';

/* The page builder. The page is drawn with the real site blocks in the middle;
   click a block to edit it in the sidebar. Blocks can be dragged (by their
   handle, or in Layers), switched on and off, duplicated and deleted.
   Save keeps a draft; Publish puts it on the website. */

const EDITING: CmsEnv = { run: () => undefined, editing: true };
const HISTORY = 60;

type Tab = 'block' | 'layers' | 'page';
type Drop = { id: string; after: boolean } | null;

/* The blocks with their undo history. Typing in one field within a second
   counts as one change, so Undo doesn't go back a letter at a time. */
interface Doc {
  blocks: CmsBlock[];
  past: CmsBlock[][];
  future: CmsBlock[][];
  lastKey: string;
  lastAt: number;
}

type Edit =
  | { type: 'reset'; blocks: CmsBlock[] }
  | { type: 'change'; blocks: CmsBlock[]; key: string; at: number }
  | { type: 'undo' }
  | { type: 'redo' };

const EMPTY_DOC: Doc = { blocks: [], past: [], future: [], lastKey: '', lastAt: 0 };

function edits(doc: Doc, e: Edit): Doc {
  switch (e.type) {
    case 'reset':
      return { ...EMPTY_DOC, blocks: e.blocks };
    case 'change': {
      const merge = e.key !== '' && e.key === doc.lastKey && e.at - doc.lastAt < 1000;
      return {
        blocks: e.blocks,
        past: merge ? doc.past : [...doc.past, doc.blocks].slice(-HISTORY),
        future: [],
        lastKey: e.key,
        lastAt: e.at,
      };
    }
    case 'undo': {
      const prev = doc.past[doc.past.length - 1];
      if (!prev) return doc;
      return { blocks: prev, past: doc.past.slice(0, -1), future: [doc.blocks, ...doc.future], lastKey: '', lastAt: 0 };
    }
    case 'redo': {
      const next = doc.future[0];
      if (!next) return doc;
      return { blocks: next, past: [...doc.past, doc.blocks], future: doc.future.slice(1), lastKey: '', lastAt: 0 };
    }
  }
}

/** Drag-and-drop reordering shared by the canvas and the Layers list. */
function useReorder(onMove: (dragId: string, targetId: string, after: boolean) => void) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [drop, setDrop] = useState<Drop>(null);
  const ghost = useRef<HTMLDivElement>(null);

  const handle = (id: string, label: string) => ({
    draggable: true,
    onDragStart: (e: React.DragEvent) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', id);
      if (ghost.current) {
        ghost.current.textContent = label;
        e.dataTransfer.setDragImage(ghost.current, 16, 16);
      }
      setDragId(id);
    },
    onDragEnd: () => {
      setDragId(null);
      setDrop(null);
    },
  });

  const target = (id: string) => ({
    onDragOver: (e: React.DragEvent) => {
      if (!dragId) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const after = e.clientY > r.top + r.height / 2;
      setDrop((d) => (d?.id === id && d.after === after ? d : { id, after }));
    },
    onDrop: (e: React.DragEvent) => {
      e.preventDefault();
      if (dragId && drop && dragId !== drop.id) onMove(dragId, drop.id, drop.after);
      setDragId(null);
      setDrop(null);
    },
  });

  const cls = (id: string) =>
    `${dragId === id ? ' is-dragging' : ''}${drop?.id === id && dragId !== id ? (drop.after ? ' drop-after' : ' drop-before') : ''}`;

  const ghostEl = <div ref={ghost} className="cms-drag-ghost" aria-hidden />;
  return { handle, target, cls, dragging: dragId !== null, ghostEl };
}

export const PageEditor: React.FC<{
  id: string;
  onBack: () => void;
  notify: (text: string) => void;
}> = ({ id, onBack, notify }) => {
  const [page, setPage] = useState<PageFull | null>(null);
  const [loadError, setLoadError] = useState('');
  const [meta, setMeta] = useState<PageInput>({ title: '', slug: '', description: '', image: '' });
  const [doc, dispatch] = useReducer(edits, EMPTY_DOC);
  const blocks = doc.blocks;
  const [dirty, setDirty] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('layers');
  const [picker, setPicker] = useState<number | null>(null);
  const [busy, setBusy] = useState<'' | 'save' | 'publish' | 'other'>('');
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');
  const [pages, setPages] = useState<PageSummary[]>([]);
  const canvasRef = useRef<HTMLDivElement>(null);

  const isHome = page?.slug === HOME_SLUG;

  useEffect(() => {
    getPage(id)
      .then((p) => {
        setPage(p);
        setMeta({ title: p.title, slug: p.slug, description: p.description, image: p.image });
        dispatch({ type: 'reset', blocks: p.draft });
      })
      .catch((err: Error) => setLoadError(err.message));
    listPages()
      .then(setPages)
      .catch(() => undefined);
  }, [id]);

  /* ------------------------------------------------------------ Changes */

  /** Every change to the blocks goes through here, so it can be undone. */
  const change = useCallback((next: CmsBlock[], coalesce = '') => {
    dispatch({ type: 'change', blocks: next, key: coalesce, at: Date.now() });
    setDirty(true);
  }, []);

  const undo = useCallback(() => {
    dispatch({ type: 'undo' });
    setDirty(true);
  }, []);

  const redo = useCallback(() => {
    dispatch({ type: 'redo' });
    setDirty(true);
  }, []);

  const indexOf = (blockId: string) => blocks.findIndex((b) => b.id === blockId);

  const insert = (type: string, at: number) => {
    const block: CmsBlock = { id: newBlockId(), type, data: blankData(type) };
    const next = [...blocks];
    next.splice(at, 0, block);
    change(next);
    setPicker(null);
    select(block.id, true);
  };

  const moveTo = (from: number, to: number) => {
    if (from === to || to < 0 || to >= blocks.length) return;
    const next = [...blocks];
    const [b] = next.splice(from, 1);
    next.splice(to, 0, b!);
    change(next);
  };

  const moveRelative = (dragId: string, targetId: string, after: boolean) => {
    const next = blocks.filter((b) => b.id !== dragId);
    const moving = blocks.find((b) => b.id === dragId);
    const at = next.findIndex((b) => b.id === targetId);
    if (!moving || at < 0) return;
    next.splice(after ? at + 1 : at, 0, moving);
    change(next);
  };

  const toggle = (blockId: string) => {
    const b = blocks.find((x) => x.id === blockId);
    change(blocks.map((x) => (x.id === blockId ? { ...x, hidden: !x.hidden } : x)));
    if (b) notify(b.hidden ? 'Block switched on: visitors will see it.' : 'Block switched off: hidden from visitors.');
  };

  const duplicate = (blockId: string) => {
    const at = indexOf(blockId);
    const b = blocks[at];
    if (!b) return;
    const copy: CmsBlock = { ...structuredClone(b), id: newBlockId() };
    // Two blocks can't share one #anchor.
    if (typeof copy.data.anchor === 'string' && copy.data.anchor) copy.data.anchor = '';
    const next = [...blocks];
    next.splice(at + 1, 0, copy);
    change(next);
    select(copy.id, true);
  };

  const remove = (blockId: string) => {
    const b = blocks.find((x) => x.id === blockId);
    if (!b) return;
    const label = BLOCK_DEFS[b.type]?.label ?? 'block';
    if (!window.confirm(`Delete this ${label} block? (Tip: switch it off instead to hide it but keep it.)`)) return;
    change(blocks.filter((x) => x.id !== blockId));
    if (selected === blockId) setSelected(null);
    notify('Block deleted. Undo with Ctrl+Z.');
  };

  const setField = (blockId: string, key: string, value: unknown) =>
    change(
      blocks.map((b) => (b.id === blockId ? { ...b, data: { ...b.data, [key]: value } } : b)),
      `${blockId}:${key}`,
    );

  const select = (blockId: string, scroll = false) => {
    setSelected(blockId);
    setTab('block');
    if (scroll) {
      window.setTimeout(() => {
        canvasRef.current?.querySelector(`[data-block="${blockId}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 60);
    }
  };

  const canvasDnd = useReorder(moveRelative);
  const layersDnd = useReorder(moveRelative);

  /* ------------------------------------------------------- Save/publish */

  const metaError = useMemo(() => {
    if (!meta.title.trim()) return 'Give the page a title (Page tab).';
    if (!isHome && !/^[a-z0-9]+(?:-[a-z0-9]+)*(?:\/[a-z0-9]+(?:-[a-z0-9]+)*)*$/.test(meta.slug))
      return 'The page address can only use lowercase letters, numbers and dashes (Page tab).';
    return '';
  }, [meta, isHome]);

  const save = useCallback(async (): Promise<PageFull | null> => {
    if (!page) return null;
    if (metaError) {
      setError(metaError);
      setTab('page');
      return null;
    }
    setBusy('save');
    setError('');
    try {
      const saved = await savePage(page.id, { ...meta, title: meta.title.trim(), draft: blocks });
      setPage(saved);
      setDirty(false);
      return saved;
    } catch (err) {
      setError((err as Error).message);
      return null;
    } finally {
      setBusy('');
    }
  }, [page, meta, blocks, metaError]);

  const publish = async () => {
    if (!page) return;
    const saved = dirty || page.hasDraft ? await save() : page;
    if (!saved) return;
    setBusy('publish');
    try {
      const live = await publishPage(saved.id);
      setPage(live);
      notify(`Published. Visitors now see the new version at ${pagePath(live.slug)}.`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const preview = async () => {
    // A tab opened after the await would be blocked as a pop-up, so open it first.
    const win = window.open('', '_blank');
    const saved = dirty ? await save() : page;
    if (!saved) return win?.close();
    const url = `${pagePath(saved.slug)}?preview=1`;
    if (win) win.location.href = url;
    else window.open(url, '_blank');
  };

  const run = async (what: 'unpublish' | 'discard' | 'delete') => {
    if (!page) return;
    if (what === 'discard' && !window.confirm('Throw away every change since the last publish?')) return;
    // Deleting asks for the super admin password first (see deleteThisPage below).
    if (what === 'delete') return setDeleting(true);
    setBusy('other');
    setError('');
    try {
      const next = what === 'unpublish' ? await unpublishPage(page.id) : await discardDraft(page.id);
      setPage(next);
      if (what === 'discard') {
        dispatch({ type: 'reset', blocks: next.draft });
        setDirty(false);
      }
      notify(what === 'unpublish' ? 'Unpublished. Visitors can no longer see this page.' : 'Changes discarded.');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy('');
    }
  };

  const deleteThisPage = async (password: string) => {
    if (!page) return;
    await deletePage(page.id, password);
    setDirty(false);
    setDeleting(false);
    notify(isHome ? 'Homepage reset to the built-in design.' : 'Page deleted.');
    onBack();
  };

  /* -------------------------------------------------------- Keyboard */

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      if (k === 's') {
        e.preventDefault();
        void save().then((p) => p && notify('Draft saved.'));
        return;
      }
      // Inside a text box, Ctrl+Z undoes typing there.
      const el = e.target as HTMLElement;
      if (el.closest('input, textarea, select')) return;
      if (k === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((k === 'z' && e.shiftKey) || k === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [save, undo, redo, notify]);

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

  /* ----------------------------------------------------------- Render */

  if (loadError) {
    return (
      <div className="cms-ed cms-ed--message">
        <p className="adm-error">{loadError}</p>
        <button type="button" className="adm-btn" onClick={onBack}>
          <ArrowLeft size={18} aria-hidden /> Back to pages
        </button>
      </div>
    );
  }
  if (!page) return <div className="cms-ed cms-ed--message" aria-busy="true" />;

  const current = blocks.find((b) => b.id === selected) ?? null;
  const currentDef = current ? BLOCK_DEFS[current.type] : undefined;
  const live = page.status === 'published';
  const unpublished = dirty || page.hasDraft;

  return (
    <FieldContext.Provider value={{ pages, notify }}>
      <div className="cms-ed">
        {/* ------------------------------------------------------ Top bar */}
        <header className="cms-ed__top">
          <button type="button" className="adm-btn" onClick={leave}>
            <ArrowLeft size={18} aria-hidden /> <span className="cms-hide-sm">Pages</span>
          </button>
          <div className="cms-ed__name">
            <strong>{meta.title || 'Untitled page'}</strong>
            <small>{pagePath(meta.slug || page.slug)}</small>
          </div>
          <span className={`adm-chip ${live ? 'is-live' : 'is-draft'}`}>{live ? 'Published' : 'Draft'}</span>
          <span className="cms-ed__state cms-hide-sm">{dirty ? 'Unsaved changes' : unpublished && live ? 'Saved · not published yet' : 'All changes saved'}</span>
          <span className="adm-spacer" />
          <button type="button" className="adm-icon-btn" onClick={undo} disabled={!doc.past.length} aria-label="Undo" title="Undo (Ctrl+Z)">
            <Undo2 size={18} aria-hidden />
          </button>
          <button type="button" className="adm-icon-btn" onClick={redo} disabled={!doc.future.length} aria-label="Redo" title="Redo (Ctrl+Shift+Z)">
            <Redo2 size={18} aria-hidden />
          </button>
          <button type="button" className="adm-btn cms-hide-sm" onClick={() => void preview()} disabled={!!busy}>
            <ExternalLink size={16} aria-hidden /> Preview
          </button>
          <button type="button" className="adm-btn" onClick={() => void save().then((p) => p && notify('Draft saved.'))} disabled={!!busy || !dirty}>
            {busy === 'save' ? 'Saving…' : 'Save draft'}
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => void publish()} disabled={!!busy || (live && !unpublished)}>
            {busy === 'publish' ? 'Publishing…' : live ? (unpublished ? 'Update site' : 'Published') : 'Publish'}
          </button>
        </header>
        {error && (
          <div className="cms-ed__error" role="alert">
            {error}
            <button type="button" className="adm-icon-btn" onClick={() => setError('')} aria-label="Dismiss">
              <X size={16} aria-hidden />
            </button>
          </div>
        )}

        <div className="cms-ed__body">
          {/* ---------------------------------------------------- Canvas */}
          <div
            className={`cms-canvas${canvasDnd.dragging ? ' is-dragging' : ''}`}
            ref={canvasRef}
            onDragOver={(e) => {
              // Scroll while dragging near the top or bottom edge.
              const el = canvasRef.current;
              if (!el || !canvasDnd.dragging) return;
              const r = el.getBoundingClientRect();
              if (e.clientY < r.top + 80) el.scrollBy({ top: -24 });
              else if (e.clientY > r.bottom - 80) el.scrollBy({ top: 24 });
            }}
            onClickCapture={(e) => {
              // Links in the page don't navigate while editing.
              if ((e.target as HTMLElement).closest('a')) e.preventDefault();
            }}
          >
            <CmsContext.Provider value={EDITING}>
              <div className="lp cms-canvas__page">
                {blocks.length === 0 && (
                  <div className="cms-canvas__empty">
                    <h2>This page is empty</h2>
                    <p>Add your first block: a banner, some text, images or a call to action.</p>
                    <button type="button" className="adm-btn adm-btn--primary adm-btn--lg" onClick={() => setPicker(0)}>
                      <Plus size={18} aria-hidden /> Add a block
                    </button>
                  </div>
                )}
                {blocks.map((b, i) => {
                  const def = BLOCK_DEFS[b.type];
                  return (
                    <React.Fragment key={b.id}>
                      <Inserter onClick={() => setPicker(i)} />
                      <div
                        data-block={b.id}
                        className={`cms-blk${selected === b.id ? ' is-on' : ''}${b.hidden ? ' is-off' : ''}${canvasDnd.cls(b.id)}`}
                        onClick={() => select(b.id)}
                        {...canvasDnd.target(b.id)}
                      >
                        <div className="cms-blk__bar" onClick={(e) => e.stopPropagation()}>
                          <span className="cms-blk__handle" {...canvasDnd.handle(b.id, def?.label ?? b.type)} title="Drag to move">
                            <GripVertical size={16} aria-hidden />
                            {def?.label ?? b.type}
                          </span>
                          <button type="button" onClick={() => moveTo(i, i - 1)} disabled={i === 0} aria-label="Move up" title="Move up">
                            <ArrowUp size={15} aria-hidden />
                          </button>
                          <button type="button" onClick={() => moveTo(i, i + 1)} disabled={i === blocks.length - 1} aria-label="Move down" title="Move down">
                            <ArrowDown size={15} aria-hidden />
                          </button>
                          <span className="cms-blk__onoff">
                            <Switch on={!b.hidden} onChange={() => toggle(b.id)} label={b.hidden ? 'Off: switch on to show' : 'On: switch off to hide'} small />
                            {b.hidden ? 'Off' : 'On'}
                          </span>
                          <button type="button" onClick={() => select(b.id)} aria-label="Edit" title="Edit">
                            <SquarePen size={15} aria-hidden />
                          </button>
                          <button type="button" onClick={() => duplicate(b.id)} aria-label="Duplicate" title="Duplicate">
                            <Copy size={15} aria-hidden />
                          </button>
                          <button type="button" className="is-danger" onClick={() => remove(b.id)} aria-label="Delete" title="Delete">
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </div>
                        {b.hidden && (
                          <div className="cms-blk__offnote">
                            <EyeOff size={15} aria-hidden /> Switched off: visitors don’t see this block
                          </div>
                        )}
                        <div className="cms-blk__view">
                          <BlockView block={b} />
                        </div>
                      </div>
                    </React.Fragment>
                  );
                })}
                {blocks.length > 0 && (
                  <button type="button" className="cms-add-end" onClick={() => setPicker(blocks.length)}>
                    <Plus size={18} aria-hidden /> Add block
                  </button>
                )}
                <p className="cms-canvas__foot">The site header and footer appear here on the live page.</p>
              </div>
            </CmsContext.Provider>
            {canvasDnd.ghostEl}
          </div>

          {/* --------------------------------------------------- Sidebar */}
          <aside className={`cms-side${current && tab === 'block' ? ' has-block' : ''}`}>
            <div className="adm-tabs cms-side__tabs">
              <button type="button" className={tab === 'block' ? 'is-on' : ''} onClick={() => setTab('block')}>
                <SquarePen size={16} aria-hidden /> Block
              </button>
              <button type="button" className={tab === 'layers' ? 'is-on' : ''} onClick={() => setTab('layers')}>
                <Layers size={16} aria-hidden /> Layers <small>{blocks.length}</small>
              </button>
              <button type="button" className={tab === 'page' ? 'is-on' : ''} onClick={() => setTab('page')}>
                <Settings2 size={16} aria-hidden /> Page
              </button>
            </div>

            <div className="cms-side__body">
              {tab === 'block' &&
                (current && currentDef ? (
                  <>
                    <div className="cms-side__blockhead">
                      <span className="cms-side__icon">
                        <currentDef.icon size={18} aria-hidden />
                      </span>
                      <div>
                        <strong>{currentDef.label}</strong>
                        <small className="adm-muted">{currentDef.description}</small>
                      </div>
                    </div>
                    <label className="cms-toggle-row cms-onoff-row">
                      <Switch on={!current.hidden} onChange={() => toggle(current.id)} label="Show this block" />
                      <span>{current.hidden ? 'Off: hidden from visitors' : 'On: visible on the page'}</span>
                    </label>
                    {currentDef.fields.length === 0 && <p className="adm-muted">This block has nothing to edit: it shows content managed elsewhere in the admin.</p>}
                    <FieldList
                      fields={currentDef.fields}
                      data={{ ...currentDef.defaults, ...current.data }}
                      onChange={(key, value) => setField(current.id, key, value)}
                    />
                    <details className="cms-advanced">
                      <summary>Advanced</summary>
                      <label className="adm-field cms-field">
                        <span>Section ID</span>
                        <input
                          className="adm-input"
                          value={typeof current.data.anchor === 'string' ? current.data.anchor : ''}
                          onChange={(e) => setField(current.id, 'anchor', slugify(e.target.value))}
                          placeholder="e.g. pricing"
                        />
                        <small className="adm-muted">Lets a button link straight here with #{String(current.data.anchor || 'pricing')}.</small>
                      </label>
                    </details>
                    <div className="cms-side__blockactions">
                      <button type="button" className="adm-btn" onClick={() => duplicate(current.id)}>
                        <Copy size={16} aria-hidden /> Duplicate
                      </button>
                      <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => remove(current.id)}>
                        <Trash2 size={16} aria-hidden /> Delete block
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="cms-side__hint">
                    <SquarePen size={28} aria-hidden />
                    <p>Click any block on the page to edit its text, images and buttons.</p>
                    <button type="button" className="adm-btn" onClick={() => setPicker(blocks.length)}>
                      <Plus size={16} aria-hidden /> Add a block
                    </button>
                  </div>
                ))}

              {tab === 'layers' && (
                <>
                  <p className="adm-muted">Drag to reorder. Switch a block off to hide it without deleting it.</p>
                  <ol className="cms-layers">
                    {blocks.map((b, i) => {
                      const def = BLOCK_DEFS[b.type];
                      const Icon = def?.icon ?? Layers;
                      return (
                        <li
                          key={b.id}
                          className={`cms-layer${selected === b.id ? ' is-on' : ''}${b.hidden ? ' is-off' : ''}${layersDnd.cls(b.id)}`}
                          {...layersDnd.target(b.id)}
                        >
                          <span className="cms-layer__handle" {...layersDnd.handle(b.id, def?.label ?? b.type)} title="Drag to move">
                            <GripVertical size={16} aria-hidden />
                          </span>
                          <button type="button" className="cms-layer__main" onClick={() => select(b.id, true)}>
                            <Icon size={16} aria-hidden />
                            <span>
                              <strong>{def?.label ?? b.type}</strong>
                              <small>{blockSummary(b.type, b.data)}</small>
                            </span>
                          </button>
                          <Switch on={!b.hidden} onChange={() => toggle(b.id)} label={b.hidden ? 'Switch on' : 'Switch off'} small />
                          <span className="cms-layer__moves">
                            <button type="button" className="adm-icon-btn" onClick={() => moveTo(i, i - 1)} disabled={i === 0} aria-label="Move up">
                              <ArrowUp size={14} aria-hidden />
                            </button>
                            <button type="button" className="adm-icon-btn" onClick={() => moveTo(i, i + 1)} disabled={i === blocks.length - 1} aria-label="Move down">
                              <ArrowDown size={14} aria-hidden />
                            </button>
                          </span>
                          <button type="button" className="adm-icon-btn" onClick={() => remove(b.id)} aria-label="Delete block">
                            <Trash2 size={15} aria-hidden />
                          </button>
                        </li>
                      );
                    })}
                  </ol>
                  {layersDnd.ghostEl}
                  <button type="button" className="adm-btn adm-btn--block" onClick={() => setPicker(blocks.length)}>
                    <Plus size={16} aria-hidden /> Add block
                  </button>
                </>
              )}

              {tab === 'page' && (
                <PageSettings
                  page={page}
                  meta={meta}
                  isHome={isHome}
                  busy={!!busy}
                  notify={notify}
                  onChange={(m) => {
                    setMeta(m);
                    setDirty(true);
                  }}
                  onAction={(a) => void run(a)}
                />
              )}
            </div>
          </aside>
        </div>

        {picker !== null && <BlockPicker onPick={(type) => insert(type, picker)} onClose={() => setPicker(null)} />}
        {deleting && page && (
          <ConfirmDelete
            title={isHome ? 'Reset the homepage' : 'Delete page'}
            message={
              isHome
                ? 'Your edits are deleted and the website goes back to the built-in homepage.'
                : `“${page.title}” is removed from the website and ${pagePath(page.slug)} stops working. This can’t be undone.`
            }
            action={isHome ? 'Reset homepage' : 'Delete page'}
            onConfirm={deleteThisPage}
            onClose={() => setDeleting(false)}
          />
        )}
      </div>
    </FieldContext.Provider>
  );
};

/** The thin "+" line between blocks. */
const Inserter: React.FC<{ onClick: () => void }> = ({ onClick }) => (
  <div className="cms-insert">
    <button type="button" onClick={onClick} aria-label="Add a block here" title="Add a block here">
      <Plus size={16} aria-hidden />
    </button>
  </div>
);

const PageSettings: React.FC<{
  page: PageFull;
  meta: PageInput;
  isHome: boolean;
  busy: boolean;
  notify: (text: string) => void;
  onChange: (meta: PageInput) => void;
  onAction: (action: 'unpublish' | 'discard' | 'delete') => void;
}> = ({ page, meta, isHome, busy, notify, onChange, onAction }) => {
  const [pickImage, setPickImage] = useState(false);
  const live = page.status === 'published';
  return (
    <div className="cms-settings">
      <label className="adm-field cms-field">
        <span>Page title</span>
        <input className="adm-input" value={meta.title} onChange={(e) => onChange({ ...meta, title: e.target.value })} />
        <small className="adm-muted">Shown in the browser tab and on Google.</small>
      </label>
      <label className="adm-field cms-field">
        <span>Address</span>
        {isHome ? (
          <input className="adm-input" value="/ (the homepage)" disabled />
        ) : (
          <span className="cms-slug">
            <b>{window.location.host}/</b>
            <input className="adm-input" value={meta.slug} onChange={(e) => onChange({ ...meta, slug: e.target.value.toLowerCase().replace(/[^a-z0-9/-]/g, '-') })} />
          </span>
        )}
        {!isHome && live && <small className="adm-muted">Changing the address breaks links people already have.</small>}
      </label>
      <label className="adm-field cms-field">
        <span>Description for Google and link previews</span>
        <textarea
          className="adm-input adm-textarea"
          rows={3}
          maxLength={400}
          value={meta.description}
          onChange={(e) => onChange({ ...meta, description: e.target.value })}
        />
        <small className="adm-muted">{meta.description.length}/160 recommended</small>
      </label>
      <div className="adm-field cms-field">
        <span>Share image</span>
        <div className="cms-image-field">
          <button type="button" className="cms-image-field__thumb" onClick={() => setPickImage(true)} aria-label="Choose share image">
            {meta.image ? <img src={mediaSrc(meta.image)} alt="" /> : <Eye size={22} aria-hidden />}
          </button>
          <div className="cms-image-field__side">
            <button type="button" className="adm-btn" onClick={() => setPickImage(true)}>
              {meta.image ? 'Change' : 'Choose image'}
            </button>
            {meta.image && (
              <button type="button" className="adm-link" onClick={() => onChange({ ...meta, image: '' })}>
                Remove
              </button>
            )}
          </div>
        </div>
        <small className="adm-muted">Shown when the page is shared on WhatsApp or social media.</small>
      </div>
      {pickImage && (
        <MediaPicker
          notify={notify}
          onClose={() => setPickImage(false)}
          onPick={(im) => {
            onChange({ ...meta, image: im.src });
            setPickImage(false);
          }}
        />
      )}

      <div className="cms-settings__danger">
        <h3>Status</h3>
        <p className="adm-muted">
          {live
            ? `Published${page.publishedAt ? ` ${new Date(page.publishedAt).toLocaleString('en-GB', { dateStyle: 'medium', timeStyle: 'short' })}` : ''}. Visitors can see it.`
            : isHome
              ? 'Not published: visitors see the built-in homepage.'
              : 'Draft: only admins can see it.'}
        </p>
        {live && !isHome && (
          <button type="button" className="adm-btn" onClick={() => onAction('unpublish')} disabled={busy}>
            <EyeOff size={16} aria-hidden /> Unpublish
          </button>
        )}
        {live && page.hasDraft && (
          <button type="button" className="adm-btn" onClick={() => onAction('discard')} disabled={busy}>
            <Undo2 size={16} aria-hidden /> Discard unpublished changes
          </button>
        )}
        <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => onAction('delete')} disabled={busy}>
          <Trash2 size={16} aria-hidden /> {isHome ? 'Reset homepage' : 'Delete page'}
        </button>
      </div>
    </div>
  );
};

/** "Add block": every block type, grouped and searchable. */
const BlockPicker: React.FC<{ onPick: (type: string) => void; onClose: () => void }> = ({ onPick, onClose }) => {
  const [q, setQ] = useState('');
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
  const query = q.trim().toLowerCase();
  const matches = BLOCKS.filter((b) => !query || `${b.label} ${b.description}`.toLowerCase().includes(query));

  return (
    <div className="cms-modal" onClick={onClose}>
      <div className="cms-modal__panel" role="dialog" aria-modal="true" aria-label="Add a block" onClick={(e) => e.stopPropagation()}>
        <header className="cms-modal__head">
          <h2>Add a block</h2>
          <label className="adm-input adm-input--icon cms-modal__search">
            <Search size={16} aria-hidden />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search blocks" autoFocus />
          </label>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body">
          {CATEGORIES.map((cat) => {
            const list = matches.filter((b) => b.category === cat);
            if (!list.length) return null;
            return (
              <section key={cat} className="cms-picker__group">
                <h3>{cat}</h3>
                <ul className="cms-picker">
                  {list.map((b) => (
                    <li key={b.type}>
                      <button type="button" onClick={() => onPick(b.type)}>
                        <span className="cms-side__icon">
                          <b.icon size={20} aria-hidden />
                        </span>
                        <strong>{b.label}</strong>
                        <small>{b.description}</small>
                      </button>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
          {!matches.length && <p className="adm-muted">No blocks match “{q}”.</p>}
        </div>
      </div>
    </div>
  );
};
