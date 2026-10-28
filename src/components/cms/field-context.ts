import { createContext } from 'react';
import type { PageSummary } from '../../services/pages';

/* What the block fields need from the editor: the site's pages (for links)
   and a way to show a message. */

export interface FieldEnv {
  pages: PageSummary[];
  notify: (text: string) => void;
}

export const FieldContext = createContext<FieldEnv>({ pages: [], notify: () => undefined });
