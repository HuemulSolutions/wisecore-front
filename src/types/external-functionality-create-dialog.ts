export interface ExternalFunctionalityCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  organizationId: string
  systemId: string
  onSuccess?: () => void
}
