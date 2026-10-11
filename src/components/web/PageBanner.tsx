import React from 'react';

/* The homepage hero, page-sized: a wide rounded photo with the page title on a
   white panel cut into its bottom-left corner. Optional extras sit on the
   photo: a glass label top-left and anything (a stat, a button) bottom-right.
   It breaks out of narrow page columns so every page's banner is the same width. */

interface Props {
  image: string;
  imageAlt: string;
  title: React.ReactNode;
  lead?: React.ReactNode;
  /** Small glass label on the photo, top-left. */
  eyebrow?: React.ReactNode;
  /** On the photo, bottom-right (hidden on phones — keep it optional). */
  aside?: React.ReactNode;
  /** Under the lead, inside the white panel. */
  children?: React.ReactNode;
  /** Where to focus the photo, e.g. "50% 30%". */
  focus?: string;
}

export const PageBanner: React.FC<Props> = ({ image, imageAlt, title, lead, eyebrow, aside, children, focus }) => (
  <section className="lp-banner lp-banner--page">
    <div className="lp-banner__media">
      <img src={image} alt={imageAlt} style={focus ? { objectPosition: focus } : undefined} decoding="async" />
      {eyebrow && <p className="lp-banner__eyebrow">{eyebrow}</p>}
      {aside && <div className="lp-banner__join">{aside}</div>}
    </div>
    <div className="lp-banner__panel">
      <h1 className="page-banner__title">{title}</h1>
      {lead && <p className="page-banner__lead">{lead}</p>}
      {children}
    </div>
  </section>
);
