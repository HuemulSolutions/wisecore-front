import type { ReactNode } from 'react'
import type { HuemulTreeNode, HuemulTreeMenuAction, HuemulFileTreeLabels } from './tree'

export interface HuemulFileTreeProps {
  onLoadChildren?: (folderId: string | null) => Promise<HuemulTreeNode[]>
  onCreateFile?: (parentId: string | null, name: string) => Promise<void>
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>
  onDelete?: (nodeId: string, nodeType: string) => Promise<void>
  onShare?: (nodeId: string) => Promise<void>
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>
  onMoveFile?: (documentId: string, folderId: string | null) => Promise<void>
  onFileClick?: (node: HuemulTreeNode) => void | Promise<void>
  onFolderClick?: (node: HuemulTreeNode) => void | Promise<void>
  activeNodeId?: string | null
  menuActions?: HuemulTreeMenuAction[]
  showDefaultActions?: {
    create?: boolean
    delete?: boolean
    share?: boolean
  }
  customDialogs?: {
    createFile?: (parentId: string | null, onSuccess: () => void) => ReactNode
    createFolder?: (parentId: string | null, onSuccess: () => void) => ReactNode
    delete?: (nodeId: string, nodeType: string, onSuccess: () => void) => ReactNode
    share?: (nodeId: string, onSuccess: () => void) => ReactNode
  }
  folderType?: string
  renderLeafIcon?: (node: HuemulTreeNode) => ReactNode
  renderFolderIcon?: (node: HuemulTreeNode, isExpanded: boolean) => ReactNode
  renderNodeClassName?: (node: HuemulTreeNode) => string | undefined
  alwaysShowMenuActions?: boolean
  showCreateButtons?: boolean
  initialFolderId?: string | null
  showBorder?: boolean
  showRefreshButton?: boolean
  minHeight?: string
  labels?: HuemulFileTreeLabels
}

export interface HuemulFileTreeRef {
  refresh: () => Promise<void>
}
