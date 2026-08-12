"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { LayoutTemplate, Loader2, Pencil, Trash2 } from "lucide-react"

import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulCombobox } from "@/huemul/components/huemul-combobox"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useDocumentTypeTemplates, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import type { LinkedTemplate, DocumentTypeTemplateLinkBody } from "@/types/assets"
import type { FetchOptionsParams } from "@/huemul/components/huemul-field"

interface AssetTypeTemplatesPanelProps {
  documentTypeId: string
  /** Solo dispara el fetch cuando el tab/panel está visible. */
  enabled?: boolean
}

function TemplateRow({
  template,
  onEdit,
  onRequestRemove,
  isRemoving,
  canManage,
}: {
  template: LinkedTemplate
  onEdit: (template: LinkedTemplate) => void
  onRequestRemove: (template: LinkedTemplate) => void
  isRemoving: boolean
  canManage: boolean
}) {
  const { t } = useTranslation("asset-types")

  return (
    <li className="flex items-center gap-2 border border-border rounded-lg p-3 hover:border-muted-foreground/30 transition-colors">
      <p className="flex-1 text-xs font-medium truncate min-w-0">{template.template_name}</p>
      {canManage && (
        <>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 hover:cursor-pointer"
            onClick={() => onEdit(template)}
            aria-label={t("templates.edit", { name: template.template_name })}
          >
            <Pencil className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:bg-destructive/10 hover:text-destructive hover:cursor-pointer"
            onClick={() => onRequestRemove(template)}
            disabled={isRemoving}
            aria-label={t("templates.remove", { name: template.template_name })}
          >
            {isRemoving ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Trash2 className="h-3 w-3" />
            )}
          </Button>
        </>
      )}
    </li>
  )
}

// Sheet compartido para crear (vincular) y editar un vínculo document_type↔template.
// `template` en modo editar trae los valores a prefillear; en modo crear viene null
// y se usan defaults — el padre resuelve a qué template aplica el `onSave`.
function TemplateLinkFormSheet({
  mode,
  template,
  open,
  onOpenChange,
  onSave,
}: {
  mode: "create" | "edit"
  template: LinkedTemplate | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSave: (body: DocumentTypeTemplateLinkBody) => Promise<void>
}) {
  const { t } = useTranslation(["asset-types", "common"])

  const [relationName, setRelationName] = React.useState("")
  const [canCreateExpress, setCanCreateExpress] = React.useState(false)
  const [requireNameOnExpress, setRequireNameOnExpress] = React.useState(false)
  const [namePlaceholder, setNamePlaceholder] = React.useState("")
  const [mostrarEnWorkflow, setMostrarEnWorkflow] = React.useState(false)
  const [orden, setOrden] = React.useState("")

  // Prefill local state whenever the sheet opens — avoids showing stale form
  // data if it was left dirty from a previous open. En modo crear resetea a defaults.
  React.useEffect(() => {
    if (!open) return
    if (mode === "edit" && template) {
      setRelationName(template.relation_name ?? "")
      setCanCreateExpress(template.can_create_express)
      setRequireNameOnExpress(template.require_name_on_express)
      setNamePlaceholder(template.name_placeholder ?? "")
      setMostrarEnWorkflow(template.mostrar_en_workflow)
      setOrden(template.orden !== null ? String(template.orden) : "")
    } else if (mode === "create") {
      setRelationName("")
      setCanCreateExpress(false)
      setRequireNameOnExpress(false)
      setNamePlaceholder("")
      setMostrarEnWorkflow(false)
      setOrden("")
    }
  }, [mode, template, open])

  const isDirty =
    mode === "create" ||
    (!!template &&
      (relationName !== (template.relation_name ?? "") ||
        canCreateExpress !== template.can_create_express ||
        requireNameOnExpress !== template.require_name_on_express ||
        namePlaceholder !== (template.name_placeholder ?? "") ||
        mostrarEnWorkflow !== template.mostrar_en_workflow ||
        orden !== (template.orden !== null ? String(template.orden) : "")))

  const handleSave = () => {
    const trimmedOrden = orden.trim()
    return onSave({
      relation_name: relationName.trim() ? relationName.trim() : null,
      can_create_express: canCreateExpress,
      require_name_on_express: requireNameOnExpress,
      name_placeholder: namePlaceholder.trim() ? namePlaceholder.trim() : null,
      mostrar_en_workflow: mostrarEnWorkflow,
      orden: trimmedOrden ? Number(trimmedOrden) : null,
    })
  }

  const title = mode === "create" ? t("templates.linkTitle") : t("templates.editTitle")
  const description =
    mode === "create"
      ? t("templates.linkDescription")
      : template
        ? t("templates.editDescription", { name: template.template_name })
        : undefined

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      icon={Pencil}
      cancelLabel={t("common:cancel")}
      saveAction={{
        label: t("common:save"),
        onClick: handleSave,
        disabled: !isDirty,
      }}
    >
      <div className="flex flex-col gap-4 py-2">
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-relation-name" className="text-xs text-muted-foreground font-normal">
            {t("templates.relationName")}
          </Label>
          <Input
            id="edit-relation-name"
            value={relationName}
            onChange={(e) => setRelationName(e.target.value)}
            placeholder={t("templates.relationNamePlaceholder")}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="edit-can-create-express" className="text-xs font-normal">
            {t("templates.canCreateExpress")}
          </Label>
          <Switch
            id="edit-can-create-express"
            checked={canCreateExpress}
            onCheckedChange={setCanCreateExpress}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="edit-require-name-on-express" className="text-xs font-normal">
            {t("templates.requireNameOnExpress")}
          </Label>
          <Switch
            id="edit-require-name-on-express"
            checked={requireNameOnExpress}
            onCheckedChange={setRequireNameOnExpress}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-name-placeholder" className="text-xs text-muted-foreground font-normal">
            {t("templates.namePlaceholder")}
          </Label>
          <Input
            id="edit-name-placeholder"
            value={namePlaceholder}
            onChange={(e) => setNamePlaceholder(e.target.value)}
            placeholder={t("templates.namePlaceholderHint")}
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="edit-mostrar-en-workflow" className="text-xs font-normal">
            {t("templates.mostrarEnWorkflow")}
          </Label>
          <Switch
            id="edit-mostrar-en-workflow"
            checked={mostrarEnWorkflow}
            onCheckedChange={setMostrarEnWorkflow}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="edit-orden" className="text-xs text-muted-foreground font-normal">
            {t("templates.orden")}
          </Label>
          <Input
            id="edit-orden"
            type="number"
            value={orden}
            onChange={(e) => setOrden(e.target.value)}
            placeholder={t("templates.ordenPlaceholder")}
          />
        </div>
      </div>
    </HuemulSheet>
  )
}

/**
 * Contenido de gestión de plantillas vinculadas a un tipo de activo. Se monta
 * como tab dentro del sheet de configuración (`AssetTypeConfigSheet`).
 */
export function AssetTypeTemplatesPanel({
  documentTypeId,
  enabled = true,
}: AssetTypeTemplatesPanelProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { selectedOrganizationId } = useOrganization()
  const mutations = useAssetTypeMutations()
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate('asset_type')

  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("")
  const [isLinkFormOpen, setIsLinkFormOpen] = React.useState(false)
  const [editTarget, setEditTarget] = React.useState<LinkedTemplate | null>(null)
  const [deleteTarget, setDeleteTarget] = React.useState<LinkedTemplate | null>(null)

  const { data, isLoading } = useDocumentTypeTemplates(documentTypeId, enabled && !!documentTypeId)
  const linked = data?.data ?? []

  const fetchTemplateOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      if (!selectedOrganizationId) return { options: [], hasMore: false }
      const res = await getAllTemplates(selectedOrganizationId, search, page, pageSize)
      return {
        options: res.data.map((tpl) => ({
          value: tpl.id,
          label: tpl.name,
        })),
        hasMore: res.has_next,
      }
    },
    [selectedOrganizationId],
  )

  const handleLink = () => {
    if (!canManage || !selectedTemplateId || !documentTypeId) return
    setIsLinkFormOpen(true)
  }

  const handleSaveNewLink = (body: DocumentTypeTemplateLinkBody) => {
    if (!canManage || !documentTypeId || !selectedTemplateId) return Promise.resolve()
    return new Promise<void>((resolve, reject) => {
      mutations.linkTemplate.mutate(
        { documentTypeId, templateId: selectedTemplateId, body },
        { onSuccess: () => { setSelectedTemplateId(""); resolve() }, onError: (err) => reject(err) },
      )
    })
  }

  const handleSaveTemplate = (body: DocumentTypeTemplateLinkBody) => {
    if (!canManage || !documentTypeId || !editTarget) return Promise.resolve()
    const templateId = editTarget.template_id
    return new Promise<void>((resolve, reject) => {
      mutations.updateTemplateLink.mutate(
        { documentTypeId, templateId, body },
        { onSuccess: () => resolve(), onError: (err) => reject(err) },
      )
    })
  }

  const handleConfirmUnlink = () => {
    if (!canManage || !documentTypeId || !deleteTarget) return Promise.resolve()
    const templateId = deleteTarget.template_id
    return new Promise<void>((resolve, reject) => {
      mutations.unlinkTemplate.mutate(
        { documentTypeId, templateId },
        { onSuccess: () => resolve(), onError: (err) => reject(err) },
      )
    })
  }

  return (
    <>
      <div className="flex flex-col gap-5">
        {/* Add template */}
        {canManage && (
          <section className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              {t("templates.addTemplate")}
            </p>
            <div className="flex gap-2">
              <div className="flex-1 min-w-0">
                <HuemulCombobox
                  value={selectedTemplateId}
                  onValueChange={(v) => setSelectedTemplateId(v as string)}
                  fetchOptions={fetchTemplateOptions}
                  placeholder={t("templates.searchPlaceholder")}
                  searchPlaceholder={t("templates.searchPlaceholder")}
                  emptyMessage={t("templates.noTemplatesAvailable")}
                  disabled={!selectedOrganizationId || mutations.linkTemplate.isPending}
                  pageSize={20}
                />
              </div>
              <Button
                size="sm"
                onClick={handleLink}
                disabled={!selectedTemplateId || mutations.linkTemplate.isPending}
                className="shrink-0"
              >
                {mutations.linkTemplate.isPending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  t("templates.link")
                )}
              </Button>
            </div>
          </section>
        )}

        {/* Linked templates */}
        <section className="flex flex-col gap-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            {t("templates.linkedTemplates")}
          </p>

          {isLoading ? (
            <ul className="flex flex-col gap-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-11 rounded-lg" />
              ))}
            </ul>
          ) : linked.length === 0 ? (
            <div className="py-5 px-4 text-center border border-dashed border-border rounded-lg bg-muted/40">
              <LayoutTemplate className="h-6 w-6 text-border mx-auto mb-2" />
              <p className="text-xs font-medium text-muted-foreground">
                {t("templates.noLinkedTemplates")}
              </p>
              <p className="text-[11px] text-muted-foreground/70 mt-1 leading-relaxed">
                {t("templates.noLinkedTemplatesHint")}
              </p>
            </div>
          ) : (
            <ul className="flex flex-col gap-2">
              {linked.map((tpl) => (
                <TemplateRow
                  key={tpl.template_id}
                  template={tpl}
                  onEdit={setEditTarget}
                  onRequestRemove={setDeleteTarget}
                  isRemoving={mutations.unlinkTemplate.isPending && deleteTarget?.template_id === tpl.template_id}
                  canManage={canManage}
                />
              ))}
            </ul>
          )}
        </section>
      </div>

      <TemplateLinkFormSheet
        mode="create"
        template={null}
        open={isLinkFormOpen}
        onOpenChange={setIsLinkFormOpen}
        onSave={handleSaveNewLink}
      />

      <TemplateLinkFormSheet
        mode="edit"
        template={editTarget}
        open={editTarget !== null}
        onOpenChange={(o) => { if (!o) setEditTarget(null) }}
        onSave={handleSaveTemplate}
      />

      <HuemulAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title={t("templates.confirmDeleteTitle")}
        description={t("templates.confirmDeleteDescription", { name: deleteTarget?.template_name })}
        onAction={handleConfirmUnlink}
        actionLabel={t("common:delete")}
        cancelLabel={t("common:cancel")}
        actionVariant="destructive"
      />
    </>
  )
}
