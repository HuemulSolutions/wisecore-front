import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getTemplateContexts,
  createTemplateContext,
  updateTemplateContext,
  deleteTemplateContext,
} from "@/services/template-context"
import type { CreateTemplateContextRequest, UpdateTemplateContextRequest } from "@/types/templates"

export const templateContextQueryKeys = {
  all: ['template-context'] as const,
  listBase: () => [...templateContextQueryKeys.all, 'list'] as const,
  list: (organizationId: string, templateId: string) =>
    [...templateContextQueryKeys.listBase(), organizationId, templateId] as const,
}

export function useTemplateContexts(organizationId: string, templateId: string, options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: templateContextQueryKeys.list(organizationId, templateId),
    queryFn: () => getTemplateContexts(templateId, organizationId),
    enabled: options?.enabled !== false && !!organizationId && !!templateId,
  })
}

// Los mensajes de éxito llegan ya traducidos desde el componente (el hook no
// tiene acceso a `t()`); se muestran vía meta.successMessage, que el
// MutationCache global convierte en toast (src/lib/query-client.ts).
export interface TemplateContextMutationMessages {
  created?: string
  updated?: string
  deleted?: string
}

export function useTemplateContextMutations(
  organizationId: string,
  templateId: string,
  messages?: TemplateContextMutationMessages,
) {
  const queryClient = useQueryClient()
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: templateContextQueryKeys.list(organizationId, templateId) })

  const createMutation = useMutation({
    mutationFn: (body: CreateTemplateContextRequest) => createTemplateContext(templateId, body, organizationId),
    meta: { successMessage: messages?.created },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ contextId, body }: { contextId: string; body: UpdateTemplateContextRequest }) =>
      updateTemplateContext(templateId, contextId, body, organizationId),
    meta: { successMessage: messages?.updated },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (contextId: string) => deleteTemplateContext(templateId, contextId, organizationId),
    meta: { successMessage: messages?.deleted },
    onSuccess: invalidate,
  })

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  }
}
