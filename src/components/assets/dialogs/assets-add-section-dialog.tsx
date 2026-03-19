import { useState, useEffect } from "react"
import { PlusCircle } from "lucide-react"
import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { AddSectionFormSheet } from "@/components/sections/sections-add-form-sheet"

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

  useEffect(() => {
    if (!open) {
      setIsFormValid(false)
    }
  }, [open])

  const getDescription = () => {
    if (sectionInsertPosition === -1) {
      return "Create a new section at the beginning of the document."
    }
    if (sectionInsertPosition !== undefined && sectionInsertPosition >= 0) {
      return `Create a new section after section ${sectionInsertPosition + 1}.`
    }
    return "Create a new section for your document."
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={(o) => {
        if (!o) setIsFormValid(false)
        onOpenChange(o)
      }}
      title="Add New Section"
      description={getDescription()}
      icon={PlusCircle}
      maxWidth="sm:max-w-2xl"
      maxHeight="max-h-[90vh]"
      cancelLabel="Cancel"
      saveAction={{
        label: isPending ? "Creating..." : "Create Section",
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
