"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQueryClient } from "@tanstack/react-query"
import { Eye, Loader2, Lock, Minus, Pencil, Plus, RefreshCw, Shield, Trash2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulMatrix } from "@/huemul/components/huemul-matrix"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { cn } from "@/lib/utils"
import { PanelInfoHint, PanelLegend } from "@/components/assets-types/assets-types-lifecycle-ui"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useAllLifecycleSteps, useLifecycleMutations, lifecycleQueryKeys } from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import {
  INHERITED_VIEW_GLOBAL_KEY,
  sectionAccessCellKey,
  templateSectionAccessQueryKeys,
  usePendingSectionAccessCells,
  useTemplateLifecycleAccessMatrix,
  useTemplateSectionAccessMutations,
} from "@/hooks/useTemplateSectionLifecycleAccess"
import type { MatrixSection, MatrixStep } from "@/hooks/useTemplateSectionLifecycleAccess"
import { LIFECYCLE_GROUPABLE_TYPES, buildAccessPayload, isGroupableStepType, stepRoleIds } from "@/lib/lifecycle-access"
import { ApiError } from "@/types/api-error"
import type { TemplateSectionAccessMatrixProps } from "@/types/assets"
import type { LifecycleStep } from "@/types/lifecycle"
import type { InheritedViewAccess, TemplateSectionAccess } from "@/types/templates/section-lifecycle-access"

export type { TemplateSectionAccessMatrixProps } from "@/types/assets"

/** Los tres sabores del "sin fila en el backend" — cuál aplica depende de la sección. */
type CellEmptyState = "inherit" | "no-access"
/** Estado de solo-lectura de una celda ya resuelta con `view`, por herencia de otro step. */
const INHERITED_VIEW = "inherited-view" as const

/**
 * Cómo se pinta cada estado de una celda. Los dos primeros son el mismo "vacío"
 * en el backend (sin fila), pero significan lo contrario según la sección: sin
 * ninguna celda configurada la sección usa el permiso del documento completo
 * (`inherit`); con al menos una configurada deja de usarlo en TODAS sus etapas y
 * las vacías quedan sin acceso (`no-access`). Ver la guía de permisos de sección.
 *
 * Mismo lenguaje visual que los glifos de «Permisos por rol»
 * (`assets-types-lifecycle-matrix.tsx`: `CellCheck`/`CellImplied`/`CellDash`):
 * círculo relleno con ícono para los estados con forma, y un guion desnudo para
 * "sin acceso" — ahí no hay `icon`, `AccessGlyph` rama aparte.
 */
const ACCESS_STYLE: Partial<
  Record<CellEmptyState | TemplateSectionAccess | typeof INHERITED_VIEW, { icon: typeof Eye; circle: string; glyph: string }>
> = {
  inherit: {
    icon: Minus,
    circle: "bg-[#eef2f7]",
    glyph: "text-[#94a3b8]",
  },
  view: {
    icon: Eye,
    circle: "bg-[#eef4ff]",
    glyph: "text-[#1d4ed8]",
  },
  edit: {
    icon: Pencil,
    circle: "bg-[#f3f0ff]",
    glyph: "text-[#6d5ae0]",
  },
  [INHERITED_VIEW]: {
    icon: Lock,
    circle: "bg-[#eef4ff]",
    glyph: "text-[#1d4ed8]",
  },
}

/** Glifo de estado — mismo componente en la leyenda y en las celdas. */
function AccessGlyph({
  access,
  className,
}: {
  access: CellEmptyState | TemplateSectionAccess | typeof INHERITED_VIEW
  className?: string
}) {
  // "no-access" no tiene forma — es un guion, igual que la celda "sin permiso" de
  // la matriz de roles (`CellDash`).
  if (access === "no-access") {
    return <span className={cn("text-[13px] text-[#cbd5e1]", className)}>—</span>
  }
  const style = ACCESS_STYLE[access]!
  const Icon = style.icon
  return (
    <span
      className={cn(
        "inline-flex size-4.5 items-center justify-center rounded-full",
        style.circle,
        className,
      )}
    >
      <Icon className={cn("size-3", style.glyph)} />
    </span>
  )
}

/**
 * Leyenda de la matriz. Los dos primeros estados vacíos se muestran siempre
 * aunque una fila puntual solo pueda estar en uno de los dos — es lo que explica
 * por qué dos celdas vacías no significan lo mismo. `inherited-view` solo aplica
 * a la columna de Lectura: `view` real por tener acceso a Elaboración/Revisión/
 * Aprobación en esa misma sección, sin fila propia — no se puede quitar acá.
 */
const LEGEND: { key: CellEmptyState | TemplateSectionAccess | typeof INHERITED_VIEW; label: string; hint?: string }[] = [
  { key: "inherit", label: "legendNoRule", hint: "legendNoRuleHint" },
  { key: "no-access", label: "legendNoAccess", hint: "legendNoAccessHint" },
  { key: "view", label: "legendView" },
  { key: "edit", label: "legendEdit" },
  { key: INHERITED_VIEW, label: "legendInherited", hint: "legendInheritedHint" },
]

const ROLE_ACCESS_OPTIONS = [
  { value: null, key: "inherit" as const, label: "roleSameAsGlobal" },
  { value: "view" as const, key: "view" as const, label: "legendView" },
  { value: "edit" as const, key: "edit" as const, label: "legendEdit" },
]

/** Selector inline de 3 estados para el nivel de UN rol dentro del popover de una celda. */
function RoleAccessSelector({
  current,
  disabled,
  pending,
  onSelect,
  t,
  inheritedTooltip,
}: {
  current: TemplateSectionAccess | null
  disabled: boolean
  pending: boolean
  onSelect: (value: TemplateSectionAccess | null) => void
  t: (key: string) => string
  /** Presente cuando este rol ya tiene `view` real heredada — colapsa el selector a un glifo bloqueado. */
  inheritedTooltip?: string
}) {
  if (inheritedTooltip) {
    return (
      <span title={inheritedTooltip} className="inline-flex cursor-default items-center p-0.5">
        <AccessGlyph access={INHERITED_VIEW} className="size-5" />
      </span>
    )
  }
  return (
    <div className="flex items-center gap-1">
      {pending ? (
        <Loader2 className="size-3.5 shrink-0 animate-spin text-[#94a3b8]" />
      ) : (
        ROLE_ACCESS_OPTIONS.map((option) => {
          const isActive = (current ?? null) === option.value
          return (
            <button
              key={option.key}
              type="button"
              disabled={disabled}
              title={t(`templates.sectionAccess.${option.label}`)}
              aria-label={t(`templates.sectionAccess.${option.label}`)}
              onClick={() => onSelect(option.value)}
              className={cn(
                "rounded-[6px] p-0.5 transition-colors",
                disabled ? "cursor-default opacity-50" : "hover:cursor-pointer hover:bg-[#f1f5f9]",
                isActive && "ring-1 ring-inset ring-[#cbd5e1]",
              )}
            >
              <AccessGlyph access={option.key} className="size-5" />
            </button>
          )
        })
      )}
    </div>
  )
}

/**
 * Matriz sección × etapa del ciclo de vida de una plantilla vinculada a un tipo
 * de activo. Cada celda define qué ve esa sección durante esa etapa: hereda el
 * permiso del documento completo (sin fila en el backend), solo lectura (`view`)
 * o editable (`edit`).
 *
 * Cada clic persiste al instante con actualización optimista, igual que la matriz
 * de permisos por rol: el endpoint es un upsert por par (sección, step) y volver a
 * «heredar» es un DELETE. El filtrado por sección ya no depende de ningún flag de
 * la plantilla — se activa apenas la sección tiene alguna celda propia (ver
 * "ia context/permisos-seccion-lifecycle-guide.md"), así que la matriz se edita
 * siempre que haya permiso RBAC.
 */
export function TemplateSectionAccessMatrix({
  templateId,
  documentTypeId,
  enabled = true,
}: TemplateSectionAccessMatrixProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const organizationId = selectedOrganizationId ?? ""
  const { canUpdate, hasAnyPermission } = useUserPermissions()

  const canReadSections = hasAnyPermission(["template_section:r", "template_section:l"])
  const canManage = canUpdate("template_section")
  const canCreateStep = canUpdate("asset_type")
  const canEditCells = canManage

  const queryEnabled = enabled && !!organizationId && !!templateId && canReadSections

  const {
    sections,
    steps,
    accessBySection,
    roleAccessBySection,
    inheritedViewBySection,
    viewStepId,
    isLoading: isLoadingMatrix,
    isFetching: isFetchingMatrix,
    refetchAll,
  } = useTemplateLifecycleAccessMatrix(organizationId, templateId, documentTypeId, queryEnabled)
  const { setAccess, clearAccess } = useTemplateSectionAccessMutations(organizationId, templateId)
  const pendingCells = usePendingSectionAccessCells(organizationId)
  const { createStep } = useLifecycleMutations(documentTypeId, null)

  // El matrix de la sección no trae `step_roles` — el `PUT` acotado a un rol
  // exige que ese rol esté asociado al step, así que hace falta la fuente que sí
  // los tiene (misma query que alimenta "Permisos por rol").
  const {
    data: stepsData,
    isFetching: isFetchingSteps,
    isLoading: isLoadingSteps,
    refetch: refetchSteps,
  } = useAllLifecycleSteps(documentTypeId, queryEnabled)
  const stepsById = React.useMemo(() => {
    const map = new Map<string, LifecycleStep>()
    for (const step of stepsData?.data?.steps ?? []) map.set(step.id, step)
    return map
  }, [stepsData])

  const {
    data: rolesData,
    isFetching: isFetchingRoles,
    refetch: refetchRoles,
  } = useRoles(queryEnabled, 1, 1000)
  const roleById = React.useMemo(() => {
    const map = new Map<string, { name: string; description: string }>()
    for (const role of rolesData?.data ?? []) map.set(role.id, role)
    return map
  }, [rolesData])

  /** Roles vigentes de un step (vacío si `access_type` no usa lista de roles). */
  const rolesOfStep = React.useCallback(
    (stepId: string): string[] => {
      const step = stepsById.get(stepId)
      return step ? stepRoleIds(step) : []
    },
    [stepsById],
  )

  /** Nombre a mostrar: rol resuelto por id → `role_name` embebido en el step → id crudo. */
  const roleLabel = React.useCallback(
    (stepId: string, roleId: string): string => {
      const resolved = roleById.get(roleId)
      if (resolved) return resolved.name
      const embedded = stepsById.get(stepId)?.step_roles.find((r) => r.role_id === roleId)?.role_name
      return embedded ?? roleId
    },
    [roleById, stepsById],
  )

  const [openCell, setOpenCell] = React.useState<string | null>(null)
  const [isAddingGroup, setIsAddingGroup] = React.useState(false)
  const [newGroupType, setNewGroupType] = React.useState<string>("review")
  const [newGroupName, setNewGroupName] = React.useState("")
  const [isRefreshing, setIsRefreshing] = React.useState(false)

  const stepTypeLabel = (type: string) =>
    t(`lifecycle.stepTypes.${type}`, { defaultValue: type })

  const groupTypeOptions = React.useMemo(
    () =>
      [...LIFECYCLE_GROUPABLE_TYPES].map((type) => ({
        value: type,
        label: stepTypeLabel(type),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [t],
  )

  // Un solo handler para todas las queries de la superficie (refresh-button-guide §3):
  // la matriz completa (secciones, steps, accesos y accesos heredados), los steps
  // con sus roles (para saber a qué rol se puede acotar cada celda) y los roles
  // de la organización (para pintar sus nombres).
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId) }),
        refetchAll(),
        refetchSteps(),
        refetchRoles(),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, documentTypeId, refetchAll, refetchSteps, refetchRoles])

  /** `roleId` ausente/null = fila global; con valor, acota la escritura a ese rol del step. */
  const handleSetAccess = async (
    sectionId: string,
    stepId: string,
    access: TemplateSectionAccess | null,
    roleId?: string | null,
  ) => {
    if (!canEditCells) return
    try {
      if (access === null) {
        await clearAccess.mutateAsync({ templateSectionId: sectionId, lifecycleStepId: stepId, roleId })
      } else {
        await setAccess.mutateAsync({
          templateSectionId: sectionId,
          lifecycleStepId: stepId,
          roleId,
          access,
        })
      }
    } catch (error) {
      // El rollback del optimismo lo hace el `onError` de la mutación. El 409
      // de "view heredado" tiene su propio mensaje — no es un error de guardado
      // genérico, es el backend explicando por qué no se puede quitar.
      if (error instanceof ApiError && error.code === "SECTION_VIEW_ACCESS_INHERITED") {
        toast.error(t("templates.sectionAccess.inheritedError"))
      } else {
        toast.error(t("templates.sectionAccess.saveError"))
      }
    }
  }

  const handleAddGroup = async () => {
    if (!canCreateStep) return
    const sameTypeCount = steps.filter((s) => s.type === newGroupType).length
    try {
      await createStep.mutateAsync({
        type: newGroupType,
        name: newGroupName.trim() || t("lifecycle.newGroupName"),
        mode: "manual",
        order: sameTypeCount + 1,
        // `access_type` + `role_ids` los arma `buildAccessPayload`: fuera de
        // `custom`/`custom_owner` la clave `role_ids` no puede viajar (422).
        ...buildAccessPayload({ accessType: "all", roleIds: [] }),
      })
      // `createStep` invalida `stepsByDocumentType`, que esta matriz ya no lee:
      // sin esto la columna del grupo nuevo no aparece hasta el próximo refresh manual.
      await queryClient.invalidateQueries({
        queryKey: templateSectionAccessQueryKeys.matrix(organizationId, templateId),
      })
      setNewGroupName("")
      setIsAddingGroup(false)
    } catch {
      toast.error(t("templates.sectionAccess.saveError"))
    }
  }

  /**
   * Una sección con al menos una fila configurada (global o por rol, en
   * cualquier step) deja de usar el permiso del documento en TODAS sus celdas —
   * incluidas las que se ven vacías. Ver "ia context/permisos-seccion-lifecycle-guide.md".
   * Lo consumen el badge de la fila y el estado vacío de cada celda. Ya no depende
   * de ningún flag de la plantilla: el backend filtra estricto apenas hay una fila.
   */
  const sectionHasOwnRules = React.useCallback(
    (sectionId: string) => {
      const accessByStep = accessBySection.get(sectionId)
      const roleAccessByStep = roleAccessBySection.get(sectionId)
      return (
        (accessByStep?.size ?? 0) > 0 ||
        [...(roleAccessByStep?.values() ?? [])].some((byRole) => byRole.size > 0)
      )
    },
    [accessBySection, roleAccessBySection],
  )

  /** Entrada heredada de una fila (global con `roleId` ausente, o de ese rol puntual) — solo aplica a la columna Lectura. */
  const inheritedViewFor = React.useCallback(
    (section: MatrixSection, step: MatrixStep, roleId?: string | null): InheritedViewAccess | null => {
      if (step.id !== viewStepId) return null
      const byRole = inheritedViewBySection.get(section.id)
      return byRole?.get(roleId ?? INHERITED_VIEW_GLOBAL_KEY) ?? null
    },
    [inheritedViewBySection, viewStepId],
  )

  /** Primera columna: nombre de la sección + badge «reglas propias». */
  const renderSectionRowHeader = (section: MatrixSection) => {
    const hasOwnRules = sectionHasOwnRules(section.id)
    return (
      <>
        <span className="truncate text-[13px] font-medium text-[#0f172a]" title={section.name}>
          {section.name}
        </span>
        {hasOwnRules && (
          <span
            className="shrink-0 rounded-full border border-amber-200 bg-amber-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-amber-700"
            title={t("templates.sectionAccess.ownRulesTooltip")}
          >
            {t("templates.sectionAccess.ownRulesBadge")}
          </span>
        )}
      </>
    )
  }

  /** Celda de intersección sección × step: popover con nivel global + overrides por rol. */
  const renderSectionCell = (section: MatrixSection, step: MatrixStep) => {
    const accessByStep = accessBySection.get(section.id)
    const current = accessByStep?.get(step.id) ?? null
    const cellKey = sectionAccessCellKey(section.id, step.id)
    const pending = pendingCells.has(cellKey)
    const ariaLabel = t("templates.sectionAccess.cellAria", {
      section: section.name,
      step: step.name?.trim() || stepTypeLabel(step.type),
    })

    // Sin fila el backend no distingue nada, pero para el usuario son dos cosas
    // opuestas: "usa el permiso del documento" vs "acá no entra nadie".
    const hasOwnRules = sectionHasOwnRules(section.id)
    const emptyKey: CellEmptyState = hasOwnRules ? "no-access" : "inherit"
    const emptyLabel = hasOwnRules ? "legendNoAccess" : "legendNoRule"
    const emptyHint = hasOwnRules ? "legendNoAccessHint" : "legendNoRuleHint"

    // Solo aplica a la columna Lectura: `view` real por edición/revisión/aprobación
    // de esta misma sección, sin fila propia — no se puede quitar desde acá.
    const inheritedGlobal = inheritedViewFor(section, step, null)
    const inheritedTooltip = inheritedGlobal
      ? t("templates.sectionAccess.inheritedCellTooltip", {
          step: stepTypeLabel(inheritedGlobal.source_lifecycle_step_type),
        })
      : undefined
    const cellDisabled = !canEditCells || pending || !!inheritedGlobal

    const roleOverrides = roleAccessBySection.get(section.id)?.get(step.id)
    const validRoleIds = rolesOfStep(step.id)
    const orphanRoleIds = roleOverrides
      ? [...roleOverrides.keys()].filter((roleId) => !validRoleIds.includes(roleId))
      : []
    const overrideCount = roleOverrides?.size ?? 0
    const hasRoleRows = validRoleIds.length > 0 || orphanRoleIds.length > 0

    return (
      <Popover open={openCell === cellKey} onOpenChange={(open) => setOpenCell(open ? cellKey : null)}>
        <PopoverTrigger asChild>
          <button
            type="button"
            aria-label={
              overrideCount > 0
                ? `${ariaLabel} — ${t("templates.sectionAccess.overrideBadgeAria", { count: overrideCount })}`
                : ariaLabel
            }
            title={inheritedTooltip ?? ariaLabel}
            disabled={cellDisabled}
            className={cn(
              "relative inline-flex size-7 items-center justify-center rounded-full transition-colors",
              cellDisabled ? "cursor-default" : "hover:cursor-pointer hover:bg-[#f1f5f9]",
            )}
          >
            {pending ? (
              <Loader2 className="size-3.5 animate-spin text-[#94a3b8]" />
            ) : (
              <AccessGlyph access={inheritedGlobal ? INHERITED_VIEW : current ?? emptyKey} />
            )}
            {overrideCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 inline-flex size-[15px] items-center justify-center rounded-full border border-white bg-[#6d5ae0] text-[9px] font-semibold leading-none text-white">
                {overrideCount}
              </span>
            )}
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="center">
          <div className="flex flex-col gap-2.5">
            {/* Nivel global — aplica a cualquiera con acceso al step. */}
            <div className="flex flex-col gap-1">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {t("templates.sectionAccess.globalRowLabel")}
              </span>
              {inheritedGlobal ? (
                <div className="flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-[13px] text-[#475569]" title={inheritedTooltip}>
                  <AccessGlyph access={INHERITED_VIEW} />
                  {t("templates.sectionAccess.legendView")}
                </div>
              ) : (
                <div className="flex flex-col">
                  {(
                    [
                      { value: null, key: emptyKey, label: emptyLabel, hint: emptyHint },
                      { value: "view", key: "view", label: "legendView" },
                      { value: "edit", key: "edit", label: "legendEdit" },
                    ] as {
                      value: TemplateSectionAccess | null
                      key: CellEmptyState | TemplateSectionAccess
                      label: string
                      hint?: string
                    }[]
                  ).map((option) => {
                    const isActive = (current ?? null) === option.value
                    return (
                      <button
                        key={option.key}
                        type="button"
                        title={option.hint ? t(`templates.sectionAccess.${option.hint}`) : undefined}
                        onClick={() => {
                          setOpenCell(null)
                          handleSetAccess(section.id, step.id, option.value)
                        }}
                        className={cn(
                          "flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9]",
                          isActive ? "font-semibold text-[#0f172a]" : "text-[#475569]",
                        )}
                      >
                        <AccessGlyph access={option.key} />
                        {t(`templates.sectionAccess.${option.label}`)}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Nivel propio por rol del step — pisa el global para ese rol puntual. */}
            <div className="flex flex-col gap-1 border-t border-[#eef1f5] pt-2">
              <span className="px-1 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {t("templates.sectionAccess.byRoleLabel")}
              </span>
              {!hasRoleRows ? (
                <p className="px-1 text-[12px] text-[#94a3b8]">
                  {t("templates.sectionAccess.noRolesInStep")}
                </p>
              ) : (
                <div className="flex max-h-40 flex-col gap-0.5 overflow-y-auto">
                  {validRoleIds.map((roleId) => {
                    const roleCellKey = sectionAccessCellKey(section.id, step.id, roleId)
                    const inheritedRole = inheritedViewFor(section, step, roleId)
                    const roleInheritedTooltip = inheritedRole
                      ? t("templates.sectionAccess.inheritedCellTooltip", {
                          step: stepTypeLabel(inheritedRole.source_lifecycle_step_type),
                        })
                      : undefined
                    return (
                      <div key={roleId} className="flex items-center justify-between gap-2 rounded-[6px] px-1 py-1">
                        <span className="truncate text-[12.5px] text-[#334155]" title={roleLabel(step.id, roleId)}>
                          {roleLabel(step.id, roleId)}
                        </span>
                        <RoleAccessSelector
                          current={roleOverrides?.get(roleId) ?? null}
                          disabled={!canEditCells}
                          pending={pendingCells.has(roleCellKey)}
                          onSelect={(value) => handleSetAccess(section.id, step.id, value, roleId)}
                          t={t}
                          inheritedTooltip={roleInheritedTooltip}
                        />
                      </div>
                    )
                  })}
                  {orphanRoleIds.map((roleId) => {
                    const roleCellKey = sectionAccessCellKey(section.id, step.id, roleId)
                    const pendingOrphan = pendingCells.has(roleCellKey)
                    return (
                      <div
                        key={roleId}
                        className="flex items-center justify-between gap-2 rounded-[6px] bg-[#fff8ed] px-1 py-1"
                        title={t("templates.sectionAccess.orphanRoleHint")}
                      >
                        <span className="flex min-w-0 flex-col">
                          <span className="truncate text-[12.5px] text-[#334155]">
                            {roleLabel(step.id, roleId)}
                          </span>
                          <span className="text-[10.5px] text-[#b45309]">
                            {t("templates.sectionAccess.orphanRoleTag")}
                          </span>
                        </span>
                        <button
                          type="button"
                          disabled={!canEditCells || pendingOrphan}
                          aria-label={t("templates.sectionAccess.orphanRoleRemove")}
                          title={t("templates.sectionAccess.orphanRoleRemove")}
                          onClick={() => handleSetAccess(section.id, step.id, null, roleId)}
                          className={cn(
                            "shrink-0 rounded-[6px] p-1 transition-colors",
                            !canEditCells || pendingOrphan ? "cursor-default opacity-50" : "hover:cursor-pointer hover:bg-[#fef0dc]",
                          )}
                        >
                          {pendingOrphan ? (
                            <Loader2 className="size-3.5 animate-spin text-[#b45309]" />
                          ) : (
                            <Trash2 className="size-3.5 text-[#b45309]" />
                          )}
                        </button>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  if (!canReadSections) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e5eaf0] bg-white py-10 text-center">
        <Shield className="size-8 text-[#cbd5e1]" />
        <p className="text-[13px] text-[#64748b]">{t("templates.sectionAccess.accessDenied")}</p>
      </div>
    )
  }

  const isLoading = isLoadingMatrix || isLoadingSteps

  return (
    <div className="flex flex-col gap-3">
      {/* Info + refresh — nunca scrollea con la tabla */}
      <div className="flex shrink-0 items-start justify-between gap-3">
        <PanelInfoHint className="flex-1">{t("templates.sectionAccess.hint")}</PanelInfoHint>

        <div className="flex shrink-0 items-center gap-1.5">
          <HuemulButton
            variant="ghost"
            size="icon"
            className="size-[30px]"
            icon={RefreshCw}
            tooltip={t("common:refresh")}
            loading={isRefreshing || isFetchingMatrix || isFetchingSteps || isFetchingRoles}
            onClick={handleRefresh}
          />
        </div>
      </div>

      {/* Leyenda — mismos glifos que las celdas, para que no diverjan */}
      <PanelLegend
        className="shrink-0"
        items={[
          ...LEGEND.map((entry) => ({
            icon: <AccessGlyph access={entry.key} />,
            label: t(`templates.sectionAccess.${entry.label}`),
            hint: entry.hint ? t(`templates.sectionAccess.${entry.hint}`) : undefined,
          })),
          {
            icon: (
              <span className="inline-flex size-[15px] items-center justify-center rounded-full bg-[#6d5ae0] text-[9px] font-semibold leading-none text-white">
                1
              </span>
            ),
            label: t("templates.sectionAccess.legendOverrides"),
          },
        ]}
      />

      <HuemulMatrix<MatrixSection, MatrixStep>
        className="max-h-[420px]"
        isLoading={isLoading}
        emptyState={
          sections.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">
              {t("templates.sectionAccess.noSections")}
            </p>
          ) : steps.length === 0 ? (
            <p className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">
              {t("templates.sectionAccess.noSteps")}
            </p>
          ) : undefined
        }
        cornerLabel={t("templates.sectionAccess.sectionColumn")}
        columns={steps.map((step) => ({ key: step.id, data: step, groupKey: step.type }))}
        hasColumnHeader={(group) => isGroupableStepType(group.groupKey)}
        renderGroupHeader={(group) => (
          <span className="truncate text-[12px] font-semibold text-[#334155]" title={stepTypeLabel(group.groupKey)}>
            {stepTypeLabel(group.groupKey)}
          </span>
        )}
        renderColumnHeader={(column) => {
          const groupName = column.data.name?.trim() || t("templates.sectionAccess.unassigned")
          return (
            <span className="truncate text-[11px] font-normal text-[#94a3b8]" title={groupName}>
              {groupName}
            </span>
          )
        }}
        rows={sections.map((section) => ({ kind: "cells" as const, key: section.id, data: section }))}
        renderRowHeader={renderSectionRowHeader}
        getRowHeaderClassName={() => "gap-1.5 bg-white group-hover:bg-[#fafbfd]"}
        getCellClassName={() => "group-hover:bg-[#fafbfd]"}
        renderCell={renderSectionCell}
        trailingColumn={
          canCreateStep
            ? {
                width: "minmax(150px, auto)",
                cellClassName: "bg-white",
                renderHeader: () => (
                  <Popover open={isAddingGroup} onOpenChange={setIsAddingGroup}>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex h-7.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-dashed border-[#bfd3fb] px-3 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff]"
                      >
                        <Plus className="size-3.5" />
                        {t("templates.sectionAccess.addGroup")}
                      </button>
                    </PopoverTrigger>
                    <PopoverContent className="w-72 p-3" align="end">
                      <div className="flex flex-col gap-3">
                        <span className="text-[12px] font-semibold text-[#334155]">
                          {t("templates.sectionAccess.addGroupTitle")}
                        </span>
                        <HuemulField
                          type="select"
                          label={t("templates.sectionAccess.addGroupType")}
                          name="section-access-new-group-type"
                          value={newGroupType}
                          options={groupTypeOptions}
                          onChange={(value) => setNewGroupType(String(value ?? "review"))}
                        />
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[12px] font-medium text-[#475569]">
                            {t("templates.sectionAccess.addGroupName")}
                          </span>
                          <Input value={newGroupName} onChange={(e) => setNewGroupName(e.target.value)} />
                        </div>
                        <HuemulButton size="sm" loading={createStep.isPending} onClick={handleAddGroup}>
                          {t("templates.sectionAccess.addGroupSubmit")}
                        </HuemulButton>
                      </div>
                    </PopoverContent>
                  </Popover>
                ),
              }
            : undefined
        }
      />
    </div>
  )
}
