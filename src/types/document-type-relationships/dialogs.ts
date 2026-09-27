import type { AttributeValueType, DocumentTypeRelationship } from './core'
import type { DocumentType } from '@/types/document-types'
import type { ExecutionRelationship } from '@/types/execution-relationships'

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
  onUpdated?: (relationship: DocumentTypeRelationship) => void
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

// ─── Execution relationship dialogs ───────────────────────────────────────────

export interface ExecutionRelationshipNodeInfo {
  assetId: string       // the asset / document id (for fetching executions)
  name: string
  color?: string
  documentTypeId: string
  executionId?: string  // pre-selected execution (from node panel version selector)
}

export interface ExecutionRelationshipCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  source: ExecutionRelationshipNodeInfo
  target: ExecutionRelationshipNodeInfo
  onCreated?: (relationship: ExecutionRelationship, relName: string, sourceExecutionId: string, targetExecutionId: string) => void
}

export interface ExecutionRelationshipEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  executionRelationship: ExecutionRelationship | null
  relationshipName?: string
  onUpdated?: (relationship: ExecutionRelationship) => void
}

// ─── Direct (role) edge dialog ─────────────────────────────────────────────────

export interface RoleEdgeNameDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** 'create' for a brand-new connection, 'rename' to edit an existing direct edge. */
  mode: 'create' | 'rename'
  source: { label: string; color?: string }
  target: { label: string; color?: string }
  initialName?: string
  initialType?: string
  /** Both free text — name may be submitted blank (backend accepts `name: null`). */
  onSubmit: (name: string, type: string) => void
}
