import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { GripVertical, Trash2, Plus, Pencil, ChevronDown, Check, X } from "lucide-react"
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
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { LifecycleReviewActionsSection } from "./assets-types-lifecycle-review-actions"
import {
  ChipList,
  PanelCard,
  PanelFieldLabel,
  PanelIconButton,
  RemovableChip,
  SettingToggleList,
  SettingToggleRow,
  StepModeBadge,
} from "./assets-types-lifecycle-ui"
import type { LifecycleStep, AccessRuleType } from "@/services/lifecycle"
import type { EditStepCardData, EditStepContentProps, EditStepCardProps } from '@/types/assets'

export type { EditStepCardData, EditStepContentProps } from '@/types/assets'

// Pipeline order used to restrict step_actor_manager's source_step_id to steps
// that are genuinely earlier — mirrors the backend's own validation so the
// picker doesn't offer choices the API would reject.
const PIPELINE_ORDER = ["create", "edit", "review", "approve", "publish", "archive"]

function pipelineIndex(type: string): number {
  return PIPELINE_ORDER.indexOf(type)
}

// ─── Utils ────────────────────────────────────────────────────────────────────

export function stepToCard(step: LifecycleStep): EditStepCardData {
  return {
    id: step.id,
    name: step.name ?? "",
    mode: step.mode ?? "manual",
    hasSla: step.sla_value != null,
    slaValue: step.sla_value != null ? String(step.sla_value) : "",
    slaUnit: step.sla_unit ?? "",
    accessType: step.access_type,
    ownerCanExecute: step.access_type === "owner" || step.access_type === "custom_owner",
    roleIds: step.step_roles.map((r) => r.role_id),
    roleNames: Object.fromEntries(
      step.step_roles.map((r) => [r.role_id, r.role_name ?? r.role_id])
    ),
    accessRules: (step.access_rules ?? []).map((r) => ({
      rule_type: r.rule_type,
      source_step_id: r.source_step_id,
    })),
  }
}

// ─── EditStepCard ─────────────────────────────────────────────────────────────

/**
 * Tarjeta de un grupo. Los controles están siempre habilitados (si el usuario
 * puede gestionar): los cambios se acumulan en el estado local de
 * `EditStepContent` y se persisten con «Guardar cambios» del footer del sheet.
 * El lápiz solo alterna el renombrado inline del grupo.
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
}: EditStepCardProps) {
  const [isExpanded, setIsExpanded] = useState(true)
  const [isRenaming, setIsRenaming] = useState(false)
  const [pendingRuleType, setPendingRuleType] = useState<AccessRuleType | "">("")
  const [pendingSourceStepId, setPendingSourceStepId] = useState("")

  const assignedRoles = allRoles.filter((r) => card.roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !card.roleIds.includes(r.id))
  // Non-repeatable rule types already present can't be added again (backend
  // rejects exact rule_type+source_step_id duplicates); step_actor_manager can
  // repeat with a different source step, so it stays selectable.
  const addedSimpleRuleTypes = new Set(
    card.accessRules.filter((r) => r.rule_type !== "step_actor_manager").map((r) => r.rule_type)
  )
  const availableRuleTypeOptions = accessRuleTypeOptions.filter(
    (o) => !addedSimpleRuleTypes.has(o.value)
  )
  // Prefer the i18n label so options follow the active language; fall back to
  // the backend-provided label only when no translation key exists.
  const ruleTypeLabel = (ruleType: AccessRuleType) =>
    t(`lifecycle.accessRuleTypes.${ruleType}`, {
      defaultValue: accessRuleTypeOptions.find((o) => o.value === ruleType)?.label ?? ruleType,
    })
  const sourceStepLabel = (sourceStepId: string | null) =>
    sourceStepId ? earlierStepOptions.find((o) => o.value === sourceStepId)?.label ?? sourceStepId : null

  const handleAddAccessRule = () => {
    if (!pendingRuleType) return
    if (pendingRuleType === "step_actor_manager" && !pendingSourceStepId) return
    onChange({
      accessRules: [
        ...card.accessRules,
        {
          rule_type: pendingRuleType,
          source_step_id: pendingRuleType === "step_actor_manager" ? pendingSourceStepId : null,
        },
      ],
    })
    setPendingRuleType("")
    setPendingSourceStepId("")
  }

  const handleRemoveAccessRule = (index: number) => {
    onChange({ accessRules: card.accessRules.filter((_, i) => i !== index) })
  }

  const ro = !canManage
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })
  const groupName = card.name.trim() || t("lifecycle.newGroupName")
  const allowsAnyone = card.accessType === "all"
  const hasModeSelector = stepType === "edit" || stepType === "review"

  return (
    <PanelCard>
      {/* Cabecera — siempre visible; colapsada, la tarjeta se reduce a esta fila */}
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        {dragHandleProps && !ro && (
          <button
            type="button"
            className="shrink-0 text-[#b6c0cd] transition-colors hover:cursor-grab hover:text-[#64748b] active:cursor-grabbing"
            aria-label={t("lifecycle.groups")}
            {...dragHandleProps}
          >
            <GripVertical className="size-4" />
          </button>
        )}

        {isRenaming ? (
          <div className="min-w-0 flex-1">
            <HuemulField
              type="text"
              label=""
              name={`card-name-${card.id}`}
              value={card.name}
              onChange={(v) => onChange({ name: String(v) })}
              placeholder={t("lifecycle.groupNamePlaceholder")}
              inputClassName="h-7 text-[13px] font-semibold"
            />
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            className="min-w-0 flex-1 truncate text-left text-[13px] font-semibold text-[#0f172a] hover:cursor-pointer"
            title={groupName}
          >
            {groupName}
          </button>
        )}

        <StepModeBadge
          label={
            card.mode === "automatic" ? t("lifecycle.modeAutomatic") : t("lifecycle.modeManual")
          }
        />

        {canManage && (
          <>
            <PanelIconButton
              icon={isRenaming ? Check : Pencil}
              label={t("lifecycle.renameGroup")}
              onClick={() => setIsRenaming((prev) => !prev)}
            />
            <PanelIconButton
              icon={Trash2}
              label={t("lifecycle.deleteGroup")}
              tone="danger"
              disabled={!canDelete}
              onClick={onDelete}
            />
          </>
        )}
        <PanelIconButton
          icon={ChevronDown}
          label={isExpanded ? t("lifecycle.collapseGroup") : t("lifecycle.expandGroup")}
          onClick={() => setIsExpanded((prev) => !prev)}
          className={cn("transition-transform", isExpanded && "rotate-180")}
        />
      </div>

      {isExpanded && (
        <div className="flex flex-col gap-3 border-t border-[#eef1f5] px-3 py-3">
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
                    const newAccessType =
                      card.roleIds.length > 0 ? (v ? "custom_owner" : "custom") : "owner"
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
                                    const newAccessType =
                                      newRoleIds.length > 0
                                        ? card.ownerCanExecute
                                          ? "custom_owner"
                                          : "custom"
                                        : "owner"
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
                        const newAccessType = card.ownerCanExecute ? "custom_owner" : "custom"
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
                  <div className="flex flex-col gap-1.5">
                    <PanelFieldLabel disabled={ro}>
                      {t("lifecycle.accessRules.title")}
                    </PanelFieldLabel>
                    {card.accessRules.length > 0 && (
                      <ChipList>
                        {card.accessRules.map((rule, index) => (
                          <RemovableChip
                            key={`${rule.rule_type}-${rule.source_step_id ?? "none"}-${index}`}
                            label={`${ruleTypeLabel(rule.rule_type)}${
                              sourceStepLabel(rule.source_step_id)
                                ? ` (${sourceStepLabel(rule.source_step_id)})`
                                : ""
                            }`}
                            disabled={ro}
                            onRemove={ro ? undefined : () => handleRemoveAccessRule(index)}
                          />
                        ))}
                      </ChipList>
                    )}
                    <div className="flex items-center gap-2">
                      <HuemulField
                        type="select"
                        label=""
                        name={`access-rule-type-${card.id}`}
                        value={pendingRuleType}
                        options={availableRuleTypeOptions.map((o) => ({
                          value: o.value,
                          label: ruleTypeLabel(o.value),
                        }))}
                        placeholder={t("lifecycle.panel.addRulePlaceholder")}
                        onChange={(v) => {
                          setPendingRuleType((v as AccessRuleType) || "")
                          setPendingSourceStepId("")
                        }}
                        disabled={ro}
                        className="flex-1"
                      />
                      {pendingRuleType === "step_actor_manager" && (
                        <HuemulField
                          type="select"
                          label=""
                          name={`access-rule-source-${card.id}`}
                          value={pendingSourceStepId}
                          options={earlierStepOptions}
                          placeholder={t("lifecycle.accessRules.sourceStepPlaceholder")}
                          onChange={(v) => setPendingSourceStepId(String(v ?? ""))}
                          disabled={ro}
                          className="flex-1"
                        />
                      )}
                      <button
                        type="button"
                        onClick={handleAddAccessRule}
                        title={t("lifecycle.accessRules.add")}
                        aria-label={t("lifecycle.accessRules.add")}
                        disabled={
                          ro ||
                          !pendingRuleType ||
                          (pendingRuleType === "step_actor_manager" && !pendingSourceStepId)
                        }
                        className="inline-flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-[#dde4ec] text-[#64748b] transition-colors hover:cursor-pointer hover:bg-[#f8fafc] hover:text-[#334155] disabled:pointer-events-none disabled:opacity-50"
                      >
                        <Plus className="size-4" />
                      </button>
                    </div>
                    {pendingRuleType === "step_actor_manager" && (
                      <p className="text-[11px] text-[#94a3b8]">
                        {t("lifecycle.accessRules.stepActorManagerNote")}
                      </p>
                    )}
                  </div>
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
  const initializedRef = useRef(false)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
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

  useEffect(() => {
    if (data?.data?.steps && !initializedRef.current) {
      const sorted = [...data.data.steps].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0)
      )
      setLocalSteps(sorted.map(stepToCard))
      initializedRef.current = true
    }
  }, [data])

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
    await deleteStep.mutateAsync(id)
    setLocalSteps((prev) => prev.filter((c) => c.id !== id))
    setDirtyIds((prev) => {
      if (!prev.has(id)) return prev
      const next = new Set(prev)
      next.delete(id)
      return next
    })
  }

  const handleAddGroup = async () => {
    if (!canManage) return
    const isAutomatic =
      (stepType === "edit" || stepType === "review") && newGroupMode === "automatic"
    let access_type: string
    if (isAutomatic) {
      access_type = "owner"
    } else if (newGroupAccessType === "all") {
      access_type = "all"
    } else if (newGroupOwnerCanExecute && newGroupRoleIds.length > 0) {
      access_type = "custom_owner"
    } else if (!newGroupOwnerCanExecute && newGroupRoleIds.length > 0) {
      access_type = "custom"
    } else {
      access_type = "owner"
    }
    const res = await createStep.mutateAsync({
      type: stepType,
      name: newGroupName.trim() || t("lifecycle.newGroupName"),
      mode: isAutomatic ? "automatic" : "manual",
      access_type,
      order: localSteps.length + 1,
      sla_value: !isAutomatic && newGroupHasSla ? Number(newGroupSlaValue) || null : null,
      sla_unit: !isAutomatic && newGroupHasSla ? newGroupSlaUnit || null : null,
      ...(!isAutomatic && access_type !== "all" && access_type !== "owner" && { role_ids: newGroupRoleIds }),
    })
    setLocalSteps((prev) => [...prev, stepToCard(res.data)])
    setNewGroupName("")
    setNewGroupMode("manual")
  }

  // ── Guardado batch ──────────────────────────────────────────────────────────
  // El closure vive en un ref para que el footer siempre invoque la última
  // versión sin re-registrar la API en cada tecleo.
  const isDirty = dirtyIds.size > 0 || orderDirty
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
          access_type: isAutomatic ? "owner" : currentCard.accessType,
          ...(!isAutomatic && currentCard.accessType !== "all" && currentCard.accessType !== "owner" && {
            role_ids: currentCard.roleIds,
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

  useEffect(() => {
    onRegisterEditor?.({ isDirty, save })
  }, [isDirty, save, onRegisterEditor])

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
                  canDelete={!((stepType === "edit" || stepType === "approve") && localSteps.length <= 1)}
                  canManage={canManage}
                  t={t}
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
