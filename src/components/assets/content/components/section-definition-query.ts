import { queryOptions } from '@tanstack/react-query';
import { getDocumentSectionsConfig } from '@/services/assets';
import type { SectionsConfigResponse } from '@/types/assets';

/**
 * Query de la configuración de secciones del documento. Única definición (key + fn + staleTime),
 * compartida por el sheet de definición de sección y por el prefetch al acercar el cursor al botón.
 * Misma key que el sheet global de Secciones (assets-sections-sheet.tsx), así comparten caché.
 */
export function sectionsConfigQueryOptions(documentId: string, organizationId: string, executionId?: string) {
  return queryOptions<SectionsConfigResponse>({
    queryKey: ['document-sections-config', documentId, executionId ?? null],
    queryFn: () => getDocumentSectionsConfig(documentId, organizationId, executionId),
    staleTime: 30000,
  });
}
