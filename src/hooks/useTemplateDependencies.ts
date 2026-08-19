import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import {
  getTemplateDependencies,
  createTemplateDependency,
  updateTemplateDependency,
  deleteTemplateDependency,
} from "@/services/template-dependencies"
import type { CreateTemplateDependencyRequest, UpdateTemplateDependencyRequest } from "@/types/templates"

export const templateDependenciesQueryKeys = {
  all: ['template-dependencies'] as const,
  listBase: () => [...templateDependenciesQueryKeys.all, 'list'] as const,
  list: (organizationId: string, templateId: string, page: number, pageSize: number) =>
    [...templateDependenciesQueryKeys.listBase(), organizationId, templateId, page, pageSize] as const,
}

export function useTemplateDependencies(
  organizationId: string,
  templateId: string,
  { enabled, page = 1, pageSize = 100 }: { enabled?: boolean; page?: number; pageSize?: number } = {},
) {
  return useQuery({
    queryKey: templateDependenciesQueryKeys.list(organizationId, templateId, page, pageSize),
    queryFn: () => getTemplateDependencies(templateId, organizationId, { page, page_size: pageSize }),
    enabled: enabled !== false && !!organizationId && !!templateId,
    // Obligatorio con paginación en la query key: sin esto, cada cambio de
    // página vuelve a isLoading=true y blanquea el panel (refresh-button-guide §4).
    placeholderData: (previousData: unknown) => previousData,
  })
}

// Mensajes ya traducidos desde el componente — ver useTemplateContext.ts.
export interface TemplateDependencyMutationMessages {
  added?: string
  versionUpdated?: string
  removed?: string
}

export function useTemplateDependencyMutations(
  organizationId: string,
  templateId: string,
  messages?: TemplateDependencyMutationMessages,
) {
  const queryClient = useQueryClient()
  // Se invalida listBase() (todas las páginas), no una key con page puntual,
  // para no dejar páginas viejas colgadas tras un alta/baja.
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: templateDependenciesQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateTemplateDependencyRequest) => createTemplateDependency(templateId, body, organizationId),
    meta: { successMessage: messages?.added },
    onSuccess: invalidate,
  })

  const updateMutation = useMutation({
    mutationFn: ({ dependencyId, body }: { dependencyId: string; body: UpdateTemplateDependencyRequest }) =>
      updateTemplateDependency(templateId, dependencyId, body, organizationId),
    meta: { successMessage: messages?.versionUpdated },
    onSuccess: invalidate,
  })

  const deleteMutation = useMutation({
    mutationFn: (dependencyId: string) => deleteTemplateDependency(templateId, dependencyId, organizationId),
    meta: { successMessage: messages?.removed },
    onSuccess: invalidate,
  })

  return {
    create: createMutation,
    update: updateMutation,
    delete: deleteMutation,
  }
}
