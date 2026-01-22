import type { FileNode } from "@/types/assets"

export interface MenuAction {
  variant: string
  label: string
  icon?: React.ReactNode
  onClick: (nodeId: string) => Promise<void>
  show?: (node: FileNode) => boolean
}
