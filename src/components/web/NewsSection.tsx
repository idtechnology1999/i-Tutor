import React, { useEffect, useRef, useState } from 'react';
import { ArrowRight, CalendarDays, Clock3, ExternalLink, Newspaper, X } from 'lucide-react';
import { NEWS } from '../../data/news';
import type { NewsCategory, NewsItem } from '../../data/news';

const FILTERS: Array<'All' | NewsCategory> = ['All', 'Admissions', 'Exam tips', 'i-Tutor update'];

const dateLabel = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

const toneFor = (category: NewsCategory) =>
  category === 'Admissions' ? 'blue' : category === 'Exam tips' ? 'green' : 'amber';

/* --------------------------------------------------------------- Reader */

const NewsReader: React.FC<{ item: NewsItem; onClose: () => void }> = ({ item, onClose }) => {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    panelRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      prev?.focus?.();
    };
  }, [onClose]);

  return (
    <div className="news-reader" onClick={onClose}>
      <article
        ref={panelRef}
        className="news-reader__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="news-reader-title"
        tabIndex={-1}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="news-reader__media">
          <img src={item.image} alt={item.imageAlt} width={1280} height={960} />
          <button type="button" className="news-reader__close" onClick={onClose} aria-label="Close article">
            <X size={20} aria-hidden />
          </button>
        </div>
        <div className="news-reader__body">
          <span className={`lp-badge lp-badge--${toneFor(item.category)}`}>{item.category}</span>
          <h2 id="news-reader-title">{item.title}</h2>
          <p className="news-meta">
            <span>
              <CalendarDays size={14} aria-hidden /> {dateLabel(item.date)}
            </span>
            <span>
              <Clock3 size={14} aria-hidden /> {item.readMinutes} min read
            </span>
          </p>
          {item.body.map((para) => (
            <p key={para.slice(0, 24)} className="news-reader__p">
              {para}
            </p>
          ))}
          {item.source && item.sourceUrl && (
            <a className="news-reader__source" href={item.sourceUrl} target="_blank" rel="noreferrer">
              Source: {item.source} <ExternalLink size={14} aria-hidden />
            </a>
          )}
        </div>
      </article>
    </div>
  );
};

/* -------------------------------------------------------------- Section */

export const NewsSection: React.FC = () => {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [open, setOpen] = useState<NewsItem | null>(null);

  const items = NEWS.filter((n) => filter === 'All' || n.category === filter);
  const [lead, ...rest] = items;

  return (
    <section className="lp-section news" id="news" aria-labelledby="news-title">
      <div className="lp-wrap">
        <header className="news__head">
          <div>
            <p className="lp-kicker" data-reveal>
              <Newspaper size={16} aria-hidden className="news__kicker-icon" /> Latest news
            </p>
            <h2 className="lp-h2" id="news-title" data-reveal data-reveal-delay={60}>
              What’s happening this exam season.
            </h2>
          </div>
          <div className="news__filters" role="tablist" aria-label="Filter news" data-reveal data-reveal-delay={120}>
            {FILTERS.map((f) => (
              <button
                key={f}
                type="button"
                role="tab"
                aria-selected={filter === f}
                className={filter === f ? 'is-on' : ''}
                onClick={() => setFilter(f)}
              >
                {f}
              </button>
            ))}
          </div>
        </header>

        {lead ? (
          <div className="news__grid" key={filter}>
            <button type="button" className="news-card news-card--lead" onClick={() => setOpen(lead)}>
              <span className="news-card__media">
                <img src={lead.image} alt={lead.imageAlt} width={1280} height={960} loading="lazy" decoding="async" />
              </span>
              <span className="news-card__text">
                <span className={`lp-badge lp-badge--${toneFor(lead.category)}`}>{lead.category}</span>
                <strong>{lead.title}</strong>
                <span className="news-card__summary">{lead.summary}</span>
                <span className="news-meta">
                  <span>{dateLabel(lead.date)}</span>
                  <span>{lead.readMinutes} min read</span>
                </span>
                <span className="news-card__more">
                  Read more <ArrowRight size={16} aria-hidden />
                </span>
              </span>
            </button>

            <div className="news__list">
              {rest.map((item, i) => (
                <button
                  key={item.id}
                  type="button"
                  className="news-card news-card--row"
                  style={{ ['--i' as string]: i }}
                  onClick={() => setOpen(item)}
                >
                  <span className="news-card__media">
                    <img src={item.image} alt={item.imageAlt} width={1280} height={960} loading="lazy" decoding="async" />
                  </span>
                  <span className="news-card__text">
                    <span className={`news-card__cat is-${toneFor(item.category)}`}>{item.category}</span>
                    <strong>{item.title}</strong>
                    <span className="news-meta">
                      <span>{dateLabel(item.date)}</span>
                      <span>{item.readMinutes} min read</span>
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="news__empty">No news in this category yet.</p>
        )}
      </div>

      {open && <NewsReader item={open} onClose={() => setOpen(null)} />}
    </section>
  );
};
