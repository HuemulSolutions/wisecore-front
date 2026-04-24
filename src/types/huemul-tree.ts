import type React from "react"

/**
 * Base node shape for HuemulFileTree.
 * Extend this interface for domain-specific node types.
 * Only `id`, `name`, and `type` are required.
 */
export interface HuemulTreeNode {
  id: string
  name: string
  /** Arbitrary string — the component uses the `folderType` prop (default "folder") to identify folder nodes */
  type: string
  children?: HuemulTreeNode[]
  isExpanded?: boolean
  isLoading?: boolean
  hasChildren?: boolean
  disabled?: boolean
}

/**
 * Context-menu action for tree nodes.
 * Compatible with the existing `MenuAction` type in menu-action.ts.
 */
export interface HuemulTreeMenuAction {
  variant?: string
  label: string
  icon?: React.ReactNode
  onClick: (nodeId: string) => Promise<void>
  /** Return false to hide the action for a specific node */
  show?: (node: HuemulTreeNode) => boolean
}

/** Labels that can be overridden when using HuemulFileTree */
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
