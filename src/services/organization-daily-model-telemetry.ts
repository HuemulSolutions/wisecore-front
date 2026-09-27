import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  OrganizationDailyModelTelemetry,
  OrganizationDailyModelTelemetryResponse,
  OrganizationDailyModelTelemetryListResponse,
  GetOrganizationDailyModelTelemetryListParams,
  CreateOrganizationDailyModelTelemetryRequest,
  UpdateOrganizationDailyModelTelemetryRequest,
  RefreshOrganizationDailyModelTelemetryRequest,
  OrganizationDailyModelTelemetryRefreshResponse,
  OrganizationDailyModelTelemetryRefreshResult,
} from '@/types/organization-daily-model-telemetry'

const BASE_URL = `${backendUrl}/organization-daily-model-telemetry`

function buildParams(filters: Record<string, string | number | undefined>): URLSearchParams {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value === undefined) continue
    if (typeof value === 'string' && !value.trim()) continue
    query.set(key, String(value))
  }
  return query
}

// Sin organization_id el backend recorre la base de cada organización (fan-out
// cross-org) para armar el listado combinado. Puede tardar varios segundos en
// instalaciones con muchas organizaciones; no asumir una respuesta rápida ni
// agregar un timeout corto para este caso.
export async function getOrganizationDailyModelTelemetryList(
  params: GetOrganizationDailyModelTelemetryListParams = {},
): Promise<OrganizationDailyModelTelemetryListResponse> {
  const { page = 1, page_size = 100, ...filters } = params
  const query = buildParams({ page, page_size, ...filters })
  const response = await httpClient.get(`${BASE_URL}/?${query}`)
  return response.json() as Promise<OrganizationDailyModelTelemetryListResponse>
}

export async function getOrganizationDailyModelTelemetry(
  telemetryId: string,
  organizationId: string,
): Promise<OrganizationDailyModelTelemetry> {
  const query = buildParams({ organization_id: organizationId })
  const response = await httpClient.get(`${BASE_URL}/${telemetryId}?${query}`)
  const data = (await response.json()) as OrganizationDailyModelTelemetryResponse
  return data.data
}

export async function createOrganizationDailyModelTelemetry(
  payload: CreateOrganizationDailyModelTelemetryRequest,
): Promise<OrganizationDailyModelTelemetry> {
  const response = await httpClient.post(`${BASE_URL}/`, payload)
  const data = (await response.json()) as OrganizationDailyModelTelemetryResponse
  return data.data
}

export async function updateOrganizationDailyModelTelemetry(
  telemetryId: string,
  organizationId: string,
  payload: UpdateOrganizationDailyModelTelemetryRequest,
): Promise<OrganizationDailyModelTelemetry> {
  const query = buildParams({ organization_id: organizationId })
  const response = await httpClient.put(`${BASE_URL}/${telemetryId}?${query}`, payload)
  const data = (await response.json()) as OrganizationDailyModelTelemetryResponse
  return data.data
}

export async function deleteOrganizationDailyModelTelemetry(
  telemetryId: string,
  organizationId: string,
): Promise<void> {
  const query = buildParams({ organization_id: organizationId })
  await httpClient.delete(`${BASE_URL}/${telemetryId}?${query}`)
}

// target_date por defecto es el día de negocio actual; include_previous_day
// (default true en backend) recalcula también el día anterior. Esto ya corre
// solo todos los días a las 5:00 am — el uso normal de frontend no necesita
// invocar este endpoint.
export async function refreshOrganizationDailyModelTelemetry(
  payload: RefreshOrganizationDailyModelTelemetryRequest = {},
  organizationId?: string,
): Promise<OrganizationDailyModelTelemetryRefreshResult[]> {
  const url = organizationId ? `${BASE_URL}/refresh/${organizationId}` : `${BASE_URL}/refresh`
  const response = await httpClient.post(url, payload)
  const data = (await response.json()) as OrganizationDailyModelTelemetryRefreshResponse
  return data.data
}

export type {
  OrganizationDailyModelTelemetry,
  OrganizationDailyModelTelemetryListResponse,
  OrganizationDailyModelTelemetryResponse,
}
