import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Zap } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface LifecycleReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: (data: { comment: string; run_external_review: boolean }) => void
  hasExternalReview: boolean
  isProcessing?: boolean
}

export function LifecycleReviewDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  hasExternalReview,
  isProcessing = false,
}: LifecycleReviewDialogProps) {
  const { t } = useTranslation(["assets", "common"])
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
      cancelLabel={t("common:cancel", "Cancel")}
      saveAction={{
        label: confirmLabel,
        onClick: () => onConfirm({ comment, run_external_review: hasExternalReview }),
        loading: isProcessing,
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="review-comment">{t("lifecycle.commentLabel")}</Label>
          <Textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("lifecycle.commentPlaceholder")}
            disabled={isProcessing}
            rows={3}
          />
        </div>
        {hasExternalReview && (
          <Alert>
            <Zap />
            <AlertDescription>{t("lifecycle.externalReviewWillRun")}</AlertDescription>
          </Alert>
        )}
      </div>
    </HuemulDialog>
  )
}
