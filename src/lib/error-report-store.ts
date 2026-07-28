import type { ErrorReport } from '@/types/error-utils';

/**
 * Puente fuera de React para abrir el dialog global de detalles de error.
 *
 * `handleApiError` es una función de módulo (no un hook) y se importa desde
 * `query-client.ts`, que se evalúa antes de que React monte. Un context con
 * setter registrado por efecto tendría una ventana en la que el setter es
 * `null`, además de doble registro bajo StrictMode. Un store de módulo +
 * `useSyncExternalStore` evita ambos problemas y es trivial de testear sin
 * renderizar nada.
 *
 * Semántica: last-wins, sin cola. Solo se muta al hacer click en
 * "Ver detalles"; si el usuario abre un segundo reporte con el dialog ya
 * abierto, se reemplaza el contenido en vez de encolar.
 */

type StoreState = { current: ErrorReport | null; listeners: Set<() => void> };

const GLOBAL_KEY = '__wisecoreErrorReportStore';
const globalScope = globalThis as typeof globalThis & { [GLOBAL_KEY]?: StoreState };

// Anclado en globalThis a propósito: si este módulo se evalúa dos veces
// (HMR de Vite en dev, o doble resolución), dos copias del estado dejarían
// al dialog suscrito a un store distinto del que muta `open()`. Con una
// sola clave global las dos copias comparten el mismo estado.
const state: StoreState =
  globalScope[GLOBAL_KEY] ?? (globalScope[GLOBAL_KEY] = { current: null, listeners: new Set() });

export const errorReportStore = {
  subscribe(listener: () => void): () => void {
    state.listeners.add(listener);
    return () => {
      state.listeners.delete(listener);
    };
  },
  /** Debe devolver una referencia estable cuando nada cambió (React 19 lo exige). */
  getSnapshot(): ErrorReport | null {
    return state.current;
  },
  open(report: ErrorReport): void {
    state.current = report;
    state.listeners.forEach((l) => l());
  },
  close(): void {
    if (state.current === null) return;
    state.current = null;
    state.listeners.forEach((l) => l());
  },
};
