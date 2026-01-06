"use client"

import { useState } from "react"
import { FileTreeItem } from "./file-tree-item"
import type { FileNode, FileTreeProps } from "./types"

export function FileTree({ items: initialItems, onDrop, onSelect, onDoubleClick, selectedId, onLoadChildren }: FileTreeProps) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState(selectedId)

  const handleDrop = (draggedItem: FileNode, targetFolder: FileNode) => {
    const newItems = JSON.parse(JSON.stringify(items)) as FileNode[]

    const removeItem = (nodes: FileNode[], itemId: string): FileNode | null => {
      for (let i = 0; i < nodes.length; i++) {
        if (nodes[i].id === itemId) {
          const removed = nodes[i]
          nodes.splice(i, 1)
          return removed
        }
        if (nodes[i].children) {
          const found = removeItem(nodes[i].children!, itemId)
          if (found) return found
        }
      }
      return null
    }

    const addItemToFolder = (nodes: FileNode[], folderId: string, item: FileNode) => {
      for (const node of nodes) {
        if (node.id === folderId && node.type === "folder") {
          if (!node.children) node.children = []
          node.children.push(item)
          return true
        }
        if (node.children && addItemToFolder(node.children, folderId, item)) {
          return true
        }
      }
      return false
    }

    const removed = removeItem(newItems, draggedItem.id)
    if (removed) {
      addItemToFolder(newItems, targetFolder.id, removed)
      setItems(newItems)
      onDrop?.(draggedItem, targetFolder)
    }
  }

  const handleSelect = (item: FileNode) => {
    setSelected(item.id)
    onSelect?.(item)
  }

  const handleDoubleClick = (item: FileNode) => {
    onDoubleClick?.(item)
  }

  return (
    <div className="w-full space-y-0.5">
      {items.map((item) => (
        <FileTreeItem
          key={item.id}
          item={item}
          level={0}
          onDrop={handleDrop}
          onSelect={handleSelect}
          onDoubleClick={handleDoubleClick}
          selectedId={selected}
          onLoadChildren={onLoadChildren}
        />
      ))}
    </div>
  )
}