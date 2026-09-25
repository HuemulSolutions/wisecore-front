// ─── Enums ────────────────────────────────────────────────────────────────────

export type ExecutionRelationshipDirection = 'all' | 'source' | 'target'

/** "default" = basada en un document_type_relationship; "manual" = relación libre por nombre. */
export type ExecutionRelationshipType = 'default' | 'manual'

// ─── Attribute value ──────────────────────────────────────────────────────────

/**
 * Forma de respuesta de un atributo. Para relaciones "default" viene
 * `document_type_relationship_attribute_id`; para "manual" viene `name` y el id es null.
 */
export interface ExecutionRelationshipAttributeValue {
  document_type_relationship_attribute_id: string | null
  name?: string | null
  value: string
  value_type?: string | null
  is_required?: boolean
  display_order?: number
}

/** Atributo enviado en los requests: por id (default) o por nombre (manual). */
export type ExecutionRelationshipAttributeInput =
  | { document_type_relationship_attribute_id: string; value: string }
  | { name: string; value: string }

// ─── Main entity ──────────────────────────────────────────────────────────────

export interface ExecutionRelationship {
  id: string
  document_type_relationship_id: string | null
  relationship_type: ExecutionRelationshipType
  execution_relationship_name: string | null
  source_execution_id: string
  target_execution_id: string
  attributes: ExecutionRelationshipAttributeValue[]
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

// ─── Expanded entity (returned by /execution/{id}/relationships) ──────────────

export interface ExecutionRelationshipInlineDocType {
  id: string
  name: string
  source_document_type_id: string
  target_document_type_id: string
  min_count: number
  max_count: number
}

export interface ExecutionRelationshipInlineExecution {
  id: string
  name: string
  document_id: string
  document_name: string
  document_type_id: string
  document_type_color?: string
}

export interface ExecutionRelationshipSubitem {
  id: string
  direction: 'source' | 'target'
  relationship_type: ExecutionRelationshipType
  execution_relationship_name: string | null
  document_type_relationship: ExecutionRelationshipInlineDocType | null
  source_execution: ExecutionRelationshipInlineExecution
  target_execution: ExecutionRelationshipInlineExecution
  attributes: ExecutionRelationshipAttributeValue[]
  relationship_source: ExecutionRelationshipSubitem[]
  relationship_target: ExecutionRelationshipSubitem[]
}

export interface ExecutionRelationshipWithDetails {
  id: string
  direction: 'source' | 'target'
  relationship_type: ExecutionRelationshipType
  execution_relationship_name: string | null
  document_type_relationship: ExecutionRelationshipInlineDocType | null
  source_execution: ExecutionRelationshipInlineExecution
  target_execution: ExecutionRelationshipInlineExecution
  attributes: ExecutionRelationshipAttributeValue[]
  relationship_source: ExecutionRelationshipSubitem[]
  relationship_target: ExecutionRelationshipSubitem[]
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface ExecutionRelationshipsResponse {
  data: ExecutionRelationship[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
}

export interface ExecutionRelationshipsByExecutionResponse {
  data: ExecutionRelationshipWithDetails[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
}

export interface ExecutionRelationshipResponse {
  data: ExecutionRelationship
  transaction_id: string
}

// ─── Query params ─────────────────────────────────────────────────────────────

export interface GetExecutionRelationshipsParams {
  direction?: ExecutionRelationshipDirection
  page?: number
  page_size?: number
  include_subrelationships?: boolean
}

// ─── Request bodies ───────────────────────────────────────────────────────────

export interface CreateExecutionRelationshipRequest {
  /** Requerido para tipo "default"; null/omitido para "manual". */
  document_type_relationship_id?: string | null
  /** Requerido para tipo "manual"; null/omitido para "default". */
  execution_relationship_name?: string | null
  source_execution_id: string
  target_execution_id: string
  attributes?: ExecutionRelationshipAttributeInput[]
}

export interface UpdateExecutionRelationshipRequest {
  attributes: ExecutionRelationshipAttributeInput[]
}
