import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import {
  useAllLifecycleSteps,
  useLifecycleMutations,
  useLifecycleAccessRuleTypes,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { deriveAccessType, stepRoleIds, buildAccessPayload, pipelineIndex } from "@/lib/lifecycle-access"
import { Skeleton } from "@/components/ui/skeleton"
import {
  AccessRulesEditor,
  ChipList,
  PanelCard,
  PanelFieldLabel,
  PanelInfoHint,
  PanelPillButton,
  PanelSummaryRow,
  RemovableChip,
  SettingToggleList,
  SettingToggleRow,
} from "./assets-types-lifecycle-ui"
import type { CreateStepContentProps, EditStepCardAccessRule } from '@/types/assets'
import type { LifecycleAccessType } from '@/types/lifecycle'

/** Igualdad de listas de ids — evita recrear el array de roles en cada refetch. */
function sameIdList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

export type { CreateStepContentProps } from '@/types/assets'

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Contenido de una etapa SIN grupos: «Lectura» (`view`, o su alias legado
 * `read`), «Creador» (`create`), «Publicación» (`publish`) y «Archivado»
 * (`archive`) — un único `LifecycleStep` por tipo con permisos simples. Las
 * etapas agrupables (`edit`/`review`/`approve`) van por `EditStepContent`.
 *
 * Siempre muestra todo el contenido (resumen en lectura o controles en edición)
 * — es una sola tarjeta y el header del panel ya titula la etapa, así que un
 * colapso no aporta nada. El lápiz («Editar») habilita los controles, cuyos
 * cambios se acumulan en estado local y se persisten con «Guardar cambios» del
 * footer del sheet a través de `onRegisterEditor` — mismo patrón que las
 * tarjetas de grupo de `EditStepContent`.
 *
 * Acá no hay SLA ni vigencia: son propias de las etapas con grupos.
 */
export function CreateStepContent({
  documentTypeId,
  stepType,
  stepLabel,
  onRegisterEditor,
}: CreateStepContentProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate('asset_type')
  // Una sola query de steps para todo el componente: la del document type
  // completo, que además alimenta `earlierSteps`. Así no se depende de que el
  // backend soporte `?step_type=` para cada tipo, y el step llega igual de
  // fresco — `applyOptimisticStepPatch`/`invalidateSteps` (useLifecycle.ts)
  // trabajan sobre el prefijo `stepsByDocumentType`, que la incluye.
  const { data: allStepsData, isLoading } = useAllLifecycleSteps(documentTypeId, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { updateStep } = useLifecycleMutations(documentTypeId, stepType)
  const { data: accessRuleTypesData } = useLifecycleAccessRuleTypes()
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })

  const step = (allStepsData?.data?.steps ?? []).find((s) => s.type === stepType) ?? null
  const allRoles = rolesData?.data ?? []
  const accessRuleTypeOptions = accessRuleTypesData?.data ?? []

  // Steps de otros tipos anteriores en el pipeline — candidatos para el
  // `source_step_id` de la regla `step_actor_manager` (mismo criterio que
  // `EditStepContent`).
  const earlierSteps = (allStepsData?.data?.steps ?? []).filter(
    (s) => s.type !== stepType && pipelineIndex(s.type) !== -1 && pipelineIndex(s.type) < pipelineIndex(stepType)
  )
  const earlierStepOptions = earlierSteps.map((s) => ({
    value: s.id,
    label: s.name ?? t(`lifecycle.stepTypes.${s.type}`, { defaultValue: s.type }),
  }))

  const [isDirty, setIsDirty] = useState(false)
  const [accessType, setAccessType] = useState<LifecycleAccessType>("all")
  const [ownerCanExecute, setOwnerCanExecute] = useState(true)
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [accessRules, setAccessRules] = useState<EditStepCardAccessRule[]>([])

  // Edición explícita: el contenido siempre se muestra, y solo se habilita al
  // pulsar «Editar» — mismo patrón que los grupos de `EditStepContent`.
  const [isEditing, setIsEditing] = useState(false)
  const editSnapshotRef = useRef<{
    accessType: LifecycleAccessType
    ownerCanExecute: boolean
    roleIds: string[]
    accessRules: EditStepCardAccessRule[]
    isDirty: boolean
  } | null>(null)

  // ── Hidratación / rehidratación ─────────────────────────────────────────────
  // Rehidrata en cada llegada de datos mientras no haya cambios sin persistir —
  // incluso con una edición abierta: un cambio hecho en la matriz (p. ej. tildar
  // un rol) debe reflejarse acá también mientras no haya nada local que pisar.
  const hydrationBlocked = isDirty

  useEffect(() => {
    if (!step || hydrationBlocked) return
    setAccessType(step.access_type)
    setOwnerCanExecute(
      step.access_type === "all" || step.access_type === "owner" || step.access_type === "custom_owner",
    )
    // Roles vigentes: si el paso ya no es `custom`/`custom_owner`, los residuales
    // que devuelva el backend no deben repoblar los chips (ver `stepRoleIds`).
    const nextRoleIds = stepRoleIds(step)
    setRoleIds((prev) => (sameIdList(prev, nextRoleIds) ? prev : nextRoleIds))
    setAccessRules(
      (step.access_rules ?? []).map((r) => ({ rule_type: r.rule_type, source_step_id: r.source_step_id }))
    )
    // No hace falta `setIsDirty(false)`: por el guard, acá `isDirty` ya es false.
  }, [step, hydrationBlocked])

  // ── Guardado batch ──────────────────────────────────────────────────────────
  const saveRef = useRef<() => Promise<void>>(async () => {})

  saveRef.current = async () => {
    if (!canManage || !step || !isDirty) return
    await updateStep.mutateAsync({
      stepId: step.id,
      data: {
        // `access_type` + `role_ids` los arma `buildAccessPayload`: fuera de
        // `custom`/`custom_owner` la clave `role_ids` no puede viajar, el backend
        // la rechaza con 422 incluso vacía.
        ...buildAccessPayload({ accessType, roleIds }),
        access_rules: accessRules,
      },
    })
    setIsDirty(false)
    toast.success(t("lifecycle.savedSuccess"))
  }

  const save = useCallback(() => saveRef.current(), [])

  // Descarta los cambios locales sin recomponer el estado a mano: el efecto de
  // rehidratación de arriba repuebla los campos desde el step cacheado en
  // cuanto `hydrationBlocked` baja.
  const discardRef = useRef<() => void>(() => {})
  discardRef.current = () => {
    editSnapshotRef.current = null
    setIsEditing(false)
    setIsDirty(false)
  }
  const discard = useCallback(() => discardRef.current(), [])

  useEffect(() => {
    onRegisterEditor?.({ isDirty, save, discard })
  }, [isDirty, save, discard, onRegisterEditor])

  useEffect(() => {
    return () => onRegisterEditor?.(null)
  }, [onRegisterEditor])

  const handleStartEdit = () => {
    editSnapshotRef.current = { accessType, ownerCanExecute, roleIds, accessRules, isDirty }
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    const snapshot = editSnapshotRef.current
    if (snapshot) {
      setAccessType(snapshot.accessType)
      setOwnerCanExecute(snapshot.ownerCanExecute)
      setRoleIds(snapshot.roleIds)
      setAccessRules(snapshot.accessRules)
      setIsDirty(snapshot.isDirty)
    }
    editSnapshotRef.current = null
    setIsEditing(false)
  }

  const handleDoneEdit = () => {
    editSnapshotRef.current = null
    setIsEditing(false)
  }

  if (isLoading) {
    return (
      <PanelCard>
        <div className="flex flex-col gap-3 px-3 py-3">
          <Skeleton className="h-5 w-40" />
          <Skeleton className="h-14 w-full rounded-md" />
        </div>
      </PanelCard>
    )
  }

  if (!step) {
    return (
      <PanelCard>
        <p className="px-3 py-4 text-[12.5px] text-[#64748b]">
          {t("lifecycle.noConfig")}
        </p>
      </PanelCard>
    )
  }

  const ro = !canManage || !isEditing
  const title = step.name ?? stepLabel ?? t(`lifecycle.stepTypes.${stepType}`, { defaultValue: stepType })
  const assignedRoles = allRoles.filter((r) => roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !roleIds.includes(r.id))
  const showRolePicker = accessType !== "all"
  const accessTypeLabel = (at: typeof accessType) => {
    switch (at) {
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

  // Roles con `view` real por herencia (edición/revisión/aprobación), sin fila
  // propia acá — el backend los calcula, no se pueden agregar/quitar desde este
  // panel. Solo el step `view` los trae; `read` (alias legado) queda sin esto.
  const inheritedForAll = stepType === "view" && step.view_inherited_for_all_roles === true
  const inheritedRoles = stepType === "view" && !inheritedForAll ? (step.inherited_roles ?? []) : []
  const inheritedRoleLabel = (roleId: string) => allRoles.find((r) => r.id === roleId)?.name ?? roleId
  const inheritedRoleTooltip = (sourceStepType: string, sourceStepName: string | null) =>
    t("lifecycle.matrix.viewInheritedFrom", {
      step: sourceStepName ?? t(`lifecycle.stepTypes.${sourceStepType}`, { defaultValue: sourceStepType }),
    })

  return (
    <PanelCard>
      {/* Cabecera — título de la tarjeta + acción de edición. El título de la
          etapa ya lo dice el header del panel; acá solo el nombre del paso.
          Mismo patrón que el header de `EditStepCard`: fila propia, el borde
          entre header y cuerpo lo aporta el `border-t` de abajo. */}
      <div className="flex items-center gap-1.5 px-3 py-2.5">
        <span
          className="min-w-0 flex-1 truncate text-[13px] font-semibold text-[#0f172a]"
          title={title}
        >
          {title}
        </span>

        {isEditing ? (
          <div className="flex shrink-0 items-center gap-1.5">
            <PanelPillButton label={t("common:cancel")} onClick={handleCancelEdit} />
            <PanelPillButton
              label={t("lifecycle.doneEditing")}
              tone="primary"
              onClick={handleDoneEdit}
            />
          </div>
        ) : (
          canManage && (
            <PanelPillButton icon={Pencil} label={t("common:edit")} onClick={handleStartEdit} />
          )
        )}
      </div>

      <div className="flex flex-col gap-3 border-t border-[#eef1f5] px-3 py-3">
        {stepType === "view" && (
          <PanelInfoHint>{t("lifecycle.viewStepHint")}</PanelInfoHint>
        )}

        {inheritedForAll && (
          <PanelInfoHint>{t("lifecycle.viewInheritedAllRolesHint")}</PanelInfoHint>
        )}

        {inheritedRoles.length > 0 && (
          <div className="flex flex-col gap-1.5">
            <PanelFieldLabel>{t("lifecycle.viewInheritedRolesLabel")}</PanelFieldLabel>
            <ChipList>
              {inheritedRoles.map((r) => (
                <RemovableChip
                  key={r.role_id}
                  label={inheritedRoleLabel(r.role_id)}
                  title={inheritedRoleTooltip(r.source_step_type, r.source_step_name)}
                />
              ))}
            </ChipList>
          </div>
        )}

        <div className="flex flex-col gap-3">
          {isEditing ? (
            <>
              <SettingToggleList>
                <SettingToggleRow
                  label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
                  description={t("lifecycle.allowAnyoneDescShort")}
                  checked={accessType === "all"}
                  disabled={ro}
                  onChange={(v) => {
                    if (v) {
                      setAccessType("all")
                      setOwnerCanExecute(true)
                      setRoleIds([])
                    } else {
                      setAccessType("owner")
                      setOwnerCanExecute(true)
                    }
                    setIsDirty(true)
                  }}
                />

                <SettingToggleRow
                  label={t("lifecycle.ownerCanExecuteLabel", { action: stepAction })}
                  description={t("lifecycle.ownerCanExecuteDesc")}
                  checked={ownerCanExecute}
                  disabled={ro || accessType === "all"}
                  onChange={(v) => {
                    setOwnerCanExecute(v)
                    setAccessType(deriveAccessType({ anyone: false, owner: v, roleCount: roleIds.length }))
                    setIsDirty(true)
                  }}
                />
              </SettingToggleList>

              {/* Roles asignados: chips removibles + selector */}
              {showRolePicker && (
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
                                  const newIds = roleIds.filter((id) => id !== r.id)
                                  setRoleIds(newIds)
                                  setAccessType(
                                    deriveAccessType({ anyone: false, owner: ownerCanExecute, roleCount: newIds.length }),
                                  )
                                  setIsDirty(true)
                                }
                          }
                        />
                      ))}
                    </ChipList>
                  )}
                  <HuemulField
                    type="combobox"
                    label=""
                    name="add-role-create"
                    placeholder={t("lifecycle.panel.addRoleToStep")}
                    value=""
                    options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
                    onChange={(roleId) => {
                      if (!roleId) return
                      const newIds = [...roleIds, roleId as string]
                      setRoleIds(newIds)
                      setAccessType(
                        deriveAccessType({ anyone: false, owner: ownerCanExecute, roleCount: newIds.length }),
                      )
                      setIsDirty(true)
                    }}
                    disabled={ro}
                  />
                </div>
              )}

              {/* Reglas adicionales — acceso por creador/jefatura (OR con los roles) */}
              {showRolePicker && (
                <AccessRulesEditor
                  accessRules={accessRules}
                  accessRuleTypeOptions={accessRuleTypeOptions}
                  earlierStepOptions={earlierStepOptions}
                  onChange={(rules) => {
                    setAccessRules(rules)
                    setIsDirty(true)
                  }}
                  disabled={ro}
                  t={t}
                />
              )}
            </>
          ) : (
            <>
              <PanelSummaryRow label={t("lifecycle.summary.whoCanExecute", { action: stepAction })}>
                {accessTypeLabel(accessType)}
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

              {accessRules.length > 0 && (
                <PanelSummaryRow label={t("lifecycle.summary.rules")}>
                  <ChipList>
                    {accessRules.map((rule, index) => {
                      const ruleLabel = t(`lifecycle.accessRuleTypes.${rule.rule_type}`, {
                        defaultValue: accessRuleTypeOptions.find((o) => o.value === rule.rule_type)?.label ?? rule.rule_type,
                      })
                      const sourceLabel = rule.source_step_id
                        ? earlierStepOptions.find((o) => o.value === rule.source_step_id)?.label ?? rule.source_step_id
                        : null
                      return (
                        <RemovableChip
                          key={`${rule.rule_type}-${rule.source_step_id ?? "none"}-${index}`}
                          label={sourceLabel ? `${ruleLabel} (${sourceLabel})` : ruleLabel}
                        />
                      )
                    })}
                  </ChipList>
                </PanelSummaryRow>
              )}
            </>
          )}
        </div>
      </div>
    </PanelCard>
  )
}
