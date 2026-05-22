export interface DeleteProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  onAction: () => Promise<void>
}
