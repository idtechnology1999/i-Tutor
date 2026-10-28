import React, { useEffect, useRef, useState } from 'react';
import { Check, Copy, ImagePlus, Link2, Search, Trash2, UploadCloud, X } from 'lucide-react';
import { SITE_IMAGES, deleteMedia, listMedia, updateMediaAlt, uploadMedia } from '../../services/pages';
import type { MediaItem } from '../../services/pages';
import { mediaSrc } from '../../cms/read';
import { isLive } from '../../services/api';
import type { CmsImage } from '../../cms/types';

/* The image library: upload (button, drag and drop, or paste), browse, edit
   descriptions and delete. Used as its own page (/cms/media) and as the
   picker behind every image field. */

const kb = (n: number) => (n > 1024 * 1024 ? `${(n / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);

const MediaGrid: React.FC<{
  pick?: (item: MediaItem) => void;
  notify: (text: string) => void;
}> = ({ pick, notify }) => {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [error, setError] = useState('');
  const [uploading, setUploading] = useState(0);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    listMedia()
      .then(setItems)
      .catch((err: Error) => setError(err.message));
  }, []);

  const upload = async (files: File[]) => {
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (!images.length) return setError('Choose image files (JPEG, PNG, WebP or GIF).');
    setError('');
    setUploading((n) => n + images.length);
    let last: MediaItem | null = null;
    for (const file of images) {
      try {
        last = await uploadMedia(file);
        const added = last;
        setItems((list) => [added, ...(list ?? [])]);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setUploading((n) => n - 1);
      }
    }
    if (last) {
      notify(images.length === 1 ? 'Image uploaded.' : `${images.length} images uploaded.`);
      setSelected(last);
    }
  };

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) {
        e.preventDefault();
        void upload(files);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  });

  const q = query.trim().toLowerCase();
  const filter = (list: MediaItem[]) => (q ? list.filter((m) => `${m.name} ${m.alt}`.toLowerCase().includes(q)) : list);
  const uploaded = filter(items ?? []);
  const site = filter(SITE_IMAGES);

  const remove = (item: MediaItem) => {
    if (!window.confirm(`Delete “${item.name}”? Pages that use it will show no image there.`)) return;
    deleteMedia(item.id)
      .then(() => {
        setItems((list) => (list ?? []).filter((m) => m.id !== item.id));
        setSelected(null);
        notify('Image deleted.');
      })
      .catch((err: Error) => setError(err.message));
  };

  const tile = (m: MediaItem, own: boolean) => (
    <li key={m.id}>
      <button
        type="button"
        className={`cms-media__tile${selected?.id === m.id ? ' is-on' : ''}`}
        onClick={() => setSelected(m)}
        onDoubleClick={() => pick?.(m)}
        title={m.alt || m.name}
      >
        <img src={mediaSrc(m.url)} alt="" loading="lazy" />
        {!own && <span className="cms-media__badge">Site</span>}
      </button>
    </li>
  );

  return (
    <div
      className={`cms-media${dragging ? ' is-dragging' : ''}${pick ? ' is-picker' : ''}`}
      onDragOver={(e) => {
        if (Array.from(e.dataTransfer.types).includes('Files')) {
          e.preventDefault();
          setDragging(true);
        }
      }}
      onDragLeave={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragging(false);
      }}
      onDrop={(e) => {
        if (!e.dataTransfer.files.length) return;
        e.preventDefault();
        setDragging(false);
        void upload(Array.from(e.dataTransfer.files));
      }}
    >
      <div className="cms-media__main">
        <div className="cms-media__bar">
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => fileRef.current?.click()} disabled={uploading > 0}>
            <UploadCloud size={18} aria-hidden /> {uploading ? `Uploading ${uploading}…` : 'Upload images'}
          </button>
          <label className="adm-input adm-input--icon cms-media__search">
            <Search size={16} aria-hidden />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search images" />
          </label>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
            multiple
            hidden
            onChange={(e) => {
              void upload(Array.from(e.target.files ?? []));
              e.target.value = '';
            }}
          />
        </div>
        <p className="adm-muted">
          Drag images here, paste one, or use Upload. Big photos are shrunk before upload.
          {!isLive && ' Demo mode: images are kept in this browser only.'}
        </p>
        {error && <p className="adm-error">{error}</p>}

        <h3 className="cms-media__group">Your uploads</h3>
        {items === null && !error ? (
          <p className="adm-muted">Loading…</p>
        ) : uploaded.length ? (
          <ul className="cms-media__grid">{uploaded.map((m) => tile(m, true))}</ul>
        ) : (
          <div className="adm-empty adm-empty--small">
            <ImagePlus size={28} aria-hidden />
            <p>{q ? 'No uploads match your search.' : 'No uploads yet. Drop images here to add them.'}</p>
          </div>
        )}

        {site.length > 0 && (
          <>
            <h3 className="cms-media__group">Photos already on the website</h3>
            <ul className="cms-media__grid">{site.map((m) => tile(m, false))}</ul>
          </>
        )}
      </div>

      {selected && (
        <MediaDetails
          key={selected.id}
          item={selected}
          own={!selected.id.startsWith('site-')}
          onPick={pick}
          onClose={() => setSelected(null)}
          onDelete={remove}
          onSaved={(m) => {
            setItems((list) => (list ?? []).map((x) => (x.id === m.id ? m : x)));
            setSelected(m);
            notify('Description saved.');
          }}
          onError={setError}
        />
      )}

      {dragging && (
        <div className="cms-media__drop" aria-hidden>
          <UploadCloud size={36} />
          Drop to upload
        </div>
      )}
    </div>
  );
};

const MediaDetails: React.FC<{
  item: MediaItem;
  own: boolean;
  onPick?: (item: MediaItem) => void;
  onClose: () => void;
  onDelete: (item: MediaItem) => void;
  onSaved: (item: MediaItem) => void;
  onError: (text: string) => void;
}> = ({ item, own, onPick, onClose, onDelete, onSaved, onError }) => {
  const [alt, setAlt] = useState(item.alt);
  const [copied, setCopied] = useState(false);
  const url = mediaSrc(item.url);
  const absolute = url.startsWith('/') ? `${window.location.origin}${url}` : url;

  return (
    <aside className="cms-media__details">
      <header>
        <strong title={item.name}>{item.name}</strong>
        <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
          <X size={18} aria-hidden />
        </button>
      </header>
      <img src={url} alt="" />
      {own && (
        <p className="adm-muted">
          {item.width > 0 && `${item.width} × ${item.height} px · `}
          {kb(item.size)}
        </p>
      )}
      <label className="adm-field">
        <span>Description (alt text)</span>
        <textarea
          className="adm-input adm-textarea"
          rows={2}
          value={alt}
          onChange={(e) => setAlt(e.target.value)}
          placeholder="What the image shows, for screen readers and Google"
          disabled={!own}
        />
      </label>
      <div className="cms-media__actions">
        {onPick && (
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => onPick({ ...item, alt })}>
            <Check size={18} aria-hidden /> Use this image
          </button>
        )}
        {own && alt !== item.alt && (
          <button
            type="button"
            className="adm-btn"
            onClick={() =>
              updateMediaAlt(item.id, alt)
                .then(onSaved)
                .catch((err: Error) => onError(err.message))
            }
          >
            Save description
          </button>
        )}
        {!url.startsWith('data:') && (
          <button
            type="button"
            className="adm-btn"
            onClick={() =>
              void navigator.clipboard?.writeText(absolute).then(() => {
                setCopied(true);
                window.setTimeout(() => setCopied(false), 1500);
              })
            }
          >
            <Copy size={16} aria-hidden /> {copied ? 'Copied' : 'Copy link'}
          </button>
        )}
        {own && (
          <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={() => onDelete(item)}>
            <Trash2 size={16} aria-hidden /> Delete
          </button>
        )}
      </div>
    </aside>
  );
};

/** /cms/media */
export const MediaPage: React.FC<{ notify: (text: string) => void }> = ({ notify }) => (
  <div className="cms-pagewrap">
    <header className="adm-head">
      <div>
        <h1>Media</h1>
        <p>Images for your pages. Upload once, then use them in any block.</p>
      </div>
    </header>
    <MediaGrid notify={notify} />
  </div>
);

/** The picker behind image fields: the library, or a link to an image elsewhere. */
export const MediaPicker: React.FC<{
  onPick: (image: CmsImage) => void;
  onClose: () => void;
  notify: (text: string) => void;
}> = ({ onPick, onClose, notify }) => {
  const [tab, setTab] = useState<'library' | 'link'>('library');
  const [url, setUrl] = useState('');

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const validUrl = /^https:\/\/\S+$/i.test(url.trim());

  return (
    <div className="cms-modal" onClick={onClose}>
      <div className="cms-modal__panel cms-modal__panel--wide" role="dialog" aria-modal="true" aria-label="Choose an image" onClick={(e) => e.stopPropagation()}>
        <header className="cms-modal__head">
          <h2>Choose an image</h2>
          <div className="adm-tabs cms-modal__tabs">
            <button type="button" className={tab === 'library' ? 'is-on' : ''} onClick={() => setTab('library')}>
              <ImagePlus size={16} aria-hidden /> Library
            </button>
            <button type="button" className={tab === 'link' ? 'is-on' : ''} onClick={() => setTab('link')}>
              <Link2 size={16} aria-hidden /> Image link
            </button>
          </div>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="cms-modal__body">
          {tab === 'library' ? (
            <MediaGrid notify={notify} pick={(m) => onPick({ src: m.url, alt: m.alt })} />
          ) : (
            <div className="cms-linkpick">
              <label className="adm-field">
                <span>Image address</span>
                <input className="adm-input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://…/photo.jpg" autoFocus />
              </label>
              <p className="adm-muted">An image hosted somewhere else. It must start with https://. Uploading is more reliable.</p>
              {validUrl && <img src={url.trim()} alt="" className="cms-linkpick__preview" />}
              <button type="button" className="adm-btn adm-btn--primary" disabled={!validUrl} onClick={() => onPick({ src: url.trim(), alt: '' })}>
                Use this image
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
