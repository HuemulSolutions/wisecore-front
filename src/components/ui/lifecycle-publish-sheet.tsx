import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Globe } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulLifecycleProgressHeader } from "@/huemul/components/huemul-lifecycle-progress-header"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import type { LifecycleProgress } from "@/types/lifecycle"

interface LifecyclePublishSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (data: { comment: string; run_external_publish: boolean }) => void
  isProcessing?: boolean
  /** Versión a publicar, si ya está asignada — nombra la descripción/confirmar. */
  version?: string | null
  progress: LifecycleProgress
}

export function LifecyclePublishSheet({
  open,
  onOpenChange,
  onConfirm,
  isProcessing = false,
  version = null,
  progress,
}: LifecyclePublishSheetProps) {
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
    <HuemulSheet
      open={open}
      onOpenChange={(o) => !isProcessing && onOpenChange(o)}
      title={t("lifecycle.publishTitle")}
      description={version ? t("lifecycle.publishVersionDescription", { version }) : t("lifecycle.publishDescription")}
      icon={Globe}
      iconVariant="tile"
      maxWidth="sm:max-w-xl"
      cancelLabel={t("common:cancel", "Cancel")}
      saveAction={{
        label: version ? t("lifecycle.publishVersionConfirm", { version }) : t("lifecycle.publishConfirm"),
        onClick: () => onConfirm({ comment, run_external_publish: runExternalPublish }),
        loading: isProcessing,
      }}
    >
      <div className="space-y-4">
        <HuemulLifecycleProgressHeader
          progress={progress}
          next={
            progress.nextStep
              ? {
                  label: t("lifecycle.nextStepLabel"),
                  value: progress.nextStep.name ?? progress.nextStep.stage,
                  stage: progress.nextStep.stage,
                }
              : null
          }
        />
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
    </HuemulSheet>
  )
}
