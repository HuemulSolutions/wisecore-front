"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Settings, RefreshCw, Plus, X, Check, Globe, CheckCircle2, Columns3, Loader2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { useAllLifecycleSteps, useLifecycleMutations } from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import type { AssetTypeLifecycleMatrixProps } from "@/types/assets"
import type { LifecycleStep } from "@/types/lifecycle"
import type { Role } from "@/types/rbac"

export type { AssetTypeLifecycleMatrixProps } from "@/types/assets"

// Mismo orden de pipeline que `assets-types-lifecycle-edit-step.tsx` (PIPELINE_ORDER) —
// determina el orden de las pastillas y de las columnas. Los tipos no listados van al
// final, en el orden que los devuelva el backend.
const PIPELINE_ORDER = ["create", "edit", "review", "approve", "publish", "archive", "view"]

// Tipos de paso que soportan múltiples grupos (varios `LifecycleStep` por tipo) —
// ver el routing de `EditStepContent` vs `CreateStepContent` en assets-types-lifecycle-dialog.tsx.
const GROUPABLE_TYPES = new Set(["edit", "review", "approve"])

function pipelineIndex(type: string): number {
  const idx = PIPELINE_ORDER.indexOf(type)
  return idx === -1 ? PIPELINE_ORDER.length : idx
}

function isRoleAssigned(step: LifecycleStep, roleId: string): boolean {
  return step.step_roles.some((r) => r.role_id === roleId)
}

type MatrixRow =
  | { kind: "all" }
  | { kind: "listedRoles" }
  | { kind: "role"; role: Role }
  | { kind: "add" }

const ROLE_COLUMN_WIDTH = "232px"

/** Celda marcada: check blanco sobre círculo verde. */
function CellCheck() {
  return (
    <span className="inline-flex size-[18px] items-center justify-center rounded-full bg-[#dcfce7]">
      <Check className="size-3 text-[#15803d]" strokeWidth={3} />
    </span>
  )
}

/** Celda sin permiso: guion gris. */
function CellDash() {
  return <span className="text-[13px] text-[#cbd5e1]">—</span>
}

/**
 * Matriz rol × paso del ciclo de vida. Cada columna es un `LifecycleStep` (un grupo)
 * y cada fila un rol. Sobre la tabla, el selector de etapa del flujo: elegir una etapa
 * tinta sus columnas y abre el panel lateral con sus grupos (`onSelectStage`), que es
 * donde se configura el detalle (SLA, modo, reglas de acceso). El menú «Columnas»
 * conserva el filtro de visibilidad por tipo de paso.
 */
export function AssetTypeLifecycleMatrix({
  documentTypeId,
  enabled = true,
  activeStageType,
  lockedStageType = null,
  onSelectStage,
}: AssetTypeLifecycleMatrixProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate("asset_type")

  const { data, isLoading, isFetching, refetch } = useAllLifecycleSteps(documentTypeId, enabled)
  const { data: rolesData } = useRoles(enabled, 1, 1000)
  const { updateStep } = useLifecycleMutations(documentTypeId, null)

  const allSteps = React.useMemo(() => data?.data?.steps ?? [], [data])
  const allRoles = React.useMemo(() => rolesData?.data ?? [], [rolesData])

  const [visibleTypes, setVisibleTypes] = React.useState<Set<string> | null>(null)
  const [localExtraRoleIds, setLocalExtraRoleIds] = React.useState<string[]>([])
  const [isAddingRole, setIsAddingRole] = React.useState(false)
  const [roleToRemove, setRoleToRemove] = React.useState<Role | null>(null)

  const stepTypesPresent = React.useMemo(() => {
    const present = new Set(allSteps.map((s) => s.type))
    const ordered = PIPELINE_ORDER.filter((type) => present.has(type))
    const extra = [...present].filter((type) => !PIPELINE_ORDER.includes(type))
    return [...ordered, ...extra]
  }, [allSteps])

  // Cuántos grupos hay por tipo — alimenta el badge de las pastillas agrupables.
  const groupCountByType = React.useMemo(() => {
    const counts = new Map<string, number>()
    allSteps.forEach((s) => counts.set(s.type, (counts.get(s.type) ?? 0) + 1))
    return counts
  }, [allSteps])

  const visibleSteps = React.useMemo(() => {
    const sorted = [...allSteps].sort((a, b) => {
      const typeDiff = pipelineIndex(a.type) - pipelineIndex(b.type)
      if (typeDiff !== 0) return typeDiff
      return (a.order ?? 0) - (b.order ?? 0)
    })
    if (!visibleTypes) return sorted
    return sorted.filter((s) => visibleTypes.has(s.type))
  }, [allSteps, visibleTypes])

  // Roles ya presentes en algún step + agregados localmente sin asignaciones aún.
  const listedRoleIds = React.useMemo(() => {
    const ids = new Set<string>()
    allSteps.forEach((s) => s.step_roles.forEach((r) => ids.add(r.role_id)))
    localExtraRoleIds.forEach((id) => ids.add(id))
    return ids
  }, [allSteps, localExtraRoleIds])

  const listedRoles = React.useMemo(
    () => allRoles.filter((r) => listedRoleIds.has(r.id)).sort((a, b) => a.name.localeCompare(b.name)),
    [allRoles, listedRoleIds]
  )

  const availableRolesToAdd = React.useMemo(
    () => allRoles.filter((r) => !listedRoleIds.has(r.id)),
    [allRoles, listedRoleIds]
  )

  const toggleTypeFilter = (type: string) => {
    setVisibleTypes((prev) => {
      const base = prev ?? new Set(stepTypesPresent)
      const next = new Set(base)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  // Elegir una etapa oculta por el filtro la vuelve visible: si no, el panel se abriría
  // sin ninguna columna que lo respalde.
  const handleSelectStage = (type: string) => {
    setVisibleTypes((prev) => {
      if (!prev || prev.has(type)) return prev
      const next = new Set(prev)
      next.add(type)
      return next
    })
    onSelectStage(type)
  }

  // Deriva el nuevo access_type igual que el switch "El propietario puede…" del
  // panel de edición (assets-types-lifecycle-edit-step.tsx): salir de "custom" es
  // la única forma de que el propietario quede sin acceso; cualquier otro estado
  // (incluido "all") preserva el acceso del propietario al agregar el primer rol.
  const toggleRole = React.useCallback(
    async (step: LifecycleStep, roleId: string) => {
      if (!canManage || step.mode === "automatic") return
      const ownerCanExecute = step.access_type !== "custom"
      const currentIds = step.step_roles.map((r) => r.role_id)
      const newRoleIds = currentIds.includes(roleId)
        ? currentIds.filter((id) => id !== roleId)
        : [...currentIds, roleId]
      const newAccessType =
        newRoleIds.length > 0 ? (ownerCanExecute ? "custom_owner" : "custom") : "owner"
      await updateStep.mutateAsync({
        stepId: step.id,
        data: { access_type: newAccessType, role_ids: newRoleIds },
      })
    },
    [canManage, updateStep]
  )

  const stepsWithRole = React.useCallback(
    (roleId: string) => allSteps.filter((s) => isRoleAssigned(s, roleId)),
    [allSteps]
  )

  const handleRemoveRole = (role: Role) => {
    if (stepsWithRole(role.id).length === 0) {
      setLocalExtraRoleIds((prev) => prev.filter((id) => id !== role.id))
      return
    }
    setRoleToRemove(role)
  }

  const confirmRemoveRole = async () => {
    if (!roleToRemove) return
    await Promise.all(stepsWithRole(roleToRemove.id).map((step) => toggleRole(step, roleToRemove.id)))
    setLocalExtraRoleIds((prev) => prev.filter((id) => id !== roleToRemove.id))
    setRoleToRemove(null)
  }

  const rows: MatrixRow[] = React.useMemo(
    () => [
      { kind: "all" },
      { kind: "listedRoles" },
      ...listedRoles.map((role) => ({ kind: "role" as const, role })),
      { kind: "add" },
    ],
    [listedRoles]
  )

  const gridTemplateColumns = `${ROLE_COLUMN_WIDTH} repeat(${Math.max(visibleSteps.length, 1)}, minmax(112px, 1fr))`

  const stepTypeLabel = (type: string) =>
    t(`lifecycle.stepTypes.${type}`, { defaultValue: type })

  const rowKey = (row: MatrixRow) => (row.kind === "role" ? `role-${row.role.id}` : row.kind)

  /** Nombre + línea secundaria de la primera columna. */
  const renderRoleCell = (row: MatrixRow) => {
    switch (row.kind) {
      case "all":
        return (
          <div className="flex min-w-0 items-center gap-2">
            <Globe className="size-4 shrink-0 text-[#94a3b8]" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-[#0f172a]">
                {t("lifecycle.matrix.wholeOrganization")}
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                {t("lifecycle.matrix.globalScope")}
              </span>
            </div>
          </div>
        )
      case "listedRoles":
        return (
          <div className="flex min-w-0 items-center gap-2">
            <CheckCircle2 className="size-4 shrink-0 text-[#94a3b8]" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-[#0f172a]">
                {t("lifecycle.matrix.allListedRoles")}
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                {t("lifecycle.matrix.roleCount", { total: listedRoles.length })}
              </span>
            </div>
          </div>
        )
      case "role":
        return (
          <div className="flex min-w-0 items-center justify-between gap-2">
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-[#0f172a]" title={row.role.name}>
                {row.role.name}
              </span>
              {row.role.description && (
                <span className="truncate text-[11px] text-[#94a3b8]" title={row.role.description}>
                  {row.role.description}
                </span>
              )}
            </div>
            {canManage && (
              <HuemulButton
                icon={X}
                variant="ghost"
                size="icon"
                className="size-6 shrink-0 text-[#94a3b8] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                iconClassName="size-3.5"
                onClick={() => handleRemoveRole(row.role)}
                tooltip={t("lifecycle.matrix.removeRole")}
              />
            )}
          </div>
        )
      case "add":
        return null
    }
  }

  /** Celda de intersección rol × step. */
  const renderStepCell = (row: MatrixRow, step: LifecycleStep) => {
    switch (row.kind) {
      case "all":
        return step.access_type === "all" ? <CellCheck /> : <CellDash />
      case "listedRoles":
        return step.access_type === "custom" || step.access_type === "custom_owner" ? (
          <CellCheck />
        ) : (
          <CellDash />
        )
      case "role": {
        const checked = isRoleAssigned(step, row.role.id)
        const isAutomatic = step.mode === "automatic"
        const isLocked = lockedStageType === step.type
        const disabled = !canManage || isAutomatic || isLocked || updateStep.isPending
        return (
          <button
            type="button"
            role="checkbox"
            aria-checked={checked}
            aria-label={t("lifecycle.matrix.toggleRole", {
              role: row.role.name,
              step: step.name?.trim() || stepTypeLabel(step.type),
            })}
            title={
              isAutomatic
                ? t("lifecycle.matrix.automaticHint")
                : isLocked
                  ? t("lifecycle.unsavedInStage", { stage: stepTypeLabel(step.type) })
                  : undefined
            }
            disabled={disabled}
            onClick={() => toggleRole(step, row.role.id)}
            className={cn(
              "inline-flex size-7 items-center justify-center rounded-full transition-colors",
              disabled ? "cursor-default" : "hover:cursor-pointer hover:bg-[#f1f5f9]",
            )}
          >
            {checked ? <CellCheck /> : <CellDash />}
          </button>
        )
      }
      case "add":
        return null
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-col gap-3 py-2">
      {/* Selector de etapa del flujo + acciones — shrink-0, nunca scrollea */}
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
            {t("lifecycle.matrix.stageLabel")}
          </span>
          <div className="flex flex-wrap gap-1.5">
            {stepTypesPresent.map((type) => {
              const isActive = activeStageType === type
              const groupCount = groupCountByType.get(type) ?? 0
              return (
                <button
                  key={type}
                  type="button"
                  aria-pressed={isActive}
                  onClick={() => handleSelectStage(type)}
                  className={cn(
                    "inline-flex h-[30px] items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors hover:cursor-pointer",
                    isActive
                      ? "border-[#bfd3fb] bg-[#eef4ff] font-semibold text-[#1d4ed8]"
                      : "border-[#dbe1e9] text-[#334155] hover:border-[#bfd3fb] hover:bg-[#f8fafc]",
                  )}
                >
                  {stepTypeLabel(type)}
                  {GROUPABLE_TYPES.has(type) && (
                    <span
                      className={cn(
                        "inline-flex size-[18px] items-center justify-center rounded-full text-[11px] font-semibold",
                        isActive ? "bg-[#dbe7fe] text-[#1d4ed8]" : "bg-[#eef2f7] text-[#64748b]",
                      )}
                    >
                      {groupCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
          <p className="text-[12px] text-[#64748b]">{t("lifecycle.matrix.hint")}</p>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                title={t("lifecycle.matrix.columns")}
                aria-label={t("lifecycle.matrix.columns")}
                className="inline-flex size-[30px] items-center justify-center rounded-[8px] border border-[#dde4ec] text-[#64748b] transition-colors hover:cursor-pointer hover:bg-[#f8fafc] hover:text-[#334155]"
              >
                <Columns3 className="size-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuLabel>{t("lifecycle.matrix.filterHint")}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {stepTypesPresent.map((type) => (
                <DropdownMenuCheckboxItem
                  key={type}
                  checked={!visibleTypes || visibleTypes.has(type)}
                  onCheckedChange={() => toggleTypeFilter(type)}
                  onSelect={(event) => event.preventDefault()}
                >
                  {stepTypeLabel(type)}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <button
            type="button"
            title={t("common:refresh")}
            aria-label={t("common:refresh")}
            disabled={isFetching}
            onClick={() => refetch()}
            className="inline-flex size-[30px] items-center justify-center rounded-[8px] border border-[#dde4ec] text-[#64748b] transition-colors hover:cursor-pointer hover:bg-[#f8fafc] hover:text-[#334155] disabled:pointer-events-none disabled:opacity-60"
          >
            {isFetching ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <RefreshCw className="size-4" />
            )}
          </button>
        </div>
      </div>

      {/* Tabla — única área que scrollea */}
      <div className="min-h-0 flex-1 overflow-auto rounded-[10px] border border-[#e5eaf0] bg-white">
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="grid" style={{ gridTemplateColumns }}>
            {/* Header */}
            <div className="sticky top-0 left-0 z-20 border-b border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {t("lifecycle.matrix.roleColumn")}
              </span>
            </div>
            {visibleSteps.map((step) => {
              const isActiveStage = activeStageType === step.type
              const groupLabel = GROUPABLE_TYPES.has(step.type)
                ? t("lifecycle.matrix.groupPrefix", {
                    name: step.name?.trim() || t("lifecycle.matrix.unassigned"),
                  })
                : t("lifecycle.matrix.unassigned")
              return (
                <div
                  key={`header-${step.id}`}
                  className={cn(
                    "sticky top-0 z-10 flex flex-col gap-0.5 border-b border-l border-[#e5eaf0] px-3 py-2.5",
                    isActiveStage ? "bg-[#f2f6fe]" : "bg-[#f7f9fb]",
                  )}
                >
                  <div className="flex items-center gap-1">
                    <span
                      className={cn(
                        "truncate text-[12px] font-semibold",
                        isActiveStage ? "text-[#1d4ed8]" : "text-[#334155]",
                      )}
                    >
                      {stepTypeLabel(step.type)}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleSelectStage(step.type)}
                      title={t("lifecycle.matrix.configureStep", { step: stepTypeLabel(step.type) })}
                      aria-label={t("lifecycle.matrix.configureStep", { step: stepTypeLabel(step.type) })}
                      className={cn(
                        "inline-flex size-4 shrink-0 items-center justify-center rounded-[4px] transition-colors hover:cursor-pointer",
                        isActiveStage
                          ? "text-[#1d4ed8]"
                          : "text-[#b6c0cd] hover:bg-[#eef2f7] hover:text-[#64748b]",
                      )}
                    >
                      <Settings className="size-3" />
                    </button>
                  </div>
                  <span
                    className="truncate text-[11px] font-normal text-[#94a3b8]"
                    title={groupLabel}
                  >
                    {groupLabel}
                  </span>
                </div>
              )
            })}

            {/* Filas */}
            {rows.map((row, rowIndex) => {
              const isLast = rowIndex === rows.length - 1
              if (row.kind === "add") {
                if (!canManage) return null
                return (
                  <div
                    key={rowKey(row)}
                    className="px-3 py-3"
                    style={{ gridColumn: "1 / -1" }}
                  >
                    {isAddingRole ? (
                      <div className="max-w-[280px]">
                        <HuemulField
                          type="combobox"
                          label=""
                          name="matrix-add-role"
                          value=""
                          placeholder={t("lifecycle.matrix.addRolePlaceholder")}
                          options={availableRolesToAdd.map((r) => ({ value: r.id, label: r.name }))}
                          onChange={(roleId) => {
                            if (roleId) setLocalExtraRoleIds((prev) => [...prev, String(roleId)])
                            setIsAddingRole(false)
                          }}
                        />
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setIsAddingRole(true)}
                        className="inline-flex h-[30px] items-center gap-1.5 rounded-[8px] border border-dashed border-[#bfd3fb] px-3 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff]"
                      >
                        <Plus className="size-3.5" />
                        {t("lifecycle.matrix.addRole")}
                      </button>
                    )}
                  </div>
                )
              }

              return (
                <div key={rowKey(row)} className="group contents">
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex min-w-0 items-center bg-white px-3 py-2.5 transition-colors group-hover:bg-[#fafbfd]",
                      !isLast && "border-b border-[#eef1f5]",
                    )}
                  >
                    {renderRoleCell(row)}
                  </div>
                  {visibleSteps.map((step) => (
                    <div
                      key={`${rowKey(row)}-${step.id}`}
                      className={cn(
                        "flex items-center justify-center border-l border-[#eef1f5] px-3 py-2.5 transition-colors group-hover:bg-[#fafbfd]",
                        activeStageType === step.type && "bg-[#fafcff]",
                        !isLast && "border-b border-b-[#eef1f5]",
                      )}
                    >
                      {renderStepCell(row, step)}
                    </div>
                  ))}
                </div>
              )
            })}
          </div>
        )}
      </div>

      <HuemulAlertDialog
        open={roleToRemove !== null}
        onOpenChange={(open) => {
          if (!open) setRoleToRemove(null)
        }}
        title={t("lifecycle.matrix.removeRole")}
        description={t("lifecycle.matrix.removeRoleConfirm")}
        actionLabel={t("lifecycle.matrix.removeRole")}
        actionVariant="destructive"
        onAction={confirmRemoveRole}
      />
    </div>
  )
}
