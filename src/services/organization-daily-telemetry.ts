import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  OrganizationDailyTelemetry,
  OrganizationDailyTelemetryResponse,
  OrganizationDailyTelemetryListResponse,
  GetOrganizationDailyTelemetryListParams,
  CreateOrganizationDailyTelemetryRequest,
  UpdateOrganizationDailyTelemetryRequest,
  RefreshOrganizationDailyTelemetryRequest,
  OrganizationDailyTelemetryRefreshResponse,
  OrganizationDailyTelemetryRefreshResult,
} from '@/types/organization-daily-telemetry'

const BASE_URL = `${backendUrl}/organization-daily-telemetry`

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
export async function getOrganizationDailyTelemetryList(
  params: GetOrganizationDailyTelemetryListParams = {},
): Promise<OrganizationDailyTelemetryListResponse> {
  const { page = 1, page_size = 100, ...filters } = params
  const query = buildParams({ page, page_size, ...filters })
  const response = await httpClient.get(`${BASE_URL}/?${query}`)
  return response.json() as Promise<OrganizationDailyTelemetryListResponse>
}

export async function getOrganizationDailyTelemetry(
  telemetryId: string,
  organizationId: string,
): Promise<OrganizationDailyTelemetry> {
  const query = buildParams({ organization_id: organizationId })
  const response = await httpClient.get(`${BASE_URL}/${telemetryId}?${query}`)
  const data = (await response.json()) as OrganizationDailyTelemetryResponse
  return data.data
}

export async function createOrganizationDailyTelemetry(
  payload: CreateOrganizationDailyTelemetryRequest,
): Promise<OrganizationDailyTelemetry> {
  const response = await httpClient.post(`${BASE_URL}/`, payload)
  const data = (await response.json()) as OrganizationDailyTelemetryResponse
  return data.data
}

export async function updateOrganizationDailyTelemetry(
  telemetryId: string,
  organizationId: string,
  payload: UpdateOrganizationDailyTelemetryRequest,
): Promise<OrganizationDailyTelemetry> {
  const query = buildParams({ organization_id: organizationId })
  const response = await httpClient.put(`${BASE_URL}/${telemetryId}?${query}`, payload)
  const data = (await response.json()) as OrganizationDailyTelemetryResponse
  return data.data
}

export async function deleteOrganizationDailyTelemetry(
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
export async function refreshOrganizationDailyTelemetry(
  payload: RefreshOrganizationDailyTelemetryRequest = {},
  organizationId?: string,
): Promise<OrganizationDailyTelemetryRefreshResult[]> {
  const url = organizationId ? `${BASE_URL}/refresh/${organizationId}` : `${BASE_URL}/refresh`
  const response = await httpClient.post(url, payload)
  const data = (await response.json()) as OrganizationDailyTelemetryRefreshResponse
  return data.data
}

export type {
  OrganizationDailyTelemetry,
  OrganizationDailyTelemetryListResponse,
  OrganizationDailyTelemetryResponse,
}
