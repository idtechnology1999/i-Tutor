import React, { useEffect, useState } from 'react';
import { ArrowLeft, ArrowUpRight, FileText, Images, MonitorSmartphone } from 'lucide-react';
import { BrandMark } from '../web/BrandMark';
import { PagesList } from './PagesList';
import { PageEditor } from './PageEditor';
import { MediaPage } from './MediaLibrary';
import { ScreenEditor, ScreensList } from './Screens';

/* The CMS at /cms: its own full-screen area, separate from the admin
   sidebar, behind the same admin sign-in.
     /cms             pages
     /cms/screens     login, sign-up and onboarding text
     /cms/media       images
     /cms/pages/<id>  the page editor
     /cms/screens/<id> a screen's text */

export const CmsApp: React.FC<{
  path: string;
  navigate: (to: string) => void;
  onExit: () => void;
}> = ({ path, navigate, onExit }) => {
  const clean = path.replace(/\/+$/, '');
  const editing = /^\/cms\/pages\/([^/]+)$/i.exec(clean)?.[1];
  const screen = /^\/cms\/screens\/([^/]+)$/i.exec(clean)?.[1];
  const section: 'pages' | 'screens' | 'media' = /^\/cms\/media$/i.test(clean)
    ? 'media'
    : /^\/cms\/screens$/i.test(clean)
      ? 'screens'
      : 'pages';
  const [toast, setToast] = useState<{ id: number; text: string } | null>(null);
  const notify = (text: string) => setToast((prev) => ({ id: (prev?.id ?? 0) + 1, text }));

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(t);
  }, [toast]);

  useEffect(() => {
    document.title = 'CMS — i-Tutor';
  }, []);

  const toastEl = toast && (
    <div className="adm-toast" key={toast.id} role="status">
      {toast.text}
    </div>
  );

  if (editing) {
    return (
      <div className="cms">
        <PageEditor key={editing} id={editing} onBack={() => navigate('/cms')} notify={notify} />
        {toastEl}
      </div>
    );
  }

  if (screen) {
    return (
      <div className="cms">
        <ScreenEditor key={screen} id={screen} onBack={() => navigate('/cms/screens')} notify={notify} />
        {toastEl}
      </div>
    );
  }

  return (
    <div className="cms">
      <header className="cms-top">
        <div className="cms-top__brand">
          <BrandMark />
          <span className="adm-side__tag">CMS</span>
        </div>
        <nav className="cms-top__nav" aria-label="CMS">
          <button type="button" className={section === 'pages' ? 'is-on' : ''} onClick={() => navigate('/cms')}>
            <FileText size={17} aria-hidden /> Pages
          </button>
          <button type="button" className={section === 'screens' ? 'is-on' : ''} onClick={() => navigate('/cms/screens')}>
            <MonitorSmartphone size={17} aria-hidden /> Screens
          </button>
          <button type="button" className={section === 'media' ? 'is-on' : ''} onClick={() => navigate('/cms/media')}>
            <Images size={17} aria-hidden /> Media
          </button>
        </nav>
        <span className="adm-spacer" />
        <a className="adm-btn cms-hide-sm" href="/" target="_blank" rel="noreferrer">
          <ArrowUpRight size={17} aria-hidden /> View website
        </a>
        <button type="button" className="adm-btn" onClick={onExit}>
          <ArrowLeft size={17} aria-hidden /> Back to admin
        </button>
      </header>
      <main className="cms-main">
        {section === 'pages' && <PagesList onOpen={(id) => navigate(`/cms/pages/${id}`)} notify={notify} />}
        {section === 'screens' && <ScreensList onOpen={(id) => navigate(`/cms/screens/${id}`)} notify={notify} />}
        {section === 'media' && <MediaPage notify={notify} />}
      </main>
      {toastEl}
    </div>
  );
};
