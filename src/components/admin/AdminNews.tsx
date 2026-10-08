import React, { useEffect, useState } from 'react';
import { Check, Plus, Trash2, X } from 'lucide-react';
import { cms, useCms } from '../../lib/cms';
import type { CmsNews } from '../../lib/cms';
import type { NewsCategory } from '../../data/news';
import type { AdminNav } from './AdminApp';
import { PageHead, StatusChip } from './AdminApp';

const CATEGORIES: NewsCategory[] = ['Admissions', 'Exam tips', 'i-Tutor update'];

const IMAGES = [
  { src: '/images/student-cbt-focus.jpg', alt: 'A student concentrating at a computer' },
  { src: '/images/students-at-terminals.jpg', alt: 'Students working at computers in a school CBT lab' },
  { src: '/images/cbt-lab-rows.jpg', alt: 'Rows of students sitting at desktop computers' },
  { src: '/images/teacher-guiding.jpg', alt: 'A teacher explaining something on a screen to students' },
  { src: '/images/tutor-session.jpg', alt: 'A teacher helping students at a computer' },
  { src: '/images/student-portrait.jpg', alt: 'A secondary-school student at a computer, holding a booklet' },
];

const blank = (): CmsNews => ({
  id: `news-${Date.now()}`,
  category: 'Exam tips',
  title: '',
  summary: '',
  date: new Date().toISOString().slice(0, 10),
  readMinutes: 2,
  image: IMAGES[0].src,
  imageAlt: IMAGES[0].alt,
  body: [],
  status: 'draft',
});

const NewsEditor: React.FC<{
  initial: CmsNews;
  isNew: boolean;
  onClose: () => void;
  onSave: (n: CmsNews) => void;
  onDelete?: () => void;
}> = ({ initial, isNew, onClose, onSave, onDelete }) => {
  const [n, setN] = useState<CmsNews>(initial);
  const [bodyText, setBodyText] = useState(initial.body.join('\n\n'));
  const [tried, setTried] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  const set = <K extends keyof CmsNews>(k: K, v: CmsNews[K]) => setN((p) => ({ ...p, [k]: v }));
  const missing = [!n.title.trim() && 'a title', !n.summary.trim() && 'a short summary', !bodyText.trim() && 'the article text']
    .filter(Boolean)
    .join(', ');

  const save = (publish: boolean) => {
    setTried(true);
    if (publish && missing) return;
    const body = bodyText
      .split(/\n\s*\n/)
      .map((p) => p.trim())
      .filter(Boolean);
    const words = body.join(' ').split(/\s+/).length;
    onSave({
      ...n,
      title: n.title.trim(),
      summary: n.summary.trim(),
      body,
      readMinutes: Math.max(1, Math.round(words / 200)),
      source: n.source?.trim() || undefined,
      sourceUrl: n.sourceUrl?.trim() || undefined,
      status: publish ? 'published' : 'draft',
    });
  };

  return (
    <div className="adm-drawer" onClick={onClose}>
      <aside className="adm-drawer__panel" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" aria-label="Edit news post">
        <header className="adm-drawer__head">
          <h2>{isNew ? 'New post' : 'Edit post'}</h2>
          <button type="button" className="adm-icon-btn" onClick={onClose} aria-label="Close">
            <X size={20} aria-hidden />
          </button>
        </header>
        <div className="adm-drawer__body">
          <label className="adm-field">
            <span>Title</span>
            <input className="adm-input" value={n.title} onChange={(e) => set('title', e.target.value)} placeholder="Short and clear" />
          </label>
          <div className="adm-grid-2">
            <label className="adm-field">
              <span>Category</span>
              <select className="adm-input" value={n.category} onChange={(e) => set('category', e.target.value as NewsCategory)}>
                {CATEGORIES.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="adm-field">
              <span>Date</span>
              <input className="adm-input" type="date" value={n.date} onChange={(e) => set('date', e.target.value)} />
            </label>
          </div>
          <label className="adm-field">
            <span>Summary (shown on the card)</span>
            <textarea className="adm-input adm-textarea" rows={2} value={n.summary} onChange={(e) => set('summary', e.target.value)} />
          </label>
          <label className="adm-field">
            <span>Article (leave a blank line between paragraphs)</span>
            <textarea className="adm-input adm-textarea" rows={8} value={bodyText} onChange={(e) => setBodyText(e.target.value)} />
          </label>
          <div className="adm-field">
            <span>Photo</span>
            <div className="adm-images" role="radiogroup" aria-label="Photo">
              {IMAGES.map((img) => (
                <button
                  key={img.src}
                  type="button"
                  role="radio"
                  aria-checked={n.image === img.src}
                  className={n.image === img.src ? 'is-on' : ''}
                  onClick={() => setN((p) => ({ ...p, image: img.src, imageAlt: img.alt }))}
                >
                  <img src={img.src} alt={img.alt} loading="lazy" />
                  {n.image === img.src && (
                    <span className="adm-images__tick">
                      <Check size={14} aria-hidden />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
          <div className="adm-grid-2">
            <label className="adm-field">
              <span>Official source (optional)</span>
              <input className="adm-input" value={n.source ?? ''} onChange={(e) => set('source', e.target.value)} placeholder="e.g. JAMB" />
            </label>
            <label className="adm-field">
              <span>Source link</span>
              <input className="adm-input" type="url" value={n.sourceUrl ?? ''} onChange={(e) => set('sourceUrl', e.target.value)} placeholder="https://" />
            </label>
          </div>
          <p className="adm-muted">Only post official announcements after checking them on the source’s own website, and add the link.</p>
          {tried && missing && (
            <div className="adm-note is-error">
              <strong>Before publishing:</strong> add {missing}.
            </div>
          )}
        </div>
        <footer className="adm-drawer__foot">
          {!isNew && onDelete && (
            <button type="button" className="adm-btn adm-btn--danger-ghost" onClick={onDelete}>
              <Trash2 size={16} aria-hidden /> Delete
            </button>
          )}
          <span className="adm-spacer" />
          <button type="button" className="adm-btn" onClick={() => save(false)}>
            Save draft
          </button>
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => save(true)}>
            Publish
          </button>
        </footer>
      </aside>
    </div>
  );
};

export const AdminNews: React.FC<{ nav: AdminNav }> = ({ nav }) => {
  const { news } = useCms();
  const [editing, setEditing] = useState<CmsNews | 'new' | null>(null);

  return (
    <div className="adm-page">
      <PageHead
        title="News"
        sub="Posts appear in “Latest news” on the home page, newest first."
        actions={
          <button type="button" className="adm-btn adm-btn--primary" onClick={() => setEditing('new')}>
            <Plus size={18} aria-hidden /> New post
          </button>
        }
      />

      {news.length === 0 ? (
        <div className="adm-empty">
          <h3>No posts yet</h3>
          <p>Share admission updates, exam tips and i-Tutor news.</p>
        </div>
      ) : (
        <ul className="adm-news">
          {news.map((n) => (
            <li key={n.id}>
              <button type="button" onClick={() => setEditing(n)}>
                <img src={n.image} alt="" loading="lazy" />
                <span className="adm-news__text">
                  <strong>{n.title || 'Untitled post'}</strong>
                  <span className="adm-muted">
                    {n.category} · {new Date(`${n.date}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </span>
                <StatusChip status={n.status} />
              </button>
            </li>
          ))}
        </ul>
      )}

      {editing && (
        <NewsEditor
          initial={editing === 'new' ? blank() : editing}
          isNew={editing === 'new'}
          onClose={() => setEditing(null)}
          onSave={(item) => {
            cms.saveNews(item);
            nav.notify(item.status === 'published' ? 'Post published.' : 'Draft saved.');
            setEditing(null);
          }}
          onDelete={
            editing !== 'new'
              ? () => {
                  if (!window.confirm('Delete this post?')) return;
                  cms.deleteNews(editing.id);
                  nav.notify('Post deleted.');
                  setEditing(null);
                }
              : undefined
          }
        />
      )}
    </div>
  );
};
