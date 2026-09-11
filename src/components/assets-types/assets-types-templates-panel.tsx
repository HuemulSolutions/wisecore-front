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
import { SortableContext, arrayMove, rectSortingStrategy, useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import {
  PanelBadge,
  PanelBreadcrumb,
  PanelCollapsibleCard,
  PanelFieldLabel,
  PanelIconButton,
  PanelSectionLabel,
  SettingToggleRow,
} from "@/components/assets-types/assets-types-lifecycle-ui"
import { AssetTypeTemplatePicker } from "@/components/assets-types/assets-types-template-picker"
import { TemplateSectionAccessMatrix } from "@/components/assets-types/assets-types-template-sections-matrix"
import { TemplateSectionConditions } from "@/components/assets-types/assets-types-template-section-conditions"
import { assetTypeQueryKeys, useDocumentTypeTemplates, useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { updateDocumentTypeTemplate } from "@/services/asset-types"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { cn } from "@/lib/utils"
import type { AssetTypeTemplatesPanelProps, DocumentTypeTemplateLinkBody, LinkedTemplate } from "@/types/assets"

// ─── Card arrastrable de la grilla de vinculadas ───────────────────────────

function SortableTemplateCard({
  template,
  order,
  isDirty,
  isRemoving,
  canManage,
  onConfigure,
  onRequestRemove,
}: {
  template: LinkedTemplate
  order: number
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
      className={cn(
        "relative flex flex-col gap-2.5 rounded-[10px] border border-[#e3e9f0] bg-white p-3 shadow-[0_1px_2px_rgba(15,23,42,0.04)]",
        isDragging && "opacity-50 z-50",
      )}
    >
      {canManage && (
        <button
          type="button"
          aria-label={t("templates.reorder", { name: template.template_name })}
          className="absolute top-2 left-2 flex items-center justify-center text-[#cbd5e1] hover:cursor-grab hover:text-[#94a3b8] active:cursor-grabbing"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3.5" />
        </button>
      )}

      <div className="flex items-start gap-2.5 pl-4">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-[#f1effc]">
          <FileText className="size-3.5 text-[#6d5ae0]" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-[12.5px] font-medium text-[#334155]">{template.template_name}</p>
          <p className="truncate text-[11px] text-[#94a3b8]">
            {template.relation_name
              ? t("templates.displayNameBadge", { name: template.relation_name })
              : t("templates.noDisplayName")}
          </p>
        </div>
        <span className="shrink-0 text-[11px] font-medium text-[#cbd5e1]">{String(order).padStart(2, "0")}</span>
      </div>

      <div className="flex flex-wrap items-center gap-1 pl-4">
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

      {canManage && (
        <div className="flex items-center justify-end gap-1.5 border-t border-[#eef1f5] pt-2.5">
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
        </div>
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
  const [deleteTarget, setDeleteTarget] = React.useState<LinkedTemplate | null>(null)

  const linkedTemplateIds = React.useMemo(() => new Set(localLinks.map((l) => l.template_id)), [localLinks])

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

  const handleLinkTemplate = (templateId: string, templateName: string) => {
    if (!canManage || !documentTypeId) return Promise.resolve()
    const body: DocumentTypeTemplateLinkBody = {
      relation_name: null,
      can_create_express: false,
      require_name_on_express: false,
      name_placeholder: null,
      mostrar_en_workflow: false,
      orden: localLinks.length,
    }
    return new Promise<void>((resolve, reject) => {
      mutations.linkTemplate.mutate(
        { documentTypeId, templateId, body },
        {
          onSuccess: () => {
            // Se agrega en local además de invalidar: si hay cambios sucios en
            // otra fila, la hidratación queda bloqueada y la nueva fila no
            // aparecería hasta el próximo guardado.
            setLocalLinks((prev) => [
              ...prev,
              {
                template_id: templateId,
                template_name: templateName,
                relation_name: null,
                can_create_express: false,
                require_name_on_express: false,
                name_placeholder: null,
                mostrar_en_workflow: false,
                orden: prev.length,
              },
            ])
            resolve()
          },
          onError: (err) => reject(err),
        },
      )
    })
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
        // Vincular a la izquierda con ancho fijo y angosto (es un formulario
        // corto, no necesita crecer), vinculadas a la derecha ocupando el
        // resto — ahí vive una grilla de 2 columnas de cards que sí necesita
        // el espacio. `items-start` porque la card de vincular es baja y no
        // debe estirarse al alto de la lista. El detalle de plantilla (la
        // otra rama) no lleva grid: su matriz de permisos necesita todo el ancho.
        <div className="grid items-start gap-4 md:grid-cols-[360px_1fr]">
          {canManage && (
            <AssetTypeTemplatePicker
              linkedTemplateIds={linkedTemplateIds}
              isLinking={mutations.linkTemplate.isPending}
              onLink={handleLinkTemplate}
            />
          )}

          {/* Sin el bloque de vincular quedaría un hueco a la izquierda. Es
              defensivo: hoy `canManage` es el mismo permiso que monta el tab. */}
          <section className={cn("flex flex-col gap-2", !canManage && "md:col-span-2")}>
            <div className="flex items-center justify-between gap-2">
              <div className="flex min-w-0 items-baseline gap-2">
                <PanelSectionLabel label={t("templates.addedTemplates")} count={localLinks.length} />
                <span className="truncate text-[11px] text-[#94a3b8]">
                  {t("templates.addedTemplatesHint")}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {orderDirty && <PanelBadge label={t("templates.orderUnsavedBadge")} tone="warning" />}
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
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 rounded-[10px]" />
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
                  strategy={rectSortingStrategy}
                >
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {localLinks.map((tpl, index) => (
                      <SortableTemplateCard
                        key={tpl.template_id}
                        template={tpl}
                        order={index + 1}
                        isDirty={dirtyIds.has(tpl.template_id)}
                        isRemoving={mutations.unlinkTemplate.isPending && deleteTarget?.template_id === tpl.template_id}
                        canManage={canManage}
                        onConfigure={() => setConfiguringId(tpl.template_id)}
                        onRequestRemove={() => setDeleteTarget(tpl)}
                      />
                    ))}
                  </div>
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
