import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface LifecycleReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: (data: { comment: string; run_external_review: boolean }) => void
  showExternalReviewToggle: boolean
  isProcessing?: boolean
}

export function LifecycleReviewDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  showExternalReviewToggle,
  isProcessing = false,
}: LifecycleReviewDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  const [comment, setComment] = useState("")
  const [runExternalReview, setRunExternalReview] = useState(true)

  useEffect(() => {
    if (!open) {
      setComment("")
      setRunExternalReview(false)
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
        onClick: () => onConfirm({ comment, run_external_review: showExternalReviewToggle && runExternalReview }),
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
        {showExternalReviewToggle && (
          <HuemulField
            type="switch"
            label={t("lifecycle.reviewWithExternalSystem")}
            name="run_external_review"
            value={runExternalReview}
            onChange={(v) => setRunExternalReview(Boolean(v))}
            disabled={isProcessing}
          />
        )}
      </div>
    </HuemulDialog>
  )
}
