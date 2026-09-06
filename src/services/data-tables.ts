import { backendUrl } from '@/config'
import { httpClient } from '@/lib/http-client'
import type {
  DataTableSourceDef,
  DataTableSourcesResponse,
  DataTableResolveRequest,
  DataTableResolveResult,
  DataTableResolveResponse,
} from '@/types/data-table-resolve'

const SOURCES_URL = `${backendUrl}/data-table/sources`

/** Catálogo de fuentes/columnas/filtros disponibles. Sin permiso especial. */
export async function getDataTableSources(organizationId: string): Promise<DataTableSourceDef[]> {
  const response = await httpClient.get(SOURCES_URL, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DataTableSourcesResponse
  return data.data.sources
}

/** Resuelve en batch N configuraciones de tabla contra un documento. Requiere `asset:r`. */
export async function resolveDataTables(
  documentId: string,
  organizationId: string,
  body: DataTableResolveRequest,
): Promise<DataTableResolveResult> {
  const response = await httpClient.post(`${backendUrl}/documents/${documentId}/data-tables/resolve`, body, {
    headers: { 'X-Org-Id': organizationId },
  })
  const data = (await response.json()) as DataTableResolveResponse
  return data.data
}

export type { DataTableSourceDef, DataTableResolveResult }
