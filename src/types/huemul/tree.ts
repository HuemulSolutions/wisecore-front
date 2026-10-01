import type React from "react"
import type { LucideIcon } from "lucide-react"

export interface HuemulTreeNode {
  id: string
  name: string
  type: string
  children?: HuemulTreeNode[]
  isExpanded?: boolean
  isLoading?: boolean
  hasChildren?: boolean
  disabled?: boolean
  metadata?: Record<string, unknown>
  /** Total de hijos de la carpeta, si el consumidor lo conoce (alimenta el contador "25 de 143"). */
  childrenTotal?: number
  /** Cursor de la siguiente página de hijos. No nulo ⇒ el árbol pinta la fila "Mostrar más". */
  nextCursor?: string | null
  /** Páginas de hijos ya cargadas: el refresh repite exactamente esas en vez de volver a la primera. */
  loadedPages?: number
  isLoadingMore?: boolean
}

/** Qué página de hijos pide el árbol. `cursor: null` = la primera. */
export interface HuemulTreePageRequest {
  cursor: string | null
  limit: number
}

/**
 * Respuesta paginada de `onLoadChildren`. Un consumidor que devuelve un array
 * plano sigue siendo válido: el árbol lo trata como "todo cargado, sin más
 * páginas" (ver `normalizeTreePage`).
 */
export interface HuemulTreePage {
  items: HuemulTreeNode[]
  total?: number
  hasMore: boolean
  nextCursor: string | null
}

export type HuemulTreeLoadResult = HuemulTreeNode[] | HuemulTreePage

export interface HuemulTreeMenuAction {
  variant?: string
  label: string
  icon?: React.ReactNode
  onClick: (nodeId: string) => Promise<void>
  show?: (node: HuemulTreeNode) => boolean
}

/**
 * Acción contextual de la SUPERFICIE (no de un nodo): se renderiza como botón
 * en la franja de arriba del árbol. Para acciones sobre un nodo puntual, usar
 * `HuemulTreeMenuAction`.
 */
export interface HuemulTreeToolbarAction {
  /** Identidad estable de la acción (key de React, no se muestra). */
  key: string
  label: string
  /** Componente de ícono (ej. `FolderPlus`), no un elemento ya renderizado. */
  icon?: LucideIcon
  onClick: () => void | Promise<void>
  disabled?: boolean
  variant?: "outline" | "ghost" | "default"
}

export interface HuemulFileTreeLabels {
  newFile?: string
  newFolder?: string
  shareLink?: string
  deleteFolder?: string
  deleteFile?: string
  loading?: string
  empty?: string
  createFile?: string
  createFolder?: string
  inputPlaceholder?: string
  refresh?: string
}
