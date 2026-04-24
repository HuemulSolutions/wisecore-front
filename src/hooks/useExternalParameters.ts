import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {
  getExternalParameters,
  getExternalParameter,
  createExternalParameter,
  updateExternalParameter,
  deleteExternalParameter,
  getExternalFunctionalityParameters,
  getExternalFunctionalityParameter,
  createExternalFunctionalityParameter,
  updateExternalFunctionalityParameter,
  deleteExternalFunctionalityParameter,
} from '@/services/external-parameters'
import type {
  ExternalParameterType,
  CreateExternalParameterRequest,
  UpdateExternalParameterRequest,
} from '@/types/external-parameters'

// ─── Query keys ───────────────────────────────────────────────────────────────

export const externalParameterQueryKeys = {
  all: ['external-parameters'] as const,
  listBase: () => [...externalParameterQueryKeys.all, 'list'] as const,
  detail: (organizationId: string, systemId: string, parameterId: string) =>
    [
      ...externalParameterQueryKeys.all,
      'detail',
      organizationId,
      systemId,
      parameterId,
    ] as const,
  list: (
    organizationId: string,
    systemId: string,
    page: number,
    pageSize: number,
    search?: string,
    paramType?: ExternalParameterType,
  ) =>
    [
      ...externalParameterQueryKeys.listBase(),
      organizationId,
      systemId,
      page,
      pageSize,
      search ?? '',
      paramType ?? '',
    ] as const,
  functionalityListBase: () =>
    [...externalParameterQueryKeys.all, 'functionality-list'] as const,
  functionalityDetail: (
    organizationId: string,
    systemId: string,
    functionalityId: string,
    parameterId: string,
  ) =>
    [
      ...externalParameterQueryKeys.all,
      'functionality-detail',
      organizationId,
      systemId,
      functionalityId,
      parameterId,
    ] as const,
  functionalityList: (
    organizationId: string,
    systemId: string,
    functionalityId: string,
    page: number,
    pageSize: number,
    search?: string,
    paramType?: ExternalParameterType,
  ) =>
    [
      ...externalParameterQueryKeys.functionalityListBase(),
      organizationId,
      systemId,
      functionalityId,
      page,
      pageSize,
      search ?? '',
      paramType ?? '',
    ] as const,
}

// ─── Options ──────────────────────────────────────────────────────────────────

export interface UseExternalParametersOptions {
  enabled?: boolean
  page?: number
  pageSize?: number
  search?: string
  paramType?: ExternalParameterType
}

// ─── List query ───────────────────────────────────────────────────────────────

export function useExternalParameters(
  organizationId: string,
  systemId: string,
  options: UseExternalParametersOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 50, search, paramType } = options

  return useQuery({
    queryKey: externalParameterQueryKeys.list(
      organizationId,
      systemId,
      page,
      pageSize,
      search,
      paramType,
    ),
    queryFn: () =>
      getExternalParameters(organizationId, systemId, {
        page,
        page_size: pageSize,
        search,
        param_type: paramType,
      }),
    enabled: enabled && !!organizationId && !!systemId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Detail query ─────────────────────────────────────────────────────────────

export function useExternalParameter(
  organizationId: string,
  systemId: string,
  parameterId: string,
) {
  return useQuery({
    queryKey: externalParameterQueryKeys.detail(organizationId, systemId, parameterId),
    queryFn: () => getExternalParameter(organizationId, systemId, parameterId),
    enabled: !!organizationId && !!systemId && !!parameterId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useExternalParameterMutations(organizationId: string, systemId: string) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: externalParameterQueryKeys.listBase() })

  const createMutation = useMutation({
    mutationFn: (body: CreateExternalParameterRequest) =>
      createExternalParameter(organizationId, systemId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      parameterId,
      body,
    }: {
      parameterId: string
      body: UpdateExternalParameterRequest
    }) => updateExternalParameter(organizationId, systemId, parameterId, body),
    onSuccess: (_data, { parameterId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: externalParameterQueryKeys.detail(organizationId, systemId, parameterId),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (parameterId: string) =>
      deleteExternalParameter(organizationId, systemId, parameterId),
    onSuccess: (_data, parameterId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: externalParameterQueryKeys.detail(organizationId, systemId, parameterId),
      })
    },
  })

  return {
    createExternalParameter: createMutation,
    updateExternalParameter: updateMutation,
    deleteExternalParameter: deleteMutation,
  }
}

// ─── Functionality-scoped list query ──────────────────────────────────────────

export function useExternalFunctionalityParameters(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  options: UseExternalParametersOptions = {},
) {
  const { enabled = true, page = 1, pageSize = 50, search, paramType } = options

  return useQuery({
    queryKey: externalParameterQueryKeys.functionalityList(
      organizationId,
      systemId,
      functionalityId,
      page,
      pageSize,
      search,
      paramType,
    ),
    queryFn: () =>
      getExternalFunctionalityParameters(organizationId, systemId, functionalityId, {
        page,
        page_size: pageSize,
        search,
        param_type: paramType,
      }),
    enabled: enabled && !!organizationId && !!systemId && !!functionalityId,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

// ─── Functionality-scoped detail query ────────────────────────────────────────

export function useExternalFunctionalityParameter(
  organizationId: string,
  systemId: string,
  functionalityId: string,
  parameterId: string,
) {
  return useQuery({
    queryKey: externalParameterQueryKeys.functionalityDetail(
      organizationId,
      systemId,
      functionalityId,
      parameterId,
    ),
    queryFn: () =>
      getExternalFunctionalityParameter(organizationId, systemId, functionalityId, parameterId),
    enabled: !!organizationId && !!systemId && !!functionalityId && !!parameterId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

// ─── Functionality-scoped mutations ───────────────────────────────────────────

export function useExternalFunctionalityParameterMutations(
  organizationId: string,
  systemId: string,
  functionalityId: string,
) {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({
      queryKey: externalParameterQueryKeys.functionalityListBase(),
    })

  const createMutation = useMutation({
    mutationFn: (body: CreateExternalParameterRequest) =>
      createExternalFunctionalityParameter(organizationId, systemId, functionalityId, body),
    onSuccess: invalidateList,
  })

  const updateMutation = useMutation({
    mutationFn: ({
      parameterId,
      body,
    }: {
      parameterId: string
      body: UpdateExternalParameterRequest
    }) =>
      updateExternalFunctionalityParameter(
        organizationId,
        systemId,
        functionalityId,
        parameterId,
        body,
      ),
    onSuccess: (_data, { parameterId }) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: externalParameterQueryKeys.functionalityDetail(
          organizationId,
          systemId,
          functionalityId,
          parameterId,
        ),
      })
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (parameterId: string) =>
      deleteExternalFunctionalityParameter(
        organizationId,
        systemId,
        functionalityId,
        parameterId,
      ),
    onSuccess: (_data, parameterId) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: externalParameterQueryKeys.functionalityDetail(
          organizationId,
          systemId,
          functionalityId,
          parameterId,
        ),
      })
    },
  })

  return {
    createExternalFunctionalityParameter: createMutation,
    updateExternalFunctionalityParameter: updateMutation,
    deleteExternalFunctionalityParameter: deleteMutation,
  }
}
