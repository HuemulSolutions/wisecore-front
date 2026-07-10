import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { AddSectionExecutionForm } from "@/components/sections/sections-execution-add-form"
import { useTranslation } from "react-i18next"
import type { AddSectionExecutionSheetProps } from '@/types/assets'
export type { AddSectionExecutionSheetProps } from '@/types/assets'

export function AddSectionExecutionSheet({
  open,
  onOpenChange,
  afterFromSectionId,
  existingSections,
  onSubmit,
  isPending,
  onClose,
  defaultType,
  defaultManualInput,
}: AddSectionExecutionSheetProps) {
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
    <HuemulSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t('addSectionExecution.title')}
      description={
        afterFromSectionId
          ? t('addSectionExecution.afterDescription')
          : t('addSectionExecution.beginningDescription')
      }
      icon={PlusCircle}
      side="right"
      maxWidth="sm:max-w-xl"
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
    </HuemulSheet>
  )
}
