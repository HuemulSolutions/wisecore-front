import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { AddSectionExecutionForm } from "@/components/sections/sections-execution-add-form"
import { useTranslation } from "react-i18next"
import type { AddSectionExecutionDialogProps } from "@/types/assets-add-section-execution-dialog"
export type { AddSectionExecutionDialogProps } from "@/types/assets-add-section-execution-dialog"

export function AddSectionExecutionDialog({
  open,
  onOpenChange,
  afterFromSectionId,
  existingSections,
  onSubmit,
  isPending,
  onClose,
  defaultType,
  defaultManualInput,
}: AddSectionExecutionDialogProps) {
  const [isFormValid, setIsFormValid] = useState(false)
  const { t } = useTranslation(["assets", "common"])

  useEffect(() => {
    if (!open) {
      setIsFormValid(false)
    }
  }, [open])

  const handleCancel = () => {
    onClose()
    setIsFormValid(false)
  }

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={t('addSectionExecution.title')}
      description={
        afterFromSectionId 
          ? t('addSectionExecution.afterDescription')
          : t('addSectionExecution.beginningDescription')
      }
      icon={PlusCircle}
      maxWidth="xl"
      maxHeight="90vh"
      showDefaultFooter
      onCancel={handleCancel}
      submitLabel={t('addSectionExecution.submitLabel')}
      cancelLabel={t('common:cancel')}
      isSubmitting={isPending}
      isValid={isFormValid}
      formId="add-section-execution-form"
    >
      <AddSectionExecutionForm
        afterFromId={afterFromSectionId}
        existingSections={existingSections}
        onSubmit={onSubmit}
        isPending={isPending}
        onValidationChange={setIsFormValid}
        defaultType={defaultType}
        defaultManualInput={defaultManualInput}
      />
    </ReusableDialog>
  )
}
