"use client"

import type React from "react"
import type { MenuAction } from "@/types/menu-action"
import type { FileNode } from "@/types/assets"

import { useState, useCallback, useEffect, useImperativeHandle, forwardRef } from "react"
import { ChevronRight, ChevronDown, File, Folder, FolderOpen, Plus, RefreshCw, MoreVertical, Trash2, Share } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface FileTreeProps {
  onLoadChildren?: (folderId: string | null) => Promise<FileNode[]>
  onCreateFile?: (parentId: string | null, name: string, documentTypeId?: string, templateId?: string) => Promise<void>
  onCreateFolder?: (parentId: string | null, name: string) => Promise<void>
  onDelete?: (nodeId: string, nodeType: "document" | "folder") => Promise<void>
  onShare?: (nodeId: string) => Promise<void>
  onMoveFolder?: (folderId: string, parentFolderId: string | null) => Promise<void>
  onMoveFile?: (documentId: string, folderId: string | null) => Promise<void>
  onFileClick?: (node: FileNode) => void | Promise<void>
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

export interface FileTreeRef {
  refresh: () => Promise<void>
}

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
    const [nodes, setNodes] = useState<FileNode[]>([])
    const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set())
    const [creatingNode, setCreatingNode] = useState<{
      parentId: string | null
      type: "document" | "folder"
    } | null>(null)
    const [newNodeName, setNewNodeName] = useState("")
    const [draggedNode, setDraggedNode] = useState<string | null>(null)
    const [dragOverNode, setDragOverNode] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(false)
    const [isInitialized, setIsInitialized] = useState(false)
    const [activeDialog, setActiveDialog] = useState<{
      type: "createFile" | "createFolder" | "delete" | "share"
      nodeId: string | null
      nodeType?: "document" | "folder"
    } | null>(null)

    useEffect(() => {
      const getExpandedIds = (nodeList: FileNode[]): string[] => {
        const expanded: string[] = []
        for (const node of nodeList) {
          if (node.isExpanded && node.type === "folder") {
            expanded.push(node.id)
          }
          if (node.children) {
            expanded.push(...getExpandedIds(node.children))
          }
        }
        return expanded
      }

      setExpandedFolders(new Set(getExpandedIds(nodes)))
    }, [nodes])

    const loadInitialData = useCallback(async () => {
      if (!onLoadChildren) return

      setIsLoading(true)
      try {
        const data = await onLoadChildren(initialFolderId)
        setNodes(data)
        setIsInitialized(true)
      } catch (error) {
        console.error("Error loading initial data:", error)
      } finally {
        setIsLoading(false)
      }
    }, [onLoadChildren, initialFolderId])

    useEffect(() => {
      if (!isInitialized) {
        loadInitialData()
      }
    }, [isInitialized, loadInitialData])

    const refresh = useCallback(async () => {
      if (!onLoadChildren) return

      setIsLoading(true)
      try {
        // Get current expanded folder IDs before refresh
        const currentExpandedIds = Array.from(expandedFolders)

        // Load root data
        const rootData = await onLoadChildren(initialFolderId)

        // Recursively reload all expanded folders
        const reloadExpandedFolders = async (nodeList: FileNode[]): Promise<FileNode[]> => {
          const result: FileNode[] = []

          for (const node of nodeList) {
            const newNode = { ...node }

            if (node.type === "folder" && currentExpandedIds.includes(node.id)) {
              // This folder was expanded, reload its children
              try {
                const children = await onLoadChildren(node.id)
                newNode.children = await reloadExpandedFolders(children)
                newNode.isExpanded = true
                newNode.hasChildren = children.length > 0
              } catch (error) {
                console.error(`Error reloading folder ${node.id}:`, error)
                newNode.children = []
                newNode.isExpanded = false
              }
            }

            result.push(newNode)
          }

          return result
        }

        const refreshedNodes = await reloadExpandedFolders(rootData)
        setNodes(refreshedNodes)
      } catch (error) {
        console.error("Error refreshing tree:", error)
      } finally {
        setIsLoading(false)
      }
    }, [onLoadChildren, expandedFolders, initialFolderId])

    useImperativeHandle(ref, () => ({
      refresh,
    }))

    const applyExpandedState = useCallback(
      (nodeList: FileNode[]): FileNode[] => {
        return nodeList.map((node) => {
          const shouldBeExpanded = expandedFolders.has(node.id)
          return {
            ...node,
            isExpanded: shouldBeExpanded,
            children: node.children ? applyExpandedState(node.children) : node.children,
          }
        })
      },
      [expandedFolders],
    )

    const updateNode = useCallback((nodeId: string, updates: Partial<FileNode>, nodeList: FileNode[]): FileNode[] => {
      return nodeList.map((node) => {
        if (node.id === nodeId) {
          return { ...node, ...updates }
        }
        if (node.children) {
          return { ...node, children: updateNode(nodeId, updates, node.children) }
        }
        return node
      })
    }, [])

    const addChildNode = useCallback((parentId: string, newNode: FileNode, nodeList: FileNode[]): FileNode[] => {
      return nodeList.map((node) => {
        if (node.id === parentId) {
          return {
            ...node,
            children: [...(node.children || []), newNode],
            hasChildren: true,
          }
        }
        if (node.children) {
          return { ...node, children: addChildNode(parentId, newNode, node.children) }
        }
        return node
      })
    }, [])

    const removeNode = useCallback((nodeId: string, nodeList: FileNode[]): FileNode[] => {
      return nodeList.filter((node) => {
        if (node.id === nodeId) {
          return false
        }
        if (node.children) {
          node.children = removeNode(nodeId, node.children)
        }
        return true
      })
    }, [])

    const findNode = useCallback((nodeId: string, nodeList: FileNode[]): FileNode | null => {
      for (const node of nodeList) {
        if (node.id === nodeId) return node
        if (node.children) {
          const found = findNode(nodeId, node.children)
          if (found) return found
        }
      }
      return null
    }, [])

    const isDescendant = useCallback(
      (ancestorId: string, nodeId: string, nodeList: FileNode[]): boolean => {
        const ancestor = findNode(ancestorId, nodeList)
        if (!ancestor || !ancestor.children) return false

        for (const child of ancestor.children) {
          if (child.id === nodeId) return true
          if (isDescendant(child.id, nodeId, nodeList)) return true
        }
        return false
      },
      [findNode],
    )

    const handleToggle = async (node: FileNode) => {
      if (node.disabled) return

      if (node.type === "document") return

      if (node.isExpanded) {
        setExpandedFolders((prev) => {
          const newSet = new Set(prev)
          newSet.delete(node.id)
          return newSet
        })
        setNodes((prev) => updateNode(node.id, { isExpanded: false }, prev))
        return
      }

      setExpandedFolders((prev) => new Set(prev).add(node.id))

      if (!node.children && onLoadChildren) {
        setNodes((prev) => updateNode(node.id, { isLoading: true }, prev))

        try {
          const children = await onLoadChildren(node.id)
          setNodes((prev) =>
            updateNode(
              node.id,
              {
                children,
                isExpanded: true,
                isLoading: false,
                hasChildren: children.length > 0,
              },
              prev,
            ),
          )
        } catch (error) {
          console.error("Error loading children:", error)
          setNodes((prev) => updateNode(node.id, { isLoading: false }, prev))
        }
      } else {
        setNodes((prev) => updateNode(node.id, { isExpanded: true }, prev))
      }
    }

    const handleFileClick = async (node: FileNode) => {
      if (node.disabled) return

      if (node.type === "document" && onFileClick) {
        setIsLoading(true)
        try {
          await onFileClick(node)
        } finally {
          setIsLoading(false)
        }
      }
    }

    const handleCreate = (parentId: string | null, type: "document" | "folder") => {
      const dialogType = type === "document" ? "createFile" : "createFolder"

      if (customDialogs && customDialogs[dialogType]) {
        setActiveDialog({ type: dialogType, nodeId: parentId })
      } else {
        setCreatingNode({ parentId, type })
        setNewNodeName("")
      }
    }

    const handleConfirmCreate = async () => {
      if (!newNodeName.trim() || !creatingNode) return

      setIsLoading(true)

      try {
        if (creatingNode.type === "document" && onCreateFile) {
          await onCreateFile(creatingNode.parentId, newNodeName)
        } else if (creatingNode.type === "folder" && onCreateFolder) {
          await onCreateFolder(creatingNode.parentId, newNodeName)
        }

        await refresh()

        setCreatingNode(null)
        setNewNodeName("")
      } catch (error) {
        console.error("Error creating node:", error)
        setIsLoading(false)
      }
    }

    const handleCancelCreate = () => {
      setCreatingNode(null)
      setNewNodeName("")
    }

    const handleDelete = async (nodeId: string, nodeType: "document" | "folder") => {
      if (customDialogs?.delete) {
        setActiveDialog({ type: "delete", nodeId, nodeType })
      } else {
        setIsLoading(true)
        try {
          if (onDelete) {
            await onDelete(nodeId, nodeType)
          }

          await refresh()
        } catch (error) {
          console.error("Error deleting node:", error)
          setIsLoading(false)
        }
      }
    }

    const handleShare = async (nodeId: string) => {
      if (customDialogs?.share) {
        setActiveDialog({ type: "share", nodeId })
      } else {
        setIsLoading(true)
        try {
          if (onShare) {
            await onShare(nodeId)
          }
        } finally {
          setIsLoading(false)
        }
      }
    }

    const handleMenuAction = async (action: MenuAction, nodeId: string) => {
      setIsLoading(true)
      try {
        await action.onClick(nodeId)
      } finally {
        setIsLoading(false)
      }
    }

    const handleDragStart = (e: React.DragEvent, nodeId: string, node: FileNode) => {
      if (node.disabled) {
        e.preventDefault()
        return
      }
      setDraggedNode(nodeId)
      e.dataTransfer.effectAllowed = "move"
    }

    const handleDragOver = (e: React.DragEvent, nodeId: string | null, nodeType?: "document" | "folder") => {
      e.preventDefault()
      e.stopPropagation()

      if (nodeType === "document") return

      setDragOverNode(nodeId)
      e.dataTransfer.dropEffect = "move"
    }

    const handleDragLeave = (e: React.DragEvent) => {
      e.preventDefault()
      setDragOverNode(null)
    }

    const handleDrop = async (e: React.DragEvent, targetId: string | null) => {
      e.preventDefault()
      e.stopPropagation()
      setDragOverNode(null)

      if (!draggedNode || draggedNode === targetId) {
        setDraggedNode(null)
        return
      }

      if (targetId && isDescendant(draggedNode, targetId, nodes)) {
        setDraggedNode(null)
        return
      }

      setIsLoading(true)

      try {
        const node = findNode(draggedNode, nodes)
        if (!node) return

        if (node.type === "folder" && onMoveFolder) {
          await onMoveFolder(draggedNode, targetId)
        } else if (node.type === "document" && onMoveFile) {
          await onMoveFile(draggedNode, targetId)
        }

        await refresh()
      } catch (error) {
        console.error("Error moving node:", error)
        setIsLoading(false)
      } finally {
        setDraggedNode(null)
      }
    }

    const handleDialogSuccess = async () => {
      setActiveDialog(null)
      await refresh()
    }

    const renderNode = (node: FileNode, level = 0, isLastChild = false) => {
      const isFolder = node.type === "folder"
      const isExpanded = node.isExpanded
      const isCreating = creatingNode?.parentId === node.id
      const isDragging = draggedNode === node.id
      const isDragOver = dragOverNode === node.id

      const hasVisibleMenuActions =
        (isFolder && showDefaultActions.create) ||
        showDefaultActions.delete ||
        showDefaultActions.share ||
        menuActions.some((action) => (action.show ? action.show(node) : true))

      return (
        <div key={node.id} className={cn("relative", level > 0 && "ml-4")}>
          {level > 0 && (
            <div 
              className="absolute left-0 top-0 bottom-0 w-px bg-border"
              style={{ 
                left: `${level * 12 - 14}px`,
                height: isLastChild ? '1.25rem' : '100%'
              }}
            />
          )}
          {level > 0 && (
            <div 
              className="absolute top-5 w-3 h-px bg-border"
              style={{ left: `${level * 12 - 14}px` }}
            />
          )}
          <div
            className={cn(
              "group flex items-center gap-1 py-1 px-2 rounded-md transition-colors relative",
              node.disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-accent cursor-pointer",
              isDragging && "opacity-50",
              isDragOver && isFolder && "bg-primary/10 border-2 border-primary border-dashed",
            )}
            style={{ paddingLeft: `${level * 12 + 6}px` }}
            draggable={!node.disabled}
            onDragStart={(e) => handleDragStart(e, node.id, node)}
            onDragOver={(e) =>
              isFolder && !node.disabled ? handleDragOver(e, node.id, node.type) : e.preventDefault()
            }
            onDragLeave={handleDragLeave}
            onDrop={(e) => (isFolder && !node.disabled ? handleDrop(e, node.id) : e.preventDefault())}
          >
            {isFolder && (
              <Button
                variant="ghost"
                size="icon"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => handleToggle(node)}
                disabled={node.disabled}
              >
                {node.isLoading ? (
                  <div className="h-3 w-3 animate-spin rounded-full border-2 border-muted-foreground border-t-transparent" />
                ) : isExpanded ? (
                  <ChevronDown className="h-3 w-3" />
                ) : (
                  <ChevronRight className="h-3 w-3" />
                )}
              </Button>
            )}

            <div
              className="flex items-center gap-2 flex-1 min-w-0"
              onClick={() => (isFolder ? handleToggle(node) : handleFileClick(node))}
            >
              {isFolder ? (
                isExpanded ? (
                  <FolderOpen className="h-4 w-4 text-blue-500 flex-shrink-0" />
                ) : (
                  <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
                )
              ) : (
                <div className="flex items-center gap-2">
                  <File
                    className="h-4 w-4 flex-shrink-0"
                    style={{ color: node.document_type?.color || "currentColor" }}
                  />
                </div>
              )}
              <p className="text-sm truncate">{node.name}</p>
              {/* {node.document_type && (
                <span
                  className="text-xs px-1.5 py-0.5 rounded-md font-medium"
                  style={{
                    backgroundColor: `${node.document_type.color}20`,
                    color: node.document_type.color,
                  }}
                >
                  {node.document_type.name}
                </span>
              )} */}
            </div>

            {hasVisibleMenuActions && !node.disabled && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {isFolder && showDefaultActions.create && (
                    <>
                      <DropdownMenuItem onSelect={() => handleCreate(node.id, "document")} className="hover:cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        New File
                      </DropdownMenuItem>
                      <DropdownMenuItem onSelect={() => handleCreate(node.id, "folder")} className="hover:cursor-pointer">
                        <Plus className="mr-2 h-4 w-4" />
                        New Folder
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                    </>
                  )}

                  {menuActions
                    .filter((action) => (action.show ? action.show(node) : true))
                    .map((action, index) => (
                      <DropdownMenuItem
                        key={index}
                        onSelect={() => handleMenuAction(action, node.id)}
                        className={action.variant === "destructive" ? "text-destructive focus:text-destructive" : ""}
                      >
                        {action.icon && <span className="mr-2">{action.icon}</span>}
                        {action.label}
                      </DropdownMenuItem>
                    ))}

                  {menuActions.length > 0 && (showDefaultActions.share || showDefaultActions.delete) && (
                    <DropdownMenuSeparator />
                  )}

                  {showDefaultActions.share && (
                    <DropdownMenuItem onSelect={() => handleShare(node.id)} className="hover:cursor-pointer">
                      <Share className="mr-2 h-4 w-4" />
                      Share Link
                    </DropdownMenuItem>
                  )}

                  {showDefaultActions.delete && (
                    <DropdownMenuItem
                      onSelect={() => handleDelete(node.id, node.type)}
                      className="text-destructive focus:text-destructive hover:cursor-pointer"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      {isFolder ? "Delete Folder" : "Delete File"}
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>

          {isCreating && (
            <div
              className="flex items-center gap-2 py-1 px-2 ml-4 relative"
              style={{ paddingLeft: `${(level + 1) * 12 + 6}px` }}
            >
              <div 
                className="absolute left-0 top-0 bottom-0 w-px bg-border"
                style={{ left: `${(level + 1) * 12 - 14}px` }}
              />
              <div 
                className="absolute top-5 w-3 h-px bg-border"
                style={{ left: `${(level + 1) * 12 - 14}px` }}
              />
              {creatingNode.type === "folder" ? (
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0 ml-4" />
              )}
              <Input
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmCreate()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                onBlur={handleConfirmCreate}
                placeholder="Nombre..."
                className="h-7 text-sm"
                autoFocus
              />
            </div>
          )}

          {isExpanded && node.children && node.children.map((child, index) => 
            renderNode(child, level + 1, index === node.children!.length - 1)
          )}
        </div>
      )
    }

    return (
      <div className="space-y-2">
        {showRefreshButton && (
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={refresh} disabled={isLoading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
              Actualizar
            </Button>
          </div>
        )}

        <div
          className={cn(
            "relative rounded-lg transition-colors",
            showBorder && "border bg-card",
            !showBorder && "bg-transparent",
            dragOverNode === null && draggedNode && "bg-primary/10 border-primary border-dashed",
          )}
          style={{ minHeight }}
          onDragOver={(e) => handleDragOver(e, null)}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, null)}
        >
          {isLoading && (
            <div className="absolute inset-0 bg-background/80 flex items-center justify-center z-50 rounded-lg">
              <div className="flex flex-col items-center gap-2">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                <p className="text-sm text-muted-foreground">Loading...</p>
              </div>
            </div>
          )}

          {showCreateButtons && (
            <div className="flex gap-2 mb-4">
              <Button variant="outline" size="sm" onClick={() => handleCreate(null, "document")}>
                <Plus className="mr-2 h-4 w-4" />
                Crear archivo
              </Button>
              <Button variant="outline" size="sm" onClick={() => handleCreate(null, "folder")}>
                <Plus className="mr-2 h-4 w-4" />
                Crear carpeta
              </Button>
            </div>
          )}

          {creatingNode?.parentId === null && (
            <div className="flex items-center gap-2 py-1 px-2 mb-2 relative">
              {creatingNode.type === "folder" ? (
                <Folder className="h-4 w-4 text-blue-500 flex-shrink-0" />
              ) : (
                <File className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <Input
                value={newNodeName}
                onChange={(e) => setNewNodeName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleConfirmCreate()
                  if (e.key === "Escape") handleCancelCreate()
                }}
                onBlur={handleConfirmCreate}
                placeholder="Nombre..."
                className="h-7 text-sm"
                autoFocus
              />
            </div>
          )}

          <div className="space-y-0.5">
            {nodes.length === 0 && !isLoading && (
              <p className="text-sm text-muted-foreground text-center py-8">No hay archivos ni carpetas</p>
            )}
            {nodes.map((node, index) => renderNode(node, 0, index === nodes.length - 1))}
          </div>
        </div>

        {activeDialog && customDialogs && (
          <>
            {activeDialog.type === "createFile" &&
              customDialogs.createFile &&
              customDialogs.createFile(activeDialog.nodeId, handleDialogSuccess)}
            {activeDialog.type === "createFolder" &&
              customDialogs.createFolder &&
              customDialogs.createFolder(activeDialog.nodeId, handleDialogSuccess)}
            {activeDialog.type === "delete" &&
              customDialogs.delete &&
              activeDialog.nodeType &&
              customDialogs.delete(activeDialog.nodeId!, activeDialog.nodeType, handleDialogSuccess)}
            {activeDialog.type === "share" &&
              customDialogs.share &&
              customDialogs.share(activeDialog.nodeId!, handleDialogSuccess)}
          </>
        )}
      </div>
    )
  },
)

FileTree.displayName = "FileTree"
