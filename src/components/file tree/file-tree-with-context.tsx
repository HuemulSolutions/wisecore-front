"use client"

import { useState, useEffect } from "react"
import { DndContext, DragOverlay, useSensor, useSensors, PointerSensor, MouseSensor, KeyboardSensor } from "@dnd-kit/core"
import type { DragEndEvent, DragStartEvent, DragOverEvent } from "@dnd-kit/core"
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable"
import { FileTreeItemWithContext } from "./file-tree-item-with-context"
import type { FileNode } from "./types"
import { useOrganizationId } from "@/hooks/use-organization"
import { File, Folder } from "lucide-react"

interface FileTreeWithContextProps {
  items: FileNode[]
  onSelect?: (item: FileNode) => void
  onDoubleClick?: (item: FileNode) => void
  selectedId?: string
  onLoadChildren?: (folderId: string) => Promise<FileNode[]>
  onRefresh?: () => void
  onDocumentCreated?: (document: { id: string; name: string; type: "document" }) => void
  onShare?: (item: FileNode, fullPath: string[], isAutomatic?: boolean) => void
}

export function FileTreeWithContext({ 
  items: initialItems, 
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
  const [activeItem, setActiveItem] = useState<FileNode | null>(null)
  const selectedOrganizationId = useOrganizationId()

  // Configure sensors for drag and drop
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 3, // Reduced distance for better detection
        delay: 50, // Shorter delay for more responsive drag
        tolerance: 0, // No tolerance to ensure immediate detection
      },
    }),
    // MouseSensor as fallback for when dev tools interfere with PointerSensor
    useSensor(MouseSensor, {
      activationConstraint: {
        distance: 3,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )
  
  // Si no hay organización seleccionada, no renderizar nada
  if (!selectedOrganizationId) {
    return null;
  }

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

  // dnd-kit event handlers
  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event
    const draggedItem = items.find(item => item.id === active.id) ||
                       findItemInTree(items, active.id as string)
    if (draggedItem) {
      setActiveItem(draggedItem)
    }
  }

  const handleDragOver = (_event: DragOverEvent) => {
    // Could add visual feedback here if needed
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    setActiveItem(null)

    if (!over || active.id === over.id) {
      return
    }

    const draggedItem = findItemInTree(items, active.id as string)
    const targetItem = findItemInTree(items, over.id as string)

    if (!draggedItem || !targetItem || targetItem.type !== "folder") {
      return
    }

    await handleDrop(draggedItem, targetItem)
  }

  // Helper function to find item in tree
  const findItemInTree = (nodes: FileNode[], id: string): FileNode | null => {
    for (const node of nodes) {
      if (node.id === id) return node
      if (node.children) {
        const found = findItemInTree(node.children, id)
        if (found) return found
      }
    }
    return null
  }

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
        await moveFolder(draggedItem.id, targetFolder.id, selectedOrganizationId);
      } else if (draggedItem.type === "file") {
        const { moveDocument } = await import("@/services/documents");
        await moveDocument(draggedItem.id, targetFolder.id, selectedOrganizationId);
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
    <DndContext
      sensors={sensors}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveItem(null)}
      autoScroll={false}
    >
      <div className="w-full space-y-0.5">
        {items.map((item) => (
          <FileTreeItemWithContext
            key={item.id}
            item={item}
            level={0}
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
      
      <DragOverlay>
        {activeItem && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-background border-2 border-primary/20 shadow-xl opacity-95 transform rotate-3">
            {activeItem.type === "folder" ? (
              <Folder className="w-4 h-4 text-primary" />
            ) : (
              <File className="w-4 h-4 text-muted-foreground" />
            )}
            <span className="text-sm font-medium">{activeItem.name}</span>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}