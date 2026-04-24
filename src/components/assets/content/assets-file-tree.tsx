"use client"

import type React from "react"
import type { MenuAction } from "@/types/menu-action"
import type { FileNode } from "@/types/assets"
import type { HuemulTreeNode, HuemulTreeMenuAction } from "@/types/huemul-tree"
import type { HuemulFileTreeProps } from "@/huemul/components/huemul-file-tree"

import { forwardRef } from "react"
import { File } from "lucide-react"
import { HuemulFileTree, type HuemulFileTreeRef } from "@/huemul/components/huemul-file-tree"
import { useTranslation } from "react-i18next"

/**
 * Assets-specific FileTree props.
 * Extends HuemulFileTree with FileNode-typed callbacks and the extra
 * documentTypeId / templateId params on onCreateFile.
 */
interface FileTreeProps {
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
}

export interface FileTreeRef extends HuemulFileTreeRef {}

/**
 * Assets-scoped wrapper around HuemulFileTree.
 * - Maps FileNode <-> HuemulTreeNode via structural casting.
 * - Adapts MenuAction.show (receives FileNode) to HuemulTreeMenuAction.show (receives HuemulTreeNode).
 * - Renders document_type color in leaf icons via renderLeafIcon.
 * - Passes translated labels from the "assets" i18n namespace.
 */
export const FileTree = forwardRef<FileTreeRef, FileTreeProps>(
  (
    {
      onLoadChildren,
      onCreateFile,
      onCreateFolder,
      onDelete,
      onShare,
      onMoveFolder,
      onMoveFile,
      onFileClick,
      activeNodeId,
      menuActions = [],
      showDefaultActions = { create: true, delete: true, share: true },
      customDialogs,
      showCreateButtons = true,
      initialFolderId = null,
      showBorder = true,
      showRefreshButton = false,
      minHeight = "530px",
    },
    ref,
  ) => {
    const { t } = useTranslation("assets")

    const adaptedMenuActions: HuemulTreeMenuAction[] = menuActions.map((action) => ({
      ...action,
      show: action.show ? (node: HuemulTreeNode) => action.show!(node as FileNode) : undefined,
    }))

    const adaptedCustomDialogs: HuemulFileTreeProps["customDialogs"] = customDialogs
      ? {
          createFile: customDialogs.createFile,
          createFolder: customDialogs.createFolder,
          delete: customDialogs.delete
            ? (nodeId, nodeType, onSuccess) =>
                customDialogs.delete!(nodeId, nodeType as "document" | "folder", onSuccess)
            : undefined,
          share: customDialogs.share,
        }
      : undefined

    return (
      <HuemulFileTree
        ref={ref}
        onLoadChildren={
          onLoadChildren
            ? (folderId) => onLoadChildren(folderId) as Promise<HuemulTreeNode[]>
            : undefined
        }
        onCreateFile={onCreateFile ? (parentId, name) => onCreateFile(parentId, name) : undefined}
        onCreateFolder={onCreateFolder}
        onDelete={onDelete as ((nodeId: string, nodeType: string) => Promise<void>) | undefined}
        onShare={onShare}
        onMoveFolder={onMoveFolder}
        onMoveFile={onMoveFile}
        onFileClick={onFileClick ? (node) => onFileClick(node as FileNode) : undefined}
        activeNodeId={activeNodeId}
        menuActions={adaptedMenuActions}
        showDefaultActions={showDefaultActions}
        customDialogs={adaptedCustomDialogs}
        folderType="folder"
        renderLeafIcon={(node) => {
          const fileNode = node as FileNode
          return (
            <File
              className="h-3.5 w-3.5 shrink-0"
              style={{ color: fileNode.document_type?.color || "currentColor" }}
            />
          )
        }}
        showCreateButtons={showCreateButtons}
        initialFolderId={initialFolderId}
        showBorder={showBorder}
        showRefreshButton={showRefreshButton}
        minHeight={minHeight}
        labels={{
          newFile: t("fileTree.newFile"),
          newFolder: t("fileTree.newFolder"),
          shareLink: t("fileTree.shareLink"),
          deleteFolder: t("fileTree.deleteFolder"),
          deleteFile: t("fileTree.deleteFile"),
        }}
      />
    )
  },
)

FileTree.displayName = "FileTree"
