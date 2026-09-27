import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  getOrganizationDailyTelemetryList,
  getOrganizationDailyTelemetry,
  createOrganizationDailyTelemetry,
  updateOrganizationDailyTelemetry,
  deleteOrganizationDailyTelemetry,
  refreshOrganizationDailyTelemetry,
} from '@/services/organization-daily-telemetry'
import type {
  GetOrganizationDailyTelemetryListParams,
  CreateOrganizationDailyTelemetryRequest,
  UpdateOrganizationDailyTelemetryRequest,
  RefreshOrganizationDailyTelemetryRequest,
} from '@/types/organization-daily-telemetry'

export const organizationDailyTelemetryQueryKeys = {
  all: ['organization-daily-telemetry'] as const,
  listBase: () => [...organizationDailyTelemetryQueryKeys.all, 'list'] as const,
  list: (params: GetOrganizationDailyTelemetryListParams) =>
    [...organizationDailyTelemetryQueryKeys.listBase(), params] as const,
  detail: (telemetryId: string, organizationId: string) =>
    [...organizationDailyTelemetryQueryKeys.all, 'detail', organizationId, telemetryId] as const,
}

export interface UseOrganizationDailyTelemetryListOptions
  extends GetOrganizationDailyTelemetryListParams {
  enabled?: boolean
}

// Sin organization_id la query dispara un fan-out cross-org en el backend
// (recorre cada organización); puede tardar varios segundos. No agregar
// timeouts cortos ni asumir que la ausencia de datos es un error.
export function useOrganizationDailyTelemetryList(
  options: UseOrganizationDailyTelemetryListOptions = {},
) {
  const { enabled = true, ...params } = options

  return useQuery({
    queryKey: organizationDailyTelemetryQueryKeys.list(params),
    queryFn: () => getOrganizationDailyTelemetryList(params),
    enabled,
    staleTime: 2 * 60 * 1000,
    gcTime: 5 * 60 * 1000,
    placeholderData: (prev) => prev,
    retry: 0,
  })
}

export function useOrganizationDailyTelemetry(telemetryId: string, organizationId: string) {
  return useQuery({
    queryKey: organizationDailyTelemetryQueryKeys.detail(telemetryId, organizationId),
    queryFn: () => getOrganizationDailyTelemetry(telemetryId, organizationId),
    enabled: !!telemetryId && !!organizationId,
    staleTime: 2 * 60 * 1000,
    retry: 0,
  })
}

export function useOrganizationDailyTelemetryMutations() {
  const queryClient = useQueryClient()

  const invalidateList = () =>
    queryClient.invalidateQueries({ queryKey: organizationDailyTelemetryQueryKeys.listBase() })

  const createOrganizationDailyTelemetryMutation = useMutation({
    mutationFn: (payload: CreateOrganizationDailyTelemetryRequest) =>
      createOrganizationDailyTelemetry(payload),
    onSuccess: () => invalidateList(),
  })

  const updateOrganizationDailyTelemetryMutation = useMutation({
    mutationFn: ({
      telemetryId,
      organizationId,
      payload,
    }: {
      telemetryId: string
      organizationId: string
      payload: UpdateOrganizationDailyTelemetryRequest
    }) => updateOrganizationDailyTelemetry(telemetryId, organizationId, payload),
    onSuccess: (_data, variables) => {
      invalidateList()
      queryClient.invalidateQueries({
        queryKey: organizationDailyTelemetryQueryKeys.detail(
          variables.telemetryId,
          variables.organizationId,
        ),
      })
    },
  })

  const deleteOrganizationDailyTelemetryMutation = useMutation({
    mutationFn: ({
      telemetryId,
      organizationId,
    }: {
      telemetryId: string
      organizationId: string
    }) => deleteOrganizationDailyTelemetry(telemetryId, organizationId),
    onSuccess: (_data, variables) => {
      invalidateList()
      queryClient.removeQueries({
        queryKey: organizationDailyTelemetryQueryKeys.detail(
          variables.telemetryId,
          variables.organizationId,
        ),
      })
    },
  })

  const refreshOrganizationDailyTelemetryMutation = useMutation({
    mutationFn: ({
      payload = {},
      organizationId,
    }: {
      payload?: RefreshOrganizationDailyTelemetryRequest
      organizationId?: string
    }) => refreshOrganizationDailyTelemetry(payload, organizationId),
    onSuccess: () => invalidateList(),
  })

  return {
    createOrganizationDailyTelemetry: createOrganizationDailyTelemetryMutation,
    updateOrganizationDailyTelemetry: updateOrganizationDailyTelemetryMutation,
    deleteOrganizationDailyTelemetry: deleteOrganizationDailyTelemetryMutation,
    refreshOrganizationDailyTelemetry: refreshOrganizationDailyTelemetryMutation,
  }
}
