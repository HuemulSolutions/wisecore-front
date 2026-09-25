/**
 * Mapa de ids del catálogo `/data-table/sources` -> claves i18n locales, para los ids
 * conocidos hoy (`document_versions`, `document_metadata`, `related_documents` y sus campos).
 * El backend no tiene i18n (todo viene fijo en español) — estas claves son la única forma
 * de mostrar la UI en inglés. Un id que el backend agregue y no esté acá cae al `label` que
 * manda el propio backend (siempre en español) — nunca se rompe, solo no se traduce.
 */
import type { DataTableFilterOption } from '@/types/data-table-resolve'

export type DataTableTranslate = (key: string, options?: Record<string, unknown>) => string

const SOURCE_LABEL_KEYS: Record<string, string> = {
  document_versions: 'editor:dataTable.sources.documentVersions',
  document_metadata: 'editor:dataTable.sources.documentMetadata',
  related_documents: 'editor:dataTable.sources.relatedDocuments',
}

const FIELD_LABEL_KEYS: Record<string, string> = {
  version: 'editor:dataTable.fields.version',
  name: 'editor:dataTable.fields.name',
  lifecycle_state: 'editor:dataTable.fields.lifecycleState',
  created_at: 'editor:dataTable.fields.createdAt',
  updated_at: 'editor:dataTable.fields.updatedAt',
  created_by_user_name: 'editor:dataTable.fields.createdBy',
  updated_by_user_name: 'editor:dataTable.fields.updatedBy',
  created_by_user: 'editor:dataTable.fields.createdBy',
  updated_by_user: 'editor:dataTable.fields.updatedBy',
  change_summary: 'editor:dataTable.fields.changeSummary',
  review_date: 'editor:dataTable.fields.reviewDate',
  audit_date: 'editor:dataTable.fields.auditDate',
  expiration_date: 'editor:dataTable.fields.expirationDate',
  estimated_publication_date: 'editor:dataTable.fields.estimatedPublicationDate',
  document_name: 'editor:dataTable.fields.documentName',
  internal_code: 'editor:dataTable.fields.internalCode',
  description: 'editor:dataTable.fields.description',
  document_type: 'editor:dataTable.fields.documentType',
  template_name: 'editor:dataTable.fields.templateName',
  access_level: 'editor:dataTable.fields.accessLevel',
  execution_name: 'editor:dataTable.fields.executionName',
  current_version: 'editor:dataTable.fields.currentVersion',
  related_document_name: 'editor:dataTable.fields.relatedDocument',
  relationship_direction: 'editor:dataTable.fields.relationshipDirection',
  relationship_name: 'editor:dataTable.fields.relationshipName',
  related_document_type: 'editor:dataTable.fields.relatedDocumentType',
  related_document_version: 'editor:dataTable.fields.relatedDocumentVersion',
}

const FILTER_LABEL_KEYS: Record<string, string> = {
  lifecycle_states: 'editor:dataTable.sheet.lifecycleFilterLabel',
  relationship_directions: 'editor:dataTable.sheet.directionFilterLabel',
}

const FILTER_HINT_KEYS: Record<string, string> = {
  lifecycle_states: 'editor:dataTable.sheet.lifecycleFilterHint',
  relationship_directions: 'editor:dataTable.sheet.directionFilterHint',
}

export function labelForSource(t: DataTableTranslate, source: { id: string; label: string }): string {
  const key = SOURCE_LABEL_KEYS[source.id]
  return key ? t(key) : source.label
}

export function labelForField(t: DataTableTranslate, field: { id: string; label: string }): string {
  const key = FIELD_LABEL_KEYS[field.id]
  return key ? t(key) : field.label
}

/** Label a mandar en el request de /resolve para una columna sin rename del usuario.
 * `undefined` cuando el id no está mapeado — el backend usa su propio label (español). */
export function labelForColumnId(t: DataTableTranslate, columnId: string): string | undefined {
  const key = FIELD_LABEL_KEYS[columnId]
  return key ? t(key) : undefined
}

export function labelForFilter(t: DataTableTranslate, filter: { id: string; label: string }): string {
  const key = FILTER_LABEL_KEYS[filter.id]
  return key ? t(key) : filter.label
}

export function hintForFilter(t: DataTableTranslate, filter: { id: string; hint?: string | null }): string | undefined {
  const key = FILTER_HINT_KEYS[filter.id]
  if (key) return t(key)
  return filter.hint?.trim() || undefined
}

export function labelForFilterOption(
  t: DataTableTranslate,
  filterId: string,
  option: DataTableFilterOption,
): string {
  if (filterId === 'lifecycle_states') {
    return t(`assets:lifecycle.stateLabels.${option.value}`, { defaultValue: option.label })
  }
  if (filterId === 'relationship_directions') {
    if (option.value === 'outgoing') return t('editor:dataTable.values.directionOutgoing')
    if (option.value === 'incoming') return t('editor:dataTable.values.directionIncoming')
  }
  return option.label
}
