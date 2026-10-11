import React from 'react';
import { ArrowRight, CalendarDays, Check } from 'lucide-react';

/* One homepage section per exam service (Post-UTME, WAEC, NECO…): a shape
   panel with the heading on a carved white block, the pitch and points, and a
   visual made of cards and shapes. `flip` mirrors it, carving the heading into
   the top-right, so neighbouring sections don't look the same. */

interface Props {
  id: string;
  kicker: string;
  title: React.ReactNode;
  lead: string;
  points: string[];
  /** When the exam runs, shown with a calendar icon. */
  when?: string;
  panel: 'orange' | 'orange-solid' | 'ink' | 'mist';
  deco: 'steps-a' | 'steps-b' | 'steps-c';
  flip?: boolean;
  cta: string;
  onCta: () => void;
  /** The visual beside the text. */
  children: React.ReactNode;
}

export const ServiceSection: React.FC<Props> = ({ id, kicker, title, lead, points, when, panel, deco, flip, cta, onCta, children }) => (
  <section className="lp-section lp-service" id={id}>
    <div className={`lp-wrap lp-panel lp-panel--${panel} lp-service__panel${flip ? ' is-flip' : ''}`}>
      <span className={`lp-deco lp-deco--${deco}`} aria-hidden />
      <div className="lp-service__copy">
        <div className={`lp-carve-head${flip ? ' lp-carve-head--right' : ''}`}>
          <p className="lp-kicker">{kicker}</p>
          <h2 className="lp-h2">{title}</h2>
        </div>
        <p className="lp-service__lead">{lead}</p>
        {when && (
          <p className="lp-service__when">
            <CalendarDays size={16} aria-hidden /> {when}
          </p>
        )}
        <ul className="lp-service__points">
          {points.map((p) => (
            <li key={p}>
              <Check size={16} aria-hidden /> {p}
            </li>
          ))}
        </ul>
        <button type="button" className="lp-btn lp-btn--primary lp-service__cta" onClick={onCta}>
          {cta}
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      <div className="lp-service__visual">{children}</div>
    </div>
  </section>
);
