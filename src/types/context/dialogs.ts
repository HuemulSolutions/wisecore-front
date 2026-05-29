import type { ContextItem } from './core'

export interface AddContextDialogProps {
  /** Document ID to add context to */
  documentId: string
  /** Controlled open state */
  open: boolean
  /** Called when the dialog requests to open or close */
  onOpenChange: (open: boolean) => void
}

export interface DeleteContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => Promise<void>
}

export interface EditContextDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  context: ContextItem | null
  onConfirm: (id: string, name: string, content: string) => void
  isProcessing: boolean
}
