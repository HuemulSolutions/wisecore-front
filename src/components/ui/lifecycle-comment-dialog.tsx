import { useState, useEffect } from "react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { LucideIcon } from "lucide-react"

interface LifecycleCommentDialogProps {
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

export function LifecycleCommentDialog({
  open,
  onOpenChange,
  title,
  description,
  onConfirm,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  commentLabel = "Comment",
  commentPlaceholder = "Add a comment...",
  isProcessing = false,
  variant = "default",
  icon,
}: LifecycleCommentDialogProps) {
  const [comment, setComment] = useState("")

  useEffect(() => {
    if (!open) {
      setComment("")
    }
  }, [open])

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={icon}
      cancelLabel={cancelLabel}
      saveAction={{
        label: confirmLabel,
        onClick: () => onConfirm(comment),
        variant: variant === "destructive" ? "destructive" : "default",
        loading: isProcessing,
      }}
    >
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
    </HuemulDialog>
  )
}
