import type { ReactNode } from "react"

export interface HuemulContextStripBlock {
  key: string
  label: string
  content: ReactNode
  /** El bloque ocupa el espacio sobrante (ej. un select a la derecha). Default `false`. */
  grow?: boolean
}

export interface HuemulContextStripProps {
  blocks: HuemulContextStripBlock[]
  className?: string
}
