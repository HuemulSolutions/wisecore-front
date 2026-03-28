import { createContext } from 'react';

/**
 * Context to provide the current section index to descendant components.
 * Used by heading elements to generate matching IDs for table of contents navigation.
 */
export const SectionIndexContext = createContext<number | undefined>(undefined);
