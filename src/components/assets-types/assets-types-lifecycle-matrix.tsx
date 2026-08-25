"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Settings, RefreshCw, Plus, X, Check, Globe, User, Loader2, ChevronRight } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulMatrix } from "@/huemul/components/huemul-matrix"
import type { HuemulMatrixRow } from "@/huemul/components/huemul-matrix"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import {
  useAllLifecycleSteps,
  useLifecycleMutations,
  usePendingLifecycleStepIds,
  lifecycleQueryKeys,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import {
  LIFECYCLE_PIPELINE_ORDER,
  isGroupableStepType,
  pipelineIndex,
  pipelineSortIndex,
  ownerCanExecute,
  allowsAnyone,
  usesRoleList,
  stepRoleIds,
  buildAccessPatch,
} from "@/lib/lifecycle-access"
import type { AssetTypeLifecycleMatrixProps } from "@/types/assets"
import type { LifecycleStep, AccessRuleType } from "@/types/lifecycle"
import type { Role } from "@/types/rbac"

export type { AssetTypeLifecycleMatrixProps } from "@/types/assets"

/** Filas fijas de reglas relacionales — mismo orden en todas las columnas. */
const ACCESS_RULE_ROWS: AccessRuleType[] = [
  "creator",
  "creator_manager",
  "owner_manager",
  "step_actor_manager",
]

function isRoleAssigned(step: LifecycleStep, roleId: string): boolean {
  return usesRoleList(step.access_type) && step.step_roles.some((r) => r.role_id === roleId)
}

type MatrixRow =
  | { kind: "all" }
  | { kind: "owner" }
  | { kind: "sectionRoles" }
  | { kind: "role"; role: Role }
  | { kind: "add" }
  | { kind: "sectionRules" }
  | { kind: "rule"; ruleType: AccessRuleType }

/** Celda concedida: check blanco sobre círculo verde. */
function CellCheck() {
  return (
    <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-[#dcfce7]">
      <Check className="size-3 text-[#15803d]" strokeWidth={3} />
    </span>
  )
}

/** Celda implícita: la fila «Toda la organización» ya cubre este permiso. */
function CellImplied() {
  return (
    <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-[#eef2f7]">
      <Check className="size-3 text-[#94a3b8]" strokeWidth={3} />
    </span>
  )
}

/** Celda sin permiso: guion gris. */
function CellDash() {
  return <span className="text-[13px] text-[#cbd5e1]">—</span>
}

/** Celda que no aplica a esta columna (p. ej. propietario en la etapa de creación). */
function CellNotApplicable({ title }: { title?: string }) {
  return (
    <span className="text-[10.5px] font-medium text-[#cbd5e1]" title={title}>
      n/a
    </span>
  )
}

/** Botón de celda editable, con los cuatro estados: concedido / implícito / sin permiso / en vuelo. */
function ToggleCell({
  checked,
  implied = false,
  pending = false,
  disabled,
  onClick,
  ariaLabel,
  title,
}: {
  checked: boolean
  implied?: boolean
  pending?: boolean
  disabled: boolean
  onClick: () => void
  ariaLabel: string
  title?: string
}) {
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={checked || implied}
      aria-label={ariaLabel}
      title={title}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex size-7 items-center justify-center rounded-full transition-colors",
        disabled ? "cursor-default" : "hover:cursor-pointer hover:bg-[#f1f5f9]",
      )}
    >
      {pending ? (
        <Loader2 className="size-3.5 animate-spin text-[#94a3b8]" />
      ) : implied ? (
        <CellImplied />
      ) : checked ? (
        <CellCheck />
      ) : (
        <CellDash />
      )}
    </button>
  )
}

/** Tinte de fondo + ícono de la fila especial "Toda la organización". */
const ROW_TINT: Partial<Record<MatrixRow["kind"], { cell: string; hover: string; icon: string }>> = {
  all: { cell: "bg-[#fffbeb]", hover: "group-hover:bg-[#fef6dd]", icon: "text-[#d97706]" },
}

/**
 * Matriz rol × paso del ciclo de vida. Cada columna es un `LifecycleStep` (un grupo)
 * y cada fila define un permiso: toda la organización, el propietario, un rol o una
 * regla relacional (creador, jefe del creador, jefe del propietario, jefe de un paso
 * anterior). Todas las filas son editables acá — la matriz es dueña de todo el
 * permiso del ciclo de vida, no solo de los roles.
 *
 * Sobre la tabla, el selector de etapa del flujo: elegir una etapa tinta y filtra la
 * tabla a solo esa etapa, y abre el panel lateral (`onSelectStage`), que es donde se
 * configura lo que no es permiso: nombre, modo, SLA, vigencia, orden y acciones
 * externas. Reclicar el chip activo restaura todas las columnas.
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
  const queryClient = useQueryClient()

  const { data, isLoading, isFetching } = useAllLifecycleSteps(documentTypeId, enabled)
  const {
    data: rolesData,
    isFetching: isFetchingRoles,
    refetch: refetchRoles,
  } = useRoles(enabled, 1, 1000)
  const { updateStep } = useLifecycleMutations(documentTypeId, null)
  const pendingStepIds = usePendingLifecycleStepIds(documentTypeId)

  const allSteps = React.useMemo(() => data?.data?.steps ?? [], [data])
  const allRoles = React.useMemo(() => rolesData?.data ?? [], [rolesData])

  const [localExtraRoleIds, setLocalExtraRoleIds] = React.useState<string[]>([])
  const [isAddingRole, setIsAddingRole] = React.useState(false)
  const [roleToRemove, setRoleToRemove] = React.useState<Role | null>(null)
  const [isRefreshing, setIsRefreshing] = React.useState(false)
  // Popover abierto de "jefe de paso anterior": qué step está eligiendo su source step.
  const [rulePickerStepId, setRulePickerStepId] = React.useState<string | null>(null)
  // Sección «Acceso automático por jerarquía»: arranca colapsada — son filas fijas
  // que la mayoría de los tipos de activo no usa.
  const [rulesExpanded, setRulesExpanded] = React.useState(false)

  const stepTypeLabel = (type: string) =>
    t(`lifecycle.stepTypes.${type}`, { defaultValue: type })
  const stepActionLabel = (type: string) =>
    t(`lifecycle.stepActions.${type}`, { defaultValue: type })
  const ruleTypeLabel = (ruleType: AccessRuleType) =>
    t(`lifecycle.accessRuleTypes.${ruleType}`, { defaultValue: ruleType })
  const stepColumnLabel = (step: LifecycleStep) => step.name?.trim() || stepTypeLabel(step.type)

  const stepTypesPresent = React.useMemo(() => {
    const present = new Set(allSteps.map((s) => s.type))
    const ordered = LIFECYCLE_PIPELINE_ORDER.filter((type) => present.has(type))
    const extra = [...present].filter((type) => pipelineIndex(type) === -1)
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
      const typeDiff = pipelineSortIndex(a.type) - pipelineSortIndex(b.type)
      if (typeDiff !== 0) return typeDiff
      return (a.order ?? 0) - (b.order ?? 0)
    })
    return activeStageType ? sorted.filter((s) => s.type === activeStageType) : sorted
  }, [allSteps, activeStageType])

  // Candidatos a `source_step_id` de "jefe de paso anterior" por columna: mismo
  // criterio que el backend valida — pasos de un tipo anterior en el pipeline, o
  // del mismo tipo con `order` menor.
  const earlierStepOptionsByStepId = React.useMemo(() => {
    const map = new Map<string, { value: string; label: string }[]>()
    allSteps.forEach((step) => {
      const earlier = allSteps.filter((other) => {
        if (other.id === step.id) return false
        if (other.type === step.type) return (other.order ?? 0) < (step.order ?? 0)
        const otherIdx = pipelineIndex(other.type)
        return otherIdx !== -1 && otherIdx < pipelineIndex(step.type)
      })
      map.set(
        step.id,
        earlier
          .sort((a, b) => pipelineSortIndex(a.type) - pipelineSortIndex(b.type) || (a.order ?? 0) - (b.order ?? 0))
          .map((s) => ({ value: s.id, label: stepColumnLabel(s) })),
      )
    })
    return map
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allSteps])

  // Roles ya presentes en algún step + agregados localmente sin asignaciones aún.
  const listedRoleIds = React.useMemo(() => {
    const ids = new Set<string>()
    // `stepRoleIds` filtra los roles residuales de pasos que ya no son custom-ish:
    // sin eso generarían filas fantasma en la tabla.
    allSteps.forEach((s) => stepRoleIds(s).forEach((id) => ids.add(id)))
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

  // Falla silenciosa → toast: el rollback optimista ya devuelve la celda a su
  // estado anterior (ver onError de `updateStep` en useLifecycle.ts); acá solo
  // se avisa que el cambio no se guardó.
  const runToggle = React.useCallback(
    async (action: () => Promise<unknown>) => {
      try {
        await action()
      } catch {
        toast.error(t("lifecycle.saveError"))
      }
    },
    [t]
  )

  // Fila «Toda la organización». `access_rules` sí es reemplazo total y se limpia
  // explícitamente; `role_ids` NO viaja: fuera de `custom`/`custom_owner` el
  // backend rechaza la clave (422). Los `step_roles` que queden allá son inertes
  // y la UI los ignora vía `stepRoleIds`.
  const toggleAnyone = React.useCallback(
    (step: LifecycleStep) => {
      if (!canManage || step.mode === "automatic") return Promise.resolve()
      return updateStep.mutateAsync({
        stepId: step.id,
        data: {
          access_type: allowsAnyone(step.access_type) ? "owner" : "all",
          access_rules: [],
        },
      })
    },
    [canManage, updateStep]
  )

  // Fila «Propietario».
  const toggleOwner = React.useCallback(
    (step: LifecycleStep) => {
      if (!canManage || step.mode === "automatic") return Promise.resolve()
      const roleIds = stepRoleIds(step)
      return updateStep.mutateAsync({
        stepId: step.id,
        data: buildAccessPatch({
          anyone: false,
          owner: !ownerCanExecute(step.access_type),
          roleIds,
        }),
      })
    },
    [canManage, updateStep]
  )

  // Fila de rol. Se parte de `stepRoleIds`, no de `step_roles` crudo: en una
  // columna que salió de `custom` los roles residuales del backend no cuentan,
  // así que marcar un rol arranca desde cero y no resucita los viejos. Las celdas
  // de una columna `all` están deshabilitadas (ver el render), por eso derivar
  // con `anyone: false` acá no puede sacar una columna de `all`.
  const toggleRole = React.useCallback(
    (step: LifecycleStep, roleId: string) => {
      if (!canManage || step.mode === "automatic") return Promise.resolve()
      const current = stepRoleIds(step)
      const roleIds = current.includes(roleId)
        ? current.filter((id) => id !== roleId)
        : [...current, roleId]
      return updateStep.mutateAsync({
        stepId: step.id,
        data: buildAccessPatch({
          anyone: false,
          owner: ownerCanExecute(step.access_type),
          roleIds,
        }),
      })
    },
    [canManage, updateStep]
  )

  // Fila de regla relacional — `access_rules` es reemplazo total.
  const toggleRule = React.useCallback(
    (step: LifecycleStep, ruleType: AccessRuleType, sourceStepId?: string) => {
      if (!canManage || step.mode === "automatic") return Promise.resolve()
      const has = step.access_rules.some((r) => r.rule_type === ruleType)
      const rules = has
        ? step.access_rules.filter((r) => r.rule_type !== ruleType)
        : [...step.access_rules, { rule_type: ruleType, source_step_id: sourceStepId ?? null }]
      return updateStep.mutateAsync({
        stepId: step.id,
        data: {
          access_rules: rules.map(({ rule_type, source_step_id }) => ({ rule_type, source_step_id })),
        },
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
    try {
      await Promise.all(stepsWithRole(roleToRemove.id).map((step) => toggleRole(step, roleToRemove.id)))
    } catch {
      toast.error(t("lifecycle.saveError"))
    }
    setLocalExtraRoleIds((prev) => prev.filter((id) => id !== roleToRemove.id))
    setRoleToRemove(null)
  }

  // Un solo handler para TODAS las queries de la superficie (refresh-button-guide
  // §3): los steps se invalidan por el prefijo del document type —así se refresca
  // también la query del panel lateral, no solo la de la matriz— y los roles por
  // su propio `refetch`.
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({
          queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId),
        }),
        refetchRoles(),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, documentTypeId, refetchRoles])

  // Cuántos tipos de regla están activos en al menos un paso — alimenta el badge
  // de la cabecera cuando la sección está colapsada, para que una regla vigente
  // nunca quede escondida sin señal.
  const activeRulesCount = React.useMemo(
    () => new Set(allSteps.flatMap((s) => s.access_rules.map((r) => r.rule_type))).size,
    [allSteps]
  )

  const rows: MatrixRow[] = React.useMemo(
    () => [
      { kind: "all" },
      { kind: "owner" },
      { kind: "sectionRoles" },
      ...listedRoles.map((role) => ({ kind: "role" as const, role })),
      { kind: "add" },
      { kind: "sectionRules" },
      ...(rulesExpanded
        ? ACCESS_RULE_ROWS.map((ruleType) => ({ kind: "rule" as const, ruleType }))
        : []),
    ],
    [listedRoles, rulesExpanded]
  )

  const rowKey = (row: MatrixRow) => {
    switch (row.kind) {
      case "role":
        return `role-${row.role.id}`
      case "rule":
        return `rule-${row.ruleType}`
      default:
        return row.kind
    }
  }

  /** Nombre + línea secundaria de la primera columna. */
  const renderRoleCell = (row: MatrixRow) => {
    switch (row.kind) {
      case "all":
        return (
          <div className="flex min-w-0 items-center gap-2">
            <Globe className={cn("size-4 shrink-0", ROW_TINT.all!.icon)} />
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
      case "owner":
        return (
          <div className="flex min-w-0 items-center gap-2">
            <User className="size-4 shrink-0 text-[#64748b]" />
            <div className="flex min-w-0 flex-col">
              <span className="truncate text-[13px] font-medium text-[#0f172a]">
                {t("lifecycle.accessOwner")}
              </span>
              <span className="text-[11px] text-[#94a3b8]">
                {t("lifecycle.matrix.ownerScope")}
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
      case "rule":
        return (
          <span className="truncate text-[13px] font-medium text-[#0f172a]" title={ruleTypeLabel(row.ruleType)}>
            {ruleTypeLabel(row.ruleType)}
          </span>
        )
      case "add":
      case "sectionRoles":
      case "sectionRules":
        return null
    }
  }

  /** Celda de intersección permiso × step. */
  const renderStepCell = (row: MatrixRow, step: LifecycleStep) => {
    const isAutomatic = step.mode === "automatic"
    const isLocked = lockedStageType === step.type
    const pending = pendingStepIds.has(step.id)
    const commonDisabled = !canManage || isAutomatic || isLocked || pending
    const lockedOrAutomaticTitle = isAutomatic
      ? t("lifecycle.matrix.automaticHint")
      : isLocked
        ? t("lifecycle.unsavedInStage", { stage: stepTypeLabel(step.type) })
        : undefined

    switch (row.kind) {
      case "all":
        return (
          <ToggleCell
            checked={allowsAnyone(step.access_type)}
            pending={pending}
            disabled={commonDisabled}
            onClick={() => runToggle(() => toggleAnyone(step))}
            ariaLabel={t("lifecycle.matrix.toggleAnyone", { step: stepColumnLabel(step) })}
            title={lockedOrAutomaticTitle}
          />
        )
      case "owner": {
        if (step.type === "create") {
          return <CellNotApplicable title={t("lifecycle.matrix.ownerNotApplicable")} />
        }
        const implied = allowsAnyone(step.access_type)
        // Roles vigentes, no los residuales: si no, la celda quedaría habilitada
        // sobre roles que el backend ya ignora y el clic degradaría el paso a `custom`.
        const noRoles = stepRoleIds(step).length === 0
        const title = implied
          ? t("lifecycle.matrix.impliedByAnyone", { action: stepActionLabel(step.type) })
          : noRoles
            ? t("lifecycle.matrix.ownerRequiredHint")
            : lockedOrAutomaticTitle
        return (
          <ToggleCell
            checked={ownerCanExecute(step.access_type)}
            implied={implied}
            pending={pending}
            disabled={commonDisabled || implied || noRoles}
            onClick={() => runToggle(() => toggleOwner(step))}
            ariaLabel={t("lifecycle.matrix.toggleOwner", { step: stepColumnLabel(step) })}
            title={title}
          />
        )
      }
      case "role": {
        const implied = allowsAnyone(step.access_type)
        const title = implied
          ? t("lifecycle.matrix.impliedByAnyone", { action: stepActionLabel(step.type) })
          : lockedOrAutomaticTitle
        return (
          <ToggleCell
            checked={isRoleAssigned(step, row.role.id)}
            implied={implied}
            pending={pending}
            disabled={commonDisabled || implied}
            onClick={() => runToggle(() => toggleRole(step, row.role.id))}
            ariaLabel={t("lifecycle.matrix.toggleRole", {
              role: row.role.name,
              step: stepColumnLabel(step),
            })}
            title={title}
          />
        )
      }
      case "rule": {
        const implied = allowsAnyone(step.access_type)
        const checked = step.access_rules.some((r) => r.rule_type === row.ruleType)
        const title = implied
          ? t("lifecycle.matrix.impliedByAnyone", { action: stepActionLabel(step.type) })
          : lockedOrAutomaticTitle
        const ariaLabel = t("lifecycle.matrix.toggleRule", {
          rule: ruleTypeLabel(row.ruleType),
          step: stepColumnLabel(step),
        })

        if (row.ruleType === "step_actor_manager" && !checked) {
          const options = earlierStepOptionsByStepId.get(step.id) ?? []
          if (options.length === 0) {
            return <CellNotApplicable title={t("lifecycle.matrix.noEarlierStep")} />
          }
          return (
            <Popover
              open={rulePickerStepId === step.id}
              onOpenChange={(open) => setRulePickerStepId(open ? step.id : null)}
            >
              <PopoverTrigger asChild>
                <ToggleCell
                  checked={false}
                  implied={implied}
                  pending={pending}
                  disabled={commonDisabled || implied}
                  onClick={() => {}}
                  ariaLabel={ariaLabel}
                  title={title}
                />
              </PopoverTrigger>
              <PopoverContent className="w-64 p-3" align="center">
                <div className="flex flex-col gap-2">
                  <span className="text-[12px] font-medium text-[#334155]">
                    {t("lifecycle.accessRules.sourceStepPlaceholder")}
                  </span>
                  <HuemulField
                    type="select"
                    label=""
                    name={`rule-source-${step.id}`}
                    value=""
                    options={options}
                    placeholder={t("lifecycle.accessRules.sourceStepPlaceholder")}
                    onChange={(value) => {
                      setRulePickerStepId(null)
                      if (!value) return
                      runToggle(() => toggleRule(step, "step_actor_manager", String(value)))
                    }}
                  />
                </div>
              </PopoverContent>
            </Popover>
          )
        }

        return (
          <ToggleCell
            checked={checked}
            implied={implied}
            pending={pending}
            disabled={commonDisabled || implied}
            onClick={() => runToggle(() => toggleRule(step, row.ruleType))}
            ariaLabel={ariaLabel}
            title={title}
          />
        )
      }
      case "add":
      case "sectionRoles":
      case "sectionRules":
        return null
    }
  }

  // Filas «cells» editables tal cual; las tres filas especiales (añadir rol,
  // separador de sección y cabecera colapsable de reglas) pasan a bandas a
  // ancho completo — `add` desaparece del todo si el usuario no puede gestionar.
  const matrixRows: HuemulMatrixRow<MatrixRow>[] = rows.flatMap((row): HuemulMatrixRow<MatrixRow>[] => {
    if (row.kind === "add") {
      if (!canManage) return []
      return [
        {
          kind: "band",
          key: rowKey(row),
          className: "bg-white",
          contentClassName: "px-3 py-3",
          content: isAddingRole ? (
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
              className="inline-flex h-7.5 items-center gap-1.5 rounded-xl border border-dashed border-[#bfd3fb] px-3 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff]"
            >
              <Plus className="size-3.5" />
              {t("lifecycle.matrix.addRole")}
            </button>
          ),
        },
      ]
    }

    if (row.kind === "sectionRoles") {
      return [
        {
          kind: "band",
          key: rowKey(row),
          className: "border-t border-b border-[#eef1f5] bg-[#f7f9fb]",
          contentClassName: "px-3 py-1.5",
          content: (
            <span className="text-[10.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              {t("lifecycle.matrix.sectionRoles")}
            </span>
          ),
        },
      ]
    }

    if (row.kind === "sectionRules") {
      const label = t("lifecycle.matrix.sectionRules")
      const toggle = () => setRulesExpanded((prev) => !prev)
      return [
        {
          kind: "band",
          key: rowKey(row),
          hoverable: true,
          onClick: toggle,
          className: "border-t border-b border-[#eef1f5] bg-[#f7f9fb] hover:cursor-pointer group-hover/band:bg-[#eef2f7]",
          content: (
            <button
              type="button"
              onClick={toggle}
              aria-expanded={rulesExpanded}
              aria-label={t(
                rulesExpanded ? "lifecycle.matrix.collapseSection" : "lifecycle.matrix.expandSection",
                { section: label },
              )}
              title={t("lifecycle.matrix.sectionRulesHint")}
              className="flex w-max items-center gap-1.5 px-3 py-1.5 text-left hover:cursor-pointer"
            >
              <ChevronRight
                className={cn(
                  "size-3.5 shrink-0 text-[#94a3b8] transition-transform",
                  rulesExpanded && "rotate-90",
                )}
              />
              <span className="whitespace-nowrap text-[10.5px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {label}
              </span>
              {!rulesExpanded && activeRulesCount > 0 && (
                <span className="inline-flex shrink-0 items-center rounded-full bg-[#eef2f7] px-1.5 text-[11px] font-semibold text-[#64748b]">
                  {t("lifecycle.matrix.activeRulesCount", { count: activeRulesCount })}
                </span>
              )}
            </button>
          ),
        },
      ]
    }

    return [{ kind: "cells", key: rowKey(row), data: row }]
  })

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
                  onClick={() => onSelectStage(type)}
                  className={cn(
                    "inline-flex h-7.5 items-center gap-1.5 rounded-full border px-3 text-[13px] transition-colors hover:cursor-pointer",
                    isActive
                      ? "border-[#bfd3fb] bg-[#eef4ff] font-semibold text-[#1d4ed8]"
                      : "border-[#dbe1e9] text-[#334155] hover:border-[#bfd3fb] hover:bg-[#f8fafc]",
                  )}
                >
                  {stepTypeLabel(type)}
                  {isGroupableStepType(type) && (
                    <span
                      className={cn(
                        "inline-flex size-4.5 items-center justify-center rounded-full text-[11px] font-semibold",
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
          <HuemulButton
            variant="ghost"
            size="icon"
            className="size-7.5"
            icon={RefreshCw}
            tooltip={t("common:refresh")}
            loading={isRefreshing || isFetching || isFetchingRoles}
            onClick={handleRefresh}
          />
        </div>
      </div>

      {/* Tabla — única área que scrollea */}
      <HuemulMatrix<MatrixRow, LifecycleStep>
        className="min-h-0 flex-1"
        isLoading={isLoading}
        cornerLabel={t("lifecycle.matrix.roleColumn")}
        columns={visibleSteps.map((step) => ({ key: step.id, data: step, groupKey: step.type }))}
        hasColumnHeader={(group) => isGroupableStepType(group.groupKey)}
        getGroupHeaderClassName={(group) =>
          activeStageType === group.groupKey ? "bg-[#f2f6fe]" : "bg-[#f7f9fb]"
        }
        renderGroupHeader={(group) => {
          const isActiveStage = activeStageType === group.groupKey
          const typeLabel = stepTypeLabel(group.groupKey)
          return (
            <>
              <span
                className={cn(
                  "truncate text-[12px] font-semibold",
                  isActiveStage ? "text-[#1d4ed8]" : "text-[#334155]",
                )}
                title={typeLabel}
              >
                {typeLabel}
              </span>
              <button
                type="button"
                onClick={() => onSelectStage(group.groupKey)}
                title={t("lifecycle.matrix.configureStep", { step: typeLabel })}
                aria-label={t("lifecycle.matrix.configureStep", { step: typeLabel })}
                className={cn(
                  "inline-flex size-4 shrink-0 items-center justify-center rounded-lg transition-colors hover:cursor-pointer",
                  isActiveStage
                    ? "text-[#1d4ed8]"
                    : "text-[#b6c0cd] hover:bg-[#eef2f7] hover:text-[#64748b]",
                )}
              >
                <Settings className="size-3" />
              </button>
            </>
          )
        }}
        renderColumnHeader={(column) => {
          const groupName = column.data.name?.trim() || t("lifecycle.matrix.unassigned")
          return (
            <span className="truncate text-[11px] font-normal text-[#94a3b8]" title={groupName}>
              {groupName}
            </span>
          )
        }}
        rows={matrixRows}
        renderRowHeader={renderRoleCell}
        renderCell={renderStepCell}
        getRowHeaderClassName={(row) => {
          const tint = ROW_TINT[row.kind]
          return tint ? cn(tint.cell, tint.hover) : "bg-white group-hover:bg-[#fafbfd]"
        }}
        getCellClassName={(row, step) => {
          const tint = ROW_TINT[row.kind]
          return cn(
            tint ? cn(tint.cell, tint.hover) : "group-hover:bg-[#fafbfd]",
            !tint && activeStageType === step.type && "bg-[#fafcff]",
          )
        }}
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
