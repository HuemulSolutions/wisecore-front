import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExternalFunctionalities,
  getExternalFunctionality,
  createExternalFunctionality,
  updateExternalFunctionality,
  deleteExternalFunctionality,
} from '@/services/external-functionalities'
import type {
  ExternalFunctionalityHttpMethod,
  ExternalFunctionalityExecutionType,
  ExternalFunctionalityClass,
  ExternalFunctionalityObjective,
  CreateExternalFunctionalityRequest,
  UpdateExternalFunctionalityRequest,
} from '@/types/external-functionalities'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const externalFunctionalityQueryKeys = {
  all: ['external-functionalities'] as const,
  listBase: () => [...externalFunctionalityQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, systemId: string, functionalityId: string) =>
    [
      ...externalFunctionalityQueryKeys.all,
      'detail',
      organizationId,
      systemId,
      functionalityId,
    ] as const,
  list: (
    organizationId: string,
    systemId: string,
    page: number,
    pageSize: number,
    search?: string,
    httpMethod?: ExternalFunctionalityHttpMethod,
    executionType?: ExternalFunctionalityExecutionType,
    functionalityClass?: ExternalFunctionalityClass,
    objective?: ExternalFunctionalityObjective,
  ) =>
    [
      ...externalFunctionalityQueryKeys.listBase(),
      organizationId,
      systemId,
      page,
      pageSize,
      search ?? '',
      httpMethod ?? '',
      executionType ?? '',
      functionalityClass ?? '',
      objective ?? '',
    ] as const,
}

// ─── List query ───────────────────────────────────────────────────────────────

export interface UseExternalFunctionalitiesOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  httpMethod?: ExternalFunctionalityHttpMethod
  executionType?: ExternalFunctionalityExecutionType
  functionalityClass?: ExternalFunctionalityClass
  objective?: ExternalFunctionalityObjective
}

export function useExternalFunctionalities(
  organizationId: string,
  systemId: string,
  options: UseExternalFunctionalitiesOptions = {},
) {
  const {
    enabled = true,
    page = 1,
    pageSize = 50,
    search,
    httpMethod,
    executionType,
    functionalityClass,
    objective,
  } = options

  return useQuery({
    queryKey: externalFunctionalityQueryKeys.list(
      organizationId,
      systemId,
      page,
      pageSize,
      search,
      httpMethod,
      executionType,
      functionalityClass,
      objective,
    ),
    queryFn: () =>
      getExternalFunctionalities(organizationId, systemId, {
        page,
        page_size: pageSize,
        search,
        http_method: httpMethod,
        execution_type: executionType,
        functionality_class: functionalityClass,
        objective,
      }),
    enabled: enabled && !!organizationId && !!systemId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useExternalFunctionality(
  organizationId: string,
  systemId: string,
  functionalityId: string,
) {
  return useQuery({
    queryKey: externalFunctionalityQueryKeys.detail(organizationId, systemId, functionalityId),
    queryFn: () => getExternalFunctionality(organizationId, systemId, functionalityId),
    enabled: !!organizationId && !!systemId && !!functionalityId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useExternalFunctionalityMutations(organizationId: string, systemId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: externalFunctionalityQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateExternalFunctionalityRequest) =>
      createExternalFunctionality(organizationId, systemId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      functionalityId,
      body,
    }: {
      functionalityId: string
      body: UpdateExternalFunctionalityRequest
    }) => updateExternalFunctionality(organizationId, systemId, functionalityId, body),
    onSuccess: (_data, { functionalityId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: externalFunctionalityQueryKeys.detail(organizationId, systemId, functionalityId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (functionalityId: string) =>
      deleteExternalFunctionality(organizationId, systemId, functionalityId),
    onSuccess: (_data, functionalityId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: externalFunctionalityQueryKeys.detail(organizationId, systemId, functionalityId),
      })
    },
  })

  return {
    createExternalFunctionality: createMutation,
    updateExternalFunctionality: updateMutation,
    deleteExternalFunctionality: deleteMutation,
  }
}
