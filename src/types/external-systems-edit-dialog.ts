import type { ExternalSystem } from '@/types/external-systems'

export interface ExternalSystemEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  system: ExternalSystem | null
}
