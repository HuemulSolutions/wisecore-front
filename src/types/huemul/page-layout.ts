import type { ReactNode, RefObject } from 'react'
import type { ImperativePanelHandle } from 'react-resizable-panels'

export interface HuemulColumnSection {
  content: ReactNode
  show?: boolean
  resizable?: boolean
  defaultSize?: number
  minSize?: number
  maxSize?: number
  collapsible?: boolean
  collapsedSize?: number
  onCollapse?: () => void
  onExpand?: () => void
  panelRef?: RefObject<ImperativePanelHandle | null>
  className?: string
}

export interface HuemulPageLayoutColumn {
  content: ReactNode
  defaultSize?: number
  minSize?: number
  maxSize?: number
  show?: boolean
  collapsible?: boolean
  collapsedSize?: number
  onCollapse?: () => void
  onExpand?: () => void
  panelRef?: RefObject<ImperativePanelHandle | null>
  resizable?: boolean
  className?: string
  header?: HuemulColumnSection
  footer?: HuemulColumnSection
}

export interface HuemulPageLayoutProps {
  header?: ReactNode
  showHeader?: boolean
  columns: HuemulPageLayoutColumn[]
  className?: string
  headerClassName?: string
  bodyClassName?: string
  withHandle?: boolean
  direction?: "horizontal" | "vertical"
}
