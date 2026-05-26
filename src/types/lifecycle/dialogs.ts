import type { LucideIcon } from 'lucide-react'

export interface LifecycleCommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  onConfirm: (comment: string) => void
  confirmLabel?: string
  cancelLabel?: string
  commentLabel?: string
  commentPlaceholder?: string
  isProcessing?: boolean
  variant?: "default" | "destructive"
  icon?: LucideIcon
}

export interface LifecycleRollbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executionId: string | null
  organizationId: string
  onConfirm: (options: { comment: string; target_state?: string; target_step_id?: string }) => void
  isProcessing?: boolean
}
