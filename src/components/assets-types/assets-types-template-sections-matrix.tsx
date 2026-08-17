"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Eye, Loader2, Minus, Pencil, Plus, RefreshCw, Shield } from "lucide-react"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { HuemulField } from "@/huemul/components/huemul-field"
import { Input } from "@/components/ui/input"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils"
import { getTemplateById } from "@/services/templates"
import { useOrganization } from "@/contexts/organization-context"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import {
  useAllLifecycleSteps,
  useLifecycleMutations,
  lifecycleQueryKeys,
} from "@/hooks/useLifecycle"
import {
  sectionAccessCellKey,
  usePendingSectionAccessCells,
  useTemplateSectionAccessMutations,
  useTemplateSectionsLifecycleAccess,
} from "@/hooks/useTemplateSectionLifecycleAccess"
import {
  LIFECYCLE_GROUPABLE_TYPES,
  buildAccessPayload,
  isGroupableStepType,
  pipelineSortIndex,
} from "@/lib/lifecycle-access"
import type { TemplateSectionAccessMatrixProps } from "@/types/assets"
import type { LifecycleStep } from "@/types/lifecycle"
import type { TemplateSectionAccess } from "@/types/templates/section-lifecycle-access"

export type { TemplateSectionAccessMatrixProps } from "@/types/assets"

const SECTION_COLUMN_WIDTH = "232px"
const ADD_GROUP_COLUMN_WIDTH = "150px"

/** Fila de la matriz: una sección de la plantilla. */
interface MatrixSection {
  id: string
  name: string
  order: number
}

/** Cómo se pinta cada uno de los tres estados de una celda. */
const ACCESS_STYLE: Record<
  "hidden" | TemplateSectionAccess,
  { icon: typeof Eye; box: string; glyph: string }
> = {
  hidden: {
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
  access: "hidden" | TemplateSectionAccess
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

/**
 * Matriz sección × etapa del ciclo de vida de una plantilla vinculada a un tipo
 * de activo. Cada celda define qué ve esa sección durante esa etapa: oculta (sin
 * fila en el backend), solo lectura (`view`) o editable (`edit`).
 *
 * Cada clic persiste al instante con actualización optimista, igual que la matriz
 * de permisos por rol: el endpoint es un upsert por par (sección, step) y volver a
 * «sin acceso» es un DELETE.
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

  const {
    data: stepsData,
    isLoading: isLoadingSteps,
    isFetching: isFetchingSteps,
  } = useAllLifecycleSteps(documentTypeId, queryEnabled)

  const sections = React.useMemo<MatrixSection[]>(() => {
    const raw: unknown = templateData?.sections ?? templateData?.template_sections ?? []
    if (!Array.isArray(raw)) return []
    return raw
      .map((section: { id: string; name?: string; order?: number }, index: number) => ({
        id: section.id,
        name: section.name ?? "",
        order: section.order ?? index,
      }))
      .sort((a, b) => a.order - b.order)
  }, [templateData])

  const sectionIds = React.useMemo(() => sections.map((s) => s.id), [sections])

  const steps = React.useMemo<LifecycleStep[]>(() => {
    const all = stepsData?.data?.steps ?? []
    return [...all].sort((a, b) => {
      const typeDiff = pipelineSortIndex(a.type) - pipelineSortIndex(b.type)
      if (typeDiff !== 0) return typeDiff
      return (a.order ?? 0) - (b.order ?? 0)
    })
  }, [stepsData])

  const { accessBySection, isFetching: isFetchingAccess, refetchAll } =
    useTemplateSectionsLifecycleAccess(organizationId, sectionIds, queryEnabled)
  const { setAccess, clearAccess } = useTemplateSectionAccessMutations(organizationId)
  const pendingCells = usePendingSectionAccessCells(organizationId)
  const { createStep } = useLifecycleMutations(documentTypeId, null)

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
  // secciones del template, steps del ciclo de vida y accesos de cada sección.
  const handleRefresh = React.useCallback(async () => {
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["template", templateId] }),
        queryClient.invalidateQueries({
          queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId),
        }),
        refetchAll(),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, templateId, documentTypeId, refetchAll])

  const handleSetAccess = async (
    sectionId: string,
    stepId: string,
    access: TemplateSectionAccess | null,
  ) => {
    setOpenCell(null)
    if (!canManage) return
    try {
      if (access === null) {
        await clearAccess.mutateAsync({ templateSectionId: sectionId, lifecycleStepId: stepId })
      } else {
        await setAccess.mutateAsync({
          templateSectionId: sectionId,
          lifecycleStepId: stepId,
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
      setNewGroupName("")
      setIsAddingGroup(false)
    } catch {
      toast.error(t("templates.sectionAccess.saveError"))
    }
  }

  const gridTemplateColumns = `${SECTION_COLUMN_WIDTH} repeat(${Math.max(steps.length, 1)}, minmax(112px, 1fr))${canCreateStep ? ` minmax(${ADD_GROUP_COLUMN_WIDTH}, auto)` : ""}`

  if (!canReadSections) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-[10px] border border-[#e5eaf0] bg-white py-10 text-center">
        <Shield className="size-8 text-[#cbd5e1]" />
        <p className="text-[13px] text-[#64748b]">{t("templates.sectionAccess.accessDenied")}</p>
      </div>
    )
  }

  const isLoading = isLoadingTemplate || isLoadingSteps

  return (
    <div className="flex flex-col gap-3">
      {/* Leyenda + refresh — nunca scrollea con la tabla */}
      <div className="flex shrink-0 items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-2">
          <p className="text-[12px] text-[#64748b]">{t("templates.sectionAccess.hint")}</p>
          <div className="flex flex-wrap items-center gap-3">
            {(["hidden", "view", "edit"] as const).map((access) => (
              <span key={access} className="inline-flex items-center gap-1.5">
                <AccessGlyph access={access} />
                <span className="text-[12px] text-[#475569]">
                  {t(
                    access === "hidden"
                      ? "templates.sectionAccess.legendHidden"
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
            loading={isRefreshing || isFetchingTemplate || isFetchingSteps || isFetchingAccess}
            onClick={handleRefresh}
          />
        </div>
      </div>

      <div className="max-h-[420px] overflow-auto rounded-[10px] border border-[#e5eaf0] bg-white">
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
            {/* Header */}
            <div className="sticky top-0 left-0 z-20 border-b border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5">
              <span className="text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
                {t("templates.sectionAccess.sectionColumn")}
              </span>
            </div>
            {steps.map((step) => {
              const groupLabel = isGroupableStepType(step.type)
                ? t("templates.sectionAccess.groupPrefix", {
                    name: step.name?.trim() || t("templates.sectionAccess.unassigned"),
                  })
                : t("templates.sectionAccess.unassigned")
              return (
                <div
                  key={`header-${step.id}`}
                  className="sticky top-0 z-10 flex flex-col gap-0.5 border-b border-l border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5"
                >
                  <span className="truncate text-[12px] font-semibold text-[#334155]">
                    {stepTypeLabel(step.type)}
                  </span>
                  <span className="truncate text-[11px] font-normal text-[#94a3b8]" title={groupLabel}>
                    {groupLabel}
                  </span>
                </div>
              )
            })}
            {canCreateStep && (
              <div className="sticky top-0 z-10 flex items-center border-b border-l border-[#e5eaf0] bg-[#f7f9fb] px-3 py-2.5">
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
              return (
                <div key={section.id} className="group contents">
                  <div
                    className={cn(
                      "sticky left-0 z-10 flex min-w-0 items-center bg-white px-3 py-2.5 transition-colors group-hover:bg-[#fafbfd]",
                      !isLast && "border-b border-[#eef1f5]",
                    )}
                  >
                    <span
                      className="truncate text-[13px] font-medium text-[#0f172a]"
                      title={section.name}
                    >
                      {section.name}
                    </span>
                  </div>

                  {steps.map((step) => {
                    const cellKey = sectionAccessCellKey(section.id, step.id)
                    const current = accessByStep?.get(step.id) ?? null
                    const pending = pendingCells.has(cellKey)
                    const ariaLabel = t("templates.sectionAccess.cellAria", {
                      section: section.name,
                      step: step.name?.trim() || stepTypeLabel(step.type),
                    })
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
                              aria-label={ariaLabel}
                              title={ariaLabel}
                              disabled={!canManage || pending}
                              className={cn(
                                "inline-flex size-7 items-center justify-center rounded-full transition-colors",
                                !canManage || pending
                                  ? "cursor-default"
                                  : "hover:cursor-pointer hover:bg-[#f1f5f9]",
                              )}
                            >
                              {pending ? (
                                <Loader2 className="size-3.5 animate-spin text-[#94a3b8]" />
                              ) : (
                                <AccessGlyph access={current ?? "hidden"} />
                              )}
                            </button>
                          </PopoverTrigger>
                          <PopoverContent className="w-52 p-1.5" align="center">
                            <div className="flex flex-col">
                              {(
                                [
                                  { value: null, key: "hidden", label: "legendHidden" },
                                  { value: "view", key: "view", label: "legendView" },
                                  { value: "edit", key: "edit", label: "legendEdit" },
                                ] as const
                              ).map((option) => {
                                const isActive = (current ?? null) === option.value
                                return (
                                  <button
                                    key={option.key}
                                    type="button"
                                    onClick={() =>
                                      handleSetAccess(section.id, step.id, option.value)
                                    }
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
