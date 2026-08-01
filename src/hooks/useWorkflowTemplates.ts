import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { getAllTemplates, createTemplateExpress } from "@/services/templates"
import { workflowQueryKeys } from "@/hooks/useWorkflows"
import { DEFAULT_PAGE_SIZE } from "@/huemul/constants"
import type { CreateExpressBody, WorkflowTemplateItem } from "@/types/templates"

// ─── Query keys ───────────────────────────────────────────────────────────────

export const workflowTemplateQueryKeys = {
  all: ["workflow-templates"] as const,
  listBase: () => [...workflowTemplateQueryKeys.all, "list"] as const,
  list: (organizationId: string) => [...workflowTemplateQueryKeys.listBase(), organizationId] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export interface UseWorkflowTemplatesOptions {
  enabled?: boolean
}

export interface WorkflowTemplatesPage {
  items: WorkflowTemplateItem[]
}

// Templates disponibles para iniciar desde la pagina de Workflow: filtra por
// mostrar_en_workflow + can_create_express. Filtra tambien del lado del cliente
// los items sin document_type_id, ya que sin el no se puede llamar al express.
// Se trae una sola pagina grande y la paginacion visual (2 filas del grid) se
// resuelve en el cliente: es una lista curada y acotada, no la tabla principal.
export function useWorkflowTemplates(organizationId: string, options: UseWorkflowTemplatesOptions = {}) {
  const { enabled = true } = options

  return useQuery({
    queryKey: workflowTemplateQueryKeys.list(organizationId),
    queryFn: async (): Promise<WorkflowTemplatesPage> => {
      const res = await getAllTemplates(organizationId, undefined, 1, DEFAULT_PAGE_SIZE, {
        mostrar_en_workflow: true,
        can_create_express: true,
      })
      return {
        items: res.data.filter((item): item is WorkflowTemplateItem => !!item.document_type_id),
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
    },
  })
}
