import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"

interface LifecyclePublishDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { comment: string; run_external_publish: boolean }) => void
  isProcessing?: boolean
}

export function LifecyclePublishDialog({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
}: LifecyclePublishDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  const [comment, setComment] = useState("")
  const [runExternalPublish, setRunExternalPublish] = useState(true)

  useEffect(() => {
    if (!open) {
      setComment("")
      setRunExternalPublish(false)
    }
  }, [open])

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t("lifecycle.publishTitle")}
      description={t("lifecycle.publishDescription")}
      cancelLabel={t("common:cancel", "Cancel")}
      saveAction={{
        label: t("lifecycle.publishConfirm"),
        onClick: () => onConfirm({ comment, run_external_publish: runExternalPublish }),
        loading: isProcessing,
      }}
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="publish-comment">{t("lifecycle.commentLabel")}</Label>
          <Textarea
            id="publish-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t("lifecycle.commentPlaceholder")}
            disabled={isProcessing}
            rows={3}
          />
        </div>
        <HuemulField
          type="switch"
          label={t("lifecycle.publishWithExternalSystem")}
          name="run_external_publish"
          value={runExternalPublish}
          onChange={(v) => setRunExternalPublish(Boolean(v))}
          disabled={isProcessing}
        />
      </div>
    </HuemulDialog>
  )
}
