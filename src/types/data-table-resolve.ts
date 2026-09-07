/**
 * DTOs de `GET /data-table/sources` (catálogo) y `POST /documents/{document_id}/data-tables/resolve`
 * (resolución en batch) — contrato del nodo Plate `data_table` (ver `respuestas/spec-data-table-backend.md`).
 * El backend no tiene i18n: `label`/`message`/celdas vienen fijos en español.
 *
 * Nombre de archivo con sufijo `-resolve` a propósito: `src/types/data-table.ts` ya existe y es
 * un tipo completamente distinto (props genéricas de `components/ui/data-table.tsx`).
 */

// ─── Catálogo ───────────────────────────────────────────────────────────────

export type DataTableFilterKind = 'multi_enum' | 'date_range' | 'text' | 'boolean'

export interface DataTableFilterOption {
  value: string
  label: string
}

export interface DataTableFilterDef {
  id: string
  kind: DataTableFilterKind
  label: string
  hint?: string | null
  options?: DataTableFilterOption[]
}

export interface DataTableFieldDef {
  id: string
  label: string
  align?: 'left' | 'right'
}

export type DataTableSourceLayout = 'rows' | 'keyValue'

export interface DataTableSourceDef {
  id: string
  label: string
  layout: DataTableSourceLayout
  supports_limit: boolean
  default_columns: string[]
  fields: DataTableFieldDef[]
  filters?: DataTableFilterDef[]
}

export interface DataTableSourcesResponse {
  data: {
    catalog_version: string
    sources: DataTableSourceDef[]
  }
  transaction_id: string
}

// ─── Resolve ────────────────────────────────────────────────────────────────

export interface DataTableColumnSpec {
  id: string
  label?: string
}

export interface DataTableResolveTableRequest {
  node_id: string | null
  source: string
  scope: { kind: 'current' }
  columns: DataTableColumnSpec[]
  filters?: Record<string, string[]>
  limit?: number | null
  title?: string | null
}

export interface DataTableResolveRequest {
  execution_id?: string | null
  tables: DataTableResolveTableRequest[]
}

export type DataTableResolveStatus = 'ok' | 'unavailable_source' | 'forbidden' | 'error'

export interface DataTableResolvedTable {
  node_id: string | null
  status: DataTableResolveStatus
  headers: string[]
  aligns: ('left' | 'right')[]
  rows: string[][]
  total_rows: number
  truncated: boolean
  omitted_columns: string[]
  message: string | null
}

export interface DataTableResolveResult {
  resolved_at: string
  tables: DataTableResolvedTable[]
}

export interface DataTableResolveResponse {
  data: DataTableResolveResult
  transaction_id: string
}
