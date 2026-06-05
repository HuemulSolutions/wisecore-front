// ─── Enums ────────────────────────────────────────────────────────────────────

export type ExecutionRelationshipDirection = 'all' | 'source' | 'target'

// ─── Attribute value ──────────────────────────────────────────────────────────

export interface ExecutionRelationshipAttributeValue {
  document_type_relationship_attribute_id: string
  value: string
}

// ─── Main entity ──────────────────────────────────────────────────────────────

export interface ExecutionRelationship {
  id: string
  document_type_relationship_id: string
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
}

export interface ExecutionRelationshipSubitem {
  id: string
  direction: 'source' | 'target'
  document_type_relationship: ExecutionRelationshipInlineDocType
  source_execution: ExecutionRelationshipInlineExecution
  target_execution: ExecutionRelationshipInlineExecution
  attributes: ExecutionRelationshipAttributeValue[]
  relationship_source: ExecutionRelationshipSubitem[]
  relationship_target: ExecutionRelationshipSubitem[]
}

export interface ExecutionRelationshipWithDetails {
  id: string
  direction: 'source' | 'target'
  document_type_relationship: ExecutionRelationshipInlineDocType
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
  document_type_relationship_id: string
  source_execution_id: string
  target_execution_id: string
  attributes?: ExecutionRelationshipAttributeValue[]
}

export interface UpdateExecutionRelationshipRequest {
  attributes: ExecutionRelationshipAttributeValue[]
}
