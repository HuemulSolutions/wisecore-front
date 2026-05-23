import type { ReactNode } from 'react'
import type { AssetTypeWithRoles } from '@/services/asset-types'

export interface CreateDocumentTypeProps {
  trigger?: ReactNode
  onDocumentTypeCreated?: (documentType: { id: string; name: string; color: string }) => void
  open?: boolean
  onOpenChange?: (open: boolean) => void
  documentType?: AssetTypeWithRoles | null
  type?: 'document' | 'asset'
}
