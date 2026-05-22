import type { ReactNode } from "react"

export interface NetworkNode {
  id: string
  label: string
  fullLabel: string
  x: number
  y: number
  icon: ReactNode
  type: "document"
  dependencyCount?: number
  documentType?: { id: string; name: string; color: string }
}

export interface Connection {
  from: string
  to: string
  type: "dependency"
}

export interface Viewport {
  x: number
  y: number
  scale: number
}

export interface DragState {
  isDragging: boolean
  nodeId: string | null
  startX: number
  startY: number
  offsetX: number
  offsetY: number
}

export interface NetworkGraphProps {
  documents?: any[]
}
