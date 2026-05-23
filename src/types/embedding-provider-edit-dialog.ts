export interface EmbeddingProviderEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  onSubmit: (data: { name: string; key?: string; endpoint?: string; deployment?: string }) => void
  isSubmitting: boolean
}
