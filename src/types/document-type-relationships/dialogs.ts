import type { AttributeValueType, DocumentTypeRelationship } from './core'
import type { DocumentType } from '@/types/document-types'

// ─── Form data ────────────────────────────────────────────────────────────────

export interface RelationshipFormData {
  name: string
  min_count: number
  max_count: number
}

export interface AttributeFormData {
  name: string
  value_type: AttributeValueType
  is_required: boolean
  default_value: string
  display_order: number
}

// ─── Dialog props ─────────────────────────────────────────────────────────────

export interface RelationshipCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  sourceDocumentTypeId: string
  targetDocumentTypeId: string
  sourceDocumentType?: DocumentType
  targetDocumentType?: DocumentType
  onCreated?: (relationship: DocumentTypeRelationship) => void
}

export interface RelationshipEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  relationship: DocumentTypeRelationship | null
  isLocked?: boolean
}

export interface RelationshipDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  relationship: DocumentTypeRelationship | null
  onDeleted?: () => void
}

export interface AttributesDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  relationshipId: string
  relationshipName: string
}
