export interface AddContextDialogProps {
  /** Document ID to add context to */
  documentId: string
  /** Controlled open state */
  open: boolean
  /** Called when the dialog requests to open or close */
  onOpenChange: (open: boolean) => void
}
