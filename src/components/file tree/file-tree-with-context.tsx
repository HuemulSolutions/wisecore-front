"use client"

import { useState, useEffect } from "react"
import { FileTreeItemWithContext } from "./file-tree-item-with-context"
import type { FileNode } from "./types"

interface FileTreeWithContextProps {
  items: FileNode[]
  onDrop?: (draggedItem: FileNode, targetFolder: FileNode) => void
  onSelect?: (item: FileNode) => void
  onDoubleClick?: (item: FileNode) => void
  selectedId?: string
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>
  onRefresh?: () => void
  onDocumentCreated?: (document: { id: string; name: string; type: "document" }) => void
  onShare?: (item: FileNode, fullPath: string[]) => void
}

export function FileTreeWithContext({ 
  items: initialItems, 
  onDrop, 
  onSelect, 
  onDoubleClick, 
  selectedId,
  onLoadChildren,
  onRefresh,
  onDocumentCreated,
  onShare,
}: FileTreeWithContextProps) {
  const [items, setItems] = useState(initialItems)
  const [selected, setSelected] = useState(selectedId)

  // Sincronizar items cuando cambien los initialItems
  useEffect(() => {
    setItems(initialItems)
  }, [initialItems])

  // Función helper para verificar si un nodo es descendiente de otro
  const isDescendantOf = (nodeId: string, potentialAncestorId: string, nodes: FileNode[]): boolean => {
    for (const node of nodes) {
      if (node.id === nodeId) {
        return false; // Encontramos el nodo, no es descendiente
      }
      if (node.id === potentialAncestorId && node.children) {
        // Buscar recursivamente en los hijos
        const searchInChildren = (children: FileNode[]): boolean => {
          for (const child of children) {
            if (child.id === nodeId) {
              return true; // Es descendiente
            }
            if (child.children && searchInChildren(child.children)) {
              return true;
            }
          }
          return false;
        };
        return searchInChildren(node.children);
      }
      if (node.children && isDescendantOf(nodeId, potentialAncestorId, node.children)) {
        return true;
      }
    }
    return false;
  };

  const handleDrop = async (draggedItem: FileNode, targetFolder: FileNode) => {
    try {
      // Prevenir mover una carpeta dentro de sí misma o de sus subcarpetas
      if (draggedItem.type === "folder" && 
          (draggedItem.id === targetFolder.id || 
           isDescendantOf(targetFolder.id, draggedItem.id, items))) {
        const { toast } = await import("sonner");
        toast.error("Cannot move a folder into itself or its subfolders");
        return;
      }

      // Llamar a la API correspondiente según el tipo de item
      if (draggedItem.type === "folder") {
        const { moveFolder } = await import("@/services/library");
        await moveFolder(draggedItem.id, targetFolder.id);
      } else if (draggedItem.type === "file") {
        const { moveDocument } = await import("@/services/documents");
        await moveDocument(draggedItem.id, targetFolder.id);
      }

      // Si la llamada a la API fue exitosa, actualizar la interfaz localmente
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

      // Refrescar la vista completa para asegurar consistencia
      onRefresh?.();
      
      // Opcional: mostrar notificación de éxito
      const { toast } = await import("sonner");
      toast.success(`${draggedItem.type === "folder" ? "Folder" : "File"} "${draggedItem.name}" moved successfully`);
      
    } catch (error) {
      console.error("Error moving item:", error);
      const { toast } = await import("sonner");
      toast.error(`Failed to move ${draggedItem.type === "folder" ? "folder" : "file"}. Please try again.`);
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
    <div className="w-full space-y-1">
      {items.map((item) => (
        <FileTreeItemWithContext
          key={item.id}
          item={item}
          level={0}
          onDrop={handleDrop}
          onSelect={handleSelect}
          onDoubleClick={handleDoubleClick}
          selectedId={selected}
          onLoadChildren={onLoadChildren}
          onRefresh={onRefresh}
          onDocumentCreated={onDocumentCreated}
          onShare={onShare}
          currentPath={[]}
        />
      ))}
    </div>
  )
}