import React, { useEffect, useState } from 'react';
import { Maximize2, X } from 'lucide-react';
import { mediaSrc } from '../../cms/read';

/* A question's diagram (Biology, Physics, Geography…), shown under the
   question and above the options. Tap to see it full screen, which matters
   on phones where labels are small. */

export const QuestionFigure: React.FC<{ image?: string; alt?: string }> = ({ image, alt }) => {
  const [zoom, setZoom] = useState(false);

  useEffect(() => {
    if (!zoom) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setZoom(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [zoom]);

  if (!image) return null;
  const src = mediaSrc(image);
  const label = alt || 'Diagram for this question';

  return (
    <figure className="q-figure">
      <button type="button" className="q-figure__open" onClick={() => setZoom(true)} aria-label={`${label}. Tap to enlarge`}>
        <img src={src} alt={label} loading="lazy" decoding="async" />
        <span className="q-figure__zoom" aria-hidden>
          <Maximize2 size={14} /> Tap to enlarge
        </span>
      </button>
      {zoom && (
        <div className="q-figure__full" role="dialog" aria-modal="true" aria-label={label} onClick={() => setZoom(false)}>
          <button type="button" className="q-figure__close" onClick={() => setZoom(false)} aria-label="Close">
            <X size={22} aria-hidden />
          </button>
          <img src={src} alt={label} onClick={(e) => e.stopPropagation()} />
        </div>
      )}
    </figure>
  );
};
