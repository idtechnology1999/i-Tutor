import React from 'react';

/* The i-Tutor logo (Desktop\i-Teacher\i-tutor.jpeg) as inline SVG, so it is
   sharp at every size and shows before any font loads: a deep green tile, a
   white "i" whose dot is an amber light with a small flame, then the name.
   The same mark is in public/favicon.svg and the PNG icons. */
export const BrandMark: React.FC<{ compact?: boolean; invert?: boolean }> = ({
  compact = false,
  invert = false,
}) => (
  <span className={`brand ${invert ? 'brand--invert' : ''}`}>
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="7" fill={invert ? '#FFFFFF' : '#1C4338'} />
      <rect x="13.5" y="13" width="5" height="12" rx="1.3" fill={invert ? '#1C4338' : '#FFFFFF'} />
      <circle cx="16" cy="8.5" r="2.8" fill="#C8853F" />
      <ellipse cx="16" cy="8" rx="0.6" ry="1.1" fill="#FFE29A" />
    </svg>
    {!compact && (
      <span className="brand__name">
        i-Tutor
      </span>
    )}
  </span>
);
