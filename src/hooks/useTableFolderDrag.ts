import { useCallback, useEffect, useRef, useState } from "react"
import type { HuemulTableFolders } from "@/types/huemul"

// Milisegundos de hover sobre una carpeta cerrada antes de auto-expandirla durante
// un drag — confirmado contra el prototipo de referencia (Tabla con Carpetas.dc.html).
const AUTO_EXPAND_DELAY_MS = 650

export type TableDropTarget =
  | { t: "folder"; id: string }
  | { t: "gap"; index: number }

/**
 * Estado y handlers de drag & drop HTML5 nativo para `HuemulTable` cuando se usa la
 * prop `folders`. Sin dependencias externas (no dnd-kit): dentro de `HuemulTable` el
 * `<tr>` es nuestro, así que no hace falta el truco `node.closest('tr')` que necesitó
 * la implementación anterior en `assets-types-table.tsx`.
 *
 * `getItemByKey` resuelve una row key al ítem `T` — el hook no conoce `data` directo,
 * así evita recibir el array completo y quedar atado a su identidad entre renders.
 */
export function useTableFolderDrag<T>(
  folders: HuemulTableFolders<T> | undefined,
  getItemByKey: (key: string) => T | undefined,
) {
  const [dragKey, setDragKey] = useState<string | null>(null)
  const [dropTarget, setDropTarget] = useState<TableDropTarget | null>(null)
  const hoverTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hoverFolderIdRef = useRef<string | null>(null)

  const canDrag = folders?.canDragRows !== false
  const autoExpand = folders?.autoExpandOnHover !== false

  const clearHoverTimer = useCallback(() => {
    if (hoverTimerRef.current) {
      clearTimeout(hoverTimerRef.current)
      hoverTimerRef.current = null
    }
    hoverFolderIdRef.current = null
  }, [])

  useEffect(() => clearHoverTimer, [clearHoverTimer])

  const scheduleAutoExpand = useCallback(
    (folderId: string) => {
      if (!autoExpand || !folders || folders.openFolders.has(folderId)) return
      if (hoverFolderIdRef.current === folderId) return
      clearHoverTimer()
      hoverFolderIdRef.current = folderId
      hoverTimerRef.current = setTimeout(() => {
        if (!folders.openFolders.has(folderId)) {
          folders.onOpenFoldersChange(new Set(folders.openFolders).add(folderId))
        }
      }, AUTO_EXPAND_DELAY_MS)
    },
    [autoExpand, folders, clearHoverTimer],
  )

  const endDrag = useCallback(() => {
    clearHoverTimer()
    setDragKey(null)
    setDropTarget(null)
  }, [clearHoverTimer])

  const rowDragProps = useCallback(
    (key: string) => {
      if (!canDrag) return {}
      return {
        draggable: true,
        onDragStart: (e: React.DragEvent) => {
          e.dataTransfer.effectAllowed = "move"
          try {
            e.dataTransfer.setData("text/plain", key)
          } catch {
            /* algunos navegadores no permiten setData en ciertos contextos; el resto del flujo no depende de ese valor */
          }
          setDragKey(key)
          setDropTarget(null)
        },
        onDragEnd: endDrag,
      }
    },
    [canDrag, endDrag],
  )

  const folderDropProps = useCallback(
    (folderId: string) => {
      return {
        onDragOver: (e: React.DragEvent) => {
          if (!dragKey || !folders) return
          e.preventDefault()
          e.stopPropagation()
          scheduleAutoExpand(folderId)
          setDropTarget((prev) => (prev?.t === "folder" && prev.id === folderId ? prev : { t: "folder", id: folderId }))
        },
        onDragLeave: () => {
          if (hoverFolderIdRef.current === folderId) clearHoverTimer()
        },
        onDrop: (e: React.DragEvent) => {
          if (!dragKey || !folders) return
          e.preventDefault()
          e.stopPropagation()
          const item = getItemByKey(dragKey)
          endDrag()
          if (item && folders.getFolderId(item) !== folderId) {
            folders.onMoveRow(item, folderId)
          }
        },
      }
    },
    [dragKey, folders, getItemByKey, scheduleAutoExpand, clearHoverTimer, endDrag],
  )

  const gapDropProps = useCallback(
    (index: number) => {
      return {
        onDragOver: (e: React.DragEvent<HTMLElement>) => {
          if (!dragKey) return
          e.preventDefault()
          e.stopPropagation()
          clearHoverTimer()
          const rect = e.currentTarget.getBoundingClientRect()
          const idx = e.clientY - rect.top > rect.height / 2 ? index + 1 : index
          setDropTarget((prev) => (prev?.t === "gap" && prev.index === idx ? prev : { t: "gap", index: idx }))
        },
        onDrop: (e: React.DragEvent) => {
          if (!dragKey || !folders) return
          e.preventDefault()
          e.stopPropagation()
          const item = getItemByKey(dragKey)
          const resolvedIndex = dropTarget?.t === "gap" ? dropTarget.index : index
          endDrag()
          // Un ítem que ya está en la raíz soltado entre otras filas de raíz es un
          // no-op: `HuemulTable` no reordena `data` en cliente, así que no hay nada
          // que mover — evita disparar `onMoveRow` (y su toast) sin motivo.
          if (item && folders.getFolderId(item) !== null) {
            folders.onMoveRow(item, null, resolvedIndex)
          }
        },
      }
    },
    [dragKey, folders, getItemByKey, dropTarget, clearHoverTimer, endDrag],
  )

  const bodyDropProps = useCallback(
    (rootLength: number) => {
      return {
        onDragOver: (e: React.DragEvent) => {
          if (dragKey) e.preventDefault()
        },
        onDrop: (e: React.DragEvent) => {
          if (!dragKey || !folders) return
          e.preventDefault()
          const item = getItemByKey(dragKey)
          const resolvedIndex = dropTarget?.t === "gap" ? dropTarget.index : rootLength
          endDrag()
          if (item && folders.getFolderId(item) !== null) {
            folders.onMoveRow(item, null, resolvedIndex)
          }
        },
      }
    },
    [dragKey, folders, getItemByKey, dropTarget, endDrag],
  )

  return {
    dragKey,
    dropTarget,
    isDragging: dragKey !== null,
    rowDragProps,
    folderDropProps,
    gapDropProps,
    bodyDropProps,
  }
}
