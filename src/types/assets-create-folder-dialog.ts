import type { ReactNode } from 'react'

export interface CreateFolderLegacyProps {
  trigger: ReactNode
  parentFolder?: string
  onFolderCreated?: () => void
}
