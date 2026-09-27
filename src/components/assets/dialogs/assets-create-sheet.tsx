"use client"

import * as React from "react"
import { useState } from "react"
import { useMutation } from "@tanstack/react-query"
import { Plus, FileText, LayoutTemplate, Link2, PlusCircle } from "lucide-react"
import { useTranslation } from "react-i18next"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulField } from "@/huemul/components/huemul-field"
import { createDocument, importDocumentFromUrl } from "@/services/assets"
import { getAllTemplates } from "@/services/templates"
import { getAssetTypes } from "@/services/asset-types"
import { useOrganization } from "@/contexts/organization-context"
import type { FetchOptionsParams } from "@/huemul/components/huemul-field"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import { handleImportFromUrlError } from "./import-error-utils"
import type { CreateAssetRequest, CreateAssetSheetProps, DuplicateDocumentDetail } from "@/types/assets"

type ContentMode = "blank" | "template" | "url"

const SECTION_SEPARATOR_OPTIONS = ["h1", "h2", "h3"] as const

// El backend acepta links directos a .md/.markdown (query string aparte) y
// reescribe solo los links "blob" de GitHub — el resto de la validación real
// (Content-Type, DNS, redirects, tamaño) la hace el backend. Esto solo evita
// un round-trip para los casos obvios (esquema incorrecto, extensión incorrecta).
function isLikelyMarkdownUrl(value: string): boolean {
  let parsed: URL
  try {
    parsed = new URL(value)
  } catch {
    return false
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return false
  return /\.(md|markdown)$/i.test(parsed.pathname)
}

function CreateAssetSheetInner({ open, onOpenChange, folderId, onAssetCreated, canCreate }: CreateAssetSheetProps) {
  const { selectedOrganizationId } = useOrganization()
  const { t } = useTranslation('assets')
  const { t: tCommon } = useTranslation('common')
  const { canCreate: canCreateResource } = useUserPermissions()
  const navigate = useOrgNavigate()
  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [internalCode, setInternalCode] = useState("")
  const [documentTypeId, setDocumentTypeId] = useState("")
  const [docTypeLabel, setDocTypeLabel] = useState("")
  const [docTypeColor, setDocTypeColor] = useState<string | undefined>(undefined)
  const [templateId, setTemplateId] = useState("")
  const [contentMode, setContentMode] = useState<ContentMode>("blank")
  const [showCreateDocTypeDialog, setShowCreateDocTypeDialog] = useState(false)
  const [url, setUrl] = useState("")
  const [sectionSeparator, setSectionSeparator] = useState<"h1" | "h2" | "h3">("h1")
  const [forceImport, setForceImport] = useState(false)

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
      setUrl("")
      setSectionSeparator("h1")
      setForceImport(false)
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
    if (mode !== "template") setTemplateId("")
    if (mode !== "url") {
      setUrl("")
      setSectionSeparator("h1")
      setForceImport(false)
    }
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

  // Separada de createAssetMutation: responde 202 (no el asset completo),
  // no muestra el toast de éxito automático (meta.successMessage) porque el
  // documento sigue "importing" al recibir la respuesta, y necesita su propio
  // onError para el 409 de duplicado y los códigos de validación del link.
  const importFromUrlMutation = useMutation({
    mutationFn: async () => {
      if (!selectedOrganizationId) throw new Error("Organization ID not found")
      return importDocumentFromUrl({
        url: url.trim(),
        name: name.trim(),
        description: description.trim() || undefined,
        internal_code: internalCode.trim() || undefined,
        document_type_id: documentTypeId,
        folder_id: folderId ?? null,
        section_separator: sectionSeparator,
        force_import: forceImport,
        organizationId: selectedOrganizationId,
      })
    },
    meta: { showSuccessToast: false },
    onError: (error) => {
      handleImportFromUrlError(error, t, (detail: DuplicateDocumentDetail | null) => {
        const docName = detail?.document_name ?? ''
        const docId = detail?.document_id
        toast.warning(t('importFromUrl.errorDuplicateContent', { name: docName }), {
          action: docId
            ? {
                label: t('importFromUrl.openExisting'),
                onClick: () => {
                  onOpenChange(false)
                  navigate(`/asset/${docId}`)
                },
              }
            : undefined,
          duration: 8000,
        })
      })
    },
    onSuccess: (res) => {
      toast.success(t('importFromUrl.started', { name: name.trim() }))
      onOpenChange(false)
      onAssetCreated?.({
        id: res.document_id,
        name: name.trim(),
        type: "document",
      })
    },
  })

  const handleCreate = () => {
    if (!canCreate) return
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

    if (contentMode === "url") {
      if (!url.trim()) {
        toast.error(t('importFromUrl.errorUrlRequired'))
        return
      }
      if (!isLikelyMarkdownUrl(url.trim())) {
        toast.error(t('importFromUrl.errorUrlInvalid'))
        return
      }
      importFromUrlMutation.mutate()
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

  const isSaving = createAssetMutation.isPending || importFromUrlMutation.isPending
  const disabled = isSaving

  // Defensa en profundidad: aunque el trigger esté oculto, el sheet no se
  // monta sin `asset:c`.
  if (!canCreate) return null

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
          label: contentMode === "url" ? t('importFromUrl.submitLabel') : t('create.submitLabel'),
          onClick: handleCreate,
          loading: isSaving,
          disabled:
            !canCreate ||
            !name.trim() ||
            !documentTypeId ||
            !selectedOrganizationId ||
            (contentMode === "template" && !templateId) ||
            (contentMode === "url" && !url.trim()),
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
              // Atajo "crear tipo de asset": se decide con el permiso del recurso
              // (asset_type:c) desde el contexto, no leyendo is_root_admin del JWT
              // a mano — root admin NO hace bypass de permisos, y org admin sí.
              canCreateResource('asset_type')
                ? { icon: PlusCircle, onClick: () => setShowCreateDocTypeDialog(true), tooltip: t('form.newType') }
                : undefined
            }
          />

          {/* 3 · Initial content */}
          <div className="flex flex-col gap-2">
            <span className="text-sm font-medium leading-snug">{t('create.initialContentLabel')}</span>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
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
              <ContentModeCard
                icon={Link2}
                title={t('create.urlTitle')}
                description={t('create.urlDescription')}
                selected={contentMode === "url"}
                onClick={() => handleContentModeChange("url")}
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

          {/* 3 · URL + section separator + force import (url mode only) */}
          {contentMode === "url" && (
            <div className="flex flex-col gap-4">
              <HuemulField
                type="text"
                label={t('importFromUrl.urlLabel')}
                name="url"
                required
                value={url}
                onChange={(v) => setUrl(String(v))}
                placeholder={t('importFromUrl.urlPlaceholder')}
                description={t('importFromUrl.urlHelp')}
                disabled={disabled}
              />
              <HuemulField
                type="select"
                label={t('importFromUrl.sectionSeparatorLabel')}
                name="sectionSeparator"
                value={sectionSeparator}
                options={SECTION_SEPARATOR_OPTIONS.map((sep) => ({
                  value: sep,
                  label: t(`importFromUrl.separator${sep.toUpperCase()}`),
                }))}
                onChange={(v) => setSectionSeparator(String(v) as "h1" | "h2" | "h3")}
                description={t('importFromUrl.sectionSeparatorDescription')}
                disabled={disabled}
              />
              <HuemulField
                type="switch"
                label={t('importFromUrl.forceImportLabel')}
                name="forceImportUrl"
                value={forceImport}
                onChange={(v) => setForceImport(Boolean(v))}
                description={t('importFromUrl.forceImportDescription')}
                disabled={disabled}
              />
            </div>
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
          canSave={canCreateResource('asset_type')}
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
