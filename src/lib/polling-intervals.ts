/**
 * Backoff escalonado por tiempo transcurrido, compartido por los pollers de
 * estado de ejecución/generación (useExecutionRun, other-version-execution-banner,
 * ai-suggestion-feedback). Antes cada uno poleaba a 2s fijo mientras la
 * corrida estuviera viva — en una generación de varios minutos eso son
 * cientos de requests por endpoint y por usuario con el asset abierto,
 * suficiente para saturar la API. La escalera mantiene el feedback rápido al
 * arrancar (cuando el usuario está mirando la pantalla) y se espacia a
 * medida que la corrida se alarga, que es justo cuando el polling denso ya
 * no aporta nada.
 *
 * Por tiempo transcurrido (no por número de intento, a diferencia de
 * use-message-polling.ts): más robusto frente a remounts y frente a que dos
 * queries distintas (status + sections_status) compartan la misma corrida
 * sin tener que sincronizar un contador entre ambas.
 */
const EXECUTION_POLL_STEPS = [
  { untilMs: 30_000, intervalMs: 3_000 },
  { untilMs: 120_000, intervalMs: 6_000 },
  { untilMs: 300_000, intervalMs: 12_000 },
] as const;

const EXECUTION_POLL_MAX_INTERVAL_MS = 20_000;

/** Intervalo de polling (ms) según cuánto lleva viva la corrida. */
export function getExecutionPollInterval(elapsedMs: number): number {
  for (const step of EXECUTION_POLL_STEPS) {
    if (elapsedMs < step.untilMs) return step.intervalMs;
  }
  return EXECUTION_POLL_MAX_INTERVAL_MS;
}
