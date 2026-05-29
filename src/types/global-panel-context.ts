import type { ReactNode, RefObject } from 'react'
import type { ImperativePanelHandle } from 'react-resizable-panels'

export type GlobalPanelSide = "left" | "right"

export interface GlobalPanelState {
  isOpen: boolean
  side: GlobalPanelSide
  content: ReactNode | null
  title: string
  raw: boolean
  defaultSize: number
  minSize: number
  maxSize: number
}

export interface GlobalPanelContextValue extends GlobalPanelState {
  openPanel: (opts?: { side?: GlobalPanelSide; content?: ReactNode; title?: string; raw?: boolean }) => void
  closePanel: () => void
  togglePanel: (opts?: { side?: GlobalPanelSide; content?: ReactNode; title?: string; raw?: boolean }) => void
  setContent: (content: ReactNode, title?: string) => void
  setSide: (side: GlobalPanelSide) => void
  panelRef: RefObject<ImperativePanelHandle | null>
}
