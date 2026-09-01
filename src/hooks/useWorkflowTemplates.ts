import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getAllTemplates, createTemplateExpress } from "@/services/templates"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { useNavKnowledgeRefresh } from "@/contexts/nav-knowledge-context"
import { DEFAULT_PAGE_SIZE } from "@/huemul/constants"
import type { CreateExpressBody, WorkflowTemplateItem } from "@/types/templates"

// ─── Query keys ───────────────────────────────────────────────────────────────

export const workflowTemplateQueryKeys = {
  all: ["workflow-templates"] as const,
  listBase: () => [...workflowTemplateQueryKeys.all, "list"] as const,
  list: (organizationId: string) => [...workflowTemplateQueryKeys.listBase(), organizationId] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export interface UseWorkflowTemplatesParams {
  /** Texto ya debounceado; viaja como `search` al backend. */
  search?: string
  page?: number
  pageSize?: number
  enabled?: boolean
}

export interface WorkflowTemplatesPage {
  items: WorkflowTemplateItem[]
  page: number
  pageSize: number
  hasNext: boolean
  /** El backend no siempre lo envia: sin el, la paginacion va por has_next. */
  total?: number
}

// Templates disponibles para iniciar desde la pagina de Workflow: filtra por
// mostrar_en_workflow + can_create_express. Busqueda y paginacion son
// server-side; lo unico que se descarta en cliente son los items sin
// document_type_id (sin el no se puede llamar al express), por lo que una
// pagina puede quedar con menos items que `pageSize`.
export function useWorkflowTemplates(organizationId: string, params: UseWorkflowTemplatesParams = {}) {
  const { search, page = 1, pageSize = DEFAULT_PAGE_SIZE, enabled = true } = params
  const normalizedSearch = search?.trim() || undefined
  // Piso de página: el launcher pinta riel y panel desde la misma respuesta, y
  // ningún call-site debería pedir menos que el mínimo del proyecto.
  const effectivePageSize = Math.max(pageSize, DEFAULT_PAGE_SIZE)

  return useQuery({
    queryKey: [
      ...workflowTemplateQueryKeys.list(organizationId),
      { search: normalizedSearch ?? null, page, pageSize: effectivePageSize },
    ],
    queryFn: async (): Promise<WorkflowTemplatesPage> => {
      const res = await getAllTemplates(organizationId, normalizedSearch, page, effectivePageSize, {
        mostrar_en_workflow: true,
        can_create_express: true,
      })
      return {
        items: res.data.filter((item): item is WorkflowTemplateItem => !!item.document_type_id),
        page: res.page ?? page,
        pageSize: res.page_size ?? effectivePageSize,
        hasNext: res.has_next ?? false,
        total: res.total,
      }
    },
    enabled: enabled && !!organizationId,
    placeholderData: (prev) => prev,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useCreateTemplateExpress(organizationId: string) {
  const queryClient = useQueryClient()
  const refreshFileTree = useNavKnowledgeRefresh()
  const { t } = useTranslation("workflow")

  return useMutation({
    mutationFn: ({
      documentTypeId,
      templateId,
      body,
    }: {
      documentTypeId: string
      templateId: string
      body: CreateExpressBody
    }) => createTemplateExpress(documentTypeId, templateId, body, organizationId),
    meta: { successMessage: t("expressSheet.success") },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: workflowQueryKeys.listBase() })
      // El backend crea el documento dentro de Workflows/<relación>, creando la
      // subcarpeta si no existía: la biblioteca cacheada queda desactualizada.
      queryClient.invalidateQueries({ queryKey: ["library"] })
      // Noop mientras el árbol no esté montado (/workflow no lo monta), pero
      // mantiene el patrón invalidate + refresh del resto de mutaciones de assets.
      refreshFileTree()
    },
  })
}
