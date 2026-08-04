import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOrganizationDailyModelTelemetryList,
  getOrganizationDailyModelTelemetry,
  createOrganizationDailyModelTelemetry,
  updateOrganizationDailyModelTelemetry,
  deleteOrganizationDailyModelTelemetry,
  refreshOrganizationDailyModelTelemetry,
} from '@/services/organization-daily-model-telemetry'
import type {
  GetOrganizationDailyModelTelemetryListParams,
  CreateOrganizationDailyModelTelemetryRequest,
  UpdateOrganizationDailyModelTelemetryRequest,
  RefreshOrganizationDailyModelTelemetryRequest,
} from '@/types/organization-daily-model-telemetry'

export const organizationDailyModelTelemetryQueryKeys = {
  all: ['organization-daily-model-telemetry'] as const,
  listBase: () => [...organizationDailyModelTelemetryQueryKeys.all, 'list'] as const,
  list: (params: GetOrganizationDailyModelTelemetryListParams) =>
    [...organizationDailyModelTelemetryQueryKeys.listBase(), params] as const,
  detail: (telemetryId: string, organizationId: string) =>
    [...organizationDailyModelTelemetryQueryKeys.all, 'detail', organizationId, telemetryId] as const,
}

export interface UseOrganizationDailyModelTelemetryListOptions
  extends GetOrganizationDailyModelTelemetryListParams {
  enabled?: boolean
}

// Sin organization_id la query dispara un fan-out cross-org en el backend
// (recorre cada organización); puede tardar varios segundos. No agregar
// timeouts cortos ni asumir que la ausencia de datos es un error.
export function useOrganizationDailyModelTelemetryList(
  options: UseOrganizationDailyModelTelemetryListOptions = {},
) {
  const { enabled = true, ...params } = options

  return useQuery({
    queryKey: organizationDailyModelTelemetryQueryKeys.list(params),
    queryFn: () => getOrganizationDailyModelTelemetryList(params),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

export function useOrganizationDailyModelTelemetry(telemetryId: string, organizationId: string) {
  return useQuery({
    queryKey: organizationDailyModelTelemetryQueryKeys.detail(telemetryId, organizationId),
    queryFn: () => getOrganizationDailyModelTelemetry(telemetryId, organizationId),
    enabled: !!telemetryId && !!organizationId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

export function useOrganizationDailyModelTelemetryMutations() {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: organizationDailyModelTelemetryQueryKeys.listBase() })

  const createOrganizationDailyModelTelemetryMutation = useMutation({
    mutationFn: (payload: CreateOrganizationDailyModelTelemetryRequest) =>
      createOrganizationDailyModelTelemetry(payload),
    onSuccess: () => invalidateList(),
  })

  const updateOrganizationDailyModelTelemetryMutation = useMutation({
    mutationFn: ({
      telemetryId,
      organizationId,
      payload,
    }: {
      telemetryId: string
      organizationId: string
      payload: UpdateOrganizationDailyModelTelemetryRequest
    }) => updateOrganizationDailyModelTelemetry(telemetryId, organizationId, payload),
    onSuccess: (_data, variables) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: organizationDailyModelTelemetryQueryKeys.detail(
          variables.telemetryId,
          variables.organizationId,
        ),
      })
    },
  })

  const deleteOrganizationDailyModelTelemetryMutation = useMutation({
    mutationFn: ({
      telemetryId,
      organizationId,
    }: {
      telemetryId: string
      organizationId: string
    }) => deleteOrganizationDailyModelTelemetry(telemetryId, organizationId),
    onSuccess: (_data, variables) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: organizationDailyModelTelemetryQueryKeys.detail(
          variables.telemetryId,
          variables.organizationId,
        ),
      })
    },
  })

  const refreshOrganizationDailyModelTelemetryMutation = useMutation({
    mutationFn: ({
      payload = {},
      organizationId,
    }: {
      payload?: RefreshOrganizationDailyModelTelemetryRequest
      organizationId?: string
    }) => refreshOrganizationDailyModelTelemetry(payload, organizationId),
    onSuccess: () => invalidateList(),
  })

  return {
    createOrganizationDailyModelTelemetry: createOrganizationDailyModelTelemetryMutation,
    updateOrganizationDailyModelTelemetry: updateOrganizationDailyModelTelemetryMutation,
    deleteOrganizationDailyModelTelemetry: deleteOrganizationDailyModelTelemetryMutation,
    refreshOrganizationDailyModelTelemetry: refreshOrganizationDailyModelTelemetryMutation,
  }
}
