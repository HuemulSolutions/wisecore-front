import { useState, useEffect, useRef, useCallback } from "react"
import { useQuery } from "@tanstack/react-query"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { GripVertical, Trash2, Plus, Pencil, X } from "lucide-react"
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useLifecycleSteps,
  useAllLifecycleSteps,
  useLifecycleMutations,
  useLifecycleSlaUnits,
  useLifecycleAccessRuleTypes,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import {
  pipelineIndex,
  deriveAccessType,
  ownerCanExecute,
  stepRoleIds,
  buildAccessPayload,
  getRequiredStepTypes,
} from "@/lib/lifecycle-access"
import { getDocumentTypeById } from "@/services/document-types"
import { handleApiError } from "@/lib/error-utils"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { LifecycleReviewActionsSection } from "./assets-types-lifecycle-review-actions"
import {
  AccessRulesEditor,
  ChipList,
  PanelCard,
  PanelDirtyBadge,
  PanelFieldLabel,
  PanelIconButton,
  PanelPillButton,
  PanelStatePill,
  PanelSummaryRow,
  RemovableChip,
  SettingToggleList,
  SettingToggleRow,
  StepModeBadge,
} from "./assets-types-lifecycle-ui"
import type { LifecycleStep, AccessRuleType } from "@/services/lifecycle"
import type { EditStepCardData, EditStepContentProps, EditStepCardProps } from '@/types/assets'

export type { EditStepCardData, EditStepContentProps } from '@/types/assets'

// ─── Utils ────────────────────────────────────────────────────────────────────
// `pipelineIndex` (fuente única en src/lib/lifecycle-access.ts, con "view" incluido)
// se usa acá para restringir el `source_step_id` de `step_actor_manager` a steps
// genuinamente anteriores — mismo criterio que valida el backend. No cambia el
// comportamiento: los steps "view" (índice 6) ya quedaban fuera de
// `earlierStepOptions` con el orden local anterior (sin "view").

export function stepToCard(step: LifecycleStep): EditStepCardData {
  return {
    id: step.id,
    name: step.name ?? "",
    mode: step.mode ?? "manual",
    hasSla: step.sla_value != null,
    slaValue: step.sla_value != null ? String(step.sla_value) : "",
    slaUnit: step.sla_unit ?? "",
    accessType: step.access_type,
    ownerCanExecute: ownerCanExecute(step.access_type),
    // Roles vigentes: una tarjeta `all`/`owner` no debe arrastrar los residuales
    // que el backend haya dejado (ver `stepRoleIds`).
    roleIds: stepRoleIds(step),
    roleNames: Object.fromEntries(
      step.step_roles.map((r) => [r.role_id, r.role_name ?? r.role_id])
    ),
    accessRules: (step.access_rules ?? []).map((r) => ({
      rule_type: r.rule_type,
      source_step_id: r.source_step_id,
    })),
  }
}

/** Igualdad estructural de tarjetas — solo para evitar re-renders inútiles. */
function sameCards(a: EditStepCardData[], b: EditStepCardData[]): boolean {
  return a.length === b.length && JSON.stringify(a) === JSON.stringify(b)
}

// ─── EditStepCard ─────────────────────────────────────────────────────────────

/**
 * Tarjeta de un grupo. Abre colapsada y de solo lectura; el lápiz («Editar
 * grupo») es el único camino para habilitar los controles, que se acumulan en
 * el estado local de `EditStepContent` y se persisten con «Guardar cambios»
 * del footer del sheet. La exclusividad de edición y el expandido/colapsado
 * los gobierna el padre (`EditStepContent`) vía props.
 */
function EditStepCard({
  card,
  stepType,
  slaUnitOptions,
  allRoles,
  accessRuleTypeOptions,
  earlierStepOptions,
  onChange,
  onDelete,
  t,
  canDelete,
  canManage,
  dragHandleProps,
  organizationId,
  isExpanded,
  isEditing,
  isDirty,
  onToggleExpand,
  onStartEdit,
  onCancelEdit,
  onDoneEdit,
}: EditStepCardProps) {
  const assignedRoles = allRoles.filter((r) => card.roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !card.roleIds.includes(r.id))
  // Prefer the i18n label so options follow the active language; fall back to
  // the backend-provided label only when no translation key exists. Reused by
  // the read-only summary below (the editable form delegates to `AccessRulesEditor`).
  const ruleTypeLabel = (ruleType: AccessRuleType) =>
    t(`lifecycle.accessRuleTypes.${ruleType}`, {
      defaultValue: accessRuleTypeOptions.find((o) => o.value === ruleType)?.label ?? ruleType,
    })
  const sourceStepLabel = (sourceStepId: string | null) =>
    sourceStepId ? earlierStepOptions.find((o) => o.value === sourceStepId)?.label ?? sourceStepId : null
  const accessTypeLabel = (accessType: EditStepCardData["accessType"]) => {
    switch (accessType) {
      case "all":
        return t("lifecycle.accessAll")
      case "owner":
        return t("lifecycle.accessOwner")
      case "custom_owner":
        return t("lifecycle.accessCustomOwner")
      default:
        return t("lifecycle.accessCustom")
    }
  }

  const ro = !canManage
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })
  const groupName = card.name.trim() || t("lifecycle.newGroupName")
  const allowsAnyone = card.accessType === "all"
  const hasModeSelector = stepType === "edit" || stepType === "review"

  return (
    <PanelCard>
      {/* Cabecera — siempre visible; colapsada, la tarjeta se reduce a esta fila.
          Clickear la fila expande/colapsa; controles internos frenan la propagación. */}
      <div
        className={cn(
          "flex items-center gap-1.5 px-3 py-2.5",
          !isEditing && "hover:cursor-pointer",
        )}
        onClick={isEditing ? undefined : onToggleExpand}
      >
        {dragHandleProps && !ro && (
          <button
            type="button"
            className="shrink-0 text-[#b6c0cd] transition-colors hover:cursor-grab hover:text-[#64748b] active:cursor-grabbing"
            aria-label={t("lifecycle.groups")}
            onClick={(e) => e.stopPropagation()}
            {...dragHandleProps}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        <span
          className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0f172a]"
          title={groupName}
          aria-expanded={isEditing ? undefined : isExpanded}
        >
          {groupName}
        </span>

        {isDirty && <PanelDirtyBadge label={t("lifecycle.editedBadge")} />}

        <StepModeBadge
          label={
            card.mode === "automatic" ? t("lifecycle.modeAutomatic") : t("lifecycle.modeManual")
          }
        />

        {isEditing ? (
          <>
            <PanelStatePill label={t("lifecycle.editingBadge")} />
            {canManage && (
              <PanelIconButton
                icon={Trash2}
                label={canDelete ? t("lifecycle.deleteGroup") : t("lifecycle.cannotDeleteLastStep")}
                tone="danger"
                disabled={!canDelete}
                onClick={onDelete}
              />
            )}
          </>
        ) : (
          canManage && (
            <PanelPillButton icon={Pencil} label={t("common:edit")} onClick={onStartEdit} />
          )
        )}
      </div>

      {isEditing && (
        <div className="flex flex-col gap-3 border-t border-[#eef1f5] px-3 py-3">
          {/* Nombre del grupo */}
          <div className="flex flex-col gap-1.5">
            <PanelFieldLabel>{t("lifecycle.groupNameLabel")}</PanelFieldLabel>
            <HuemulField
              type="text"
              label=""
              name={`card-name-${card.id}`}
              value={card.name}
              onChange={(v) => onChange({ name: String(v) })}
              placeholder={t("lifecycle.groupNamePlaceholder")}
            />
          </div>

          {/* Tipo de paso — approve es siempre manual */}
          {hasModeSelector && (
            <div className="flex flex-col gap-1.5">
              <PanelFieldLabel disabled={ro}>{t("lifecycle.modeLabel")}</PanelFieldLabel>
              <HuemulSegmentedControl
                value={card.mode}
                disabled={ro}
                ariaLabel={t("lifecycle.modeLabel")}
                options={[
                  { value: "manual", label: t("lifecycle.modeManual") },
                  { value: "automatic", label: t("lifecycle.modeAutomatic") },
                ]}
                onChange={(mode) => onChange({ mode })}
              />
            </div>
          )}

          {/* Manual: SLA + configuración de acceso */}
          {card.mode === "manual" && (
            <>
              <SettingToggleList>
                <SettingToggleRow
                  label={t("lifecycle.slaLabel")}
                  description={t(`lifecycle.slaDescriptions.${stepType}`, {
                    defaultValue: t("lifecycle.slaDescription"),
                  })}
                  checked={card.hasSla}
                  disabled={ro}
                  onChange={(v) =>
                    onChange({
                      hasSla: v,
                      slaValue: v ? card.slaValue : "",
                      slaUnit: v ? card.slaUnit : "",
                    })
                  }
                >
                  {card.hasSla && (
                    <div className="flex items-center gap-2">
                      <HuemulField
                        type="number"
                        label=""
                        name={`sla-value-${card.id}`}
                        value={card.slaValue}
                        min={1}
                        onChange={(v) => onChange({ slaValue: String(v) })}
                        placeholder={t("lifecycle.slaValuePlaceholder")}
                        disabled={ro}
                        className="w-20"
                        inputClassName="h-8 text-[12.5px]"
                      />
                      <HuemulField
                        type="select"
                        label=""
                        name={`sla-unit-${card.id}`}
                        value={card.slaUnit}
                        options={slaUnitOptions}
                        onChange={(v) => onChange({ slaUnit: String(v) })}
                        disabled={ro}
                        className="flex-1"
                      />
                    </div>
                  )}
                </SettingToggleRow>

                <SettingToggleRow
                  label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
                  description={t("lifecycle.allowAnyoneDescShort")}
                  checked={allowsAnyone}
                  disabled={ro}
                  onChange={(v) => {
                    if (v) {
                      onChange({ accessType: "all", ownerCanExecute: false, roleIds: [] })
                    } else {
                      onChange({ accessType: "owner", ownerCanExecute: true, roleIds: [] })
                    }
                  }}
                />

                <SettingToggleRow
                  label={t("lifecycle.ownerCanExecuteLabel", { action: stepAction })}
                  description={t("lifecycle.ownerCanExecuteDesc")}
                  checked={card.ownerCanExecute}
                  disabled={ro || allowsAnyone}
                  onChange={(v) => {
                    const newAccessType = deriveAccessType({
                      anyone: false,
                      owner: v,
                      roleCount: card.roleIds.length,
                    })
                    onChange({ ownerCanExecute: v, accessType: newAccessType })
                  }}
                />
              </SettingToggleList>

              {!allowsAnyone && (
                <>
                  {/* Roles asignados como chips + selector debajo */}
                  <div className="flex flex-col gap-1.5">
                    <PanelFieldLabel disabled={ro}>
                      {t("lifecycle.rolesAllowedLabel", { action: stepAction })}
                    </PanelFieldLabel>
                    {assignedRoles.length > 0 && (
                      <ChipList>
                        {assignedRoles.map((r) => (
                          <RemovableChip
                            key={r.id}
                            label={r.name}
                            disabled={ro}
                            removeLabel={t("lifecycle.matrix.removeRole")}
                            onRemove={
                              ro
                                ? undefined
                                : () => {
                                    const newRoleIds = card.roleIds.filter((id) => id !== r.id)
                                    const newAccessType = deriveAccessType({
                                      anyone: false,
                                      owner: card.ownerCanExecute,
                                      roleCount: newRoleIds.length,
                                    })
                                    onChange({ roleIds: newRoleIds, accessType: newAccessType })
                                  }
                            }
                          />
                        ))}
                      </ChipList>
                    )}
                    <HuemulField
                      type="combobox"
                      label=""
                      name={`role-${card.id}`}
                      placeholder={t("lifecycle.panel.addRoleToStep")}
                      value=""
                      options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
                      onChange={(roleId) => {
                        if (!roleId) return
                        const role = allRoles.find((r) => r.id === roleId)
                        const newRoleIds = [...card.roleIds, String(roleId)]
                        const newAccessType = deriveAccessType({
                          anyone: false,
                          owner: card.ownerCanExecute,
                          roleCount: newRoleIds.length,
                        })
                        onChange({
                          roleIds: newRoleIds,
                          roleNames: {
                            ...card.roleNames,
                            [String(roleId)]: role?.name ?? String(roleId),
                          },
                          accessType: newAccessType,
                        })
                      }}
                      disabled={ro}
                    />
                  </div>

                  {/* Reglas adicionales — acceso por creador/jefatura (OR con los roles) */}
                  <AccessRulesEditor
                    accessRules={card.accessRules}
                    accessRuleTypeOptions={accessRuleTypeOptions}
                    earlierStepOptions={earlierStepOptions}
                    onChange={(accessRules) => onChange({ accessRules })}
                    disabled={ro}
                    t={t}
                  />
                </>
              )}
            </>
          )}

          {/* Automático: tabla de funcionalidades externas — solo edit/review */}
          {card.mode === "automatic" && hasModeSelector && organizationId && (
            <LifecycleReviewActionsSection
              organizationId={organizationId}
              stepId={card.id}
              readOnly={ro}
            />
          )}

          {/* Footer — confirmar/descartar la edición de esta tarjeta */}
          <div className="flex items-center justify-between gap-2 border-t border-[#eef1f5] pt-2.5">
            <span className="text-[11px] leading-snug text-[#94a3b8]">
              {t("lifecycle.editHint")}
            </span>
            <div className="flex shrink-0 items-center gap-1.5">
              <PanelPillButton label={t("common:cancel")} onClick={onCancelEdit} />
              <PanelPillButton label={t("lifecycle.doneEditing")} tone="primary" onClick={onDoneEdit} />
            </div>
          </div>
        </div>
      )}

      {/* Resumen de solo lectura — colapsada no se muestra nada de esto */}
      {!isEditing && isExpanded && (
        <div className="flex flex-col gap-3 border-t border-[#eef1f5] px-3 py-3">
          {card.mode === "manual" ? (
            <>
              <PanelSummaryRow label={t("lifecycle.summary.sla")}>
                {card.hasSla
                  ? `${card.slaValue} ${
                      slaUnitOptions.find((u) => u.value === card.slaUnit)?.label ?? card.slaUnit
                    }`
                  : t("lifecycle.summary.none")}
              </PanelSummaryRow>
              <PanelSummaryRow label={t("lifecycle.summary.whoCanExecute", { action: stepAction })}>
                {accessTypeLabel(card.accessType)}
              </PanelSummaryRow>
              {assignedRoles.length > 0 && (
                <PanelSummaryRow label={t("lifecycle.summary.roles")}>
                  <ChipList>
                    {assignedRoles.map((r) => (
                      <RemovableChip key={r.id} label={r.name} />
                    ))}
                  </ChipList>
                </PanelSummaryRow>
              )}
              {card.accessRules.length > 0 && (
                <PanelSummaryRow label={t("lifecycle.summary.rules")}>
                  <ChipList>
                    {card.accessRules.map((rule, index) => (
                      <RemovableChip
                        key={`${rule.rule_type}-${rule.source_step_id ?? "none"}-${index}`}
                        label={`${ruleTypeLabel(rule.rule_type)}${
                          sourceStepLabel(rule.source_step_id)
                            ? ` (${sourceStepLabel(rule.source_step_id)})`
                            : ""
                        }`}
                      />
                    ))}
                  </ChipList>
                </PanelSummaryRow>
              )}
            </>
          ) : (
            hasModeSelector &&
            organizationId && (
              <LifecycleReviewActionsSection organizationId={organizationId} stepId={card.id} readOnly />
            )
          )}
        </div>
      )}
    </PanelCard>
  )
}

// ─── SortableEditStepCard ─────────────────────────────────────────────────────

function SortableEditStepCard(
  props: EditStepCardProps & { id: string }
) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: props.id })

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn(isDragging && "opacity-50 z-50")}
    >
      <EditStepCard
        {...props}
        dragHandleProps={
          { ...attributes, ...listeners } as React.HTMLAttributes<HTMLButtonElement>
        }
      />
    </div>
  )
}

// ─── EditStepContent ──────────────────────────────────────────────────────────

/**
 * Etapas con grupos (Elaboración, Revisión, Aprobación). Mantiene las tarjetas
 * en estado local y publica `save`/`isDirty` vía `onRegisterEditor`: el botón
 * «Guardar cambios» del footer del sheet persiste de una sola vez todos los
 * grupos modificados (y el orden, si se reordenó).
 */
export function EditStepContent({
  documentTypeId,
  stepType,
  onRegisterEditor,
  organizationId,
  addGroupSignal = 0,
}: EditStepContentProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate('asset_type')
  const { data, isLoading } = useLifecycleSteps(documentTypeId, stepType, true)
  const { data: allStepsData } = useAllLifecycleSteps(documentTypeId, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { data: slaUnitsData } = useLifecycleSlaUnits()
  const { data: accessRuleTypesData } = useLifecycleAccessRuleTypes()
  const { updateStep, createStep, deleteStep } = useLifecycleMutations(
    documentTypeId,
    stepType
  )
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })

  // Misma query key que el formulario General (assets-types-general-form.tsx):
  // comparten cache, no duplica el fetch mientras el sheet de configuración
  // está abierto.
  const { data: documentTypeData } = useQuery({
    queryKey: ["document-type", documentTypeId],
    queryFn: () => getDocumentTypeById(documentTypeId),
    enabled: !!documentTypeId,
  })
  const requiredStepTypes = getRequiredStepTypes(
    documentTypeData?.data?.final_lifecycle_stage ?? "publish"
  )

  const allRoles = rolesData?.data ?? []
  const slaUnitOptions = (slaUnitsData?.data ?? []).map((u) => ({
    value: u.value,
    label: t(`lifecycle.slaUnits.${u.value}`, { defaultValue: u.label }),
  }))
  const accessRuleTypeOptions = accessRuleTypesData?.data ?? []

  // Steps of other, pipeline-earlier types (e.g. "review" steps when this is "approve") —
  // candidates for step_actor_manager's source_step_id alongside same-type cards before this one.
  const crossTypeEarlierSteps = (allStepsData?.data?.steps ?? []).filter(
    (s) => s.type !== stepType && pipelineIndex(s.type) !== -1 && pipelineIndex(s.type) < pipelineIndex(stepType)
  )
  const crossTypeEarlierStepOptions = crossTypeEarlierSteps.map((s) => ({
    value: s.id,
    label: s.name ?? t(`lifecycle.stepTypes.${s.type}`, { defaultValue: s.type }),
  }))

  const [localSteps, setLocalSteps] = useState<EditStepCardData[]>([])
  const [dirtyIds, setDirtyIds] = useState<Set<string>>(() => new Set())
  const [orderDirty, setOrderDirty] = useState(false)
  // Declarado acá (no junto al guardado batch más abajo) porque el efecto de
  // hidratación lo necesita como guard.
  const isDirty = dirtyIds.size > 0 || orderDirty
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)

  // ── Colapsado + edición exclusiva ───────────────────────────────────────────
  // El panel abre colapsado y de solo lectura: cada tarjeta se expande/edita
  // de forma independiente y solo un grupo puede estar en edición a la vez.
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set())
  const [editingId, setEditingId] = useState<string | null>(null)
  const editSnapshotRef = useRef<{ card: EditStepCardData; wasDirty: boolean } | null>(null)

  const handleToggleExpand = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleStartEdit = (id: string) => {
    const card = localSteps.find((c) => c.id === id)
    if (!card) return
    editSnapshotRef.current = { card: { ...card }, wasDirty: dirtyIds.has(id) }
    setEditingId(id)
    setExpandedIds((prev) => new Set(prev).add(id))
  }

  const handleCancelEdit = () => {
    const snapshot = editSnapshotRef.current
    if (snapshot) {
      setLocalSteps((prev) => prev.map((c) => (c.id === snapshot.card.id ? snapshot.card : c)))
      if (!snapshot.wasDirty) {
        setDirtyIds((prev) => {
          if (!prev.has(snapshot.card.id)) return prev
          const next = new Set(prev)
          next.delete(snapshot.card.id)
          return next
        })
      }
    }
    editSnapshotRef.current = null
    setEditingId(null)
  }

  const handleDoneEdit = () => {
    editSnapshotRef.current = null
    setEditingId(null)
  }
  const [addGroupOpen, setAddGroupOpen] = useState(false)
  const [newGroupName, setNewGroupName] = useState("")
  const [newGroupMode, setNewGroupMode] = useState<"manual" | "automatic">("manual")
  const [newGroupHasSla, setNewGroupHasSla] = useState(false)
  const [newGroupSlaValue, setNewGroupSlaValue] = useState("")
  const [newGroupSlaUnit, setNewGroupSlaUnit] = useState("")
  const [newGroupAccessType, setNewGroupAccessType] = useState<
    "all" | "custom_owner"
  >("all")
  const [newGroupOwnerCanExecute, setNewGroupOwnerCanExecute] = useState(false)
  const [newGroupRoleIds, setNewGroupRoleIds] = useState<string[]>([])

  // ── Hidratación / rehidratación ─────────────────────────────────────────────
  // Antes un `initializedRef` descartaba TODOS los refetch: el panel se quedaba
  // con los `role_ids` de la primera carga y al guardar los reenviaba, pisando
  // lo que la matriz hubiera cambiado. Ahora cada llegada de datos rehidrata,
  // pero solo si no hay nada que pisar (excepción documentada a la regla 3 de
  // ia context/sheet-footer-batch-save-guide.md).
  //
  // Una tarjeta abierta con el lápiz pero sin cambios (`editingId` seteado,
  // `isDirty` false) también rehidrata: un toggle hecho en la matriz debe
  // reflejarse en la tarjeta en edición. `sameCards` evita recrear el array —y
  // con él el `SortableContext`— cuando el refetch no trae cambios.
  const serverSteps = data?.data?.steps
  const hydrationBlocked = isDirty

  useEffect(() => {
    if (!serverSteps || hydrationBlocked) return
    const nextCards = [...serverSteps]
      .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      .map(stepToCard)
    // Comparación estructural para no recrear el array (y con él el
    // `SortableContext`) en cada refetch que no trae cambios.
    setLocalSteps((prev) => (sameCards(prev, nextCards) ? prev : nextCards))
  }, [serverSteps, hydrationBlocked])

  // El header del panel pide abrir el alta de grupo incrementando la señal.
  useEffect(() => {
    if (addGroupSignal <= 0) return
    setNewGroupName("")
    setNewGroupMode("manual")
    setNewGroupHasSla(false)
    setNewGroupSlaValue("")
    setNewGroupSlaUnit("")
    setNewGroupAccessType("all")
    setNewGroupOwnerCanExecute(false)
    setNewGroupRoleIds([])
    setAddGroupOpen(true)
  }, [addGroupSignal])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setLocalSteps((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      return arrayMove(prev, oldIndex, newIndex)
    })
    setOrderDirty(true)
  }

  const handleCardChange = (id: string, updated: Partial<EditStepCardData>) => {
    setLocalSteps((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    )
    setDirtyIds((prev) => {
      if (prev.has(id)) return prev
      const next = new Set(prev)
      next.add(id)
      return next
    })
  }

  const handleDelete = async (id: string) => {
    if (!canManage) return
    try {
      await deleteStep.mutateAsync(id)
    } catch (error) {
      handleApiError(error, {
        fallbackMessage: t("lifecycle.saveError"),
        onErrorCode: (code) => {
          if (code !== "LIFECYCLE_REQUIRED_STEP_MINIMUM") return false
          toast.error(t("lifecycle.cannotDeleteLastStep"))
          return true
        },
      })
      return
    }
    setLocalSteps((prev) => prev.filter((c) => c.id !== id))
    setDirtyIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    setExpandedIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
    if (editingId === id) {
      editSnapshotRef.current = null
      setEditingId(null)
    }
  }

  const handleAddGroup = async () => {
    if (!canManage) return
    const isAutomatic =
      (stepType === "edit" || stepType === "review") && newGroupMode === "automatic"
    const access_type = isAutomatic
      ? "owner"
      : deriveAccessType({
          anyone: newGroupAccessType === "all",
          owner: newGroupOwnerCanExecute,
          roleCount: newGroupRoleIds.length,
        })
    const res = await createStep.mutateAsync({
      type: stepType,
      name: newGroupName.trim() || t("lifecycle.newGroupName"),
      mode: isAutomatic ? "automatic" : "manual",
      order: localSteps.length + 1,
      sla_value: !isAutomatic && newGroupHasSla ? Number(newGroupSlaValue) || null : null,
      sla_unit: !isAutomatic && newGroupHasSla ? newGroupSlaUnit || null : null,
      // `access_type` + `role_ids` los arma `buildAccessPayload`: fuera de
      // `custom`/`custom_owner` la clave `role_ids` no puede viajar (422).
      ...buildAccessPayload({
        accessType: access_type,
        roleIds: isAutomatic ? [] : newGroupRoleIds,
      }),
    })
    const newCard = stepToCard(res.data)
    setLocalSteps((prev) => [...prev, newCard])
    setNewGroupName("")
    setNewGroupMode("manual")
    // El grupo recién creado abre directo en edición: el usuario recién lo
    // creó para configurarlo, no para verlo colapsado.
    editSnapshotRef.current = { card: { ...newCard }, wasDirty: false }
    setEditingId(newCard.id)
    setExpandedIds((prev) => new Set(prev).add(newCard.id))
  }

  // ── Guardado batch ──────────────────────────────────────────────────────────
  // El closure vive en un ref para que el footer siempre invoque la última
  // versión sin re-registrar la API en cada tecleo. `isDirty` está declarado
  // arriba, junto a `dirtyIds`/`orderDirty` (lo necesita el efecto de hidratación).
  const saveRef = useRef<() => Promise<void>>(async () => {})

  saveRef.current = async () => {
    if (!canManage || !isDirty) return
    // Reordenar obliga a reenviar todas las tarjetas: `order` es posicional.
    const idsToSave = orderDirty
      ? localSteps.map((c) => c.id)
      : localSteps.filter((c) => dirtyIds.has(c.id)).map((c) => c.id)

    for (const id of idsToSave) {
      const currentCard = localSteps.find((c) => c.id === id)
      if (!currentCard) continue
      const cardIndex = localSteps.findIndex((c) => c.id === id)
      const isAutomatic = currentCard.mode === "automatic"
      await updateStep.mutateAsync({
        stepId: currentCard.id,
        data: {
          name: currentCard.name || undefined,
          order: cardIndex + 1,
          mode: currentCard.mode,
          sla_value: !isAutomatic && currentCard.hasSla
            ? Number(currentCard.slaValue) || null
            : null,
          sla_unit: !isAutomatic && currentCard.hasSla
            ? currentCard.slaUnit || null
            : null,
          // `access_type` + `role_ids` los arma `buildAccessPayload`: fuera de
          // `custom`/`custom_owner` la clave `role_ids` no puede viajar, el backend
          // la rechaza con 422 incluso vacía.
          ...buildAccessPayload({
            accessType: isAutomatic ? "owner" : currentCard.accessType,
            roleIds: isAutomatic ? [] : currentCard.roleIds,
          }),
          access_rules: currentCard.accessRules,
        },
      })
    }

    setDirtyIds(new Set())
    setOrderDirty(false)
    toast.success(t("lifecycle.savedSuccess"))
  }

  const save = useCallback(() => saveRef.current(), [])

  // Descarta los cambios locales sin recomponer el estado a mano: el efecto de
  // rehidratación de arriba repuebla `localSteps` desde la cache en cuanto
  // `hydrationBlocked` baja (ver ese efecto para el porqué del diseño).
  const discardRef = useRef<() => void>(() => {})
  discardRef.current = () => {
    editSnapshotRef.current = null
    setEditingId(null)
    setDirtyIds(new Set())
    setOrderDirty(false)
  }
  const discard = useCallback(() => discardRef.current(), [])

  useEffect(() => {
    onRegisterEditor?.({ isDirty, save, discard })
  }, [isDirty, save, discard, onRegisterEditor])

  useEffect(() => {
    return () => onRegisterEditor?.(null)
  }, [onRegisterEditor])

  if (isLoading) {
    return (
      <div className="flex flex-col gap-3 py-2">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-28 w-full rounded-md" />
        <Skeleton className="h-28 w-full rounded-md" />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col">
      {/* Lista ordenable de tarjetas — única área que scrollea */}
      <ScrollArea className="min-h-0 flex-1" viewportClassName="pr-1">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSteps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-2.5 pb-2">
              {localSteps.length === 0 && (
                <p className="py-6 text-center text-[12px] text-[#94a3b8]">
                  {t("lifecycle.panel.groupsEmpty")}
                </p>
              )}
              {localSteps.map((card, index) => (
                <SortableEditStepCard
                  key={card.id}
                  id={card.id}
                  card={card}
                  stepType={stepType}
                  organizationId={organizationId}
                  slaUnitOptions={slaUnitOptions}
                  allRoles={allRoles}
                  accessRuleTypeOptions={accessRuleTypeOptions}
                  earlierStepOptions={[
                    ...crossTypeEarlierStepOptions,
                    ...localSteps.slice(0, index).map((s) => ({
                      value: s.id,
                      label: s.name || t("lifecycle.newGroupName"),
                    })),
                  ]}
                  onChange={(updated) => handleCardChange(card.id, updated)}
                  onDelete={() => setDeleteConfirmId(card.id)}
                  canDelete={!(requiredStepTypes.has(stepType) && localSteps.length <= 1)}
                  canManage={canManage}
                  t={t}
                  isExpanded={expandedIds.has(card.id)}
                  isEditing={editingId === card.id}
                  isDirty={dirtyIds.has(card.id)}
                  onToggleExpand={() => handleToggleExpand(card.id)}
                  onStartEdit={() => handleStartEdit(card.id)}
                  onCancelEdit={handleCancelEdit}
                  onDoneEdit={handleDoneEdit}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      </ScrollArea>

      {/* Delete confirmation */}
      <HuemulAlertDialog
        open={deleteConfirmId !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmId(null)
        }}
        title={t("lifecycle.deleteGroup")}
        description={t("lifecycle.deleteGroupConfirmDesc")}
        actionLabel={t("lifecycle.deleteGroup")}
        onAction={() => handleDelete(deleteConfirmId!)}
      />

      {/* Add group sheet */}
      <HuemulSheet
        open={addGroupOpen}
        onOpenChange={setAddGroupOpen}
        title={t("lifecycle.addGroupTitle")}
        icon={Plus}
        maxWidth="sm:max-w-md"
        saveAction={{
          label: t("common:add"),
          onClick: handleAddGroup,
          closeOnSuccess: true,
        }}
      >
        <div className="flex flex-col gap-4 py-2 min-h-70">
          <HuemulField
            type="text"
            label={t("lifecycle.groupNameLabel")}
            name="new-group-name"
            value={newGroupName}
            onChange={(v) => setNewGroupName(String(v))}
            placeholder={t("lifecycle.groupNamePlaceholder")}
          />

          {(stepType === "edit" || stepType === "review") && (
            <HuemulField
              type="radio"
              label={t("lifecycle.modeLabel")}
              name="new-group-mode"
              value={newGroupMode}
              options={[
                { value: "manual", label: t("lifecycle.modeManual") },
                { value: "automatic", label: t("lifecycle.modeAutomatic") },
              ]}
              onChange={(v) => setNewGroupMode(v as "manual" | "automatic")}
            />
          )}

          {newGroupMode === "automatic" ? (
            <p className="text-sm text-muted-foreground">
              {t("lifecycle.automaticCreateHint")}
            </p>
          ) : (
            <>
              <div className="flex flex-col gap-2">
                <HuemulField
                  type="switch"
                  label={t("lifecycle.slaLabel")}
                  name="new-group-sla"
                  value={newGroupHasSla}
                  onChange={(v) => {
                    setNewGroupHasSla(Boolean(v))
                    if (!v) {
                      setNewGroupSlaValue("")
                      setNewGroupSlaUnit("")
                    }
                  }}
                  labelFirst
                />
                {newGroupHasSla && (
                  <div className="flex items-center gap-2 pl-1">
                    <HuemulField
                      type="number"
                      label=""
                      name="new-group-sla-value"
                      value={newGroupSlaValue}
                      min={1}
                      onChange={(v) => setNewGroupSlaValue(String(v))}
                      placeholder={t("lifecycle.slaValuePlaceholder")}
                      className="w-20"
                      inputClassName="h-8 text-sm"
                    />
                    <HuemulField
                      type="select"
                      label=""
                      name="new-group-sla-unit"
                      value={newGroupSlaUnit}
                      options={slaUnitOptions}
                      onChange={(v) => setNewGroupSlaUnit(String(v))}
                      className="w-32"
                    />
                  </div>
                )}
              </div>

              {stepType !== "review" && stepType !== "approve" && (
                <HuemulField
                  type="switch"
                  label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
                  name="new-group-access-all"
                  value={newGroupAccessType === "all"}
                  onChange={(v) => {
                    setNewGroupAccessType(v ? "all" : "custom_owner")
                    setNewGroupOwnerCanExecute(true)
                    setNewGroupRoleIds([])
                  }}
                  labelFirst
                />
              )}

              {newGroupAccessType !== "all" && (
                <>
                  <HuemulField
                    type="switch"
                    label={t("lifecycle.ownerCanExecuteLabel", { action: stepAction })}
                    name="new-group-access-owner"
                    value={newGroupOwnerCanExecute}
                    onChange={(v) => setNewGroupOwnerCanExecute(Boolean(v))}
                    labelFirst
                  />

                  <HuemulField
                    type="combobox"
                    label={t("lifecycle.addRole", { action: stepAction })}
                    name="new-group-role"
                    placeholder={t("lifecycle.addRolePlaceholder")}
                    value=""
                    options={allRoles
                      .filter((r) => !newGroupRoleIds.includes(r.id))
                      .map((r) => ({ value: r.id, label: r.name }))}
                    onChange={(roleId) => {
                      if (!roleId) return
                      setNewGroupRoleIds((prev) => [...prev, String(roleId)])
                    }}
                  >
                    {newGroupRoleIds.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {allRoles
                          .filter((r) => newGroupRoleIds.includes(r.id))
                          .map((r) => (
                            <Badge
                              key={r.id}
                              variant="secondary"
                              className="flex items-center gap-1 pr-1.5"
                            >
                              <span className="text-xs">{r.name}</span>
                              <button
                                type="button"
                                className="rounded-full hover:text-destructive hover:cursor-pointer transition-colors"
                                onClick={() =>
                                  setNewGroupRoleIds((prev) =>
                                    prev.filter((id) => id !== r.id)
                                  )
                                }
                                aria-label={`Remove ${r.name}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </Badge>
                          ))}
                      </div>
                    )}
                  </HuemulField>
                </>
              )}
            </>
          )}
        </div>
      </HuemulSheet>
    </div>
  )
}
