// ─── Enums ────────────────────────────────────────────────────────────────────

export type AttributeValueType = 'number' | 'percentage' | 'text' | 'date'

export type RelationshipDirection = 'source' | 'target' | 'both'

// ─── Attribute type option (GET /attribute-types) ─────────────────────────────

export interface AttributeTypeOption {
  value: AttributeValueType
  label: string
}

// ─── Relationship config (nested in main response) ────────────────────────────

export interface DocumentTypeRelationshipConfig {
  id: string
  name: string
  source_document_type_id: string
  target_document_type_id: string
  min_count: number
  max_count: number
}

// ─── Execution reference (nested in main response) ────────────────────────────

export interface RelationshipExecutionRef {
  id: string
  name: string
  document_id: string
  document_name: string
  document_type_id: string
}

// ─── Attribute with value (nested in main response) ───────────────────────────

export interface RelationshipAttributeValue {
  id: string
  document_type_relationship_attribute_id: string
  name: string
  value_type: AttributeValueType
  is_required: boolean
  display_order: number
  value: number | string | null
}

// ─── Main entity ──────────────────────────────────────────────────────────────

export interface DocumentTypeRelationship {
  id: string
  direction: RelationshipDirection
  document_type_relationship: DocumentTypeRelationshipConfig
  source_execution: RelationshipExecutionRef
  target_execution: RelationshipExecutionRef
  attributes: RelationshipAttributeValue[]
}

// ─── Response wrappers ────────────────────────────────────────────────────────

export interface DocumentTypeRelationshipsResponse {
  data: DocumentTypeRelationship[]
  transaction_id: string
  page: number
  page_size: number
  has_next: boolean
  total?: number
}

export interface DocumentTypeRelationshipResponse {
  data: DocumentTypeRelationship
  transaction_id: string
}

// ─── Attribute definition (sub-resource /attributes) ─────────────────────────

export interface RelationshipAttributeDefinition {
  id: string
  name: string
  value_type: AttributeValueType
  is_required: boolean
  default_value: string | null
  display_order: number
}

export interface RelationshipAttributeDefinitionsResponse {
  data: RelationshipAttributeDefinition[]
  transaction_id: string
}

export interface RelationshipAttributeDefinitionResponse {
  data: RelationshipAttributeDefinition
  transaction_id: string
}

// ─── Request types ────────────────────────────────────────────────────────────

export interface GetDocumentTypeRelationshipsParams {
  page?: number
  page_size?: number
  search?: string
  document_type_id?: string
}

export interface CreateDocumentTypeRelationshipRequest {
  name: string
  source_document_type_id: string
  target_document_type_id: string
  min_count: number
  max_count: number
}

export interface UpdateDocumentTypeRelationshipRequest {
  name?: string
  source_document_type_id?: string
  target_document_type_id?: string
  min_count?: number
  max_count?: number
}

export interface CreateRelationshipAttributeRequest {
  name: string
  value_type: AttributeValueType
  is_required?: boolean
  default_value?: string
  display_order?: number
}

export interface UpdateRelationshipAttributeRequest {
  name?: string
  value_type?: AttributeValueType
  is_required?: boolean
  default_value?: string
  display_order?: number
}
