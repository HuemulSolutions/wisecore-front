// ─── Enums ────────────────────────────────────────────────────────────────────

export type AttributeValueType = 'number' | 'percentage' | 'text' | 'date'

// ─── Attribute type option (GET /attribute-types) ─────────────────────────────

export interface AttributeTypeOption {
  value: AttributeValueType
  label: string
}

// ─── Main entity ──────────────────────────────────────────────────────────────

export interface DocumentTypeRelationship {
  id: string
  name: string
  source_document_type_id: string
  source_document_type_name: string
  target_document_type_id: string
  target_document_type_name: string
  min_count: number
  max_count: number
  attributes: RelationshipAttributeDefinition[]
  relationship_source: DocumentTypeRelationship[]
  relationship_target: DocumentTypeRelationship[]
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
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
  include_subrelationships?: boolean
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
