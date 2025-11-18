"use client"

import type React from "react"

import { useState } from "react"
import { ChevronRight, Folder, File, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { FileNode } from "./types"

interface FileTreeItemProps {
  item: FileNode
  level: number
  onDrop: (draggedItem: FileNode, targetFolder: FileNode) => void
  onSelect: (item: FileNode) => void
  onDoubleClick?: (item: FileNode) => void
  selectedId?: string
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>
  onChildrenLoaded?: (folderId: string, children: FileNode[]) => void
}

export function FileTreeItem({
  item,
  level,
  onDrop,
  onSelect,
  onDoubleClick,
  selectedId,
  onLoadChildren,
  onChildrenLoaded,
}: FileTreeItemProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isDragOver, setIsDragOver] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [localChildren, setLocalChildren] = useState<FileNode[]>(item.children || [])

  const isFolder = item.type === "folder"
  const hasChildren = isFolder && localChildren.length > 0
  const isSelected = selectedId === item.id

  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.effectAllowed = "move"
    e.dataTransfer.setData("application/json", JSON.stringify(item))
  }

  const handleDragOver = (e: React.DragEvent) => {
    if (isFolder) {
      e.preventDefault()
      e.dataTransfer.dropEffect = "move"
      setIsDragOver(true)
    }
  }

  const handleDragLeave = () => {
    setIsDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    try {
      const draggedData = e.dataTransfer.getData("application/json")
      const draggedNode = JSON.parse(draggedData) as FileNode

      if (isFolder && draggedNode.id !== item.id) {
        onDrop(draggedNode, item)
        setIsExpanded(true)
      }
    } catch (error) {
      console.error("Error en drop:", error)
    }
  }

  const handleToggleExpand = async () => {
    if (!isExpanded && isFolder && onLoadChildren && localChildren.length === 0) {
      setIsLoading(true)
      try {
        const loadedChildren = await onLoadChildren(item.id)
        setLocalChildren(loadedChildren)
        onChildrenLoaded?.(item.id, loadedChildren)
      } catch (error) {
        console.error("Error cargando contenido:", error)
      } finally {
        setIsLoading(false)
      }
    }
    setIsExpanded(!isExpanded)
  }

  return (
    <div className="w-full">
      <div
        draggable
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => onSelect(item)}
        onDoubleClick={() => onDoubleClick?.(item)}
        className={cn(
          "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-all duration-200",
          "hover:bg-gray-100 hover:shadow-sm",
          isSelected && "bg-[#4464f7]/10 text-[#4464f7] border-l-2 border-[#4464f7]",
          isDragOver && "bg-[#4464f7]/20 border-2 border-dashed border-[#4464f7]",
          "group",
        )}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
      >
        {/* Botón de expandir/contraer */}
        {isFolder && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleToggleExpand()
                  }}
                  className={cn(
                    "flex-shrink-0 p-0.5 hover:bg-foreground/10 rounded transition-transform",
                    !hasChildren && !onLoadChildren && "invisible",
                    (isExpanded || isLoading) && "rotate-90",
                  )}
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isExpanded ? "Collapse folder" : "Expand folder"}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}

        {/* Ícono */}
        {!isFolder && <div className="w-4 h-4 flex-shrink-0" />}

        {isFolder ? (
          <Folder className="w-4 h-4 flex-shrink-0 text-primary" />
        ) : (
          <File className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
        )}

        {/* Nombre del archivo/carpeta */}
        <span className="truncate text-sm flex-1">{item.name}</span>
      </div>

      {/* Items hijos si la carpeta está expandida */}
      {isFolder && isExpanded && localChildren.length > 0 && (
        <div className="w-full">
          {localChildren.map((child) => (
            <FileTreeItem
              key={child.id}
              item={child}
              level={level + 1}
              onDrop={onDrop}
              onSelect={onSelect}
              onDoubleClick={onDoubleClick}
              selectedId={selectedId}
              onLoadChildren={onLoadChildren}
              onChildrenLoaded={onChildrenLoaded}
            />
          ))}
        </div>
      )}
    </div>
  )
}
