import { useQuery } from '@tanstack/react-query'
import {
  getOrganizationDailyModelTelemetry,
} from '@/services/organization-daily-model-telemetry'
import type {
  GetOrganizationDailyModelTelemetryListParams,
} from '@/types/organization-daily-model-telemetry'

export const organizationDailyModelTelemetryQueryKeys = {
  all: ['organization-daily-model-telemetry'] as const,
  listBase: () => [...organizationDailyModelTelemetryQueryKeys.all, 'list'] as const,
  // `organizationId` como segmento propio (no solo dentro de `params`, que
  // puede no traerlo) — evita cache sucio al cambiar de organización, mismo
  // bug ya corregido en /models y /roles.
  list: (organizationId: string, params: GetOrganizationDailyModelTelemetryListParams) =>
    [...organizationDailyModelTelemetryQueryKeys.listBase(), organizationId, params] as const,
  detail: (telemetryId: string, organizationId: string) =>
    [...organizationDailyModelTelemetryQueryKeys.all, 'detail', organizationId, telemetryId] as const,
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
