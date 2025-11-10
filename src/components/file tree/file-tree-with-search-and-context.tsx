"use client"

import { useState } from "react"
import { FileSearch } from "./file-search"
import { FileTreeWithContext } from "./file-tree-with-context"
import { Separator } from "@/components/ui/separator"
import type { FileNode } from "./types"

interface FileTreeWithSearchAndContextProps {
  items: FileNode[]
  onDrop?: (draggedItem: FileNode, targetFolder: FileNode) => void
  onSelect?: (item: FileNode) => void
  onDoubleClick?: (item: FileNode) => void
  selectedId?: string
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>
  showSearch?: boolean
  searchPlaceholder?: string
  onRefresh?: () => void
  onDocumentCreated?: (document: { id: string; name: string; type: "document" }) => void
  onShare?: (item: FileNode, fullPath: string[]) => void
}

export function FileTreeWithSearchAndContext({
  items: initialItems,
  onDrop,
  onSelect,
  onDoubleClick,
  selectedId,
  showSearch = true,
  searchPlaceholder,
  onLoadChildren,
  onRefresh,
  onDocumentCreated,
  onShare,
}: FileTreeWithSearchAndContextProps) {
  const [selected, setSelected] = useState(selectedId)

  const handleSelect = (item: FileNode) => {
    setSelected(item.id)
    onSelect?.(item)
  }

  const handleDoubleClick = (item: FileNode) => {
    onDoubleClick?.(item)
  }

  return (
    <div className={`w-full ${showSearch ? 'space-y-4' : ''}`}>
      {showSearch && (
        <>
          <FileSearch
            items={initialItems}
            onSelect={handleSelect}
            selectedId={selected}
            placeholder={searchPlaceholder}
          />
          <Separator />
        </>
      )}

      <FileTreeWithContext
        items={initialItems}
        onDrop={onDrop}
        onSelect={handleSelect}
        onDoubleClick={handleDoubleClick}
        selectedId={selected}
        onLoadChildren={onLoadChildren}
        onRefresh={onRefresh}
        onDocumentCreated={onDocumentCreated}
        onShare={onShare}
      />
    </div>
  )
}