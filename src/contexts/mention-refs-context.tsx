import { createContext, useContext, useMemo } from 'react';

import { useLibraryAssetsByIds } from '@/hooks/useLibraryAssets';
import { getCurrentExecution } from '@/lib/library-executions';
import { getExecutionCompactLabel } from '@/components/assets/content/utils/version-utils';
import type { LibraryContentAsset, LibraryContentAssetExecution } from '@/types/folders';
import type { WisecoreMentionElement } from '@/types/mention';
import type { AssetReferenceElement } from '@/types/reference';

interface MentionRefsContextValue {
  byId: Record<string, LibraryContentAsset>;
  /** Ids que el batch efectivamente pidió — permite distinguir "no pedido todavía"
   * (referencia recién insertada, aún no barrida por assets-content.tsx) de
   * "pedido y no vino" (borrado o sin acceso). Solo lo primero cae al snapshot sin marcar nada. */
  requestedIds: Set<string>;
  /** false hasta que llega la primera respuesta — antes de eso los chips deben caer al snapshot. */
  isLoaded: boolean;
}

const MentionRefsContext = createContext<MentionRefsContextValue>({ byId: {}, requestedIds: new Set(), isLoaded: false });

/**
 * Resuelve, en una sola llamada por lote (`asset_ids` + `include_executions`),
 * los datos frescos de todos los assets referenciados por menciones dentro de
 * un documento — reemplaza el snapshot congelado que cada chip trae en el
 * propio nodo Plate. Mismo patrón que `MediaUrlProvider`.
 */
export function MentionRefsProvider({
  assetIds,
  organizationId,
  children,
}: {
  assetIds: string[];
  organizationId: string | undefined;
  children: React.ReactNode;
}) {
  const { data, isSuccess } = useLibraryAssetsByIds(organizationId ?? '', assetIds, {
    enabled: !!organizationId && assetIds.length > 0,
    includeExecutions: true,
  });

  const value = useMemo<MentionRefsContextValue>(() => {
    const byId: Record<string, LibraryContentAsset> = {};
    for (const asset of data ?? []) byId[asset.id] = asset;
    // Sin ids que resolver, se considera "cargado" de entrada (no hay nada que esperar).
    return { byId, requestedIds: new Set(assetIds), isLoaded: isSuccess || assetIds.length === 0 };
  }, [data, isSuccess, assetIds]);

  return <MentionRefsContext.Provider value={value}>{children}</MentionRefsContext.Provider>;
}

export interface ResolvedMention {
  /** Nombre a mostrar (fresco si ya se resolvió, snapshot si no). */
  name: string;
  color?: string | null;
  /** Sufijo "· v1.2.0" cuando la mención está fijada a una versión puntual. */
  versionLabel: string | null;
  /** Versión fijada (executionId) que ya no es la vigente del documento. */
  isStale: boolean;
  /** El asset no vino en la respuesta del lote: eliminado o sin acceso. */
  isMissing: boolean;
}

/** Resuelve una mención de asset contra los datos frescos del lote, con fallback al snapshot del nodo. */
export function useResolvedMention(element: WisecoreMentionElement): ResolvedMention {
  const { byId, requestedIds, isLoaded } = useContext(MentionRefsContext);

  return useMemo(() => {
    const snapshot: ResolvedMention = {
      name: element.value ?? '',
      color: element.color,
      versionLabel: null,
      isStale: false,
      isMissing: false,
    };

    if (element.refType === 'role' || !element.key) return snapshot;
    if (!isLoaded) return snapshot;

    const asset = byId[element.key];
    // No pedido todavía (referencia recién insertada, aún no barrida por el documento) — no
    // marcar como eliminado, solo mostrar el snapshot hasta que llegue el próximo lote.
    if (!asset) return requestedIds.has(element.key) ? { ...snapshot, isMissing: true } : snapshot;

    const current = getCurrentExecution(asset);
    const resolved: ResolvedMention = {
      name: asset.name,
      color: asset.document_type?.color ?? element.color,
      versionLabel: null,
      isStale: false,
      isMissing: false,
    };

    if (!element.executionId) return resolved;

    const pinned = asset.executions?.find(
      (execution: LibraryContentAssetExecution) => execution.id === element.executionId
    );
    if (!pinned) return resolved;

    return {
      ...resolved,
      versionLabel: getExecutionCompactLabel(pinned),
      isStale: !!current && current.id !== pinned.id,
    };
  }, [byId, requestedIds, isLoaded, element.key, element.refType, element.executionId, element.value, element.color]);
}

export interface ResolvedAssetReference {
  name: string;
  color?: string | null;
  documentTypeName?: string;
  /** `folder_path`/`folder_name` del asset, si el backend los envía — ver Riesgos en el plan. */
  folderLabel?: string | null;
  /** Label a mostrar en la chip: la vigente si `versionMode: 'latest'`, la fijada si `'pinned'`. */
  displayVersionLabel: string | null;
  /** Solo relevante con `versionMode: 'pinned'`: existe una versión más nueva que la fijada. */
  isStale: boolean;
  /** La versión más nueva del documento, cuando `isStale`. */
  latestVersionLabel: string | null;
  /** El asset no vino en la respuesta del lote: eliminado o sin acceso. */
  isMissing: boolean;
  /** Dato completo, para acciones de la ficha (abrir, cambiar versión, conteo de ejecuciones). */
  asset: LibraryContentAsset | null;
}

/**
 * Resuelve un `asset_reference` contra los datos frescos del lote. A diferencia de
 * `useResolvedMention`, la comparación de "desactualizado" es contra
 * `latest_execution_id` (la más nueva que exista), no contra la vigente/aprobada —
 * el aviso es "existe una versión más nueva", no "esta no es la aprobada".
 */
export function useResolvedAssetReference(element: AssetReferenceElement): ResolvedAssetReference {
  const { byId, requestedIds, isLoaded } = useContext(MentionRefsContext);

  return useMemo(() => {
    const snapshot: ResolvedAssetReference = {
      name: element.name ?? '',
      color: element.color,
      displayVersionLabel:
        element.versionMode === 'pinned'
          ? (element.pinnedVersionLabel ?? null)
          : (element.snapshotVersionLabel ?? null),
      isStale: false,
      latestVersionLabel: null,
      isMissing: false,
      asset: null,
    };

    if (!isLoaded) return snapshot;

    const asset = byId[element.assetId];
    // No pedido todavía (referencia recién insertada, aún no barrida por el documento) — no
    // marcar como eliminado, solo mostrar el snapshot hasta que llegue el próximo lote.
    if (!asset) return requestedIds.has(element.assetId) ? { ...snapshot, isMissing: true } : snapshot;

    const folderLabel = asset.folder_path ?? asset.folder_name ?? null;

    if (element.versionMode !== 'pinned') {
      const current = getCurrentExecution(asset);
      return {
        name: asset.name,
        color: asset.document_type?.color ?? element.color,
        documentTypeName: asset.document_type?.name,
        folderLabel,
        displayVersionLabel: current ? getExecutionCompactLabel(current) : null,
        isStale: false,
        latestVersionLabel: null,
        isMissing: false,
        asset,
      };
    }

    const pinned = asset.executions?.find((execution) => execution.id === element.executionItemId);
    const latest = asset.executions?.find((execution) => execution.id === asset.latest_execution_id) ?? null;
    const isStale = !!pinned && !!latest && latest.id !== pinned.id;

    return {
      name: asset.name,
      color: asset.document_type?.color ?? element.color,
      documentTypeName: asset.document_type?.name,
      folderLabel,
      displayVersionLabel: pinned ? getExecutionCompactLabel(pinned) : (element.pinnedVersionLabel ?? null),
      isStale,
      latestVersionLabel: isStale ? getExecutionCompactLabel(latest) : null,
      isMissing: false,
      asset,
    };
  }, [
    byId,
    requestedIds,
    isLoaded,
    element.assetId,
    element.versionMode,
    element.executionItemId,
    element.name,
    element.color,
    element.pinnedVersionLabel,
    element.snapshotVersionLabel,
  ]);
}
