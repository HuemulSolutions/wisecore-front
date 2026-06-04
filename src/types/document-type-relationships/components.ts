import type { DocumentType } from '@/types/document-types'
import type React from 'react'

// ─── Canvas ───────────────────────────────────────────────────────────────────

export interface PendingConnection {
  sourceId: string
  targetId: string
}

export interface CanvasNodeAction {
  key: string
  label: string
  icon: React.ComponentType<{ className?: string }>
  onClick: (nodeId: string) => void
  destructive?: boolean
  separator?: boolean
}

export interface RelationshipsCanvasProps {
  organizationId: string
  documentTypes: DocumentType[]
  initialDocumentTypeId?: string
  nodeActions?: CanvasNodeAction[]
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

export interface AssetTypeSidebarProps {
  items: DocumentType[]
  isLoading?: boolean
  isFetching?: boolean
  page: number
  pageSize: number
  onRefresh?: () => void
}

export interface AssetTypeDraggableItemProps {
  item: DocumentType
}
