import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Zap, GitCompare, Loader2 } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import MdxEditor from "@/components/layout/mdx-editor"

type ChangeSummaryStatus = "pending" | "completed" | "failed" | null

interface LifecycleReviewDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: (data: { comment: string; run_external_review: boolean }) => void
  hasExternalReview: boolean
  isProcessing?: boolean
  /** When true, this is the approval step: shows "Cambios de la versión" instead of a plain comment. */
  isApprovalStep?: boolean
  changeSummary?: string | null
  changeSummaryStatus?: ChangeSummaryStatus
  changeSummaryError?: string | null
  /** Whether there is a previous version to compare against. */
  canViewChanges?: boolean
  onViewChanges?: () => void
  /** True while the change summary is still being fetched/generated. */
  isSummaryLoading?: boolean
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
  isApprovalStep = false,
  changeSummary = null,
  changeSummaryStatus = null,
  changeSummaryError = null,
  canViewChanges = false,
  onViewChanges,
  isSummaryLoading = false,
}: LifecycleReviewDialogProps) {
  const { t } = useTranslation(["assets", "common"])
  const [comment, setComment] = useState("")
  const [seeded, setSeeded] = useState(false)

  useEffect(() => {
    if (!open) {
      setComment("")
      setSeeded(false)
    }
  }, [open])

  // Seed the editor once the change summary has finished loading.
  // `seeded` flips in the same batch as `setComment`, so remounting the
  // MdxEditor (uncontrolled) on `seeded` picks up the populated value.
  useEffect(() => {
    if (open && isApprovalStep && !isSummaryLoading && changeSummary && !seeded) {
      setComment(changeSummary)
      setSeeded(true)
    }
  }, [open, isApprovalStep, isSummaryLoading, changeSummary, seeded])

  const isEditorDisabled = isProcessing || (isApprovalStep && isSummaryLoading)

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      maxWidth="sm:max-w-3xl"
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
          <div className="flex items-center justify-between">
            <Label htmlFor="review-comment">
              {isApprovalStep ? t("lifecycle.changeSummaryLabel") : t("lifecycle.commentLabel")}
            </Label>
            {isApprovalStep && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 gap-1.5 hover:cursor-pointer"
                disabled={!canViewChanges}
                onClick={onViewChanges}
              >
                <GitCompare className="h-3.5 w-3.5" />
                {t("lifecycle.viewChanges")}
              </Button>
            )}
          </div>

          {isApprovalStep ? (
            <>
              {isSummaryLoading && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground py-3">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("lifecycle.generatingSummary")}
                </div>
              )}
              {!isSummaryLoading && changeSummaryStatus === "failed" && (
                <Alert variant="destructive" className="mb-2">
                  <AlertDescription>
                    {changeSummaryError || t("lifecycle.summaryFailed")}
                  </AlertDescription>
                </Alert>
              )}
              {!isSummaryLoading && (
                <MdxEditor
                  key={seeded ? "seeded" : "empty"}
                  value={comment}
                  onChange={setComment}
                />
              )}
            </>
          ) : (
            <Textarea
              id="review-comment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder={t("lifecycle.commentPlaceholder")}
              disabled={isEditorDisabled}
              rows={3}
            />
          )}
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
