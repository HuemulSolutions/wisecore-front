import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { AddSectionExecutionForm } from "@/components/sections/sections-execution-add-form"
import { useTranslation } from "react-i18next"
import type { AddSectionExecutionDialogProps } from '@/types/assets'
export type { AddSectionExecutionDialogProps } from '@/types/assets'

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

  const handleOpenChange = (open: boolean) => {
    onOpenChange(open)
    if (!open) onClose()
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={handleOpenChange}
      title={t('addSectionExecution.title')}
      description={
        afterFromSectionId 
          ? t('addSectionExecution.afterDescription')
          : t('addSectionExecution.beginningDescription')
      }
      icon={PlusCircle}
      maxWidth="sm:max-w-xl"
      maxHeight="max-h-[90vh]"
      cancelLabel={t('common:cancel')}
      saveAction={{
        label: t('addSectionExecution.submitLabel'),
        loading: isPending,
        disabled: !isFormValid || isPending,
        closeOnSuccess: false,
        onClick: () => {
          const form = document.getElementById('add-section-execution-form') as HTMLFormElement | null
          form?.requestSubmit()
        },
      }}
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
    </HuemulDialog>
  )
}
