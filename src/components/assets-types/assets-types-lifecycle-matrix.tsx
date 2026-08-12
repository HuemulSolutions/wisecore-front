"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Settings, RefreshCw, Plus, X, Check, Globe, CheckCircle2 } from "lucide-react"
import { HuemulTable } from "@/huemul/components/huemul-table"
import type { HuemulTableColumn } from "@/huemul/components/huemul-table"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Checkbox } from "@/components/ui/checkbox"
import { cn } from "@/lib/utils"
import { useAllLifecycleSteps, useLifecycleMutations } from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import type { AssetTypeLifecycleMatrixProps } from "@/types/assets"
import type { LifecycleStep } from "@/types/lifecycle"
import type { Role } from "@/types/rbac"

export type { AssetTypeLifecycleMatrixProps } from "@/types/assets"

// Mismo orden de pipeline que `assets-types-lifecycle-edit-step.tsx` (PIPELINE_ORDER) —
// determina el orden de las columnas. Los tipos no listados van al final, en el orden
// que los devuelva el backend.
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

/**
 * Matriz rol × paso del ciclo de vida — reemplaza el selector de pills + contenido
 * único por una tabla comparable donde cada columna es un `LifecycleStep` (un grupo)
 * y cada fila un rol. El detalle de cada columna (SLA, modo, reglas de acceso,
 * grupos) se configura en el panel lateral que abre el engranaje del header,
 * montado por el contenedor (`AssetTypeLifecyclePanel`) vía `onConfigureStep`.
 */
export function AssetTypeLifecycleMatrix({
  documentTypeId,
  enabled = true,
  activeStepId,
  onConfigureStep,
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

  const roleColumn: HuemulTableColumn<MatrixRow> = {
    key: "role",
    label: t("lifecycle.matrix.roleColumn"),
    width: "220px",
    sticky: true,
    render: (row) => {
      switch (row.kind) {
        case "all":
          return (
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <Globe className="h-4 w-4 text-amber-500 shrink-0" />
              {t("lifecycle.matrix.wholeOrganization")}
            </span>
          )
        case "listedRoles":
          return (
            <span className="flex items-center gap-2 text-sm font-medium text-foreground">
              <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
              {t("lifecycle.matrix.allListedRoles")}
            </span>
          )
        case "role":
          return (
            <div className="flex items-center justify-between gap-2">
              <span className="text-sm truncate">{row.role.name}</span>
              {canManage && (
                <HuemulButton
                  icon={X}
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemoveRole(row.role)}
                  tooltip={t("lifecycle.matrix.removeRole")}
                />
              )}
            </div>
          )
        case "add":
          if (!canManage) return null
          return isAddingRole ? (
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
          ) : (
            <button
              type="button"
              onClick={() => setIsAddingRole(true)}
              className="flex items-center gap-1 text-sm text-primary font-medium hover:underline hover:cursor-pointer transition-colors"
            >
              <Plus className="w-4 h-4" />
              {t("lifecycle.matrix.addRole")}
            </button>
          )
      }
    },
  }

  const stepColumns: HuemulTableColumn<MatrixRow>[] = visibleSteps.map((step) => {
    const stepTypeLabel = t(`lifecycle.stepTypes.${step.type}`, { defaultValue: step.type })
    const groupLabel = GROUPABLE_TYPES.has(step.type)
      ? step.name?.trim() || t("lifecycle.matrix.unassigned")
      : null
    const isAutomatic = step.mode === "automatic"
    const isActive = activeStepId === step.id

    return {
      key: step.id,
      label: stepTypeLabel,
      align: "center",
      renderHeader: () => (
        <div className="flex flex-col items-center gap-1 py-1">
          <div className="flex items-center gap-1">
            <span className="text-xs font-semibold whitespace-nowrap">{stepTypeLabel}</span>
            <HuemulButton
              icon={Settings}
              variant="ghost"
              size="icon"
              className={cn("h-5 w-5", isActive && "bg-primary/10 text-primary")}
              onClick={() => onConfigureStep(step.id)}
              tooltip={t("lifecycle.matrix.configureStep", { step: stepTypeLabel })}
            />
          </div>
          {groupLabel ? (
            <span className="text-[11px] font-normal text-muted-foreground truncate max-w-28" title={groupLabel}>
              {t("lifecycle.matrix.groupPrefix", { name: groupLabel })}
            </span>
          ) : (
            <span className="text-[11px] font-normal text-muted-foreground/60">
              {t("lifecycle.matrix.unassigned")}
            </span>
          )}
        </div>
      ),
      render: (row) => {
        switch (row.kind) {
          case "all":
            return step.access_type === "all" ? (
              <Check className="h-4 w-4 text-amber-600 mx-auto" />
            ) : null
          case "listedRoles":
            return step.access_type === "custom" || step.access_type === "custom_owner" ? (
              <Check className="h-4 w-4 text-emerald-600 mx-auto" />
            ) : null
          case "role":
            return (
              <div className="flex justify-center">
                <Checkbox
                  checked={isRoleAssigned(step, row.role.id)}
                  disabled={!canManage || isAutomatic || updateStep.isPending}
                  onCheckedChange={() => toggleRole(step, row.role.id)}
                  aria-label={t("lifecycle.matrix.groupPrefix", { name: row.role.name })}
                />
              </div>
            )
          case "add":
            return null
        }
      },
    }
  })

  const columns = [roleColumn, ...stepColumns]

  return (
    <div className="flex flex-col gap-3 h-full min-h-0 py-2">
      {/* Toolbar: filtro de tipo de paso (pills) + refresh — shrink-0, nunca scrollea */}
      <div className="shrink-0 flex flex-col gap-2 pb-2 border-b border-border">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap gap-2">
            {stepTypesPresent.map((type) => {
              const isVisible = !visibleTypes || visibleTypes.has(type)
              return (
                <Badge
                  key={type}
                  variant={isVisible ? "default" : "outline"}
                  className="cursor-pointer select-none text-sm px-4 py-1.5 transition-colors"
                  onClick={() => toggleTypeFilter(type)}
                  title={t("lifecycle.matrix.filterHint")}
                >
                  {t(`lifecycle.stepTypes.${type}`, { defaultValue: type })}
                </Badge>
              )
            })}
          </div>
          <HuemulButton
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            icon={RefreshCw}
            tooltip={t("common:refresh")}
            loading={isFetching}
            onClick={() => refetch()}
          />
        </div>
        <p className="text-sm text-muted-foreground">{t("lifecycle.matrix.hint")}</p>
      </div>

      {/* Tabla — única área que scrollea */}
      <HuemulTable<MatrixRow>
        data={rows}
        columns={columns}
        getRowKey={(row) => (row.kind === "role" ? `role-${row.role.id}` : row.kind)}
        getRowClassName={(row) =>
          row.kind === "all"
            ? "bg-amber-50 hover:bg-amber-50 dark:bg-amber-950/20 dark:hover:bg-amber-950/20"
            : row.kind === "listedRoles"
              ? "bg-emerald-50 hover:bg-emerald-50 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/20"
              : ""
        }
        isLoading={isLoading}
        isFetching={isFetching}
        className="flex-1 min-h-0"
      />

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
