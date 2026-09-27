import type { LibraryContentAsset, LibraryContentAssetExecution } from '@/types/folders';

/**
 * Helpers puros para interpretar los campos de include_executions en LibraryContentAsset.
 * Todos toleran assets traídos sin include_executions=true (campos ausentes).
 */

/** true si hay una versión más nueva que la vigente (aviso "hay una versión en curso"). */
export function hasPendingNewerExecution(asset: LibraryContentAsset): boolean {
    return (
        asset.latest_execution_id != null &&
        asset.current_execution_id != null &&
        asset.latest_execution_id !== asset.current_execution_id
    );
}

/** Ejecución de mayor versión (primera del historial) cuando hay una versión pendiente; si no, null. */
export function getPendingExecution(asset: LibraryContentAsset): LibraryContentAssetExecution | null {
    if (!hasPendingNewerExecution(asset)) return null;
    return asset.executions?.[0] ?? null;
}

/** Ejecución vigente del historial (la que coincide con current_execution_id). */
export function getCurrentExecution(asset: LibraryContentAsset): LibraryContentAssetExecution | null {
    if (!asset.current_execution_id || !asset.executions) return null;
    return asset.executions.find((execution) => execution.id === asset.current_execution_id) ?? null;
}

/** Cantidad de ejecuciones que quedan fuera de las `shown` mostradas, para el link "Ver N más". */
export function getRemainingExecutionCount(asset: LibraryContentAsset, shown: number): number {
    const total = asset.execution_count ?? asset.executions?.length ?? 0;
    return Math.max(0, total - shown);
}
