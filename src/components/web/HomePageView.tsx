import React, { useEffect, useState } from 'react';
import { BlockList } from '../../cms/render';
import { HOME_BLOCKS } from '../../cms/home';
import { usePublicPage } from '../../cms/usePage';
import { HOME_SLUG } from '../../services/pages';
import { SiteFooter } from './SiteFooter';
import { CourseFinder } from './CourseFinder';

/* The homepage: built from CMS blocks (/cms → Homepage). Until an admin
   publishes their own version, it shows the built-in design in cms/home.ts.
   The course finder pops up over it a few seconds after a visitor arrives,
   once per visit, like an advert they can close. */

const SEEN_THIS_VISIT = 'itutor-course-finder-visit';
export const FINDER_NEVER = 'itutor-course-finder-never';

const shouldShow = () => {
  try {
    return window.localStorage.getItem(FINDER_NEVER) !== '1' && window.sessionStorage.getItem(SEEN_THIS_VISIT) !== '1';
  } catch {
    return true;
  }
};

export const HomePageView: React.FC = () => {
  const state = usePublicPage(HOME_SLUG);
  const [finder, setFinder] = useState(false);

  useEffect(() => {
    if (!shouldShow()) return;
    const t = window.setTimeout(() => {
      setFinder(true);
      try {
        window.sessionStorage.setItem(SEEN_THIS_VISIT, '1');
      } catch {
        /* ignore */
      }
    }, 5000);
    return () => window.clearTimeout(t);
  }, []);

  // While the first visit loads, keep the space instead of flashing the built-in page.
  if (state.status === 'loading') return <div className="lp cms-loading" aria-busy="true" />;
  const blocks = state.status === 'ready' ? state.page.blocks : HOME_BLOCKS;

  return (
    <div className="lp">
      <BlockList blocks={blocks} />
      <SiteFooter />
      {finder && <CourseFinder onClose={() => setFinder(false)} startHref="/dashboard" />}
    </div>
  );
};

export default HomePageView;
