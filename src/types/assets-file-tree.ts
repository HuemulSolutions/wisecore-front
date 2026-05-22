import type React from 'react'
import type { MenuAction } from '@/types/menu-action'
import type { FileNode } from '@/types/assets'
import type { HuemulFileTreeRef } from '@/huemul/components/huemul-file-tree'

export interface FileTreeProps {
  onLoadChildren?: (folderId: string | null) => Promise<FileNode[]>
  /** documentTypeId and templateId are passed by custom create-file dialogs and are ignored by the default inline input */
  onCreateFile?: (parentId: string | null, name: string, documentTypeId?: string, templateId?: string) => Promise<void>
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>
  onDelete?: (nodeId: string, nodeType: "document" | "folder") => Promise<void>
  onShare?: (nodeId: string) => Promise<void>
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>
  onMoveFile?: (documentId: string, folderId: string | null) => Promise<void>
  onFileClick?: (node: FileNode) => void | Promise<void>
  activeNodeId?: string | null
  menuActions?: MenuAction[]
  showDefaultActions?: {
    create?: boolean
    delete?: boolean
    share?: boolean
  }
  customDialogs?: {
    createFile?: (parentId: string | null, onSuccess: () => void) => React.ReactNode
    createFolder?: (parentId: string | null, onSuccess: () => void) => React.ReactNode
    delete?: (nodeId: string, nodeType: "document" | "folder", onSuccess: () => void) => React.ReactNode
    share?: (nodeId: string, onSuccess: () => void) => React.ReactNode
  }
  showCreateButtons?: boolean
  initialFolderId?: string | null
  showBorder?: boolean
  showRefreshButton?: boolean
  minHeight?: string
  renderLeafIcon?: (node: FileNode) => React.ReactNode
  renderNodeClassName?: (node: FileNode) => string | undefined
  alwaysShowMenuActions?: boolean
}

export interface FileTreeRef extends HuemulFileTreeRef {}
