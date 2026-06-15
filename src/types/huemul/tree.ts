import type React from "react"

export interface HuemulTreeNode {
  id: string
  name: string
  type: string
  children?: HuemulTreeNode[]
  isExpanded?: boolean
  isLoading?: boolean
  hasChildren?: boolean
  disabled?: boolean
  metadata?: Record<string, unknown>
}

export interface HuemulTreeMenuAction {
  variant?: string
  label: string
  icon?: React.ReactNode
  onClick: (nodeId: string) => Promise<void>
  show?: (node: HuemulTreeNode) => boolean
}

export interface HuemulFileTreeLabels {
  newFile?: string
  newFolder?: string
  shareLink?: string
  deleteFolder?: string
  deleteFile?: string
  loading?: string
  empty?: string
  createFile?: string
  createFolder?: string
  inputPlaceholder?: string
}
