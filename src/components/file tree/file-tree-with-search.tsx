"use client"

import { useState } from "react"
import { FileSearch } from "./file-search"
import { FileTree } from "./file-tree"
import { Separator } from "@/components/ui/separator"
import type { FileNode, FileTreeProps } from "./types"

interface FileTreeWithSearchProps extends FileTreeProps {
  showSearch?: boolean
  searchPlaceholder?: string
}

export function FileTreeWithSearch({
  items: initialItems,
  onDrop,
  onSelect,
  onDoubleClick,
  selectedId,
  showSearch = true,
  searchPlaceholder,
  onLoadChildren,
}: FileTreeWithSearchProps) {
  const [selected, setSelected] = useState(selectedId)

  const handleSelect = (item: FileNode) => {
    setSelected(item.id)
    onSelect?.(item)
  }

  const handleDoubleClick = (item: FileNode) => {
    onDoubleClick?.(item)
  }

  return (
    <div className="w-full space-y-4">
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

      <FileTree
        items={initialItems}
        onDrop={onDrop}
        onSelect={handleSelect}
        onDoubleClick={handleDoubleClick}
        selectedId={selected}
        onLoadChildren={onLoadChildren}
      />
    </div>
  )
}
