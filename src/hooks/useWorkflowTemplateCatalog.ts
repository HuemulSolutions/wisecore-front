import { useInfiniteQuery } from "@tanstack/react-query"
import { getAllTemplates } from "@/services/templates"
import { workflowTemplateQueryKeys } from "@/hooks/useWorkflowTemplates"
import { DEFAULT_PAGE_SIZE } from "@/huemul/constants"
import type { WorkflowTemplateItem } from "@/types/templates"

interface UseWorkflowTemplateCatalogParams {
  /** Texto ya debounceado; viaja como `search` al backend. */
  search?: string
  enabled?: boolean
}

interface CatalogPage {
  items: WorkflowTemplateItem[]
  page: number
  hasNext: boolean
  total?: number
}

// Catálogo completo de templates iniciables para el diálogo «Ver todos»:
// mismos filtros que `useWorkflowTemplates`, pero acumulando páginas
// («Cargar más» agrega, no reemplaza). Búsqueda y paginación server-side.
export function useWorkflowTemplateCatalog(organizationId: string, params: UseWorkflowTemplateCatalogParams = {}) {
  const { search, enabled = true } = params
  const normalizedSearch = search?.trim() || undefined

  const query = useInfiniteQuery({
    queryKey: [...workflowTemplateQueryKeys.catalog(organizationId), { search: normalizedSearch ?? null }],
    initialPageParam: 1,
    queryFn: async ({ pageParam }): Promise<CatalogPage> => {
      const res = await getAllTemplates(organizationId, normalizedSearch, pageParam, DEFAULT_PAGE_SIZE, {
        mostrar_en_workflow: true,
        can_create_express: true,
      })
      return {
        items: res.data.filter((item): item is WorkflowTemplateItem => !!item.document_type_id),
        page: res.page ?? pageParam,
        hasNext: res.has_next ?? false,
        total: res.total,
      }
    },
    getNextPageParam: (last) => (last.hasNext ? last.page + 1 : undefined),
    enabled: enabled && !!organizationId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })

  const pages = query.data?.pages ?? []
  return {
    ...query,
    items: pages.flatMap((p) => p.items),
    total: pages.length > 0 ? pages[pages.length - 1].total : undefined,
  }
}
