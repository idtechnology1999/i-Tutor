import React from 'react';
import { plainTex, useKatex } from '../../lib/katex';

/** A LaTeX formula as real maths; readable plain text until KaTeX arrives. */
export const Maths: React.FC<{ tex: string; display?: boolean; className?: string }> = ({ tex, display, className = '' }) => {
  const k = useKatex();
  if (!k) return <span className={`tr-tex-plain ${className}`}>{plainTex(tex)}</span>;
  // trust stays off, so formulas can't add links, styles or HTML.
  const html = k.renderToString(tex, { displayMode: display, throwOnError: false, strict: 'ignore', output: 'htmlAndMathml', maxExpand: 200 });
  return <span className={`${display ? 'tr-tex tr-tex--display' : 'tr-tex'} ${className}`} dangerouslySetInnerHTML={{ __html: html }} />;
};
