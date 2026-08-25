"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, Loader2, Minus, Pencil, Plus, RefreshCw, Shield, Trash2 } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { SettingToggleRow } from "@/components/assets-types/assets-types-lifecycle-ui"
import { getTemplateById, updateTemplate } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { useAllLifecycleSteps, useLifecycleMutations, lifecycleQueryKeys } from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import {
  sectionAccessCellKey,
  templateSectionAccessQueryKeys,
  usePendingSectionAccessCells,
  useTemplateLifecycleAccessMatrix,
  useTemplateSectionAccessMutations,
} from "@/hooks/useTemplateSectionLifecycleAccess"
import type { MatrixStep } from "@/hooks/useTemplateSectionLifecycleAccess"
import { LIFECYCLE_GROUPABLE_TYPES, buildAccessPayload, isGroupableStepType, stepRoleIds } from "@/lib/lifecycle-access"
import type { TemplateSectionAccessMatrixProps } from "@/types/assets"
import type { LifecycleStep } from "@/types/lifecycle"
import type { TemplateSectionAccess } from "@/types/templates/section-lifecycle-access"

export type { TemplateSectionAccessMatrixProps } from "@/types/assets"

const SECTION_COLUMN_WIDTH = "232px"
const ADD_GROUP_COLUMN_WIDTH = "150px"

/**
 * Alto de la fila de etapas del encabezado. La fila de grupos se pega justo
 * debajo con este mismo offset, así ambas quedan sticky sin superponerse.
 */
const HEADER_TYPE_ROW_HEIGHT = 30

/** Cómo se pinta cada uno de los tres estados de una celda. */
const ACCESS_STYLE: Record<
  "inherit" | TemplateSectionAccess,
  { icon: typeof Eye; box: string; glyph: string }
> = {
  inherit: {
    icon: Minus,
    box: "border border-dashed border-[#cbd5e1] bg-white",
    glyph: "text-[#cbd5e1]",
  },
  view: {
    icon: Eye,
    box: "border border-[#dbe7fe] bg-[#eef4ff]",
    glyph: "text-[#1d4ed8]",
  },
  edit: {
    icon: Pencil,
    box: "border border-[#ddd6fe] bg-[#f3f0ff]",
    glyph: "text-[#6d5ae0]",
  },
}

/** Cuadro de estado — mismo glifo en la leyenda y en las celdas. */
function AccessGlyph({
  access,
  className,
}: {
  access: "inherit" | TemplateSectionAccess
  className?: string
}) {
  const style = ACCESS_STYLE[access]
  const Icon = style.icon
  return (
    <span
      className={cn(
        "inline-flex size-[22px] items-center justify-center rounded-[6px]",
        style.box,
        className,
      )}
    >
      <Icon className={cn("size-3.5", style.glyph)} />
    </span>
  )
}

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
}: {
  current: TemplateSectionAccess | null
  disabled: boolean
  pending: boolean
  onSelect: (value: TemplateSectionAccess | null) => void
  t: (key: string) => string
}) {
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
 * «heredar» es un DELETE.
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
  const canToggleAccess = canUpdate("template")

  const queryEnabled = enabled && !!organizationId && !!templateId && canReadSections

  // Misma query key que usa el panel de templates (`templates-content.tsx`): las
  // secciones vienen embebidas en el template, no hay endpoint propio.
  const {
    data: templateData,
    isLoading: isLoadingTemplate,
    isFetching: isFetchingTemplate,
  } = useQuery({
    queryKey: ["template", templateId],
    queryFn: () => getTemplateById(templateId, organizationId),
    enabled: queryEnabled,
    retry: false,
  })

  const accessEnabled = templateData?.section_lifecycle_access_enabled === true
  const canEditCells = canManage && accessEnabled

  const setAccessEnabledMutation = useMutation({
    mutationFn: (value: boolean) =>
      updateTemplate(templateId, { section_lifecycle_access_enabled: value }, organizationId),
    onMutate: async (value: boolean) => {
      const queryKey = ["template", templateId]
      await queryClient.cancelQueries({ queryKey })
      const snapshot = queryClient.getQueryData(queryKey)
      queryClient.setQueryData(queryKey, (previous: typeof templateData) =>
        previous ? { ...previous, section_lifecycle_access_enabled: value } : previous,
      )
      return { snapshot }
    },
    onError: (_error, _value, context) => {
      queryClient.setQueryData(["template", templateId], context?.snapshot)
      toast.error(t("templates.sectionAccess.enableError"))
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["template", templateId] })
    },
  })

  const {
    sections,
    steps,
    accessBySection,
    roleAccessBySection,
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
  // el flag del template, la matriz completa (secciones, steps y accesos), los
  // steps con sus roles (para saber a qué rol se puede acotar cada celda) y los
  // roles de la organización (para pintar sus nombres).
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["template", templateId] }),
        queryClient.invalidateQueries({ queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId) }),
        refetchAll(),
        refetchSteps(),
        refetchRoles(),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, templateId, documentTypeId, refetchAll, refetchSteps, refetchRoles])

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
    } catch {
      // El rollback del optimismo lo hace el `onError` de la mutación.
      toast.error(t("templates.sectionAccess.saveError"))
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

  const gridTemplateColumns = `${SECTION_COLUMN_WIDTH} repeat(${Math.max(steps.length, 1)}, minmax(112px, 1fr))${canCreateStep ? ` minmax(${ADD_GROUP_COLUMN_WIDTH}, auto)` : ""}`

  // Grupos de columnas del encabezado: `steps` ya viene ordenado por tipo desde
  // el hook, así que basta agrupar los consecutivos. `startIndex` es el offset
  // dentro de `steps` — se usa para posicionar las celdas en el grid.
  const headerGroups = React.useMemo(() => {
    const groups: { type: string; steps: MatrixStep[]; startIndex: number }[] = []
    steps.forEach((step, index) => {
      const last = groups[groups.length - 1]
      if (last && last.type === step.type) last.steps.push(step)
      else groups.push({ type: step.type, steps: [step], startIndex: index })
    })
    return groups
  }, [steps])

  if (!canReadSections) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e5eaf0] bg-white py-10 text-center">
        <Shield className="size-8 text-[#cbd5e1]" />
        <p className="text-[13px] text-[#64748b]">{t("templates.sectionAccess.accessDenied")}</p>
      </div>
    )
  }

  const isLoading = isLoadingTemplate || isLoadingMatrix || isLoadingSteps

  return (
    <div className="flex flex-col gap-3">
      <SettingToggleRow
        className="rounded-[10px] border border-[#e5eaf0] bg-white px-3 py-2.5"
        label={t("templates.sectionAccess.enableLabel")}
        description={t("templates.sectionAccess.enableHint")}
        checked={accessEnabled}
        disabled={!canToggleAccess || setAccessEnabledMutation.isPending || isLoadingTemplate}
        onChange={(value) => setAccessEnabledMutation.mutate(value)}
      />

      {!accessEnabled && (
        <p className="text-[12px] text-[#94a3b8]">{t("templates.sectionAccess.disabledNotice")}</p>
      )}

      {/* Leyenda + refresh — nunca scrollea con la tabla */}
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-[12px] text-[#64748b]">{t("templates.sectionAccess.hint")}</p>
          <div className="flex flex-wrap items-center gap-3">
            {(["inherit", "view", "edit"] as const).map((access) => (
              <span key={access} className="inline-flex items-center gap-1.5">
                <AccessGlyph access={access} />
                <span className="text-[12px] text-[#475569]">
                  {t(
                    access === "inherit"
                      ? "templates.sectionAccess.legendInherit"
                      : access === "view"
                        ? "templates.sectionAccess.legendView"
                        : "templates.sectionAccess.legendEdit",
                  )}
                </span>
              </span>
            ))}
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <HuemulButton
            variant="ghost"
            size="icon"
            className="size-[30px]"
            icon={RefreshCw}
            tooltip={t("common:refresh")}
            loading={isRefreshing || isFetchingTemplate || isFetchingMatrix || isFetchingSteps || isFetchingRoles}
            onClick={handleRefresh}
          />
        </div>
      </div>

      <div
        className={cn(
          "max-h-[420px] overflow-auto rounded-[10px] border border-[#e5eaf0] bg-white",
          !accessEnabled && "opacity-60",
        )}
      >
        {isLoading ? (
          <div className="flex flex-col gap-2 p-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : sections.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">
            {t("templates.sectionAccess.noSections")}
          </p>
        ) : steps.length === 0 ? (
          <p className="px-4 py-8 text-center text-[13px] text-[#94a3b8]">
            {t("templates.sectionAccess.noSteps")}
          </p>
        ) : (
          <div className="grid" style={{ gridTemplateColumns }}>
            {/*
              Header de dos niveles. Las celdas se posicionan explícitamente
              (`gridColumn` + `gridRow`) porque las etapas sin grupos abarcan
              ambas filas y el auto-placement dejaría de ser predecible.
              La columna de sección es la 1, así que el step en índice `i` cae
              en la columna `i + 2`. Las dos primeras filas quedan cubiertas por
              completo, de modo que las filas de datos siguen desde la 3.
            */}
            <div
              className="sticky top-0 left-0 z-30 flex items-center border-b border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5"
              style={{ gridColumn: 1, gridRow: "1 / span 2" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {t("templates.sectionAccess.sectionColumn")}
              </span>
            </div>
            {headerGroups.map((group) => {
              const isGroupable = isGroupableStepType(group.type)
              const typeLabel = stepTypeLabel(group.type)
              return (
                <React.Fragment key={`header-${group.type}-${group.startIndex}`}>
                  {/* Nivel 1: la etapa, una sola vez por más grupos que tenga */}
                  <div
                    className={cn(
                      "sticky top-0 z-20 flex items-center border-l bg-[#f7f9fb] px-3",
                      isGroupable
                        ? "border-b border-b-[#eef2f7] border-l-[#e5eaf0]"
                        : "border-b border-[#e5eaf0]",
                    )}
                    style={{
                      gridColumn: `${group.startIndex + 2} / span ${group.steps.length}`,
                      gridRow: isGroupable ? "1" : "1 / span 2",
                      ...(isGroupable ? { height: HEADER_TYPE_ROW_HEIGHT } : {}),
                    }}
                  >
                    <span
                      className="truncate text-[12px] font-semibold text-[#334155]"
                      title={typeLabel}
                    >
                      {typeLabel}
                    </span>
                  </div>

                  {/* Nivel 2: un grupo por columna — solo en etapas agrupables */}
                  {isGroupable &&
                    group.steps.map((step, index) => {
                      const groupName =
                        step.name?.trim() || t("templates.sectionAccess.unassigned")
                      return (
                        <div
                          key={`header-group-${step.id}`}
                          className="sticky z-20 flex items-center border-b border-l border-[#e5eaf0] bg-[#f7f9fb] px-3 py-1.5"
                          style={{
                            gridColumn: group.startIndex + 2 + index,
                            gridRow: "2",
                            top: HEADER_TYPE_ROW_HEIGHT,
                          }}
                        >
                          <span
                            className="truncate text-[11px] font-normal text-[#94a3b8]"
                            title={groupName}
                          >
                            {groupName}
                          </span>
                        </div>
                      )
                    })}
                </React.Fragment>
              )
            })}
            {canCreateStep && (
              <div
                className="sticky top-0 z-20 flex items-center border-b border-l border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5"
                style={{ gridColumn: steps.length + 2, gridRow: "1 / span 2" }}
              >
                <Popover open={isAddingGroup} onOpenChange={setIsAddingGroup}>
                  <PopoverTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-[30px] items-center gap-1.5 rounded-[8px] border border-dashed border-[#bfd3fb] px-3 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff]"
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
                        <Input
                          value={newGroupName}
                          onChange={(e) => setNewGroupName(e.target.value)}
                        />
                      </div>
                      <HuemulButton
                        size="sm"
                        loading={createStep.isPending}
                        onClick={handleAddGroup}
                      >
                        {t("templates.sectionAccess.addGroupSubmit")}
                      </HuemulButton>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            )}

            {/* Filas */}
            {sections.map((section, rowIndex) => {
              const isLast = rowIndex === sections.length - 1
              const accessByStep = accessBySection.get(section.id)
              const roleAccessByStep = roleAccessBySection.get(section.id)
              // Una sección con al menos una fila configurada (global o por rol, en
              // cualquier step) deja de heredar del documento en TODAS sus celdas —
              // incluidas las que se ven vacías. Ver "ia context/permisos-seccion-lifecycle-guide.md".
              const hasOwnRules =
                accessEnabled &&
                (((accessByStep?.size ?? 0) > 0) ||
                  [...(roleAccessByStep?.values() ?? [])].some((byRole) => byRole.size > 0))
              return (
                <div key={section.id} className="group contents">
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex min-w-0 items-center gap-1.5 bg-white px-3 py-2.5 transition-colors group-hover:bg-[#fafbfd]",
                      !isLast && "border-b border-[#eef1f5]",
                    )}
                  >
                    <span
                      className="truncate text-[13px] font-medium text-[#0f172a]"
                      title={section.name}
                    >
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
                  </div>

                  {steps.map((step) => {
                    const cellKey = sectionAccessCellKey(section.id, step.id)
                    const current = accessByStep?.get(step.id) ?? null
                    const pending = pendingCells.has(cellKey)
                    const ariaLabel = t("templates.sectionAccess.cellAria", {
                      section: section.name,
                      step: step.name?.trim() || stepTypeLabel(step.type),
                    })

                    const roleOverrides = roleAccessBySection.get(section.id)?.get(step.id)
                    const validRoleIds = rolesOfStep(step.id)
                    const orphanRoleIds = roleOverrides
                      ? [...roleOverrides.keys()].filter((roleId) => !validRoleIds.includes(roleId))
                      : []
                    const overrideCount = roleOverrides?.size ?? 0
                    const hasRoleRows = validRoleIds.length > 0 || orphanRoleIds.length > 0

                    return (
                      <div
                        key={cellKey}
                        className={cn(
                          "flex items-center justify-center border-l border-[#eef1f5] px-3 py-2.5 transition-colors group-hover:bg-[#fafbfd]",
                          !isLast && "border-b border-b-[#eef1f5]",
                        )}
                      >
                        <Popover
                          open={openCell === cellKey}
                          onOpenChange={(open) => setOpenCell(open ? cellKey : null)}
                        >
                          <PopoverTrigger asChild>
                            <button
                              type="button"
                              aria-label={
                                overrideCount > 0
                                  ? `${ariaLabel} — ${t("templates.sectionAccess.overrideBadgeAria", { count: overrideCount })}`
                                  : ariaLabel
                              }
                              title={ariaLabel}
                              disabled={!canEditCells || pending}
                              className={cn(
                                "relative inline-flex size-7 items-center justify-center rounded-full transition-colors",
                                !canEditCells || pending
                                  ? "cursor-default"
                                  : "hover:cursor-pointer hover:bg-[#f1f5f9]",
                              )}
                            >
                              {pending ? (
                                <Loader2 className="size-3.5 animate-spin text-[#94a3b8]" />
                              ) : (
                                <AccessGlyph access={current ?? "inherit"} />
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
                                <div className="flex flex-col">
                                  {(
                                    [
                                      { value: null, key: "inherit", label: "legendInherit" },
                                      { value: "view", key: "view", label: "legendView" },
                                      { value: "edit", key: "edit", label: "legendEdit" },
                                    ] as const
                                  ).map((option) => {
                                    const isActive = (current ?? null) === option.value
                                    return (
                                      <button
                                        key={option.key}
                                        type="button"
                                        onClick={() => {
                                          setOpenCell(null)
                                          handleSetAccess(section.id, step.id, option.value)
                                        }}
                                        className={cn(
                                          "flex items-center gap-2 rounded-[6px] px-2 py-1.5 text-left text-[13px] transition-colors hover:cursor-pointer hover:bg-[#f1f5f9]",
                                          isActive
                                            ? "font-semibold text-[#0f172a]"
                                            : "text-[#475569]",
                                        )}
                                      >
                                        <AccessGlyph access={option.key} />
                                        {t(`templates.sectionAccess.${option.label}`)}
                                      </button>
                                    )
                                  })}
                                </div>
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
                                      return (
                                        <div
                                          key={roleId}
                                          className="flex items-center justify-between gap-2 rounded-[6px] px-1 py-1"
                                        >
                                          <span
                                            className="truncate text-[12.5px] text-[#334155]"
                                            title={roleLabel(step.id, roleId)}
                                          >
                                            {roleLabel(step.id, roleId)}
                                          </span>
                                          <RoleAccessSelector
                                            current={roleOverrides?.get(roleId) ?? null}
                                            disabled={!canEditCells}
                                            pending={pendingCells.has(roleCellKey)}
                                            onSelect={(value) => handleSetAccess(section.id, step.id, value, roleId)}
                                            t={t}
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
                                              !canEditCells || pendingOrphan
                                                ? "cursor-default opacity-50"
                                                : "hover:cursor-pointer hover:bg-[#fef0dc]",
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
                      </div>
                    )
                  })}

                  {canCreateStep && (
                    <div
                      className={cn(
                        "border-l border-[#eef1f5] bg-white",
                        !isLast && "border-b border-b-[#eef1f5]",
                      )}
                    />
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
