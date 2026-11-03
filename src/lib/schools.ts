import { NIGERIAN_INSTITUTIONS } from '../data/institutions';

/* Post-UTME schools. Kept out of lib/cms so the long institutions list only
   downloads with the pages that need it, not with the homepage. */

/** Post-UTME papers belong to a school. Short name is the stored value. */
export const SCHOOLS = NIGERIAN_INSTITUTIONS.map((i) => ({ id: i.shortName, name: i.name }));
export const schoolName = (id?: string) => SCHOOLS.find((s) => s.id === id)?.name ?? id ?? '';
