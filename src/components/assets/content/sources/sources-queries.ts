import { getContext } from '@/services/context'
import { getDocumentDependencies } from '@/services/dependencies'
import type { ContextItem } from '@/types/context'
import type { Dependency } from '@/types/dependency/sheets'

// Mismas keys que `context-add.tsx` y `dependency-panel.tsx`: la caché se comparte con ellos
// (y con el badge de pendientes del header), y `['document-content', id]` se invalida igual.
export const contextsQueryKey = (documentId: string) => ['contexts', documentId] as const
export const dependenciesQueryKey = (documentId: string) => ['documentDependencies', documentId] as const

export const contextsQueryOptions = (documentId: string, organizationId: string) => ({
  queryKey: contextsQueryKey(documentId),
  queryFn: (): Promise<ContextItem[]> => getContext(documentId, organizationId),
})

export const dependenciesQueryOptions = (documentId: string, organizationId: string) => ({
  queryKey: dependenciesQueryKey(documentId),
  queryFn: (): Promise<Dependency[]> => getDocumentDependencies(documentId, organizationId),
})
