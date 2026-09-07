import { createContext } from 'react';

/**
 * Señal de "colapsar/expandir todas las secciones" emitida por el botón del
 * toolbar (ver assets-content.tsx). Cada sección mantiene su propio estado de
 * colapso local (assets-section.tsx) y sólo lo sincroniza contra esta señal
 * cuando `version` avanza — así un toggle individual no queda pisado por
 * renders del Provider que no correspondan a un click del botón global.
 */
export interface CollapseAllSignal {
  collapsed: boolean;
  version: number;
}

export const SectionCollapseContext = createContext<CollapseAllSignal | null>(null);
