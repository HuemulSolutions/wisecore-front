"use client"

import { useState, useEffect, useRef } from "react"
import { Pencil } from "lucide-react"
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
  containerName,
  loading = false,
}: EditSectionDialogProps) {
  const [isFormValid, setIsFormValid] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
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
      setIsSaving(false)
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
    if (isSaving) return
    isExplicitCancel.current = true
    startClose()
  }

  const handleOpenChange = (newOpen: boolean) => {
    // Guardando: el sheet no se cierra hasta saber si el backend aceptó el cambio.
    if (!newOpen && isSaving) return
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

  const handleSubmit = async (updatedItem: ItemForBackend) => {
    if (isSaving) return
    setIsSaving(true)
    try {
      await onSave(updatedItem)
      startClose()
      onOpenChange(false)
    } catch {
      // El error ya se notifica (onError de la mutación / global); el sheet queda abierto con lo editado.
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <HuemulSheet
      open={open}
      onOpenChange={handleOpenChange}
      title={t("sections:editDialog.title")}
      description={
        containerName
          ? t("sections:editDialog.subtitle", { name: containerName })
          : t("sections:editDialog.subtitleNoName")
      }
      icon={Pencil}
      cancelLabel={t("common:cancel")}
      onCancel={handleCancel}
      maxWidth="w-full sm:max-w-[860px]"
      bodyLoading={loading}
      footerLeft={<span className="text-xs text-[#64748b]">{t("sections:form.propagate.footerNote")}</span>}
      saveAction={{
        label: isGenerating ? t("sections:editDialog.generating") : t("sections:editDialog.save"),
        icon: Pencil,
        disabled: loading || !isFormValid || isGenerating || isSaving,
        loading: isSaving,
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
        isPending={isSaving}
      />
    </HuemulSheet>
  )
}
