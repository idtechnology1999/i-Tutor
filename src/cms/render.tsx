import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowRight,
  Building2,
  ChartNoAxesColumnIncreasing,
  Check,
  CircleHelp,
  GraduationCap,
  Landmark,
  MessageSquareText,
  WifiOff,
} from 'lucide-react';
import { initMotion } from '../lib/motion';
import { useScrollProgress } from '../lib/ui';
import { CbtPreview, TutorPreview } from '../components/web/ProductPreviews';
import { ServiceSection } from '../components/web/ServiceSection';
import { NewsSection } from '../components/web/NewsSection';
import { PageBanner } from '../components/web/PageBanner';
import { SampleQuestion, ServiceVisual, TeamSection } from '../components/web/HomeWidgets';
import { BLOCK_DEFS } from './registry';
import { bool, image, items, lines, link, mediaSrc, str, useCmsEnv } from './read';
import { iconFor } from './icons';
import { Accent, CmsButton, Markdown } from './text';
import type { BlockData, CmsBlock } from './types';

/* How each block looks on the website. The site-section blocks are the
   homepage's own markup, so CMS pages match the rest of the site. */

type R = React.FC<{ d: BlockData; id?: string }>;

const arrow = <ArrowRight size={18} aria-hidden />;
const PANELS = new Set(['mist', 'orange', 'orange-solid', 'ink']);

const Img: React.FC<{ v: unknown; className?: string; eager?: boolean; width?: number; height?: number }> = ({ v, className, eager, width, height }) => {
  const im = image(v);
  if (!im.src) return null;
  return (
    <img
      src={mediaSrc(im.src)}
      alt={im.alt}
      className={className}
      width={width}
      height={height}
      loading={eager ? undefined : 'lazy'}
      fetchPriority={eager ? 'high' : undefined}
      decoding="async"
    />
  );
};

const Ticks: React.FC<{ v: unknown; className?: string }> = ({ v, className = 'lp-ticks' }) => {
  const list = lines(v);
  return list.length ? (
    <ul className={className}>
      {list.map((t, i) => (
        <li key={i}>
          <Check size={16} aria-hidden /> {t}
        </li>
      ))}
    </ul>
  ) : null;
};

/** The heading of a block: carved into the panel on panels, plain otherwise. */
const Head: React.FC<{ d: BlockData; panel: boolean; center?: boolean }> = ({ d, panel, center }) => {
  const k = str(d.kicker);
  const t = str(d.title);
  if (!k && !t) return null;
  const inner = (
    <>
      {k && <p className="lp-kicker">{k}</p>}
      {t && (
        <h2 className="lp-h2">
          <Accent text={t} />
        </h2>
      )}
    </>
  );
  if (panel) return <div className="lp-carve-head">{inner}</div>;
  return <header className={`lp-head cms-head${center ? ' lp-head--center' : ''}`}>{inner}</header>;
};

/** A section with one of the shared backgrounds. */
const Band: React.FC<{ bg: string; id?: string; className?: string; children: (panel: boolean) => React.ReactNode }> = ({
  bg,
  id,
  className = '',
  children,
}) => {
  if (PANELS.has(bg)) {
    return (
      <section className={`lp-section${bg === 'ink' ? ' lp-section--ink' : ''} ${className}`} id={id}>
        <div className={`lp-wrap lp-panel lp-panel--${bg}`}>
          <span className="lp-deco lp-deco--steps-b" aria-hidden />
          {children(true)}
        </div>
      </section>
    );
  }
  return (
    <section className={`lp-section${bg === 'tint' ? ' lp-section--tint' : ''} ${className}`} id={id}>
      <div className="lp-wrap">{children(false)}</div>
    </section>
  );
};

/* ------------------------------------------------------- Text & layout */

const BannerBlock: R = ({ d }) => {
  const im = image(d.image);
  const cta = link(d.cta);
  const cta2 = link(d.cta2);
  return (
    <div className="lp-hero cms-banner">
      <PageBanner
        image={mediaSrc(im.src || '/images/students-laptops.jpg')}
        imageAlt={im.alt}
        eyebrow={str(d.eyebrow) || undefined}
        title={<Accent text={str(d.title)} />}
        lead={str(d.lead) || undefined}
      >
        {(cta.label || cta2.label) && (
          <div className="lp-hero__actions cms-actions">
            <CmsButton link={cta} className="lp-btn lp-btn--primary" icon={arrow} />
            <CmsButton link={cta2} className="lp-btn lp-btn--quiet" />
          </div>
        )}
      </PageBanner>
    </div>
  );
};

const TextBlock: R = ({ d, id }) => {
  const center = str(d.align) === 'center';
  return (
    <Band bg={str(d.bg, 'plain')} id={id} className={center ? 'cms-center' : ''}>
      {(panel) => (
        <div className="cms-text">
          <Head d={d} panel={panel} center={center} />
          <Markdown text={str(d.body)} />
        </div>
      )}
    </Band>
  );
};

const SplitBlock: R = ({ d, id }) => (
  <Band bg={str(d.bg, 'plain')} id={id}>
    {(panel) => (
      <div className={`lp-split cms-split${bool(d.flip) ? ' is-flip' : ''}`}>
        <div className="lp-split__copy">
          <Head d={d} panel={panel} />
          {str(d.body) && <Markdown text={str(d.body)} className="lp-body" />}
          <Ticks v={d.ticks} />
          <CmsButton link={link(d.cta)} className="lp-btn lp-btn--primary" icon={arrow} />
        </div>
        <figure className="cms-split__media">
          <Img v={d.image} />
        </figure>
      </div>
    )}
  </Band>
);

const CardsBlock: R = ({ d, id }) => (
  <Band bg={str(d.bg, 'tint')} id={id}>
    {(panel) => (
      <>
        <Head d={d} panel={panel} />
        {str(d.body) && <p className="lp-body cms-intro">{str(d.body)}</p>}
        <ul className={`cms-cards cms-cards--${str(d.columns, '3')}`}>
          {items(d.items).map((c, i) => {
            const Icon = iconFor(c.icon);
            const pic = image(c.image);
            return (
              <li key={i} className="cms-card">
                {pic.src ? (
                  <Img v={c.image} className="cms-card__img" />
                ) : (
                  <span className="lp-feature__icon">
                    <Icon size={22} aria-hidden />
                  </span>
                )}
                <h3>{str(c.title)}</h3>
                {str(c.body) && <p>{str(c.body)}</p>}
                <CmsButton link={link(c.link)} className="lp-link" icon={<ArrowRight size={16} aria-hidden />} />
              </li>
            );
          })}
        </ul>
      </>
    )}
  </Band>
);

const ButtonsBlock: R = ({ d, id }) => (
  <section className="lp-section cms-buttons-band" id={id}>
    <div className={`lp-wrap lp-hero__actions cms-actions${str(d.align) === 'left' ? '' : ' is-center'}`}>
      <CmsButton link={link(d.primary)} className="lp-btn lp-btn--primary" icon={arrow} />
      <CmsButton link={link(d.secondary)} className="lp-btn lp-btn--outline" />
    </div>
  </section>
);

const SpacerBlock: R = ({ d, id }) => <div className={`cms-spacer is-${str(d.size, 'md')}`} id={id} aria-hidden />;

/* --------------------------------------------------------------- Media */

const ImageBlock: R = ({ d, id }) => {
  const size = str(d.size, 'wide');
  const caption = str(d.caption);
  return (
    <section className="lp-section cms-image-band" id={id}>
      <figure className={`cms-figure is-${size}`}>
        <Img v={d.image} />
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </section>
  );
};

/** YouTube or Vimeo address → its privacy-friendly embed address. */
const embedUrl = (url: string) => {
  const yt = /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/.exec(url);
  if (yt) return `https://www.youtube-nocookie.com/embed/${yt[1]}`;
  const vimeo = /vimeo\.com\/(?:video\/)?(\d+)/.exec(url);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}`;
  return '';
};

const VideoBlock: R = ({ d, id }) => {
  const { editing } = useCmsEnv();
  const src = embedUrl(str(d.url));
  const caption = str(d.caption);
  if (!src) return editing ? <p className="cms-missing">Paste a YouTube or Vimeo link to show the video.</p> : null;
  return (
    <section className="lp-section cms-image-band" id={id}>
      <figure className="cms-figure is-wide">
        <div className="cms-video">
          <iframe
            src={src}
            title={caption || 'Video'}
            loading="lazy"
            allow="accelerometer; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
          />
        </div>
        {caption && <figcaption>{caption}</figcaption>}
      </figure>
    </section>
  );
};

/* ------------------------------------------------------ Site sections */

const HeroBlock: R = ({ d, id }) => {
  const primary = link(d.primary);
  const secondary = link(d.secondary);
  const pill = str(d.pill);
  return (
    <section className="lp-hero lp-hero--banner" id={id}>
      <div className="lp-banner">
        <div className="lp-banner__media" data-reveal="scale">
          <Img v={d.image} eager width={1280} height={960} />

          {bool(d.showStat) && (
            <div className="lp-carve-corner" aria-hidden>
              <span className="lp-hero__score-label">{str(d.statLabel)}</span>
              <span className="lp-hero__score-value">
                {str(d.statValue)}
                <small>{str(d.statSuffix)}</small>
              </span>
              <span className="lp-hero__score-delta">{str(d.statDelta)}</span>
            </div>
          )}

          <div className="lp-banner__join">
            {pill && <span className="lp-banner__pill">{pill}</span>}
            <div className="lp-banner__actions">
              <CmsButton link={secondary} className="lp-btn lp-banner__glass" />
              <CmsButton link={primary} className="lp-btn lp-btn--primary" icon={arrow} />
            </div>
          </div>
        </div>

        <div className="lp-banner__panel">
          {str(d.eyebrow) && (
            <div className="lp-carve-step">
              <span className="lp-carve-step__tag">
                <span className="lp-eyebrow__dot" aria-hidden />
                {str(d.eyebrow)}
              </span>
            </div>
          )}
          <h1 className="lp-hero__title" data-reveal data-reveal-delay={60}>
            <Accent text={str(d.title)} />
          </h1>
          {str(d.lead) && (
            <p className="lp-hero__lead" data-reveal data-reveal-delay={120}>
              {str(d.lead)}
            </p>
          )}
          {/* On phones the buttons can't sit on the photo, so they come here. */}
          <div className="lp-hero__actions lp-banner__mobile-cta">
            <CmsButton link={primary} className="lp-btn lp-btn--primary" icon={arrow} />
            <CmsButton link={secondary} className="lp-btn lp-btn--quiet" />
          </div>
        </div>
      </div>
    </section>
  );
};

const StatsBlock: R = ({ d, id }) => (
  <section className="lp-proof" aria-label="At a glance" id={id}>
    <div className="lp-wrap lp-proof__grid">
      {items(d.items).map((s, i) => {
        const value = str(s.value);
        // "2,400+" counts up as it scrolls into view.
        const count = /^[\d,]+\+$/.test(value) ? Number(value.replace(/[,+]/g, '')) : null;
        return (
          <div key={i}>
            {count ? (
              <b data-count={count} data-count-group="true" data-count-suffix="+">
                {value}
              </b>
            ) : (
              <b>{value}</b>
            )}
            <span>{str(s.label)}</span>
          </div>
        );
      })}
    </div>
  </section>
);

const ShowcaseBlock: R = ({ d, id }) => (
  <section className="lp-showcase-carve" id={id}>
    <div className="lp-carve-photo">
      <Img v={d.image} width={1600} height={1200} />
      <div className="lp-carve-tl">
        {str(d.kicker) && <p className="lp-kicker">{str(d.kicker)}</p>}
        <h2 className="lp-h2">
          <Accent text={str(d.title)} />
        </h2>
        {str(d.text) && (
          <div className="lp-carve-tl lp-carve-tl--step">
            <p className="lp-carve-text">{str(d.text)}</p>
          </div>
        )}
      </div>
      <div className="lp-carve-br">
        <ul className="lp-carve-chips">
          {items(d.chips).map((c, i) => {
            const Icon = iconFor(c.icon);
            return (
              <li key={i}>
                <Icon size={16} aria-hidden /> {str(c.label)}
              </li>
            );
          })}
        </ul>
        <CmsButton link={link(d.cta)} className="lp-btn lp-btn--primary" icon={arrow} />
      </div>
    </div>
    {str(d.credit) && <p className="lp-photo-credit">{str(d.credit)}</p>}
  </section>
);

const ServiceBlock: R = ({ d, id }) => {
  const { run, editing } = useCmsEnv();
  const cta = link(d.cta);
  const visual = str(d.visual, 'image');
  const panel = str(d.panel, 'orange');
  return (
    <ServiceSection
      id={id ?? ''}
      kicker={str(d.kicker)}
      title={<Accent text={str(d.title)} />}
      lead={str(d.lead)}
      when={str(d.when) || undefined}
      points={lines(d.points)}
      panel={(PANELS.has(panel) ? panel : 'orange') as 'orange'}
      deco={(['steps-a', 'steps-b', 'steps-c'].includes(str(d.deco)) ? str(d.deco) : 'steps-b') as 'steps-a'}
      flip={bool(d.flip)}
      cta={cta.label}
      onCta={() => !editing && cta.href && run(cta.href)}
    >
      {visual === 'image' ? <Img v={d.image} className="cms-service__img" /> : <ServiceVisual kind={visual} />}
    </ServiceSection>
  );
};

const SampleBlock: R = ({ d, id }) => {
  const { run, editing } = useCmsEnv();
  return (
    <section className="lp-section" id={id}>
      <div className="lp-wrap lp-panel lp-panel--mist lp-split">
        <span className="lp-deco lp-deco--steps-b" aria-hidden />
        <div className="lp-split__copy">
          <div className="lp-carve-head">
            {str(d.kicker) && (
              <p className="lp-kicker" data-reveal>
                {str(d.kicker)}
              </p>
            )}
            <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
              <Accent text={str(d.title)} />
            </h2>
          </div>
          {str(d.body) && (
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              {str(d.body)}
            </p>
          )}
          <Ticks v={d.ticks} />
        </div>
        <div data-reveal="scale" data-reveal-delay={100}>
          <SampleQuestion onOpenTutor={() => !editing && run('action:tutor')} />
        </div>
      </div>
    </section>
  );
};

const FeaturesBlock: R = ({ d, id }) => (
  <section className="lp-section lp-section--tint" id={id}>
    <div className="lp-wrap">
      <header className="lp-head">
        {str(d.kicker) && (
          <p className="lp-kicker" data-reveal>
            {str(d.kicker)}
          </p>
        )}
        <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
          <Accent text={str(d.title)} />
        </h2>
      </header>

      <article className="lp-showcase">
        <div className="lp-showcase__copy">
          <div data-reveal>
            <span className="lp-feature__icon">
              <GraduationCap size={22} aria-hidden />
            </span>
            <h3>{str(d.cbtTitle)}</h3>
            <p>{str(d.cbtBody)}</p>
          </div>
          <div data-reveal data-reveal-delay={80}>
            <Ticks v={d.cbtTicks} />
            <CmsButton link={link(d.cbtLink)} className="lp-link" icon={<ArrowRight size={16} aria-hidden />} />
          </div>
        </div>
        <div className="lp-showcase__frame" data-reveal="scale" data-reveal-delay={60}>
          <CbtPreview />
        </div>
      </article>

      <article className="lp-feature lp-feature--flip">
        <figure className="lp-feature__media lp-feature__media--stage" data-reveal="scale">
          <Img v={d.tutorImage} width={1280} height={960} />
          <TutorPreview />
        </figure>
        <div className="lp-feature__copy" data-reveal data-reveal-delay={80}>
          <span className="lp-feature__icon">
            <MessageSquareText size={22} aria-hidden />
          </span>
          <h3>{str(d.tutorTitle)}</h3>
          <p>{str(d.tutorBody)}</p>
          <Ticks v={d.tutorTicks} />
          <CmsButton link={link(d.tutorLink)} className="lp-link" icon={<ArrowRight size={16} aria-hidden />} />
        </div>
      </article>

      <div className="lp-minis">
        <div className="lp-mini" data-reveal>
          <ChartNoAxesColumnIncreasing size={22} aria-hidden />
          <h4>{str(d.m1Title)}</h4>
          <p>{str(d.m1Body)}</p>
          <div className="lp-mastery" aria-hidden>
            <div>
              <span>Kinematics</span>
              <i style={{ ['--w' as string]: '82%' }} />
            </div>
            <div>
              <span>Electrolysis</span>
              <i style={{ ['--w' as string]: '46%' }} className="is-weak" />
            </div>
            <div>
              <span>Quadratics</span>
              <i style={{ ['--w' as string]: '67%' }} />
            </div>
          </div>
        </div>
        <div className="lp-mini" data-reveal data-reveal-delay={70}>
          <WifiOff size={22} aria-hidden />
          <h4>{str(d.m2Title)}</h4>
          <p>{str(d.m2Body)}</p>
          <div className="lp-download" aria-hidden>
            <span>Physics pack · 18 MB</span>
            <span className="lp-download__ok">
              <Check size={14} /> Ready offline
            </span>
          </div>
        </div>
        <div className="lp-mini" data-reveal data-reveal-delay={140}>
          <Building2 size={22} aria-hidden />
          <h4>{str(d.m3Title)}</h4>
          <p>{str(d.m3Body)}</p>
          <CmsButton link={link(d.m3Link)} className="lp-link" icon={<ArrowRight size={16} aria-hidden />} />
        </div>
      </div>
    </div>
  </section>
);

const StepsBlock: R = ({ d, id }) => {
  const panel = str(d.panel, 'orange-solid');
  return (
    <section className={`lp-section${panel === 'ink' ? ' lp-section--ink' : ''}`} id={id}>
      <div className={`lp-wrap lp-panel lp-panel--${PANELS.has(panel) ? panel : 'orange-solid'}`}>
        <span className="lp-deco lp-deco--steps-a" aria-hidden />
        <header className="lp-head">
          <Head d={d} panel />
        </header>
        <ol className="lp-steps">
          {items(d.items).map((step, index) => {
            const Icon = iconFor(step.icon);
            return (
              <li key={index} data-reveal data-reveal-delay={index * 70}>
                <span className="lp-steps__num">{String(index + 1).padStart(2, '0')}</span>
                <Icon size={22} aria-hidden />
                <h4>{str(step.title)}</h4>
                <p>{str(step.body)}</p>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
};

const TrustBlock: R = ({ d, id }) => (
  <section className="lp-section lp-section--ink" id={id}>
    <div className="lp-wrap lp-panel lp-panel--ink">
      <span className="lp-deco lp-deco--steps-c" aria-hidden />
      <header className="lp-head lp-head--split">
        <div>
          <Head d={d} panel />
        </div>
        {str(d.body) && (
          <p className="lp-body" data-reveal data-reveal-delay={120}>
            {str(d.body)}
          </p>
        )}
      </header>
      <div className="lp-trust">
        {items(d.cards).map((item, index) => {
          const Icon = iconFor(item.icon);
          const tone = ['green', 'blue', 'amber'].includes(str(item.tone)) ? str(item.tone) : 'green';
          return (
            <div className="lp-trust__card" key={index} data-reveal data-reveal-delay={index * 70}>
              <span className={`lp-badge lp-badge--${tone}`}>
                <Icon size={14} aria-hidden />
                {str(item.label)}
              </span>
              <p>{str(item.body)}</p>
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const TableBlock: R = ({ d, id }) => (
  <section className="lp-section" id={id}>
    <div className="lp-wrap lp-panel lp-panel--mist lp-split lp-split--wide">
      <span className="lp-deco lp-deco--steps-b" aria-hidden />
      <div className="lp-split__copy">
        <Head d={d} panel />
        {str(d.body) && (
          <p className="lp-body" data-reveal data-reveal-delay={120}>
            {str(d.body)}
          </p>
        )}
        <CmsButton link={link(d.button)} className="lp-btn lp-btn--outline" />
      </div>
      <div className="lp-table" data-reveal="scale">
        {(str(d.badge) || str(d.note)) && (
          <div className="lp-table__head">
            {str(d.badge) && (
              <span className="lp-badge lp-badge--blue">
                <Landmark size={14} aria-hidden />
                {str(d.badge)}
              </span>
            )}
            {str(d.note) && <span className="lp-table__checked">{str(d.note)}</span>}
          </div>
        )}
        <table>
          <thead>
            <tr>
              <th scope="col">{str(d.col1)}</th>
              <th scope="col">{str(d.col2)}</th>
              <th scope="col" className="is-num">
                {str(d.col3)}
              </th>
            </tr>
          </thead>
          <tbody>
            {items(d.rows).map((r, i) => (
              <tr key={i}>
                <td>{str(r.c1)}</td>
                <td>{str(r.c2)}</td>
                <td className="is-num">{str(r.c3)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  </section>
);

const PricingBlock: R = ({ d, id }) => (
  <section className="lp-section lp-section--tint" id={id}>
    <div className="lp-wrap">
      <header className="lp-head lp-head--center">
        {str(d.kicker) && (
          <p className="lp-kicker" data-reveal>
            {str(d.kicker)}
          </p>
        )}
        <h2 className="lp-h2" data-reveal data-reveal-delay={60}>
          <Accent text={str(d.title)} />
        </h2>
      </header>
      <div className="lp-plans">
        {items(d.plans).map((p, i) => {
          const featured = bool(p.featured);
          return (
            <div className={`lp-plan${featured ? ' lp-plan--featured' : ''}`} key={i} data-reveal data-reveal-delay={i * 80}>
              {featured && str(p.tag) ? (
                <div className="lp-plan__top">
                  <h4>{str(p.name)}</h4>
                  <span className="lp-plan__tag">{str(p.tag)}</span>
                </div>
              ) : (
                <h4>{str(p.name)}</h4>
              )}
              <p className="lp-plan__price">
                {str(p.price)} <small>{str(p.period)}</small>
              </p>
              {str(p.note) && <p className="lp-plan__note">{str(p.note)}</p>}
              <ul>
                {lines(p.features).map((f, j) => (
                  <li key={j}>
                    <Check size={16} aria-hidden /> {f}
                  </li>
                ))}
              </ul>
              <CmsButton link={link(p.cta)} className={`lp-btn lp-btn--block ${featured ? 'lp-btn--primary' : 'lp-btn--outline'}`} />
            </div>
          );
        })}
      </div>
    </div>
  </section>
);

const TeamBlock: R = ({ d, id }) => {
  const { editing } = useCmsEnv();
  return <TeamSection id={id} kicker={str(d.kicker)} title={str(d.title)} editing={editing} />;
};

const FaqBlock: R = ({ d, id }) => {
  const [open, setOpen] = useState(0);
  const panel = str(d.panel, 'orange');
  return (
    <section className={`lp-section${panel === 'ink' ? ' lp-section--ink' : ''}`} id={id}>
      <div className={`lp-wrap lp-panel lp-panel--${PANELS.has(panel) ? panel : 'orange'} lp-faq`}>
        <span className="lp-deco lp-deco--steps-c" aria-hidden />
        <header>
          <Head d={d} panel />
          {str(d.body) && (
            <p className="lp-body" data-reveal data-reveal-delay={120}>
              {str(d.body)}
            </p>
          )}
        </header>
        <div className="lp-faq__list">
          {items(d.items).map((item, index) => {
            const isOpen = open === index;
            return (
              <div className={`lp-faq__item ${isOpen ? 'is-open' : ''}`} key={index}>
                <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : index)}>
                  <CircleHelp size={18} aria-hidden />
                  <span>{str(item.q)}</span>
                  <span className="lp-faq__sign" aria-hidden />
                </button>
                <div className="lp-faq__answer" inert={!isOpen}>
                  <div>
                    <p>{str(item.a)}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

const CtaBlock: R = ({ d, id }) => {
  const ref = useRef<HTMLDivElement>(null);
  useScrollProgress(ref);
  return (
    <section className="lp-cta" id={id}>
      <div className="lp-wrap">
        <div className="lp-cta__card" ref={ref}>
          <div className="lp-cta__copy">
            <h2>{str(d.title)}</h2>
            {str(d.body) && <p>{str(d.body)}</p>}
            <div className="lp-hero__actions">
              <CmsButton link={link(d.primary)} className="lp-btn lp-btn--light" icon={arrow} />
              <CmsButton link={link(d.secondary)} className="lp-btn lp-btn--ghost-light" />
            </div>
          </div>
          <Img v={d.image} width={1280} height={960} />
        </div>
      </div>
    </section>
  );
};

const NewsBlock: R = () => <NewsSection />;

const RENDERERS: Record<string, R> = {
  banner: BannerBlock,
  text: TextBlock,
  split: SplitBlock,
  cards: CardsBlock,
  buttons: ButtonsBlock,
  spacer: SpacerBlock,
  image: ImageBlock,
  video: VideoBlock,
  hero: HeroBlock,
  stats: StatsBlock,
  showcase: ShowcaseBlock,
  service: ServiceBlock,
  sample: SampleBlock,
  features: FeaturesBlock,
  steps: StepsBlock,
  trust: TrustBlock,
  table: TableBlock,
  pricing: PricingBlock,
  team: TeamBlock,
  faq: FaqBlock,
  cta: CtaBlock,
  news: NewsBlock,
};

/** One broken block shows nothing (or a note in the editor) instead of
    taking the whole page down. */
class BlockBoundary extends React.Component<{ editing: boolean; children: React.ReactNode }, { failed: boolean }> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (this.state.failed) return this.props.editing ? <p className="cms-missing">This block couldn’t be shown. Check its fields.</p> : null;
    return this.props.children;
  }
}

/** One block, hidden or not (the editor shows switched-off blocks dimmed). */
export const BlockView: React.FC<{ block: CmsBlock }> = ({ block }) => {
  const { editing } = useCmsEnv();
  const Render = RENDERERS[block.type];
  if (!Render) return editing ? <p className="cms-missing">Unknown block “{block.type}”.</p> : null;
  // New fields added to a block type later fall back to its defaults.
  const data = { ...BLOCK_DEFS[block.type]?.defaults, ...block.data };
  const anchor = str(data.anchor).trim() || undefined;
  return (
    <BlockBoundary editing={editing}>
      <Render d={data} id={anchor} />
    </BlockBoundary>
  );
};

/** A page's visible blocks, with the site's scroll reveals. */
export const BlockList: React.FC<{ blocks: CmsBlock[] }> = ({ blocks }) => {
  useEffect(() => {
    const frame = requestAnimationFrame(() => initMotion());
    return () => cancelAnimationFrame(frame);
  }, [blocks]);
  return (
    <>
      {blocks
        .filter((b) => !b.hidden)
        .map((b) => (
          <BlockView key={b.id} block={b} />
        ))}
    </>
  );
};
