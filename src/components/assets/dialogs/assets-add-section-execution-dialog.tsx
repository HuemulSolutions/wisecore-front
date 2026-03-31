import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { AddSectionExecutionForm } from "@/components/sections/sections-execution-add-form"
import type { AddSectionExecutionRequest } from "@/services/section_execution"
import { useTranslation } from "react-i18next"

interface SectionOption {
  id: string
  name: string
}

interface AddSectionExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  afterFromSectionId: string | null
  existingSections: SectionOption[]
  onSubmit: (values: AddSectionExecutionRequest) => void
  isPending: boolean
  onClose: () => void
  defaultType?: 'ai' | 'manual' | 'reference'
  defaultManualInput?: string
}

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
  const { t } = useTranslation('assets')

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
      cancelLabel={t('addSectionExecution.cancelLabel')}
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
