import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet"
import { useTranslation } from "react-i18next"

interface Section {
  id: string
  name: string
  prompt: string
  dependencies: string[]
  document_id?: string
  template_id?: string
  type?: string
}

interface AddSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  documentId: string
  sectionInsertPosition?: number
  existingSections: Section[]
  onSubmit: (values: any) => void
  isPending: boolean
}

export function AddSectionDialog({
  open,
  onOpenChange,
  documentId,
  sectionInsertPosition,
  existingSections,
  onSubmit,
  isPending,
}: AddSectionDialogProps) {
  const [isFormValid, setIsFormValid] = useState(false)
  const { t } = useTranslation('assets')

  useEffect(() => {
    if (!open) {
      setIsFormValid(false)
    }
  }, [open])

  const getDescription = () => {
    if (sectionInsertPosition === -1) {
      return t('addSectionDialog.createBeginning')
    }
    if (sectionInsertPosition !== undefined && sectionInsertPosition >= 0) {
      return t('addSectionDialog.createAfterSection', { index: sectionInsertPosition + 1 })
    }
    return t('addSectionDialog.createNew')
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setIsFormValid(false)
        onOpenChange(o)
      }}
      title={t('addSectionDialog.title')}
      description={getDescription()}
      icon={PlusCircle}
      maxWidth="sm:max-w-2xl"
      maxHeight="max-h-[90vh]"
      cancelLabel={t('addSectionDialog.cancel')}
      saveAction={{
        label: isPending ? t('addSectionDialog.creating') : t('addSectionDialog.createSection'),
        disabled: !isFormValid || isPending,
        loading: isPending,
        closeOnSuccess: false,
        onClick: () => {
          (document.getElementById("add-section-form") as HTMLFormElement)?.requestSubmit()
        },
      }}
    >
      <AddSectionFormSheet
        documentId={documentId}
        onSubmit={onSubmit}
        isPending={isPending}
        existingSections={existingSections}
        onValidationChange={setIsFormValid}
      />
    </HuemulDialog>
  )
}
