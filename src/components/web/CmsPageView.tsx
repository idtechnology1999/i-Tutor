import React, { useEffect } from 'react';
import { ArrowRight } from 'lucide-react';
import { BlockList } from '../../cms/render';
import { usePublicPage } from '../../cms/usePage';
import { SiteFooter } from './SiteFooter';

/* A page made in the CMS, at /<slug>. Any address the app doesn't know comes
   here; if no published page has that address, it says so. */

const setMeta = (name: string, content: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${name}"]`);
  if (!tag) {
    tag = document.createElement('meta');
    tag.name = name;
    document.head.appendChild(tag);
  }
  tag.content = content;
};

export const CmsPageView: React.FC<{ slug: string; onHome: () => void }> = ({ slug, onHome }) => {
  const state = usePublicPage(slug);

  useEffect(() => {
    if (state.status === 'ready') {
      document.title = `${state.page.title} — i-Tutor`;
      if (state.page.description) setMeta('description', state.page.description);
    } else if (state.status === 'missing') {
      document.title = 'Page not found — i-Tutor';
    }
  }, [state]);

  if (state.status === 'loading') return <div className="lp cms-loading" aria-busy="true" />;

  // The app screens' text is a CMS document too, but not a page to visit.
  if (state.status !== 'ready' || slug === 'screens') {
    const missing = state.status !== 'error';
    return (
      <div className="lp">
        <section className="lp-section cms-notfound">
          <div className="lp-wrap">
            <p className="lp-kicker">{missing ? '404' : 'Offline'}</p>
            <h1 className="lp-h2">{missing ? 'We can’t find that page.' : 'This page couldn’t load.'}</h1>
            <p className="lp-body">
              {missing ? 'The link may be old, or the page may have moved.' : 'Check your internet connection and try again.'}
            </p>
            <button type="button" className="lp-btn lp-btn--primary" onClick={onHome}>
              Go to the homepage <ArrowRight size={18} aria-hidden />
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="lp cms-page">
      <BlockList blocks={state.page.blocks} />
      <SiteFooter />
    </div>
  );
};
