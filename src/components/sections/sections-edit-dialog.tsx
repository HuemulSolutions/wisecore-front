"use client"

import { useState } from "react"
import { Edit3, Loader2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Dialog } from "@/components/ui/dialog"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <ReusableDialog
        open={open}
        onOpenChange={onOpenChange}
        title="Edit Section"
        description="Make changes to the section information and content."
        icon={Edit3}
        maxWidth="xl"
        maxHeight="90vh"
        formId="edit-section-form"
        isValid={isFormValid}
        isSubmitting={isGenerating}
        submitLabel="Save Changes"
        footer={
          <>
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="hover:cursor-pointer"
              disabled={isGenerating}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              form="edit-section-form"
              className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer"
              disabled={!isFormValid}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Edit3 className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>
          </>
        }
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
      </ReusableDialog>
    </Dialog>
  )
}