import { parseApiDate } from "@/services/utils";
import type { HistoryEntryVM } from "@/types/assets";

// Agrupadores puros del feed narrow. Hablan `HistoryEntryVM`, por eso viven
// acá y no en `src/lib/` — ver ia context/detail-surface-guide.md.

export interface HistoryGroup<TRaw> {
  /** Único en React: `${value}#${runIndex}` — una etapa repetida (tras un rechazo) produce dos grupos. */
  key: string;
  value: string;
  entries: HistoryEntryVM<TRaw>[];
}

/**
 * Corta el grupo cada vez que `keyOf` cambia respecto de la fila ANTERIOR
 * (runs consecutivos, no clave global). Asume `entries` ya ordenado
 * cronológicamente por el caller.
 */
export function groupByConsecutive<TRaw>(
  entries: HistoryEntryVM<TRaw>[],
  keyOf: (entry: HistoryEntryVM<TRaw>) => string,
): HistoryGroup<TRaw>[] {
  const groups: HistoryGroup<TRaw>[] = [];
  let runIndex = -1;
  let lastValue: string | null = null;

  for (const entry of entries) {
    const value = keyOf(entry);
    if (value !== lastValue) {
      runIndex++;
      lastValue = value;
      groups.push({ key: `${value}#${runIndex}`, value, entries: [] });
    }
    groups[groups.length - 1].entries.push(entry);
  }

  return groups;
}

function localDayKey(iso: string): string {
  const d = parseApiDate(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

/** Agrupa por día calendario LOCAL. Runs consecutivos sobre una lista ya ordenada dan el mismo resultado que una clave global, y son más seguros si el orden se rompiera. */
export function groupByDay<TRaw>(entries: HistoryEntryVM<TRaw>[]): HistoryGroup<TRaw>[] {
  return groupByConsecutive(entries, (entry) => localDayKey(entry.createdAt));
}
