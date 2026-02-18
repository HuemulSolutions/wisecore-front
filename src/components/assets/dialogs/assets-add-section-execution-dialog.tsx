import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { AddSectionExecutionForm } from "@/components/sections/sections-execution-add-form"
import type { AddSectionExecutionRequest } from "@/services/section_execution"

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
}

export function AddSectionExecutionDialog({
  open,
  onOpenChange,
  afterFromSectionId,
  existingSections,
  onSubmit,
  isPending,
  onClose,
}: AddSectionExecutionDialogProps) {
  const [isFormValid, setIsFormValid] = useState(false)

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
      title="Add Section Content"
      description={
        afterFromSectionId 
          ? "Create a new section after the selected section in this execution. It will also be added permanently to the document."
          : "Create a new section at the beginning of this execution. It will also be added permanently to the document."
      }
      icon={PlusCircle}
      maxWidth="xl"
      maxHeight="90vh"
      showDefaultFooter
      onCancel={handleCancel}
      submitLabel="Add Section"
      cancelLabel="Cancel"
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
      />
    </ReusableDialog>
  )
}
