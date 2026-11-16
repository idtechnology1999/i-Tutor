import React, { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, Quote, Star } from 'lucide-react';
import { getReviews } from '../../services/reviews';
import type { PublicReview } from '../../services/reviews';
import { StudentAvatar } from './StudentAvatar';

/* Home page: students' reviews (approved in Admin → Reviews) in a sliding
   carousel. It moves on its own every few seconds, stops while a visitor
   hovers, touches or tabs into it, and can be swiped or stepped with the
   arrows. Nothing shows until there is at least one approved review: the
   site never fills it with made-up testimonials. */

const AUTO_MS = 6000;

const Stars: React.FC<{ n: number }> = ({ n }) => (
  <span className="rv-card__stars" aria-label={`${n} out of 5 stars`}>
    {[1, 2, 3, 4, 5].map((i) => (
      <Star key={i} size={17} className={i <= n ? 'is-on' : ''} aria-hidden />
    ))}
  </span>
);

export const ReviewsCarousel: React.FC<{ header: React.ReactNode }> = ({ header }) => {
  const [reviews, setReviews] = useState<PublicReview[] | null>(null);
  const [at, setAt] = useState(0);
  const [paused, setPaused] = useState(false);
  const track = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let live = true;
    void getReviews().then((r) => live && setReviews(r));
    return () => {
      live = false;
    };
  }, []);

  const count = reviews?.length ?? 0;

  // Which card is in view, as the visitor swipes or scrolls.
  useEffect(() => {
    const el = track.current;
    if (!el || !count) return;
    const onScroll = () => {
      const card = el.firstElementChild as HTMLElement | null;
      if (!card) return;
      setAt(Math.round(el.scrollLeft / (card.offsetWidth + 20)));
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    return () => el.removeEventListener('scroll', onScroll);
  }, [count]);

  const go = (i: number) => {
    const el = track.current;
    const card = el?.children[((i % count) + count) % count] as HTMLElement | undefined;
    if (el && card) el.scrollTo({ left: card.offsetLeft - el.offsetLeft, behavior: 'smooth' });
  };

  // Moves on its own, unless paused or the visitor prefers less motion.
  useEffect(() => {
    if (count < 2 || paused || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const t = window.setInterval(() => go(at + 1), AUTO_MS);
    return () => window.clearInterval(t);
    // go reads the track directly; it only depends on `at` and `count`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [at, count, paused]);

  if (!count) return null;

  return (
    <section className="lp-section rv" aria-roledescription="carousel" aria-label="Student reviews">
      <div className="lp-wrap">
        {header}
        <div
          className="rv__frame"
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
        >
          <div className="rv__track" ref={track}>
            {reviews!.map((r, i) => (
              <article className="rv-card" key={r.id} aria-roledescription="slide" aria-label={`${i + 1} of ${count}`}>
                <Quote size={28} className="rv-card__mark" aria-hidden />
                <Stars n={r.rating} />
                <p className="rv-card__text">{r.text}</p>
                <footer className="rv-card__who">
                  <StudentAvatar photo={r.photo} gender={r.gender} name={r.name} size={46} />
                  <span>
                    <strong>{r.name}</strong>
                    <small>{r.course ? `Aiming for ${r.course}` : 'i-Tutor student'}</small>
                  </span>
                </footer>
              </article>
            ))}
          </div>
          {count > 1 && (
            <div className="rv__controls">
              <button type="button" className="rv__arrow" onClick={() => go(at - 1)} aria-label="Previous review">
                <ChevronLeft size={20} aria-hidden />
              </button>
              <div className="rv__dots" role="tablist" aria-label="Choose a review">
                {reviews!.map((r, i) => (
                  <button
                    key={r.id}
                    type="button"
                    role="tab"
                    aria-selected={i === at}
                    aria-label={`Review ${i + 1}`}
                    className={i === at ? 'is-on' : ''}
                    onClick={() => go(i)}
                  />
                ))}
              </div>
              <button type="button" className="rv__arrow" onClick={() => go(at + 1)} aria-label="Next review">
                <ChevronRight size={20} aria-hidden />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
