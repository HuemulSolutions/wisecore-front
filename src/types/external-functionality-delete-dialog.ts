import type { ExternalFunctionality } from '@/types/external-functionalities'

export interface ExternalFunctionalityDeleteDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  functionality: ExternalFunctionality | null
  onDeleted?: () => void
}
