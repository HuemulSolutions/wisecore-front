import type { DocumentType } from '@/types/document-types'

// ─── Canvas ───────────────────────────────────────────────────────────────────

export interface PendingConnection {
  sourceId: string
  targetId: string
}

export interface RelationshipsCanvasProps {
  organizationId: string
  documentTypes: DocumentType[]
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export interface AssetTypeSidebarProps {
  items: DocumentType[]
  isLoading?: boolean
  page: number
  pageSize: number
}

export interface AssetTypeDraggableItemProps {
  item: DocumentType
}
