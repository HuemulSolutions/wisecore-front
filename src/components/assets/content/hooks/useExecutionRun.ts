/**
 * Estado agregado de UNA corrida de ejecución single/from, combinando
 * `GET /execution/{id}/status` (estado global) y
 * `GET /execution/{id}/sections_status` (estado por sección).
 *
 * Reemplaza useSectionsExecutionStatus.ts. Ese hook tenía DOS instancias
 * sincronizadas por Map a nivel de módulo: una "dueña" del polling en
 * AssetContent y otra "pasiva" en el banner de cada sección (uno por
 * sección en scope, ver "banners apilados" en el plan de rediseño). Ahora
 * hay un único banner de progreso por corrida (execution-run-progress-banner.tsx),
 * montado una sola vez, así que un solo dueño de ambos endpoints alcanza y
 * ya no hace falta compartir estado entre instancias.
 *
 * Identidad de corrida: el backend reutiliza el mismo `executionId` al
 * re-ejecutar una sección ya terminada — no hay forma de distinguir la
 * corrida anterior de la nueva salvo por el `runToken` que genera el
 * frontend en cada disparo (ver armExecutionTracking en assets-content.tsx).
 * Las queryKeys incluyen ese token: al cambiar, la query arranca en
 * `undefined` y no puede arrastrar el resultado de la corrida previa. Antes,
 * con la key fija por executionId, el caché de la corrida anterior (incluido
 * un 'done' ya reconciliado) sobrevivía a la re-ejecución y el banner
 * arrancaba en verde de inmediato.
 */

import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getExecutionStatus, getExecutionSectionsStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import {
  isExecutionFailureTerminal,
  isExecutionSuccessTerminal,
  isExecutionTerminal,
  isSectionTerminal,
} from '@/lib/execution-status';
import type {
  ExecutionSectionStatusItem,
  ExecutionSectionStatusValue,
  ExecutionSectionsStatusResponse,
} from '@/types/execution';

// Entre el POST /execution/generate y el momento en que el worker marca la
// primera sección como no-'done', ambos endpoints todavía pueden devolver el
// estado de la corrida anterior (mismo executionId). Durante esta ventana
// ("arming") se ignora ese estado viejo y se fuerza 'pending'/'running', para
// no mostrar "completado" antes de que la generación haya arrancado de
// verdad. Se sale apenas se ve actividad real, o a los ARM_WINDOW_MS como
// salida de emergencia (si el job nunca arranca, no queremos un banner
// colgado para siempre). Más corta que antes (30s) porque ahora protege un
// solo caso — la key por runToken ya elimina el resto del problema.
const ARM_WINDOW_MS = 15000;

// Ventana de gracia para reconciliar sections_status contra el status GLOBAL
// cuando este último llega antes (carrera del backend: /status ya dice
// 'completed' mientras /sections_status sigue en 'generating'). Pasada esta
// ventana sin que sections_status coincida, se fuerza 'done' en las
// secciones en scope para no dejar el banner/skeleton colgado para siempre.
const SETTLE_WINDOW_MS = 60000;

export type ExecutionRunPhase = 'idle' | 'arming' | 'running' | 'succeeded' | 'failed' | 'cancelled';

export interface ExecutionRunProgress {
  done: number;
  total: number;
}

export interface UseExecutionRunOptions {
  executionId?: string | null;
  executionMode?: 'single' | 'from' | 'full' | 'full-single';
  /** Índice 0-based de la sección desde la que arrancó la ejecución. */
  startSectionIndex?: number;
  /** Identifica ESTA corrida — cambia en cada disparo aunque executionId se repita. */
  runToken?: string | null;
  /** epoch ms del click que disparó esta corrida. Activa la ventana de arming. */
  startedAt?: number | null;
  enabled?: boolean;
}

export interface UseExecutionRunResult {
  phase: ExecutionRunPhase;
  progress: ExecutionRunProgress;
  currentSectionName: string | undefined;
  failureMessage: string | null | undefined;
  /** Sin filtrar por scope — lo consume el efecto `newlyDone` de AssetContent. */
  sections: ExecutionSectionStatusItem[] | undefined;
  getSectionStatus: (sectionIndex: number) => ExecutionSectionStatusValue | undefined;
  isSectionInScope: (sectionIndex: number) => boolean;
  refetch: () => void;
}

export function useExecutionRun({
  executionId,
  executionMode,
  startSectionIndex,
  runToken,
  startedAt,
  enabled = true,
}: UseExecutionRunOptions): UseExecutionRunResult {
  const { selectedOrganizationId } = useOrganization();
  const queryClient = useQueryClient();

  const isSectionInScope = useCallback((sectionIndex: number) => {
    if (!executionId) return false;
    if (executionMode === 'single') return sectionIndex === startSectionIndex;
    if (executionMode === 'from') return startSectionIndex !== undefined && sectionIndex >= startSectionIndex;
    return false;
  }, [executionId, executionMode, startSectionIndex]);

  const baseEnabled = enabled && !!executionId && !!selectedOrganizationId && !!runToken
    && (executionMode === 'single' || executionMode === 'from');

  // Actividad real confirmada para EL runToken actual. Estado de instancia
  // (no de módulo): ya no hay una segunda instancia con la que sincronizarse.
  const activityRef = useRef<{ runToken: string | null; seen: boolean }>({ runToken: null, seen: false });
  if (activityRef.current.runToken !== (runToken ?? null)) {
    activityRef.current = { runToken: runToken ?? null, seen: false };
  }

  // epoch ms en que overallStatus llegó a un terminal de éxito, para ESTE runToken.
  const settleRef = useRef<{ runToken: string | null; settledAt: number | null }>({ runToken: null, settledAt: null });
  if (settleRef.current.runToken !== (runToken ?? null)) {
    settleRef.current = { runToken: runToken ?? null, settledAt: null };
  }

  const isArming = !!runToken && !!startedAt
    && !activityRef.current.seen
    && (Date.now() - startedAt) < ARM_WINDOW_MS;

  const runStatusQuery = useQuery({
    queryKey: ['execution-run-status', executionId, runToken],
    queryFn: () => getExecutionStatus(executionId!, selectedOrganizationId!),
    enabled: baseEnabled,
    refetchInterval: (query) => {
      if (!baseEnabled) return false;
      // Ver comentario de ARM_WINDOW_MS: un terminal leído acá puede ser el
      // de la corrida anterior — no cortar el polling todavía.
      if (isArming) return 2000;
      if (isExecutionTerminal(query.state.data?.status)) return false;
      return 2000;
    },
    refetchOnWindowFocus: false,
    gcTime: 30000,
  });

  const overallStatus = runStatusQuery.data?.status;

  const sectionsEnabled = baseEnabled && startSectionIndex !== undefined;

  const sectionsQuery = useQuery({
    queryKey: ['execution-sections-status', executionId, runToken],
    queryFn: () => getExecutionSectionsStatus(executionId!, selectedOrganizationId!),
    enabled: sectionsEnabled,
    refetchInterval: (query) => {
      if (!sectionsEnabled) return false;
      if (isArming) return 2000;

      const sections = query.state.data?.sections;
      const relevant = sections?.filter((s) => isSectionInScope(s.order - 1)) ?? [];
      if (relevant.length > 0 && relevant.every((s) => isSectionTerminal(s.status))) return false;

      // El status global ya cerró en éxito pero sections_status todavía va un
      // paso atrás. Backoff hasta SETTLE_WINDOW_MS; el efecto de
      // reconciliación de abajo fuerza 'done' pasada esa ventana y este
      // mismo chequeo corta el polling en el siguiente tick.
      if (overallStatus && isExecutionSuccessTerminal(overallStatus)) {
        const settledAt = settleRef.current.settledAt;
        if (settledAt !== null) {
          const elapsed = Date.now() - settledAt;
          if (elapsed >= SETTLE_WINDOW_MS) return false;
          return elapsed < 10000 ? 2000 : 5000;
        }
      }
      return 2000;
    },
    refetchOnWindowFocus: false,
    gcTime: 30000,
  });

  // Registrar la primera confirmación de actividad real (alguna sección en
  // scope con status != 'done') para este runToken.
  useEffect(() => {
    if (!runToken || !startedAt) return;
    const sections = sectionsQuery.data?.sections;
    if (!sections?.length) return;
    const relevant = sections.filter((s) => isSectionInScope(s.order - 1));
    const hasRealActivity = relevant.some((s) => s.status !== 'done');
    if (hasRealActivity && activityRef.current.runToken === runToken) {
      activityRef.current.seen = true;
    }
  }, [runToken, startedAt, sectionsQuery.data, isSectionInScope]);

  // Registrar el instante en que el status GLOBAL llegó a un terminal de
  // éxito, y forzar un refetch inmediato de sections_status (en vez de
  // esperar el próximo tick de 2s) para que el caso feliz (ya coincide) se
  // resuelva casi al instante.
  useEffect(() => {
    if (!runToken || !executionId) return;
    if (!overallStatus || !isExecutionSuccessTerminal(overallStatus)) return;
    if (settleRef.current.runToken !== runToken || settleRef.current.settledAt !== null) return;
    settleRef.current.settledAt = Date.now();
    sectionsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runToken, executionId, overallStatus]);

  // Reconciliación: si al agotarse SETTLE_WINDOW_MS sections_status sigue sin
  // coincidir con el status global (ya en éxito), se fuerza 'done' en las
  // secciones en scope directamente en el caché de React Query.
  useEffect(() => {
    if (!runToken || !executionId) return;
    const settledAt = settleRef.current.settledAt;
    if (settledAt === null) return;

    const reconcile = () => {
      queryClient.setQueryData<ExecutionSectionsStatusResponse>(
        ['execution-sections-status', executionId, runToken],
        (prev) => {
          if (!prev?.sections?.length) return prev;
          let changed = false;
          const sections = prev.sections.map((s) => {
            if (isSectionInScope(s.order - 1) && !isSectionTerminal(s.status)) {
              changed = true;
              return { ...s, status: 'done' as ExecutionSectionStatusValue };
            }
            return s;
          });
          return changed ? { ...prev, sections } : prev;
        },
      );
    };

    const remaining = SETTLE_WINDOW_MS - (Date.now() - settledAt);
    if (remaining <= 0) {
      reconcile();
      return;
    }
    const timer = setTimeout(reconcile, remaining);
    return () => clearTimeout(timer);
  }, [runToken, executionId, overallStatus, queryClient, isSectionInScope]);

  // Igual que isArming, el default (settledAt aún no registrado) es el lado
  // seguro: no destapar el resultado final de golpe.
  const isSettling = !!executionId && !!overallStatus && isExecutionSuccessTerminal(overallStatus)
    && (settleRef.current.settledAt === null || (Date.now() - settleRef.current.settledAt) < SETTLE_WINDOW_MS);

  const getSectionStatus = useCallback((sectionIndex: number): ExecutionSectionStatusValue | undefined => {
    if (isArming && isSectionInScope(sectionIndex)) return 'pending';
    const sections = sectionsQuery.data?.sections;
    const match = sections?.find((s) => s.order === sectionIndex + 1);
    const ownStatus = match?.status;
    if (isSectionInScope(sectionIndex)) {
      if (isSectionTerminal(ownStatus)) return ownStatus;
      if (isExecutionFailureTerminal(overallStatus)) return 'failed';
      if (!isSettling && isExecutionSuccessTerminal(overallStatus)) return 'done';
    }
    return ownStatus;
  }, [isArming, isSectionInScope, sectionsQuery.data, overallStatus, isSettling]);

  const relevantSections = useMemo(
    () => sectionsQuery.data?.sections?.filter((s) => isSectionInScope(s.order - 1)) ?? [],
    [sectionsQuery.data, isSectionInScope],
  );

  const phase: ExecutionRunPhase = useMemo(() => {
    if (!executionId || !runToken || (executionMode !== 'single' && executionMode !== 'from')) return 'idle';
    if (isArming) return 'arming';

    const anySectionFailed = relevantSections.some((s) => s.status === 'failed');
    if (isExecutionFailureTerminal(overallStatus) || anySectionFailed) {
      return overallStatus === 'cancelled' ? 'cancelled' : 'failed';
    }

    const allSectionsDone = relevantSections.length > 0 && relevantSections.every((s) => s.status === 'done');
    if (isExecutionSuccessTerminal(overallStatus) && (allSectionsDone || !isSettling)) return 'succeeded';

    return 'running';
  }, [executionId, runToken, executionMode, isArming, relevantSections, overallStatus, isSettling]);

  const progress: ExecutionRunProgress = useMemo(() => {
    const total = relevantSections.length || (executionMode === 'single' ? 1 : 0);
    const done = phase === 'succeeded' ? total : relevantSections.filter((s) => s.status === 'done').length;
    return { done, total };
  }, [relevantSections, executionMode, phase]);

  const currentSectionName = useMemo(
    () => relevantSections.find((s) => s.status !== 'done' && s.status !== 'failed')?.name,
    [relevantSections],
  );

  const refetch = useCallback(() => {
    runStatusQuery.refetch();
    sectionsQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    phase,
    progress,
    currentSectionName,
    failureMessage: runStatusQuery.data?.status_message,
    sections: sectionsQuery.data?.sections,
    getSectionStatus,
    isSectionInScope,
    refetch,
  };
}
