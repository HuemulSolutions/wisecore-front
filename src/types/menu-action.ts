import type { FileNode } from "@/components/assets/assets-file-tree"

export interface MenuAction {
  variant: string
  label: string
  icon?: React.ReactNode
  onClick: (nodeId: string) => Promise<void>
  show?: (node: FileNode) => boolean
}
