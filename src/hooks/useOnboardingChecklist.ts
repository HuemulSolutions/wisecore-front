import { useCallback, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDocumentTypes } from '@/services/document-types';
import { getUsers } from '@/services/users';
import { useAllExecutions } from '@/hooks/useAllExecutions';
import { useLlmConfigurationStatus } from '@/hooks/useLlmConfigurationStatus';
import type { OnboardingStepId, OnboardingStepState } from '@/types/home';

const dismissedStorageKey = (organizationId: string | null | undefined) =>
  `wisecore:onboarding-dismissed:${organizationId ?? 'none'}`;

function readDismissed(organizationId: string | null | undefined): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.localStorage.getItem(dismissedStorageKey(organizationId)) === '1';
  } catch {
    return false;
  }
}

/**
 * Gates por feature de RBAC del Home — no existe un endpoint de checklist,
 * cada paso reusa el permiso del recurso que verifica.
 */
export interface UseOnboardingChecklistOptions {
  organizationId: string | null | undefined;
  /** LLM predeterminado + proveedor de embeddings — un solo flag, vienen del mismo endpoint (`useLlmConfigurationStatus`). */
  canCheckAiConfig: boolean;
  canCheckAssetType: boolean;
  canCheckFirstAsset: boolean;
  canCheckInviteTeam: boolean;
}

export interface UseOnboardingChecklistResult {
  /** 5 pasos en orden fijo. */
  steps: OnboardingStepState[];
  isLoading: boolean;
  allDone: boolean;
  dismissed: boolean;
  dismiss: () => void;
  /** Reabre la card tras un dismiss — usado por el botón "Continuar" del banner de 1 línea. */
  resume: () => void;
  /**
   * Los 3 sheets de creación que resuelven los pasos (tipo de activo, primer
   * activo, invitar equipo) invalidan sus propias query keys
   * (`['document-types']`, `['executions',...]`, `['users','list']`), pero
   * ninguna toca las keys `['onboarding',...]` de este hook — sin este
   * refetch explícito el checklist se quedaría tildando pasos ya resueltos
   * recién en el próximo remount.
   */
  refetch: () => void;
}

/**
 * Checklist "Puesta en marcha" del Home (estado de primera vez). No existe
 * ningún endpoint de onboarding dedicado — se deriva de endpoints ya
 * existentes (LLM/embeddings vía `useLlmConfigurationStatus`, el resto con
 * `page_size` mínimo), sin necesitar datos nuevos de backend.
 *
 * Si al usuario le falta el permiso para verificar un paso, ese paso se
 * asume completado (fail-open) — no tiene sentido bloquear la card en un
 * estado que el usuario no puede resolver de todos modos, mismo criterio que
 * `AssetGenerationGate` en `src/types/assets/core.ts`.
 */
export function useOnboardingChecklist({
  organizationId,
  canCheckAiConfig,
  canCheckAssetType,
  canCheckFirstAsset,
  canCheckInviteTeam,
}: UseOnboardingChecklistOptions): UseOnboardingChecklistResult {
  // Mismo endpoint que ya consume el banner global `LlmConfigBanner`
  // (`app-layout.tsx`) — acá se reusa el hook tal cual, sin duplicar la
  // llamada. `is_configured && is_working` = paso hecho; "configurado pero
  // roto" no cuenta como resuelto.
  const aiConfigQuery = useLlmConfigurationStatus(organizationId, canCheckAiConfig);

  // Cada organización nueva viene con un tipo de activo "default" preseedeado
  // por el backend (`created_by: null`, confirmado contra la API real) — con
  // `page_size: 1` este paso daba `done` desde el primer segundo de vida de
  // la organización, sin que el usuario definiera nada. Se pide 2 en vez de
  // 1: el default siempre ocupa un lugar, así que "hecho" es "más de 1", no
  // sobre un heurístico frágil por nombre (`name === 'default'`).
  const assetTypeQuery = useQuery({
    queryKey: ['onboarding', 'has-asset-type', organizationId],
    queryFn: () => getDocumentTypes({ page_size: 2 }),
    enabled: canCheckAssetType && !!organizationId,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  // "Crea o sube TU primer activo" — personal, no de la organización (a
  // diferencia de los otros 2 pasos). Sin `owner_scope: 'me'` este paso se
  // marcaba `done` apenas CUALQUIER otra persona de la org creaba algo,
  // dejando el checklist de un usuario nuevo sin activarse nunca en una org
  // que ya tenía actividad de otros.
  const firstAssetQuery = useAllExecutions(organizationId ?? '', {
    enabled: canCheckFirstAsset && !!organizationId,
    pageSize: 1,
    owner_scope: 'me',
  });

  const inviteTeamQuery = useQuery({
    queryKey: ['onboarding', 'has-invited-team', organizationId],
    queryFn: () => getUsers(organizationId ?? undefined, 1, 2),
    enabled: canCheckInviteTeam && !!organizationId,
    staleTime: 5 * 60 * 1000,
    retry: 0,
  });

  const isLoading =
    (canCheckAiConfig && aiConfigQuery.isLoading) ||
    (canCheckAssetType && assetTypeQuery.isLoading) ||
    (canCheckFirstAsset && firstAssetQuery.isLoading) ||
    (canCheckInviteTeam && inviteTeamQuery.isLoading);

  const steps: OnboardingStepState[] = [
    {
      id: 'defaultLlm' as OnboardingStepId,
      done: !canCheckAiConfig || (!!aiConfigQuery.data?.default_llm.is_configured && !!aiConfigQuery.data?.default_llm.is_working),
    },
    {
      id: 'embeddingProvider' as OnboardingStepId,
      done: !canCheckAiConfig || (!!aiConfigQuery.data?.embedding.is_configured && !!aiConfigQuery.data?.embedding.is_working),
    },
    {
      id: 'assetType' as OnboardingStepId,
      // "Más de 1" — el default preseedeado ya ocupa 1 lugar, así que 1 solo
      // resultado significa "todavía no hay nada propio". `has_next` cubre
      // el caso borde de que la página de 2 venga completa pero haya más.
      done: !canCheckAssetType || (assetTypeQuery.data?.data.length ?? 0) > 1 || !!assetTypeQuery.data?.has_next,
    },
    {
      id: 'firstAsset' as OnboardingStepId,
      done: !canCheckFirstAsset || (firstAssetQuery.data?.data.length ?? 0) > 0,
    },
    {
      id: 'inviteTeam' as OnboardingStepId,
      // yo + al menos 1 invitado.
      done: !canCheckInviteTeam || (inviteTeamQuery.data?.data.length ?? 0) >= 2,
    },
  ];

  const allDone = steps.every((s) => s.done);

  const [dismissed, setDismissed] = useState(() => readDismissed(organizationId));

  // Si se completó, no dejar el flag de "descartado" pegado — la próxima vez
  // que el checklist vuelva a existir (ej. otra organización) debe arrancar
  // limpio, no heredar un dismiss de un estado ya resuelto.
  useEffect(() => {
    if (!allDone || !dismissed) return;
    try {
      window.localStorage.removeItem(dismissedStorageKey(organizationId));
    } catch {
      // sin storage disponible — no bloquea nada, el checklist ya no se renderiza.
    }
    setDismissed(false);
  }, [allDone, dismissed, organizationId]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    try {
      window.localStorage.setItem(dismissedStorageKey(organizationId), '1');
    } catch {
      // modo privado — el descarte solo dura la sesión en memoria.
    }
  }, [organizationId]);

  const resume = useCallback(() => {
    setDismissed(false);
    try {
      window.localStorage.removeItem(dismissedStorageKey(organizationId));
    } catch {
      // sin storage disponible — el estado en memoria ya se actualizó.
    }
  }, [organizationId]);

  const refetch = useCallback(() => {
    void aiConfigQuery.refetch();
    void assetTypeQuery.refetch();
    void firstAssetQuery.refetch();
    void inviteTeamQuery.refetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiConfigQuery.refetch, assetTypeQuery.refetch, firstAssetQuery.refetch, inviteTeamQuery.refetch]);

  return { steps, isLoading, allDone, dismissed, dismiss, resume, refetch };
}
