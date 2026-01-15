import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { AddSectionExecutionForm } from "@/components/sections/sections-execution-add-form"

interface AddSectionExecutionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  afterFromSectionId: string | null
  onSubmit: (values: { name: string; output: string; after_from?: string }) => void
  isPending: boolean
  onClose: () => void
}

export function AddSectionExecutionDialog({
  open,
  onOpenChange,
  afterFromSectionId,
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
          ? "Add new content after the selected section in this execution."
          : "Add new content at the beginning of this execution."
      }
      icon={PlusCircle}
      maxWidth="lg"
      maxHeight="80vh"
      showDefaultFooter
      onCancel={handleCancel}
      submitLabel="Add Section"
      cancelLabel="Cancel"
      isSubmitting={isPending}
      isValid={isFormValid}
      formId="add-section-execution-form"
    >
      <AddSectionExecutionForm
        afterFromId={afterFromSectionId || undefined}
        onSubmit={onSubmit}
        isPending={isPending}
        onValidationChange={setIsFormValid}
      />
    </ReusableDialog>
  )
}
