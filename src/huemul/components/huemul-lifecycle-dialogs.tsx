import { useTranslation } from "react-i18next"
import { LifecycleReviewDialog } from "@/components/ui/lifecycle-review-dialog"
import { LifecycleRollbackDialog } from "@/components/ui/lifecycle-rollback-dialog"
import { LifecyclePublishDialog } from "@/components/ui/lifecycle-publish-dialog"
import { LifecycleCommentDialog } from "@/components/ui/lifecycle-comment-dialog"
import { LifecycleRequiredCustomFieldsDialog } from "@/components/ui/lifecycle-required-custom-fields-dialog"
import { AssignVersionDialog } from "@/components/assets/dialogs/assets-assign-version-dialog"
import type { HuemulLifecycleDialogsProps } from "@/types/lifecycle"

/**
 * Mounts the six confirmation dialogs (complete/return, publish, archive,
 * restore, assign version, required custom fields) for a `useLifecycleActions`
 * controller. Kept separate from `HuemulLifecycleActions` because
 * assets-content renders the action buttons twice (mobile header + desktop
 * metadata row) but only needs one copy of these dialogs.
 */
export function HuemulLifecycleDialogs({
  controller,
  executionId,
  organizationId,
  existingVersions,
}: HuemulLifecycleDialogsProps) {
  const { t } = useTranslation(["assets", "common"])
  const { status } = controller

  // Ir al tab de campos personalizados cierra el diálogo que lo lanzó: el tab
  // vive en el sidebar, tapado por el overlay del diálogo.
  const goToCustomFields = controller.onOpenCustomFields
    ? () => {
        controller.setIsCheckDialogOpen(false)
        controller.setIsRequiredCustomFieldsDialogOpen(false)
        controller.onOpenCustomFields!()
      }
    : undefined

  return (
    <>
      <LifecycleReviewDialog
        open={controller.isCheckDialogOpen}
        onOpenChange={(open) => !controller.checkMutation.isPending && controller.setIsCheckDialogOpen(open)}
        title={status?.will_advance_phase ? t("lifecycle.advanceStateTitle") : t("lifecycle.advanceStepTitle")}
        description={
          status?.will_advance_phase ? t("lifecycle.advanceStateDescription") : t("lifecycle.advanceStepDescription")
        }
        onConfirm={(data) => controller.checkMutation.mutate(data)}
        confirmLabel={status?.will_advance_phase ? t("lifecycle.advanceStateConfirm") : t("lifecycle.advanceStepConfirm")}
        hasExternalReview={controller.hasExternalReview}
        isProcessing={controller.checkMutation.isPending}
        isApprovalStep={controller.isApprovalStep}
        changeSummary={controller.changeSummary}
        changeSummaryStatus={controller.changeSummaryStatus}
        changeSummaryError={controller.changeSummaryError}
        canViewChanges={controller.canViewChanges}
        isSummaryLoading={controller.isSummaryLoading}
        onViewChanges={controller.handleViewChanges}
        missingRequiredCustomFields={controller.missingRequiredCustomFields}
        onGoToCustomFields={goToCustomFields}
      />

      <LifecycleRollbackDialog
        open={controller.isRejectDialogOpen}
        onOpenChange={(open) => !controller.rejectMutation.isPending && controller.setIsRejectDialogOpen(open)}
        executionId={executionId ?? null}
        organizationId={organizationId!}
        onConfirm={(options) => controller.rejectMutation.mutate(options)}
        isProcessing={controller.rejectMutation.isPending}
      />

      <LifecyclePublishDialog
        open={controller.isPublishDialogOpen}
        onOpenChange={(open) => !controller.advanceMutation.isPending && controller.setIsPublishDialogOpen(open)}
        onConfirm={({ comment, run_external_publish }) =>
          controller.advanceMutation.mutate({
            comment,
            publish_step_id: status?.current_step_id ?? undefined,
            run_external_publish: run_external_publish || undefined,
          })
        }
        isProcessing={controller.advanceMutation.isPending}
      />

      <LifecycleCommentDialog
        open={controller.isArchiveDialogOpen}
        onOpenChange={(open) => !controller.advanceMutation.isPending && controller.setIsArchiveDialogOpen(open)}
        title={t("lifecycle.archiveTitle")}
        description={
          status?.state === "approved" && controller.finalLifecycleStage === "publish"
            ? t("lifecycle.archiveFromApprovedDescription")
            : t("lifecycle.archiveDescription")
        }
        onConfirm={(comment) =>
          controller.advanceMutation.mutate({
            comment,
            skip_published: status?.state === "approved",
          })
        }
        confirmLabel={t("lifecycle.archiveConfirm")}
        commentLabel={t("lifecycle.commentLabel")}
        commentPlaceholder={t("lifecycle.commentPlaceholder")}
        isProcessing={controller.advanceMutation.isPending}
        variant="destructive"
      />

      <LifecycleCommentDialog
        open={controller.isRestoreDialogOpen}
        onOpenChange={(open) => !controller.restoreMutation.isPending && controller.setIsRestoreDialogOpen(open)}
        title={t("lifecycle.restoreTitle")}
        description={t("lifecycle.restoreDescription")}
        onConfirm={(comment) => controller.restoreMutation.mutate({ comment })}
        confirmLabel={t("lifecycle.restoreConfirm")}
        commentLabel={t("lifecycle.commentLabel")}
        commentPlaceholder={t("lifecycle.commentPlaceholder")}
        isProcessing={controller.restoreMutation.isPending}
        variant="destructive"
      />

      <AssignVersionDialog
        open={controller.isAssignVersionDialogOpen}
        onOpenChange={(open) => {
          if (controller.assignVersionMutation.isPending) return
          controller.setIsAssignVersionDialogOpen(open)
        }}
        onConfirm={(version) => controller.assignVersionMutation.mutate(version)}
        isProcessing={controller.assignVersionMutation.isPending}
        executionId={executionId}
        organizationId={organizationId}
        existingVersions={existingVersions}
      />

      <LifecycleRequiredCustomFieldsDialog
        open={controller.isRequiredCustomFieldsDialogOpen}
        onOpenChange={controller.setIsRequiredCustomFieldsDialogOpen}
        fieldNames={controller.requiredCustomFieldsError}
        onGoToCustomFields={goToCustomFields}
      />
    </>
  )
}
