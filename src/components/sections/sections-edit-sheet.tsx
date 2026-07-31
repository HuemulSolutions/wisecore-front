"use client"

import { useState, useEffect, useRef } from "react"
import { Edit3 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { EditSectionForm } from "@/components/sections/sections-edit-form"
import { useOptionalEditingGuard } from "@/contexts/editing-guard-context"
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
  isTemplateSection = false,
  documentId,
  templateId,
  executionId,
}: EditSectionDialogProps) {
  const [isFormValid, setIsFormValid] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const isDirtyRef = useRef(false)
  const isExplicitCancel = useRef(false)
  const isClosingRef = useRef(false)
  const { t } = useTranslation(["sections", "common"])
  const { guardedAction, setIsSectionEditing } = useOptionalEditingGuard()

  // Reset all flags when dialog opens
  useEffect(() => {
    if (open) {
      isDirtyRef.current = false
      isExplicitCancel.current = false
      isClosingRef.current = false
    }
  }, [open])

  const handleDirtyChange = (dirty: boolean) => {
    // Ignore dirty events fired by editors during close animation (still mounted)
    if (isClosingRef.current) return
    isDirtyRef.current = dirty
    setIsSectionEditing(dirty)
  }

  const startClose = () => {
    isClosingRef.current = true
    isDirtyRef.current = false
    setIsSectionEditing(false)
  }

  const handleCancel = () => {
    isExplicitCancel.current = true
    startClose()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen && isDirtyRef.current && !isExplicitCancel.current) {
      guardedAction(() => {
        startClose()
        onOpenChange(false)
      })
    } else {
      isExplicitCancel.current = false
      onOpenChange(newOpen)
    }
  }

  const handleSubmit = (updatedItem: ItemForBackend) => {
    startClose()
    onSave(updatedItem)
    onOpenChange(false)
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("sections:editDialog.title")}
      description={t("sections:editDialog.description")}
      icon={Edit3}
      cancelLabel={t("common:cancel")}
      onCancel={handleCancel}
      maxWidth="w-full sm:max-w-2xl lg:max-w-3xl"
      saveAction={{
        label: isGenerating ? t("sections:editDialog.generating") : t("sections:editDialog.save"),
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
        onDirtyChange={handleDirtyChange}
        hasTemplate={hasTemplate}
        isTemplateSection={isTemplateSection}
        documentId={documentId}
        templateId={templateId}
        executionId={executionId}
      />
    </HuemulSheet>
  )
}
