import { useQuery } from '@tanstack/react-query'
import { useOrganization } from '@/contexts/organization-context'
import { countPendingSources } from '@/lib/source-utils'
import { contextsQueryOptions } from '../sources-queries'

/**
 * Cantidad de fuentes obligatorias sin contenido, para el badge del botón "Fuentes".
 * Comparte la query `['contexts', id]` con el panel: abrir el panel no duplica el request.
 */
export function useSourcesPendingCount(documentId: string | undefined, enabled = true): number {
  const { selectedOrganizationId } = useOrganization()

  const { data } = useQuery({
    ...contextsQueryOptions(documentId ?? '', selectedOrganizationId ?? ''),
    enabled: enabled && !!documentId && !!selectedOrganizationId,
    select: countPendingSources,
  })

  return data ?? 0
}
