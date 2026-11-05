/** The years a past paper can be from: this year back to 1978 (JAMB's first UTME), newest first. */
export const FIRST_PAPER_YEAR = 1978;

export const PAPER_YEARS: number[] = Array.from(
  { length: new Date().getFullYear() - FIRST_PAPER_YEAR + 1 },
  (_, i) => new Date().getFullYear() - i,
);
