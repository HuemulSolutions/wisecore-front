import type { LucideIcon } from 'lucide-react'
import type { LifecycleProgress } from './progress'

export interface LifecycleCommentDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  onConfirm: (comment: string) => void
  confirmLabel?: string
  cancelLabel?: string
  commentLabel?: string
  commentPlaceholder?: string
  isProcessing?: boolean
  variant?: "default" | "destructive"
  icon?: LucideIcon
  /** Alerta roja adicional (ej. "se archivará sin publicar"). Omitir para no mostrarla. */
  warning?: string
  /** Stepper de fases — omitir o `isAvailable: false` para no mostrarlo. */
  progress?: LifecycleProgress
  /** Bloque destacado ("Próximo paso"). `null`/omitir para no mostrarlo. */
  next?: { label: string; value: string; tone?: "info" | "warning"; stage?: string | null } | null
}

export interface LifecycleRollbackDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  executionId: string | null
  organizationId: string
  onConfirm: (options: { comment: string; target_state?: string; target_step_id?: string }) => void
  isProcessing?: boolean
}
