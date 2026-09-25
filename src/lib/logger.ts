/**
 * Logger central de la app.
 *
 * `log` y `warn` solo imprimen si VITE_SHOW_IN_CONSOLE === 'true' (default: apagado).
 * `error` imprime siempre: los errores deben ser diagnosticables en produccion.
 */
const showInConsole = import.meta.env.VITE_SHOW_IN_CONSOLE === 'true';

/* eslint-disable no-console */
export const logger = {
  /** true si el logging de traza esta habilitado. Util para evitar armar payloads costosos. */
  enabled: showInConsole,

  log: (...args: unknown[]) => {
    if (showInConsole) console.log(...args);
  },

  warn: (...args: unknown[]) => {
    if (showInConsole) console.warn(...args);
  },

  /** Siempre visible. Pasa por el filtro de extensiones instalado en main.tsx. */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
};
/* eslint-enable no-console */
