import { useEffect, useState } from 'react';

/* KaTeX (maths typesetting) is only downloaded once something on screen has
   maths in it; every caller shares the one download. */

export type Katex = typeof import('katex').default;

let katex: Katex | null = null;
let loading: Promise<Katex> | null = null;

const load = () =>
  (loading ??= Promise.all([import('katex'), import('katex/dist/katex.min.css')]).then(([m]) => (katex = m.default)));

/** KaTeX once loaded (null until then, or when `needed` is false). */
export function useKatex(needed = true) {
  const [lib, setLib] = useState<Katex | null>(katex);
  useEffect(() => {
    if (!needed || lib) return;
    let live = true;
    void load()
      .then((k) => live && setLib(k))
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [needed, lib]);
  return lib;
}

/** Readable text while KaTeX loads (or if a formula can't be drawn). */
export const plainTex = (tex: string) =>
  tex
    .replace(/\\frac\{([^{}]+)\}\{([^{}]+)\}/g, '($1)/($2)')
    .replace(/\\(times|cdot)/g, '×')
    .replace(/\\div/g, '÷')
    .replace(/\\Omega/g, 'Ω')
    .replace(/\\(implies|Rightarrow)/g, '⇒')
    .replace(/\\(text|mathrm)\{([^{}]*)\}/g, '$2')
    .replace(/\\[,;: ]/g, ' ')
    .replace(/[{}]/g, '')
    .replace(/\\/g, '');
