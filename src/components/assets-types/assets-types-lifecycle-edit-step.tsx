import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { X, GripVertical, Trash2, Plus, Pencil, Save, Ban, ChevronDown } from "lucide-react"
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
import { HuemulButton } from "@/huemul/components/huemul-button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  useLifecycleSteps,
  useLifecycleMutations,
  useLifecycleSlaUnits,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { LifecycleReviewActionsSection } from "./assets-types-lifecycle-review-actions"
import type { LifecycleStep } from "@/services/lifecycle"
import type { EditStepCardData, EditStepContentProps, EditStepCardProps } from '@/types/assets'

export type { EditStepCardData, EditStepContentProps } from '@/types/assets'

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
  }
}

// ─── EditStepCard ─────────────────────────────────────────────────────────────

function EditStepCard({
  card,
  stepType,
  slaUnitOptions,
  allRoles,
  onChange,
  onDelete,
  onSave,
  t,
  isDeleting,
  canDelete,
  dragHandleProps,
  onEditingChange,
  organizationId,
}: EditStepCardProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [snapshot, setSnapshot] = useState<EditStepCardData | null>(null)
  const [isExpanded, setIsExpanded] = useState(true)

  const assignedRoles = allRoles.filter((r) => card.roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !card.roleIds.includes(r.id))
  const ro = !isEditing
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })

  const toggleExpanded = () => {
    if (isEditing) return
    setIsExpanded((prev) => !prev)
  }

  const handleCheckClick = async () => {
    if (isEditing) {
      setIsSaving(true)
      try {
        await onSave()
        setIsEditing(false)
        setSnapshot(null)
        onEditingChange?.(false)
      } finally {
        setIsSaving(false)
      }
    } else {
      setSnapshot({ ...card })
      setIsEditing(true)
      setIsExpanded(true)
      onEditingChange?.(true)
    }
  }

  const handleCancel = () => {
    if (snapshot) onChange(snapshot)
    setIsEditing(false)
    setSnapshot(null)
    onEditingChange?.(false)
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-md border bg-background p-4 shadow-sm transition-colors",
        isEditing ? "border-primary/50" : "border-border",
        !isEditing && "hover:cursor-pointer"
      )}
      onClick={toggleExpanded}
    >
      {/* Header: drag handle + name + edit/confirm + cancel + delete + expand toggle — always visible */}
      <div className="flex items-center gap-2">
        {dragHandleProps && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground hover:cursor-grab active:cursor-grabbing shrink-0"
            aria-label="Drag to reorder"
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
          >
            <GripVertical className="w-4 h-4" />
          </button>
        )}
        <div className="flex-1" onClick={(e) => { if (isEditing) e.stopPropagation() }}>
          <HuemulField
            type="text"
            label=""
            name={`card-name-${card.id}`}
            value={card.name}
            onChange={(v) => onChange({ name: String(v) })}
            placeholder={t("lifecycle.groupNamePlaceholder")}
            disabled={ro}
            inputClassName={cn(
              "h-7 border-0 shadow-none px-0 focus-visible:ring-0 font-medium",
              ro && "cursor-default"
            )}
          />
        </div>
        <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
          {isEditing ? (
            <>
              <HuemulButton
                icon={Ban}
                label={t("common:cancel")}
                variant="ghost"
                onClick={handleCancel}
                disabled={isSaving}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              />
              <HuemulButton
                icon={Save}
                label={t("common:save")}
                variant="default"
                onClick={handleCheckClick}
                loading={isSaving}
                disabled={isSaving}
              />
            </>
          ) : (
            <HuemulButton
              icon={Pencil}
              label={t("common:edit")}
              variant="ghost"
              onClick={handleCheckClick}
              className="text-muted-foreground"
            />
          )}
          <HuemulButton
            icon={Trash2}
            variant="ghost"
            size="icon"
            onClick={onDelete}
            disabled={isDeleting || !canDelete}
            tooltip={t("lifecycle.deleteGroup")}
            className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          />
        </div>
        <ChevronDown
          className={cn(
            "w-4 h-4 text-muted-foreground transition-transform shrink-0",
            isExpanded && "rotate-180"
          )}
        />
      </div>

      {isExpanded && (
        <>
          <div className="h-px bg-border" />

          {/* Mode selector — only for edit/review steps (approve stays manual-only) */}
          {(stepType === "edit" || stepType === "review") && (
            <HuemulField
              type="radio"
              label={t("lifecycle.modeLabel")}
              name={`mode-${card.id}`}
              value={card.mode}
              options={[
                { value: "manual", label: t("lifecycle.modeManual") },
                { value: "automatic", label: t("lifecycle.modeAutomatic") },
              ]}
              onChange={(v) => onChange({ mode: v as "manual" | "automatic" })}
              disabled={ro}
            />
          )}

          {/* Manual mode: SLA + access configuration */}
          {card.mode === "manual" && (
            <>
              {/* SLA */}
              <div className="flex flex-col gap-2">
                <HuemulField
                  type="switch"
                  label={t("lifecycle.slaLabel")}
                  name={`sla-toggle-${card.id}`}
                  value={card.hasSla}
                  onChange={(v) =>
                    onChange({
                      hasSla: Boolean(v),
                      slaValue: v ? card.slaValue : "",
                      slaUnit: v ? card.slaUnit : "",
                    })
                  }
                  disabled={ro}
                  labelFirst
                />
                {card.hasSla && (
                  <div className="flex items-center gap-2 pl-1">
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
                      inputClassName="h-8 text-sm"
                    />
                    <HuemulField
                      type="select"
                      label=""
                      name={`sla-unit-${card.id}`}
                      value={card.slaUnit}
                      options={slaUnitOptions}
                      onChange={(v) => onChange({ slaUnit: String(v) })}
                      disabled={ro}
                      className="w-40"
                    />
                  </div>
                )}
              </div>

              {/* Allow anyone switch */}
              <HuemulField
                type="switch"
                label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
                name={`access-all-${card.id}`}
                value={card.accessType === "all"}
                onChange={(v) => {
                  if (v) {
                    onChange({ accessType: "all", ownerCanExecute: false, roleIds: [] })
                  } else {
                    onChange({ accessType: "owner", ownerCanExecute: true, roleIds: [] })
                  }
                }}
                disabled={ro}
                labelFirst
              />

              {/* When not "all": owner switch + role picker */}
              {card.accessType !== "all" && (
                <>
                  <HuemulField
                    type="switch"
                    label={t("lifecycle.ownerCanExecuteLabel", { action: stepAction })}
                    name={`access-owner-${card.id}`}
                    value={card.ownerCanExecute}
                    onChange={(v) => {
                      const newOwner = Boolean(v)
                      const newAccessType =
                        card.roleIds.length > 0
                          ? newOwner ? "custom_owner" : "custom"
                          : "owner"
                      onChange({ ownerCanExecute: newOwner, accessType: newAccessType })
                    }}
                    disabled={ro}
                    labelFirst
                  />

                  <HuemulField
                    type="combobox"
                    label={t("lifecycle.addRole", { action: stepAction })}
                    name={`role-${card.id}`}
                    placeholder={t("lifecycle.addRolePlaceholder")}
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
                  >
                    {assignedRoles.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {assignedRoles.map((r) => (
                          <Badge
                            key={r.id}
                            variant="secondary"
                            className="flex items-center gap-1 pr-1.5"
                          >
                            <span className="text-xs">{r.name}</span>
                            {!ro && (
                              <button
                                type="button"
                                className="rounded-full hover:text-destructive hover:cursor-pointer transition-colors"
                                onClick={() => {
                                  const newRoleIds = card.roleIds.filter((id) => id !== r.id)
                                  const newAccessType =
                                    newRoleIds.length > 0
                                      ? card.ownerCanExecute ? "custom_owner" : "custom"
                                      : "owner"
                                  onChange({ roleIds: newRoleIds, accessType: newAccessType })
                                }}
                                aria-label={`Remove ${r.name}`}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            )}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </HuemulField>
                </>
              )}
            </>
          )}

          {/* Automatic mode: external functionalities table — only for edit/review steps */}
          {card.mode === "automatic" && (stepType === "edit" || stepType === "review") && organizationId && (
            <LifecycleReviewActionsSection organizationId={organizationId} stepId={card.id} readOnly={ro} />
          )}
        </>
      )}
    </div>
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

export function EditStepContent({ documentTypeId, stepType, onEditingChange, organizationId }: EditStepContentProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { data, isLoading } = useLifecycleSteps(documentTypeId, stepType, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { data: slaUnitsData } = useLifecycleSlaUnits()
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

  const [localSteps, setLocalSteps] = useState<EditStepCardData[]>([])
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
  }

  const handleCardChange = (id: string, updated: Partial<EditStepCardData>) => {
    setLocalSteps((prev) =>
      prev.map((c) => (c.id === id ? { ...c, ...updated } : c))
    )
  }

  const handleDelete = async (id: string) => {
    await deleteStep.mutateAsync(id)
    setLocalSteps((prev) => prev.filter((c) => c.id !== id))
  }

  const handleAddGroup = async () => {
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
    <div className="flex flex-col gap-4 h-full min-h-0">
      {/* Title */}
      <div className="shrink-0 flex flex-col gap-1">
        <p className="text-base font-semibold text-foreground">
          {t(`lifecycle.stepTypes.${stepType}`, { defaultValue: t("lifecycle.editTitle") })}
        </p>
        <p className="text-sm text-muted-foreground">
          {t(`lifecycle.stepDescriptions.${stepType}`, { defaultValue: t("lifecycle.editDescription") })}
        </p>
      </div>

      {/* Groups label + Add group button — fixed, never scrolls */}
      <div className="shrink-0 flex items-center justify-between py-2 border-b border-border">
        <p className="text-sm font-semibold">{t("lifecycle.groups")}</p>
        <button
          type="button"
          onClick={() => {
            setNewGroupName("")
            setNewGroupMode("manual")
            setNewGroupHasSla(false)
            setNewGroupSlaValue("")
            setNewGroupSlaUnit("")
            setNewGroupAccessType("all")
            setNewGroupOwnerCanExecute(false)
            setNewGroupRoleIds([])
            setAddGroupOpen(true)
          }}
          className="flex items-center gap-1 text-sm text-primary font-medium hover:underline hover:cursor-pointer transition-colors"
        >
          <Plus className="w-4 h-4" />
          {t("lifecycle.addGroup")}
        </button>
      </div>

      {/* Sortable card list — only this area scrolls */}
      <ScrollArea className="flex-1 min-h-0" viewportClassName="pr-3">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localSteps.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="flex flex-col gap-3 pb-2">
              {localSteps.map((card) => (
                <SortableEditStepCard
                  key={card.id}
                  id={card.id}
                  card={card}
                  stepType={stepType}
                  organizationId={organizationId}
                  slaUnitOptions={slaUnitOptions}
                  allRoles={allRoles}
                  onChange={(updated) => handleCardChange(card.id, updated)}
                  onDelete={() => setDeleteConfirmId(card.id)}
                  canDelete={!((stepType === "edit" || stepType === "approve") && localSteps.length <= 1)}
                  onEditingChange={(editing) => onEditingChange?.(editing)}
                  onSave={async () => {
                    const currentCard = localSteps.find((c) => c.id === card.id)!
                    const index = localSteps.findIndex((c) => c.id === card.id)
                    const isAutomatic = currentCard.mode === "automatic"
                    await updateStep.mutateAsync({
                      stepId: currentCard.id,
                      data: {
                        name: currentCard.name || undefined,
                        order: index + 1,
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
                      },
                    })
                  }}
                  t={t}
                  isDeleting={false}
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
        <div className="flex flex-col gap-4 py-2 min-h-[280px]">
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
