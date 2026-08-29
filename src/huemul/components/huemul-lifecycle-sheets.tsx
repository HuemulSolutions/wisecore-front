import { useTranslation } from "react-i18next"
import { LifecycleReviewSheet } from "@/components/ui/lifecycle-review-sheet"
import { LifecycleRollbackSheet } from "@/components/ui/lifecycle-rollback-sheet"
import { LifecyclePublishSheet } from "@/components/ui/lifecycle-publish-sheet"
import { LifecycleCommentSheet } from "@/components/ui/lifecycle-comment-sheet"
import { LifecycleRequiredCustomFieldsDialog } from "@/components/ui/lifecycle-required-custom-fields-dialog"
import { AssignVersionDialog } from "@/components/assets/dialogs/assets-assign-version-dialog"
import type { HuemulLifecycleSheetsProps } from "@/types/lifecycle"

/**
 * Mounts the seven confirmation sheets/dialogs (complete/return, publish,
 * archive, restore, assign version, required custom fields) for a
 * `useLifecycleActions` controller. Kept separate from `HuemulLifecycleActions`
 * because assets-content renders the action buttons twice (mobile header +
 * desktop metadata row) but only needs one copy of these sheets.
 */
export function HuemulLifecycleSheets({
  controller,
  executionId,
  organizationId,
  existingVersions,
}: HuemulLifecycleSheetsProps) {
  const { t } = useTranslation(["assets", "common"])
  const { status, progress, finalLifecycleStage } = controller

  // Ir al tab de campos personalizados cierra el sheet que lo lanzó: el tab
  // vive en el sidebar, tapado por el overlay del sheet.
  const goToCustomFields = controller.onOpenCustomFields
    ? () => {
        controller.setIsCheckDialogOpen(false)
        controller.setIsRequiredCustomFieldsDialogOpen(false)
        controller.onOpenCustomFields!()
      }
    : undefined

  const nextStepBlock = progress.nextStep
    ? {
        label: t("lifecycle.nextStepLabel"),
        value: progress.nextStep.name ?? t(`lifecycle.stageLabels.${progress.nextStep.stage}`, { defaultValue: progress.nextStep.stage }),
        stage: progress.nextStep.stage,
      }
    : null

  // Archivar sin publicar (aprobado, y el tipo de activo sí llega a "publish")
  // salta directo el paso de publicación — mismo criterio que el warning rojo.
  const isArchivingUnpublished = status?.state === "approved" && finalLifecycleStage === "publish"
  const archiveDescription = isArchivingUnpublished
    ? t("lifecycle.archiveFromApprovedDescription")
    : status?.version
      ? t("lifecycle.archivePublishedVersionDescription", { version: status.version })
      : t("lifecycle.archiveDescription")

  return (
    <>
      <LifecycleReviewSheet
        controller={controller}
        executionId={executionId}
        organizationId={organizationId}
        existingVersions={existingVersions}
        onGoToCustomFields={goToCustomFields}
      />

      <LifecycleRollbackSheet
        open={controller.isRejectDialogOpen}
        onOpenChange={(open) => !controller.rejectMutation.isPending && controller.setIsRejectDialogOpen(open)}
        executionId={executionId ?? null}
        organizationId={organizationId!}
        onConfirm={(options) => controller.rejectMutation.mutate(options)}
        isProcessing={controller.rejectMutation.isPending}
        progress={progress}
      />

      <LifecyclePublishSheet
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
        version={status?.version ?? null}
        progress={progress}
      />

      <LifecycleCommentSheet
        open={controller.isArchiveDialogOpen}
        onOpenChange={(open) => !controller.advanceMutation.isPending && controller.setIsArchiveDialogOpen(open)}
        title={t("lifecycle.archiveTitle")}
        description={archiveDescription}
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
        warning={isArchivingUnpublished ? t("lifecycle.archiveUnpublishedWarning") : undefined}
        progress={progress}
        next={nextStepBlock}
      />

      <LifecycleCommentSheet
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
        progress={progress}
        next={nextStepBlock}
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
