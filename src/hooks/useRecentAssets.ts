import { useCallback, useState } from 'react';
import type { RecentAssetEntry } from '@/types/home';

/** Cuántas entradas se guardan — no más de las que la card llega a mostrar (3). */
const MAX_ENTRIES = 3;

const storageKey = (organizationId: string | null | undefined, userId: string | null | undefined) =>
  `wisecore:recent-assets:${organizationId ?? 'none'}:${userId ?? 'none'}`;

function readStored(organizationId: string | null | undefined, userId: string | null | undefined): RecentAssetEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(storageKey(organizationId, userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (entry): entry is RecentAssetEntry =>
        !!entry && typeof entry === 'object' && typeof (entry as RecentAssetEntry).id === 'string' && typeof (entry as RecentAssetEntry).name === 'string',
    );
  } catch {
    return [];
  }
}

function writeStored(organizationId: string | null | undefined, userId: string | null | undefined, entries: RecentAssetEntry[]) {
  try {
    window.localStorage.setItem(storageKey(organizationId, userId), JSON.stringify(entries));
  } catch {
    // modo privado / cuota excedida — la sesión sigue, solo no persiste.
  }
}

/**
 * "Continuar donde quedaste" (rail derecho del Home) — no existía ningún
 * tracking de actividad reciente en el repo (confirmado por exploración), así
 * que esto es un hook nuevo, sin contraparte de servidor: es puramente una
 * conveniencia de UI de este navegador, mismo criterio que
 * `ia context/persistencia-estado-ui-guide.md` §0 (no sobrevive a cambiar de
 * navegador, no hace falta que sobreviva).
 *
 * `recordRecentAsset` se llama desde `assets-content.tsx` cuando el contenido
 * del documento resuelve con éxito (no desde `useAssetNavigation`, que en la
 * carga directa por URL solo tiene un nombre placeholder tipo
 * "Document 9a1c2e3d..." hasta que el contenido real llega).
 */
export function useRecentAssets(organizationId: string | null | undefined, userId: string | null | undefined) {
  const [entries, setEntries] = useState<RecentAssetEntry[]>(() => readStored(organizationId, userId));

  const recordRecentAsset = useCallback(
    (entry: Omit<RecentAssetEntry, 'viewedAt'>) => {
      setEntries((prev) => {
        const next = [
          { ...entry, viewedAt: new Date().toISOString() },
          ...prev.filter((e) => e.id !== entry.id),
        ].slice(0, MAX_ENTRIES);
        writeStored(organizationId, userId, next);
        return next;
      });
    },
    [organizationId, userId],
  );

  return { recentAssets: entries, recordRecentAsset };
}
