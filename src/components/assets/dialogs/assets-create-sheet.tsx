"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Plus, FileText, LayoutTemplate, PlusCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { createDocument } from "@/services/assets"
import { getAllTemplates } from "@/services/templates"
import { getAssetTypes } from "@/services/asset-types"
import { useOrganization } from "@/contexts/organization-context"
import type { FetchOptionsParams } from "@/huemul/components/huemul-field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { isRootAdmin } from "@/lib/jwt-utils"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import type { CreateAssetRequest, CreateAssetSheetProps } from "@/types/assets"

type ContentMode = "blank" | "template"

function CreateAssetSheetInner({ open, onOpenChange, folderId, onAssetCreated }: CreateAssetSheetProps) {
  const { selectedOrganizationId } = useOrganization()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [docTypeLabel, setDocTypeLabel] = useState("")
  const [docTypeColor, setDocTypeColor] = useState<string | undefined>(undefined)
  const [templateId, setTemplateId] = useState("")
  const [contentMode, setContentMode] = useState<ContentMode>("blank")
  const [showCreateDocTypeDialog, setShowCreateDocTypeDialog] = useState(false)

  React.useEffect(() => {
    if (open) {
      setName("")
      setDescription("")
      setInternalCode("")
      setDocumentTypeId("")
      setDocTypeLabel("")
      setDocTypeColor(undefined)
      setTemplateId("")
      setContentMode("blank")
    }
  }, [open, selectedOrganizationId])

  // Async fetch for templates (server-side search via `search`)
  const fetchTemplateOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      if (!selectedOrganizationId) return { options: [], hasMore: false }
      const res = await getAllTemplates(selectedOrganizationId, search, page, pageSize)
      return {
        options: res.data.map((tpl) => ({ value: tpl.id, label: tpl.name })),
        hasMore: res.has_next,
        totalCount: res.total,
      }
    },
    [selectedOrganizationId],
  )

  // Async fetch for document types (server-side search via `search`)
  const fetchDocumentTypeOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      const res = await getAssetTypes(page, pageSize, search)
      return {
        options: res.data.map(dt => ({ value: dt.id, label: dt.name, color: dt.color ?? undefined })),
        hasMore: res.has_next ?? false,
      }
    },
    [],
  )

  // Handle new document type creation
  const handleNewDocumentTypeCreated = (newDocType: { id: string; name: string; color: string }) => {
    // Auto-select the newly created document type
    setDocumentTypeId(newDocType.id)
    setDocTypeLabel(newDocType.name)
    setDocTypeColor(newDocType.color)

    toast.success(t('create.assetTypeCreatedAndSelected', { name: newDocType.name }))
  }

  // Handle document type dialog close
  const handleDocumentTypeDialogClose = (open: boolean) => {
    setShowCreateDocTypeDialog(open)
    // Don't let the close event bubble up to parent dialog
    if (!open) {
      // Force focus back to document type select to prevent parent dialog from closing
      setTimeout(() => {
        const selectTrigger = document.querySelector('[id="documentType"]')
        if (selectTrigger) {
          (selectTrigger as HTMLElement).focus()
        }
      }, 100)
    }
  }

  const handleContentModeChange = (mode: ContentMode) => {
    setContentMode(mode)
    if (mode === "blank") setTemplateId("")
  }

  const createAssetMutation = useMutation({
    mutationFn: async (data: CreateAssetRequest) => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      return createDocument(data, selectedOrganizationId)
    },
    meta: { successMessage: t('create.success') },
    onSuccess: (createdAsset) => {
      // Close dialog first
      onOpenChange(false)

      // Execute callback immediately — the dialog is protected against
      // re-render flashes via React.memo, so navigation won't cause
      // the portal to flicker.
      onAssetCreated?.({
        id: createdAsset.id,
        name: createdAsset.name,
        type: "document"
      })
    },
  })

  const handleCreate = () => {
    if (!selectedOrganizationId) {
      toast.error(t('create.errorOrganizationRequired'))
      return
    }

    if (!documentTypeId) {
      toast.error(t('create.errorAssetTypeRequired'))
      return
    }

    if (contentMode === "template" && !templateId) {
      toast.error(t('create.errorTemplateRequired'))
      return
    }

    const assetData: CreateAssetRequest = {
      name: name.trim(),
      description: description.trim(),
      document_type_id: documentTypeId,
    }

    if (internalCode.trim()) {
      assetData.internal_code = internalCode.trim()
    }

    if (contentMode === "template") {
      assetData.template_id = templateId
    } else {
      assetData.create_initial_version = true
    }

    if (folderId) {
      assetData.folder_id = folderId
    }

    createAssetMutation.mutate(assetData)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    handleCreate()
  }

  const disabled = createAssetMutation.isPending

  return (
    <>
      <HuemulSheet
        open={open}
        onOpenChange={onOpenChange}
        title={t('create.title')}
        description={t('create.description')}
        icon={Plus}
        side="right"
        maxWidth="sm:max-w-2xl"
        cancelLabel={tCommon('cancel')}
        saveAction={{
          label: t('create.submitLabel'),
          onClick: handleCreate,
          loading: createAssetMutation.isPending,
          disabled:
            !name.trim() ||
            !documentTypeId ||
            !selectedOrganizationId ||
            (contentMode === "template" && !templateId),
          closeOnSuccess: false,
        }}
      >
        <form id="create-asset-form" onSubmit={handleSubmit} className="grid gap-6">
          {/* 1 · Asset name */}
          <HuemulField
            type="text"
            label={t('form.assetName')}
            name="name"
            required
            value={name}
            onChange={(v) => setName(String(v))}
            placeholder={t('form.assetNamePlaceholder')}
            disabled={disabled}
          />

          {/* 2 · Asset type */}
          <HuemulField
            type="async-combobox"
            label={t('form.assetType')}
            name="documentType"
            id="documentType"
            required
            value={documentTypeId}
            selectedLabel={docTypeLabel}
            selectedColor={docTypeColor}
            onChange={(v) => setDocumentTypeId(String(v))}
            fetchOptions={fetchDocumentTypeOptions}
            pageSize={100}
            placeholder={t('form.assetTypePlaceholder')}
            description={t('create.assetTypeHint')}
            disabled={disabled}
            labelAction={
              isRootAdmin()
                ? { icon: PlusCircle, onClick: () => setShowCreateDocTypeDialog(true), tooltip: t('form.newType') }
                : undefined
            }
          />

          {/* 3 · Initial content */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-snug">{t('create.initialContentLabel')}</span>
            <div className="grid grid-cols-2 gap-3">
              <ContentModeCard
                icon={FileText}
                title={t('create.blankTitle')}
                description={t('create.blankDescription')}
                selected={contentMode === "blank"}
                onClick={() => handleContentModeChange("blank")}
                disabled={disabled}
              />
              <ContentModeCard
                icon={LayoutTemplate}
                title={t('create.templateTitle')}
                description={t('create.templateDescription')}
                selected={contentMode === "template"}
                onClick={() => handleContentModeChange("template")}
                disabled={disabled}
              />
            </div>
          </div>

          {/* 3 · Template selector (template mode only) */}
          {contentMode === "template" && (
            <HuemulField
              type="async-combobox"
              label={t('form.template')}
              name="template"
              value={templateId}
              onChange={(v) => setTemplateId(String(v))}
              fetchOptions={fetchTemplateOptions}
              pageSize={100}
              placeholder={t('create.selectTemplatePlaceholder')}
              disabled={disabled}
            />
          )}

          {/* 4 · Internal code + description */}
          <div className="grid grid-cols-2 gap-4">
            <HuemulField
              type="text"
              label={t('form.internalCode')}
              name="internalCode"
              value={internalCode}
              onChange={(v) => setInternalCode(String(v))}
              placeholder={t('form.internalCodePlaceholder')}
              description={t('form.internalCodeDescription')}
              disabled={disabled}
            />
            <HuemulField
              type="text"
              label={t('form.description')}
              name="description"
              value={description}
              onChange={(v) => setDescription(String(v))}
              placeholder={t('form.descriptionPlaceholder')}
              description={t('form.descriptionFieldDescription')}
              disabled={disabled}
            />
          </div>
        </form>
      </HuemulSheet>

      {/* Create Document Type Dialog */}
      {showCreateDocTypeDialog && (
        <CreateDocumentType
          trigger={<div />} // Empty trigger since we control it programmatically
          open={showCreateDocTypeDialog}
          onOpenChange={handleDocumentTypeDialogClose}
          onDocumentTypeCreated={handleNewDocumentTypeCreated}
        />
      )}
    </>
  )
}

function ContentModeCard({
  icon: Icon,
  title,
  description,
  selected,
  onClick,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  description: string
  selected: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={selected}
      className={cn(
        "flex flex-col gap-1 rounded-lg border p-4 text-left transition-colors hover:cursor-pointer",
        "disabled:pointer-events-none disabled:opacity-50",
        selected
          ? "border-primary bg-primary/5 ring-1 ring-primary"
          : "border-border hover:border-primary/40 hover:bg-accent/40",
      )}
    >
      <span className="flex items-center gap-2 text-sm font-medium">
        <Icon className={cn("size-4 shrink-0", selected ? "text-primary" : "text-muted-foreground")} />
        {title}
      </span>
      <span className={cn("text-sm leading-normal", selected ? "text-primary/80" : "text-muted-foreground")}>
        {description}
      </span>
    </button>
  )
}

export const CreateAssetSheet = React.memo(CreateAssetSheetInner)
