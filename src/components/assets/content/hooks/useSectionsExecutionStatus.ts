/**
 * Estado por sección de una ejecución 'single'/'from', a partir de
 * GET /execution/{id}/sections_status.
 *
 * Un único componente (assets-content) es el "dueño" del polling (poll: true);
 * el resto de consumidores (SectionExecutionFeedback) se suscriben en modo
 * pasivo (poll: false) leyendo la misma queryKey de React Query, sin abrir un
 * timer propio por sección.
 */

import { useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getExecutionSectionsStatus } from '@/services/executions';
import { useOrganization } from '@/contexts/organization-context';
import { logger } from '@/lib/logger';
import type { ExecutionSectionStatusItem, ExecutionSectionStatusValue } from '@/types/execution';

const TERMINAL_STATUSES = ['completed', 'done', 'failed', 'cancelled', 'approved'];

export interface UseSectionsExecutionStatusOptions {
  executionId?: string | null;
  executionMode?: 'single' | 'from' | 'full' | 'full-single';
  /** Índice 0-based de la sección desde la que arrancó la ejecución. */
  startSectionIndex?: number;
  /** true solo en el componente dueño del polling; los subscriptores pasivos usan false. */
  poll?: boolean;
  enabled?: boolean;
  /** Estado global de la ejecución: corta el polling si la ejecución falló/se canceló. */
  overallStatus?: string;
}

export interface UseSectionsExecutionStatusResult {
  sections: ExecutionSectionStatusItem[] | undefined;
  getSectionStatus: (sectionIndex: number) => ExecutionSectionStatusValue | undefined;
  isSectionInScope: (sectionIndex: number) => boolean;
  refetch: () => void;
}

export function useSectionsExecutionStatus({
  executionId,
  executionMode,
  startSectionIndex,
  poll = false,
  enabled = true,
  overallStatus,
}: UseSectionsExecutionStatusOptions): UseSectionsExecutionStatusResult {
  const { selectedOrganizationId } = useOrganization();

  const isSectionInScope = useCallback((sectionIndex: number) => {
    if (!executionId) return false;
    if (executionMode === 'single') return sectionIndex === startSectionIndex;
    if (executionMode === 'from') return startSectionIndex !== undefined && sectionIndex >= startSectionIndex;
    return false;
  }, [executionId, executionMode, startSectionIndex]);

  const queryEnabled = enabled && !!executionId && !!selectedOrganizationId
    && (executionMode === 'single' || executionMode === 'from')
    && startSectionIndex !== undefined;

  const { data, refetch } = useQuery({
    queryKey: ['execution-sections-status', executionId],
    queryFn: () => getExecutionSectionsStatus(executionId!, selectedOrganizationId!),
    enabled: queryEnabled,
    refetchInterval: poll
      ? (query) => {
          if (overallStatus && TERMINAL_STATUSES.includes(overallStatus)) return false;
          const sections = query.state.data?.sections;
          if (!sections?.length) return 2000;
          const relevant = sections.filter((s) => isSectionInScope(s.order - 1));
          if (relevant.length > 0 && relevant.every((s) => s.status === 'done')) return false;
          return 2000;
        }
      : false,
    refetchOnWindowFocus: false,
  });

  const getSectionStatus = useCallback((sectionIndex: number): ExecutionSectionStatusValue | undefined => {
    const sections = data?.sections;
    if (!sections) return undefined;
    const match = sections.find((s) => s.order === sectionIndex + 1);
    if (!match) {
      logger.log('⚠️ useSectionsExecutionStatus: no section matched for order', sectionIndex + 1, 'available:', sections.map((s) => s.order));
      return undefined;
    }
    return match.status;
  }, [data]);

  return {
    sections: data?.sections,
    getSectionStatus,
    isSectionInScope,
    refetch,
  };
}
