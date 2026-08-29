import { useState, useEffect } from "react"
import { AlertTriangle } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulLifecycleProgressHeader } from "@/huemul/components/huemul-lifecycle-progress-header"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import type { LifecycleCommentDialogProps } from '@/types/lifecycle'
export type { LifecycleCommentDialogProps } from '@/types/lifecycle'

/** Sheet genérico de comentario — hoy lo usan archivar y restaurar. */
export function LifecycleCommentSheet({
  open,
  onOpenChange,
  title,
  onConfirm,
  confirmLabel = "Confirm",
  // Sin default: `undefined` deja que HuemulSheet use su "Cancelar" traducido.
  cancelLabel,
  commentLabel = "Comment",
  commentPlaceholder = "Add a comment...",
  isProcessing = false,
  variant = "default",
  icon,
  warning,
  progress,
  next,
}: LifecycleCommentDialogProps) {
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (!open) {
      setComment("")
    }
  }, [open])

  return (
    <HuemulSheet
      open={open}
      onOpenChange={(o) => !isProcessing && onOpenChange(o)}
      title={title}
      icon={icon}
      iconVariant="tile"
      maxWidth="sm:max-w-xl"
      cancelLabel={cancelLabel}
      saveAction={{
        label: confirmLabel,
        onClick: () => onConfirm(comment),
        variant: variant === "destructive" ? "destructive" : "default",
        loading: isProcessing,
      }}
    >
      <div className="space-y-4">
        {progress && <HuemulLifecycleProgressHeader progress={progress} next={next} />}
        {warning && (
          <Alert variant="destructive">
            <AlertTriangle />
            <AlertDescription>{warning}</AlertDescription>
          </Alert>
        )}
        <div className="space-y-2">
          <Label htmlFor="lifecycle-comment">{commentLabel}</Label>
          <Textarea
            id="lifecycle-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={commentPlaceholder}
            disabled={isProcessing}
            rows={3}
          />
        </div>
      </div>
    </HuemulSheet>
  )
}
