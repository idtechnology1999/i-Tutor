import React from 'react';

/* Wordmark: a solid teal tile carrying a lowercase "i" whose dot is the
   amber accent, followed by the name. Kept as inline SVG so it renders
   before any font loads. */
export const BrandMark: React.FC<{ compact?: boolean; invert?: boolean }> = ({
  compact = false,
  invert = false,
}) => (
  <span className={`brand ${invert ? 'brand--invert' : ''}`}>
    <svg width="32" height="32" viewBox="0 0 32 32" aria-hidden focusable="false">
      <rect width="32" height="32" rx="8" fill={invert ? '#FFFFFF' : '#0E3B3A'} />
      <rect x="13.5" y="13" width="5" height="12" rx="1.5" fill={invert ? '#0E3B3A' : '#FFFFFF'} />
      <circle cx="16" cy="8.5" r="2.75" fill="#E8A33D" />
    </svg>
    {!compact && (
      <span className="brand__name">
        i-Teacher
      </span>
    )}
  </span>
);
