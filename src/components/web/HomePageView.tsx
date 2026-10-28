import React from 'react';
import { BlockList } from '../../cms/render';
import { HOME_BLOCKS } from '../../cms/home';
import { usePublicPage } from '../../cms/usePage';
import { HOME_SLUG } from '../../services/pages';
import { SiteFooter } from './SiteFooter';

/* The homepage: built from CMS blocks (/cms → Homepage). Until an admin
   publishes their own version, it shows the built-in design in cms/home.ts. */

export const HomePageView: React.FC = () => {
  const state = usePublicPage(HOME_SLUG);
  // While the first visit loads, keep the space instead of flashing the built-in page.
  if (state.status === 'loading') return <div className="lp cms-loading" aria-busy="true" />;
  const blocks = state.status === 'ready' ? state.page.blocks : HOME_BLOCKS;

  return (
    <div className="lp">
      <BlockList blocks={blocks} />
      <SiteFooter />
    </div>
  );
};

export default HomePageView;
