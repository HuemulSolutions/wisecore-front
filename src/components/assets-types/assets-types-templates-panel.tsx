"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { useQueryClient } from "@tanstack/react-query"
import { toast } from "sonner"
import { FileText, GripVertical, LayoutTemplate, RefreshCw, X } from "lucide-react"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulCombobox } from "@/huemul/components/huemul-combobox"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import {
  PanelBadge,
  PanelBreadcrumb,
  PanelCard,
  PanelCollapsibleCard,
  PanelFieldLabel,
  PanelIconButton,
  PanelSectionLabel,
  SettingToggleRow,
} from "@/components/assets-types/assets-types-lifecycle-ui"
import { TemplateSectionAccessMatrix } from "@/components/assets-types/assets-types-template-sections-matrix"
import { TemplateSectionConditions } from "@/components/assets-types/assets-types-template-section-conditions"
import { assetTypeQueryKeys, useDocumentTypeTemplates, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { updateDocumentTypeTemplate } from "@/services/asset-types"
import { getAllTemplates } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { cn } from "@/lib/utils"
import type { AssetTypeTemplatesPanelProps, DocumentTypeTemplateLinkBody, LinkedTemplate } from "@/types/assets"
import type { FetchOptionsParams } from "@/huemul/components/huemul-field"

// ─── Fila arrastrable de la lista ──────────────────────────────────────────

function SortableTemplateRow({
  template,
  isDirty,
  isRemoving,
  canManage,
  onConfigure,
  onRequestRemove,
}: {
  template: LinkedTemplate
  isDirty: boolean
  isRemoving: boolean
  canManage: boolean
  onConfigure: () => void
  onRequestRemove: () => void
}) {
  const { t } = useTranslation("asset-types")
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: template.template_id,
    disabled: !canManage,
  })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 px-3 py-2.5", isDragging && "opacity-50 z-50 bg-white")}
    >
      {canManage && (
        <button
          type="button"
          aria-label={t("templates.reorder", { name: template.template_name })}
          className="flex shrink-0 items-center justify-center text-[#94a3b8] hover:cursor-grab active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-4" />
        </button>
      )}
      <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1effc]">
        <FileText className="size-3.5 text-[#6d5ae0]" />
      </span>
      <div className="flex flex-1 min-w-0 flex-col gap-1">
        <p className="truncate text-[12.5px] font-medium text-[#334155]">
          {template.template_name}
          {template.relation_name && (
            <span className="ml-1.5 font-normal text-[#94a3b8]">
              {t("templates.displayNameBadge", { name: template.relation_name })}
            </span>
          )}
        </p>
        <div className="flex flex-wrap items-center gap-1">
          {isDirty && <PanelBadge label={t("templates.unsavedBadge")} tone="warning" />}
          <PanelBadge
            label={t(
              template.mostrar_en_workflow
                ? "templates.summary.visibleInWorkflows"
                : "templates.summary.notVisibleInWorkflows",
            )}
            tone={template.mostrar_en_workflow ? "success" : "neutral"}
          />
          {template.require_name_on_express && (
            <PanelBadge label={t("templates.summary.asksName")} />
          )}
        </div>
      </div>
      {canManage && (
        <>
          <button
            type="button"
            onClick={onConfigure}
            className="inline-flex h-7 shrink-0 items-center rounded-lg border border-[#dde4ec] px-2.5 text-[12px] font-medium text-[#475569] transition-colors hover:cursor-pointer hover:bg-[#f8fafc] hover:text-[#0f172a]"
          >
            {t("templates.configure")}
          </button>
          <PanelIconButton
            icon={X}
            label={t("templates.remove", { name: template.template_name })}
            onClick={onRequestRemove}
            disabled={isRemoving}
            tone="danger"
          />
        </>
      )}
    </div>
  )
}

// ─── Vista de detalle («Configuración de workflow») ────────────────────────

function TemplateDetailView({
  template,
  documentTypeId,
  isDirty,
  onBack,
  onChange,
  disabled,
}: {
  template: LinkedTemplate
  documentTypeId: string
  isDirty: boolean
  onBack: () => void
  onChange: (patch: Partial<DocumentTypeTemplateLinkBody>) => void
  disabled: boolean
}) {
  const { t } = useTranslation("asset-types")
  const [workflowConfigOpen, setWorkflowConfigOpen] = React.useState(true)
  const [sectionAccessOpen, setSectionAccessOpen] = React.useState(true)
  const [conditionsOpen, setConditionsOpen] = React.useState(true)

  return (
    <div className="flex flex-col gap-4">
      <PanelBreadcrumb
        rootLabel={t("templates.breadcrumbRoot")}
        onBack={onBack}
        current={template.template_name}
        badge={isDirty && <PanelBadge label={t("templates.unsavedBadge")} tone="warning" />}
      />

      <PanelCollapsibleCard
        title={t("templates.workflowConfig")}
        subtitle={t("templates.workflowConfigSubtitle")}
        headerRight={isDirty && <PanelBadge label={t("templates.unsavedBadge")} tone="warning" />}
        open={workflowConfigOpen}
        onOpenChange={setWorkflowConfigOpen}
      >
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <PanelFieldLabel disabled={disabled}>{t("templates.workflowDisplayName")}</PanelFieldLabel>
              <Input
                value={template.relation_name ?? ""}
                onChange={(e) => onChange({ relation_name: e.target.value.trim() ? e.target.value : null })}
                disabled={disabled}
              />
              <p className="text-[11px] leading-snug text-[#94a3b8]">
                {t("templates.workflowDisplayNameHint")}
              </p>
            </div>
            {template.require_name_on_express && (
              <div className="flex flex-col gap-1.5">
                <PanelFieldLabel disabled={disabled}>{t("templates.namePlaceholderLabel")}</PanelFieldLabel>
                <Input
                  value={template.name_placeholder ?? ""}
                  onChange={(e) => onChange({ name_placeholder: e.target.value.trim() ? e.target.value : null })}
                  placeholder={t("templates.namePlaceholderExample")}
                  disabled={disabled}
                />
                <p className="text-[11px] leading-snug text-[#94a3b8]">
                  {t("templates.namePlaceholderHint")}
                </p>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SettingToggleRow
              className="rounded-xl border border-[#e5eaf0]"
              label={t("templates.askNameBeforeStart")}
              description={t("templates.askNameBeforeStartHint")}
              checked={template.require_name_on_express}
              disabled={disabled}
              onChange={(value) => onChange({ require_name_on_express: value })}
            />
            <SettingToggleRow
              className="rounded-xl border border-[#e5eaf0]"
              label={t("templates.showInWorkflows")}
              description={t("templates.showInWorkflowsHint")}
              checked={template.mostrar_en_workflow}
              disabled={disabled}
              onChange={(value) => onChange({ mostrar_en_workflow: value, can_create_express: value })}
            />
          </div>
        </div>
      </PanelCollapsibleCard>

      {/* Permisos por sección: qué ve o edita cada sección en cada etapa del ciclo
          de vida. Escribe entidades propias (`lifecycle_access`), no el vínculo
          documento-tipo ↔ plantilla que guarda el footer, así que persiste al instante. */}
      <PanelCollapsibleCard
        title={t("templates.sectionAccess.title")}
        open={sectionAccessOpen}
        onOpenChange={setSectionAccessOpen}
      >
        <TemplateSectionAccessMatrix
          templateId={template.template_id}
          documentTypeId={documentTypeId}
        />
      </PanelCollapsibleCard>

      {/* Condiciones: depends_on/show_when_inactive a nivel de TemplateSection (ver
          ia context/dependencias-condicionales-formularios-guide.md §3.2). Mismo dato
          que se edita en sections-form.tsx — este es un punto de entrada centralizado
          por plantilla. Escribe la entidad TemplateSection directamente, así que
          persiste al instante como "Permisos por sección" arriba. */}
      <PanelCollapsibleCard
        title={t("templates.conditions.title")}
        subtitle={t("templates.conditions.subtitle")}
        headerRight={<PanelBadge label={t("templates.instantSaveBadge")} />}
        open={conditionsOpen}
        onOpenChange={setConditionsOpen}
      >
        <TemplateSectionConditions templateId={template.template_id} />
      </PanelCollapsibleCard>
    </div>
  )
}

/**
 * Contenido de gestión de plantillas vinculadas a un tipo de activo. Se monta
 * como tab dentro del sheet de configuración (`AssetTypeConfigSheet`); los
 * cambios se acumulan en estado local y se persisten en batch con el botón
 * «Guardar cambios» del propio panel. `saveApiRef` sigue publicándose para que
 * el contenedor pueda llamar `discard()` desde el guard de cambios sin guardar.
 */
export function AssetTypeTemplatesPanel({
  documentTypeId,
  enabled = true,
  onDirtyChange,
  saveApiRef,
}: AssetTypeTemplatesPanelProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const mutations = useAssetTypeMutations()
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate('asset_type')

  const { data, isLoading, isFetching, refetch } = useDocumentTypeTemplates(documentTypeId, enabled && !!documentTypeId)
  const serverLinks = data?.data

  const [localLinks, setLocalLinks] = React.useState<LinkedTemplate[]>([])
  const [dirtyIds, setDirtyIds] = React.useState<Set<string>>(new Set())
  const [orderDirty, setOrderDirty] = React.useState(false)
  const [isSaving, setIsSaving] = React.useState(false)
  const [configuringId, setConfiguringId] = React.useState<string | null>(null)
  const [selectedTemplateId, setSelectedTemplateId] = React.useState<string>("")
  const [selectedTemplateLabel, setSelectedTemplateLabel] = React.useState<string>("")
  const [deleteTarget, setDeleteTarget] = React.useState<LinkedTemplate | null>(null)

  const isDirty = dirtyIds.size > 0 || orderDirty

  // Hidratación gateada por el estado sucio: un refetch nunca pisa una edición
  // en curso (ver ia context/sheet-footer-batch-save-guide.md, regla 3).
  React.useEffect(() => {
    if (!serverLinks || isDirty) return
    setLocalLinks(serverLinks)
  }, [serverLinks, isDirty])

  React.useEffect(() => {
    if (configuringId && !localLinks.some((l) => l.template_id === configuringId)) {
      setConfiguringId(null)
    }
  }, [configuringId, localLinks])

  const patchLocal = React.useCallback((templateId: string, patch: Partial<DocumentTypeTemplateLinkBody>) => {
    setLocalLinks((prev) => prev.map((l) => (l.template_id === templateId ? { ...l, ...patch } : l)))
    setDirtyIds((prev) => new Set(prev).add(templateId))
  }, [])

  const discard = React.useCallback(() => {
    setDirtyIds(new Set())
    setOrderDirty(false)
  }, [])

  const saveRef = React.useRef<() => Promise<void>>(async () => {})
  saveRef.current = async () => {
    if (!canManage || !isDirty) return
    setIsSaving(true)
    try {
      for (const id of dirtyIds) {
        const tpl = localLinks.find((l) => l.template_id === id)
        if (!tpl) continue
        const body: DocumentTypeTemplateLinkBody = {
          relation_name: tpl.relation_name,
          require_name_on_express: tpl.require_name_on_express,
          name_placeholder: tpl.name_placeholder,
          mostrar_en_workflow: tpl.mostrar_en_workflow,
          can_create_express: tpl.can_create_express,
        }
        if (orderDirty) {
          body.orden = localLinks.findIndex((l) => l.template_id === id)
        }
        await updateDocumentTypeTemplate(documentTypeId, id, body)
      }
      if (orderDirty) {
        for (const [index, tpl] of localLinks.entries()) {
          if (dirtyIds.has(tpl.template_id) || tpl.orden === index) continue
          await updateDocumentTypeTemplate(documentTypeId, tpl.template_id, { orden: index })
        }
      }
      setDirtyIds(new Set())
      setOrderDirty(false)
      await queryClient.invalidateQueries({ queryKey: assetTypeQueryKeys.templates(documentTypeId) })
      toast.success(t("templates.savedSuccess"))
    } finally {
      setIsSaving(false)
    }
  }
  const save = React.useCallback(() => saveRef.current(), [])

  React.useEffect(() => {
    if (!saveApiRef) return
    saveApiRef.current = { save, discard, isDirty, isSaving }
    return () => {
      saveApiRef.current = null
    }
  }, [saveApiRef, save, discard, isDirty, isSaving])

  React.useEffect(() => {
    onDirtyChange?.({ isDirty })
  }, [isDirty, onDirtyChange])

  const fetchTemplateOptions = React.useCallback(
    async ({ search, page, pageSize }: FetchOptionsParams) => {
      if (!selectedOrganizationId) return { options: [], hasMore: false }
      const res = await getAllTemplates(selectedOrganizationId, search, page, pageSize)
      return {
        options: res.data.map((tpl) => ({ value: tpl.id, label: tpl.name })),
        hasMore: res.has_next,
      }
    },
    [selectedOrganizationId],
  )

  const handleAdd = () => {
    if (!canManage || !selectedTemplateId || !documentTypeId) return
    const body: DocumentTypeTemplateLinkBody = {
      relation_name: null,
      can_create_express: false,
      require_name_on_express: false,
      name_placeholder: null,
      mostrar_en_workflow: false,
      orden: localLinks.length,
    }
    mutations.linkTemplate.mutate(
      { documentTypeId, templateId: selectedTemplateId, body },
      {
        onSuccess: () => {
          // Se agrega en local además de invalidar: si hay cambios sucios en
          // otra fila, la hidratación queda bloqueada y la nueva fila no
          // aparecería hasta el próximo guardado.
          setLocalLinks((prev) => [
            ...prev,
            {
              template_id: selectedTemplateId,
              template_name: selectedTemplateLabel,
              relation_name: null,
              can_create_express: false,
              require_name_on_express: false,
              name_placeholder: null,
              mostrar_en_workflow: false,
              orden: prev.length,
            },
          ])
          setSelectedTemplateId("")
          setSelectedTemplateLabel("")
        },
      },
    )
  }

  const handleConfirmRemove = () => {
    if (!canManage || !documentTypeId || !deleteTarget) return Promise.resolve()
    const templateId = deleteTarget.template_id
    return new Promise<void>((resolve, reject) => {
      mutations.unlinkTemplate.mutate(
        { documentTypeId, templateId },
        {
          onSuccess: () => {
            setLocalLinks((prev) => prev.filter((l) => l.template_id !== templateId))
            setDirtyIds((prev) => {
              const next = new Set(prev)
              next.delete(templateId)
              return next
            })
            resolve()
          },
          onError: (err) => reject(err),
        },
      )
    })
  }

  const handleRefresh = () => {
    if (isDirty) return
    void refetch()
  }

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!canManage || !over || active.id === over.id) return
    const oldIndex = localLinks.findIndex((l) => l.template_id === active.id)
    const newIndex = localLinks.findIndex((l) => l.template_id === over.id)
    if (oldIndex === -1 || newIndex === -1) return
    setLocalLinks((prev) => arrayMove(prev, oldIndex, newIndex))
    setOrderDirty(true)
  }

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const configuringTemplate = configuringId ? localLinks.find((l) => l.template_id === configuringId) ?? null : null

  return (
    <>
      {configuringTemplate ? (
        <TemplateDetailView
          template={configuringTemplate}
          documentTypeId={documentTypeId}
          isDirty={dirtyIds.has(configuringTemplate.template_id)}
          onBack={() => setConfiguringId(null)}
          onChange={(patch) => patchLocal(configuringTemplate.template_id, patch)}
          disabled={!canManage}
        />
      ) : (
        <div className="flex flex-col gap-5">
          {canManage && (
            <PanelCard className="p-4">
              <h3 className="mb-2 text-[13px] font-semibold text-[#0f172a]">
                {t("templates.addTemplate")}
              </h3>
              <div className="flex gap-2">
                <div className="flex-1 min-w-0">
                  <HuemulCombobox
                    value={selectedTemplateId}
                    onValueChange={(v) => setSelectedTemplateId(v as string)}
                    onSelectedLabelChange={(label) => setSelectedTemplateLabel(label ?? "")}
                    fetchOptions={fetchTemplateOptions}
                    placeholder={t("templates.searchPlaceholder")}
                    searchPlaceholder={t("templates.searchPlaceholder")}
                    emptyMessage={t("templates.noTemplatesAvailable")}
                    disabled={!selectedOrganizationId || mutations.linkTemplate.isPending}
                    pageSize={20}
                  />
                </div>
                <HuemulButton
                  size="sm"
                  label={t("templates.add")}
                  loading={mutations.linkTemplate.isPending}
                  disabled={!selectedTemplateId}
                  onClick={handleAdd}
                  className="shrink-0"
                />
              </div>
            </PanelCard>
          )}

          <section className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <PanelSectionLabel label={t("templates.addedTemplates")} count={localLinks.length} />
                <span className="truncate text-[11px] text-[#94a3b8]">
                  {t("templates.addedTemplatesHint")}
                </span>
              </div>
              <HuemulButton
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                icon={RefreshCw}
                tooltip={t("common:refresh")}
                loading={isFetching}
                disabled={isDirty}
                onClick={handleRefresh}
              />
            </div>

            {isLoading ? (
              <div className="flex flex-col gap-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 rounded-lg" />
                ))}
              </div>
            ) : localLinks.length === 0 ? (
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
              <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext
                  items={localLinks.map((l) => l.template_id)}
                  strategy={verticalListSortingStrategy}
                >
                  <PanelCard className="divide-y divide-[#eef1f5]">
                    {localLinks.map((tpl) => (
                      <SortableTemplateRow
                        key={tpl.template_id}
                        template={tpl}
                        isDirty={dirtyIds.has(tpl.template_id)}
                        isRemoving={mutations.unlinkTemplate.isPending && deleteTarget?.template_id === tpl.template_id}
                        canManage={canManage}
                        onConfigure={() => setConfiguringId(tpl.template_id)}
                        onRequestRemove={() => setDeleteTarget(tpl)}
                      />
                    ))}
                  </PanelCard>
                </SortableContext>
              </DndContext>
            )}
          </section>
        </div>
      )}

      <HuemulAlertDialog
        open={deleteTarget !== null}
        onOpenChange={(o) => { if (!o) setDeleteTarget(null) }}
        title={t("templates.confirmDeleteTitle")}
        description={t("templates.confirmDeleteDescription", { name: deleteTarget?.template_name })}
        onAction={handleConfirmRemove}
        actionLabel={t("common:delete")}
        cancelLabel={t("common:cancel")}
        actionVariant="destructive"
      />
    </>
  )
}
