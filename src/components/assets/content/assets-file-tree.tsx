"use client"

import type { FileNode } from "@/types/assets"
import type { HuemulTreeNode, HuemulTreeMenuAction } from "@/types/huemul-tree"
import type { HuemulFileTreeProps } from "@/huemul/components/huemul-file-tree"
import type { FileTreeProps, FileTreeRef } from "@/types/assets-file-tree"
export type { FileTreeProps, FileTreeRef } from "@/types/assets-file-tree"

import { forwardRef, useCallback, useMemo } from "react"
import { File } from "lucide-react"
import { HuemulFileTree } from "@/huemul/components/huemul-file-tree"
import { useTranslation } from "react-i18next"

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
      renderLeafIcon: renderLeafIconProp,
      renderNodeClassName: renderNodeClassNameProp,
      alwaysShowMenuActions,
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

    // Memoize adapted callbacks to keep stable references and prevent
    // HuemulFileTree from re-running loadInitialData on every parent render.
    const adaptedLoadChildren = useCallback(
      onLoadChildren
        ? (folderId: string | null) => onLoadChildren(folderId) as Promise<HuemulTreeNode[]>
        : () => Promise.resolve([]),
      [onLoadChildren],
    )

    const adaptedCreateFile = useCallback(
      onCreateFile ? (parentId: string | null, name: string) => onCreateFile(parentId, name) : () => Promise.resolve(),
      [onCreateFile],
    )

    const adaptedFileClick = useMemo(
      () => (onFileClick ? (node: HuemulTreeNode) => onFileClick(node as FileNode) : undefined),
      [onFileClick],
    )

    return (
      <HuemulFileTree
        ref={ref}
        onLoadChildren={onLoadChildren ? adaptedLoadChildren : undefined}
        onCreateFile={onCreateFile ? adaptedCreateFile : undefined}
        onCreateFolder={onCreateFolder}
        onDelete={onDelete as ((nodeId: string, nodeType: string) => Promise<void>) | undefined}
        onShare={onShare}
        onMoveFolder={onMoveFolder}
        onMoveFile={onMoveFile}
        onFileClick={adaptedFileClick}
        activeNodeId={activeNodeId}
        menuActions={adaptedMenuActions}
        showDefaultActions={showDefaultActions}
        customDialogs={adaptedCustomDialogs}
        folderType="folder"
        renderLeafIcon={renderLeafIconProp
          ? (node) => renderLeafIconProp(node as FileNode)
          : (node) => {
              const fileNode = node as FileNode
              return (
                <File
                  className="h-3.5 w-3.5 shrink-0"
                  style={{ color: fileNode.document_type?.color || "currentColor" }}
                />
              )
            }
        }
        renderNodeClassName={renderNodeClassNameProp
          ? (node) => renderNodeClassNameProp(node as FileNode)
          : undefined
        }
        alwaysShowMenuActions={alwaysShowMenuActions}
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
