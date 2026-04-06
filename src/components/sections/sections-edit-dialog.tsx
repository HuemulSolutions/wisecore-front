"use client"

import { useState } from "react"
import { Edit3 } from "lucide-react"

import { HuemulDialog } from "@/huemul/components/huemul-dialog"
import { EditSectionForm } from "@/components/sections/sections-edit-form"

interface Item {
  id: string;
  name: string;
  prompt: string;
  order: number;
  dependencies: { id: string; name: string }[];
  type?: "ai" | "manual" | "reference";
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  referenced_document_id?: string;
  template_section_id?: string;
}

interface ItemForBackend {
  id: string;
  name: string;
  type?: "ai" | "manual" | "reference";
  prompt?: string;
  output?: string;
  manual_input?: string;
  reference_section_id?: string;
  reference_mode?: "latest" | "specific";
  reference_execution_id?: string;
  order: number;
  dependencies?: string[];
  propagate_to_template?: boolean;
  propagate_to_sections?: boolean;
}

interface Section {
  id: string;
  name: string;
}

interface EditSectionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  item: Item
  onSave: (updatedItem: ItemForBackend) => void
  existingSections?: Section[]
  onGeneratingChange?: (isGenerating: boolean) => void
  hasTemplate?: boolean
  isTemplateSection?: boolean
}

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
