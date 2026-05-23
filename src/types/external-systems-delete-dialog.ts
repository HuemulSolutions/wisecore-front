import type { ExternalSystem } from '@/types/external-systems'

export interface ExternalSystemDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
  onDeleted?: () => void
}
