import type { DocumentType } from '@/types/document-types'
import type React from 'react'

// ─── Canvas ───────────────────────────────────────────────────────────────────

export interface PendingConnection {
  sourceId: string
  targetId: string
  // populated in execution mode: the document type IDs from the node data
  sourceDocumentTypeId?: string
  targetDocumentTypeId?: string
  // display labels
  sourceName?: string
  targetName?: string
  sourceColor?: string
  targetColor?: string
  // pre-selected execution ids (from node panel version selector)
  sourceExecutionId?: string
  targetExecutionId?: string
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
  mode?: 'document-type' | 'execution'
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
