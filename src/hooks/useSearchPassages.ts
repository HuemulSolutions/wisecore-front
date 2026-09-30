import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { createSearchFeedback, getSearchLogFeedback, getSearchLogs, searchPassages } from "@/services/search"
import type { SearchFeedbackRequest, SearchPassagesParams } from "@/types/search"

export const searchPassagesQueryKeys = {
  all: ["search-passages"] as const,
  results: (params: SearchPassagesParams) => [...searchPassagesQueryKeys.all, "results", params] as const,
  logs: (organizationId: string, page: number, pageSize: number, onlyWithFeedback: boolean) =>
    [...searchPassagesQueryKeys.all, "logs", organizationId, page, pageSize, onlyWithFeedback] as const,
  logFeedback: (organizationId: string, searchLogId: string) =>
    [...searchPassagesQueryKeys.all, "log-feedback", organizationId, searchLogId] as const,
}

/** Pasajes de una búsqueda. `enabled` exige texto: el endpoint no busca solo por filtros. */
export function useSearchPassages(params: SearchPassagesParams | null, { enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: params ? searchPassagesQueryKeys.results(params) : [...searchPassagesQueryKeys.all, "idle"],
    queryFn: () => searchPassages(params!),
    enabled: enabled && !!params && !!params.organizationId && !!params.query.trim(),
    // El 503 de mayor precisión sin LLM de rerank es de configuración: reintentar no lo arregla.
    retry: 0,
    staleTime: 60 * 1000,
  })
}

export function useSearchFeedback(organizationId: string) {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: SearchFeedbackRequest) => createSearchFeedback(organizationId, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [...searchPassagesQueryKeys.all, "logs"] })
    },
  })
}

export function useSearchLogs(
  organizationId: string,
  { page, pageSize, onlyWithFeedback, enabled = true }: { page: number; pageSize: number; onlyWithFeedback: boolean; enabled?: boolean },
) {
  return useQuery({
    queryKey: searchPassagesQueryKeys.logs(organizationId, page, pageSize, onlyWithFeedback),
    queryFn: () => getSearchLogs(organizationId, { page, pageSize, onlyWithFeedback }),
    enabled: enabled && !!organizationId,
    retry: 0,
  })
}

export function useSearchLogFeedback(organizationId: string, searchLogId: string | null) {
  return useQuery({
    queryKey: searchPassagesQueryKeys.logFeedback(organizationId, searchLogId ?? ""),
    queryFn: () => getSearchLogFeedback(organizationId, searchLogId!),
    enabled: !!organizationId && !!searchLogId,
    retry: 0,
  })
}
