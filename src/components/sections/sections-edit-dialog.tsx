"use client"

import { useState } from "react"
import { Edit3 } from "lucide-react"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { EditSectionForm } from "@/components/sections/sections-edit-form"
import type { ItemForBackend, EditSectionDialogProps } from '@/types/sections'
export type { EditSectionDialogProps } from '@/types/sections'

export function EditSectionDialog({ 
  open, 
  onOpenChange, 
  item, 
  onSave, 
  existingSections = [],
  onGeneratingChange,
  hasTemplate = false,
  isTemplateSection = false
}: EditSectionDialogProps) {
  const [isFormValid, setIsFormValid] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)

  const handleSubmit = (updatedItem: ItemForBackend) => {
    onSave(updatedItem)
    onOpenChange(false)
  }

  return (
    <HuemulDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Edit Section"
      description="Make changes to the section information and content."
      icon={Edit3}
      maxWidth="sm:max-w-3xl"
      maxHeight="max-h-[90vh]"
      saveAction={{
        label: isGenerating ? "Generating..." : "Save Changes",
        icon: Edit3,
        disabled: !isFormValid || isGenerating,
        closeOnSuccess: false,
        onClick: () => {
          (document.getElementById("edit-section-form") as HTMLFormElement)?.requestSubmit();
        },
      }}
    >
      <EditSectionForm
        item={item}
        onSubmit={handleSubmit}
        existingSections={existingSections}
        onValidationChange={setIsFormValid}
        onGeneratingChange={(generating) => {
          setIsGenerating(generating)
          onGeneratingChange?.(generating)
        }}
        hasTemplate={hasTemplate}
        isTemplateSection={isTemplateSection}
      />
    </HuemulDialog>
  )
}
