import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { Pencil } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import {
  useLifecycleSteps,
  useAllLifecycleSteps,
  useLifecycleMutations,
  useLifecycleSlaUnits,
  useLifecycleAccessRuleTypes,
} from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { deriveAccessType, stepRoleIds, buildAccessPayload, pipelineIndex } from "@/lib/lifecycle-access"
import { Skeleton } from "@/components/ui/skeleton"
import { LifecyclePublishActionsSection } from "./assets-types-lifecycle-publish-actions"
import {
  AccessRulesEditor,
  ChipList,
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

/**
 * Traduce el `access_type` del backend al estado del panel según qué controles
 * expone cada variante.
 *
 * `useAllOrCustomOwner` (publish/archive/read/view) representa los CUATRO
 * valores —switch «todos» + switch «el propietario puede…» + roles—, así que
 * se respeta lo que devuelve el backend. Antes colapsaba `owner` a
 * `custom_owner`: un paso realmente `owner` se mostraba como `custom_owner` y
 * se volvía a guardar así, cambiando el acceso sin que el usuario tocara nada.
 */
function resolvePanelAccessType(
  serverAccessType: LifecycleAccessType,
  options: { noOwner: boolean; useAllOrCustomOwner: boolean },
): LifecycleAccessType {
  if (options.useAllOrCustomOwner) return serverAccessType
  if (serverAccessType === "custom") return "custom"
  // `create` (noOwner) no ofrece el switch de propietario: `owner` y
  // `custom_owner` no son representables y caen a `all`.
  if (options.noOwner) return "all"
  // Con propietario pero sin `useAllOrCustomOwner`, el switch alterna
  // `owner` ↔ `custom`: `custom_owner` se representa como `custom` (conserva
  // los roles) en vez de caer a `all` (los perdía).
  if (serverAccessType === "custom_owner") return "custom"
  return serverAccessType === "owner" ? "owner" : "all"
}

/** Igualdad de listas de ids — evita recrear el array de roles en cada refetch. */
function sameIdList(a: string[], b: string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i])
}

export type { CreateStepContentProps } from '@/types/assets'

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Etapas sin grupos (Creador, Publicación, Archivado, Lector): un único
 * `LifecycleStep` con permisos simples. Siempre muestra todo el contenido
 * (resumen en lectura o controles en edición) — es una sola tarjeta y el
 * header del panel ya titula la etapa, así que un colapso no aporta nada.
 * El lápiz («Editar») habilita los controles, cuyos cambios se acumulan en
 * estado local y se persisten con «Guardar cambios» del footer del sheet a
 * través de `onRegisterEditor` — mismo patrón que las tarjetas de grupo de
 * `EditStepContent`.
 */
export function CreateStepContent({
  documentTypeId,
  stepType,
  stepLabel,
  hasSla = false,
  hasValidity = true,
  noOwner = false,
  useAllOrCustomOwner = false,
  onRegisterEditor,
  organizationId,
}: CreateStepContentProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate('asset_type')
  const { data, isLoading } = useLifecycleSteps(documentTypeId, stepType, true)
  const { data: allStepsData } = useAllLifecycleSteps(documentTypeId, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { updateStep } = useLifecycleMutations(documentTypeId, stepType)
  const { data: slaUnitsData } = useLifecycleSlaUnits()
  const { data: accessRuleTypesData } = useLifecycleAccessRuleTypes()
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })

  const step = data?.data?.steps?.[0] ?? null
  const allRoles = rolesData?.data ?? []
  const slaUnitOptions = (slaUnitsData?.data ?? []).map((u) => ({
    value: u.value,
    label: t(`lifecycle.slaUnits.${u.value}`, { defaultValue: u.label }),
  }))
  const accessRuleTypeOptions = accessRuleTypesData?.data ?? []

  // Steps de otros tipos anteriores en el pipeline — candidatos para el
  // `source_step_id` de la regla `step_actor_manager` (mismo criterio que
  // `EditStepContent`). Para `create` (primer step del pipeline) queda vacío.
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
  const [validFrom, setValidFrom] = useState<string | null>(null)
  const [validTo, setValidTo] = useState<string | null>(null)
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [accessRules, setAccessRules] = useState<EditStepCardAccessRule[]>([])
  const [slaEnabled, setSlaEnabled] = useState(false)
  const [slaValue, setSlaValue] = useState("")
  const [slaUnit, setSlaUnit] = useState("")

  // Edición explícita: el contenido siempre se muestra, y solo se habilita al
  // pulsar «Editar» — mismo patrón que los grupos de `EditStepContent`.
  const [isEditing, setIsEditing] = useState(false)
  const editSnapshotRef = useRef<{
    accessType: LifecycleAccessType
    ownerCanExecute: boolean
    validFrom: string | null
    validTo: string | null
    roleIds: string[]
    accessRules: EditStepCardAccessRule[]
    slaEnabled: boolean
    slaValue: string
    slaUnit: string
    isDirty: boolean
  } | null>(null)

  // ── Hidratación / rehidratación ─────────────────────────────────────────────
  // Antes un `hydratedStepIdRef` descartaba todos los refetch (el step es
  // siempre el mismo id, así que hidrataba una única vez en toda la vida del
  // panel). Ahora rehidrata en cada llegada de datos mientras no haya cambios
  // sin persistir — incluso con una edición abierta: un cambio hecho en la
  // matriz (p. ej. tildar un rol) debe reflejarse acá también mientras no haya
  // nada local que pisar.
  const hydrationBlocked = isDirty

  useEffect(() => {
    if (!step || hydrationBlocked) return
    const nextAccessType = resolvePanelAccessType(step.access_type, { noOwner, useAllOrCustomOwner })
    setAccessType(nextAccessType)
    setOwnerCanExecute(
      nextAccessType === "all" || nextAccessType === "owner" || nextAccessType === "custom_owner",
    )
    setValidFrom(step.valid_from ?? null)
    setValidTo(step.valid_to ?? null)
    // Roles vigentes: si el paso ya no es `custom`/`custom_owner`, los residuales
    // que devuelva el backend no deben repoblar los chips (ver `stepRoleIds`).
    const nextRoleIds = stepRoleIds(step)
    setRoleIds((prev) => (sameIdList(prev, nextRoleIds) ? prev : nextRoleIds))
    setAccessRules(
      (step.access_rules ?? []).map((r) => ({ rule_type: r.rule_type, source_step_id: r.source_step_id }))
    )
    if (hasSla) {
      setSlaEnabled(step.sla_value != null)
      setSlaValue(step.sla_value != null ? String(step.sla_value) : "")
      setSlaUnit(step.sla_unit ?? "")
    }
    // No hace falta `setIsDirty(false)`: por el guard, acá `isDirty` ya es false.
  }, [step, hasSla, noOwner, useAllOrCustomOwner, hydrationBlocked])

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
        ...(hasValidity && {
          valid_from: validFrom ? validFrom.split("T")[0] : null,
          valid_to: validTo ? validTo.split("T")[0] : null,
        }),
        ...(hasSla && {
          sla_value: slaEnabled ? Number(slaValue) || null : null,
          sla_unit: slaEnabled ? slaUnit || null : null,
        }),
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
    editSnapshotRef.current = {
      accessType,
      ownerCanExecute,
      validFrom,
      validTo,
      roleIds,
      accessRules,
      slaEnabled,
      slaValue,
      slaUnit,
      isDirty,
    }
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    const snapshot = editSnapshotRef.current
    if (snapshot) {
      setAccessType(snapshot.accessType)
      setOwnerCanExecute(snapshot.ownerCanExecute)
      setValidFrom(snapshot.validFrom)
      setValidTo(snapshot.validTo)
      setRoleIds(snapshot.roleIds)
      setAccessRules(snapshot.accessRules)
      setSlaEnabled(snapshot.slaEnabled)
      setSlaValue(snapshot.slaValue)
      setSlaUnit(snapshot.slaUnit)
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
      <div className="flex flex-col gap-3 py-2">
        <Skeleton className="h-5 w-40" />
        {hasSla && <Skeleton className="h-14 w-full rounded-md" />}
        <Skeleton className="h-14 w-full rounded-md" />
      </div>
    )
  }

  if (!step) {
    return (
      <p className="py-4 text-[12.5px] text-[#64748b]">
        {t("lifecycle.noConfig")}
      </p>
    )
  }

  const ro = !canManage || !isEditing
  const title = step.name ?? stepLabel ?? t(`lifecycle.stepTypes.${stepType}`, { defaultValue: stepType })
  const assignedRoles = allRoles.filter((r) => roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !roleIds.includes(r.id))
  const showRolePicker = useAllOrCustomOwner
    ? accessType !== "all"
    : accessType === "custom" || accessType === "custom_owner"
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

  // Roles con acceso a algún otro step del lifecycle pero sin acceso al step
  // `view` — el gate real de visibilidad del documento. Sin este aviso, un
  // admin puede asignar roles a Elaboración/Aprobación/etc. y asumir que ya
  // pueden ver el documento, cuando en realidad `view` los sigue bloqueando.
  const missingViewRoleIds =
    stepType === "view" && isEditing && accessType !== "all"
      ? Array.from(
          new Set(
            (allStepsData?.data?.steps ?? [])
              .filter((s) => s.id !== step.id)
              .flatMap((s) => s.step_roles.map((r) => r.role_id))
          )
        ).filter((id) => !roleIds.includes(id))
      : []
  const missingViewRoles = allRoles.filter((r) => missingViewRoleIds.includes(r.id))

  return (
    <div className="flex flex-col gap-3">
      {/* Cabecera — título de la tarjeta + acción de edición. El título de la
          etapa ya lo dice el header del panel; acá solo el nombre del paso. */}
      <div className="flex items-center gap-1.5 border-b border-[#eef1f5] pb-2.5">
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

      {stepType === "view" && (
        <PanelInfoHint>{t("lifecycle.viewStepHint")}</PanelInfoHint>
      )}

      {missingViewRoles.length > 0 && (
        <PanelInfoHint
          tone="warning"
          action={
            <PanelPillButton
              label={t("lifecycle.viewStepMissingRolesAction")}
              tone="primary"
              onClick={() => {
                setRoleIds([...roleIds, ...missingViewRoleIds])
                if (useAllOrCustomOwner) {
                  setAccessType(
                    deriveAccessType({
                      anyone: false,
                      owner: ownerCanExecute,
                      roleCount: roleIds.length + missingViewRoleIds.length,
                    }),
                  )
                }
                setIsDirty(true)
              }}
            />
          }
        >
          {t("lifecycle.viewStepMissingRolesWarning", {
            roles: missingViewRoles.map((r) => r.name).join(", "),
          })}
        </PanelInfoHint>
      )}

      <div className="flex flex-col gap-3">
        {isEditing ? (
          <>
            <SettingToggleList>
              {hasSla && (
                <SettingToggleRow
                  label={t("lifecycle.slaLabel")}
                  description={t(`lifecycle.slaDescriptions.${stepType}`, {
                    defaultValue: t("lifecycle.slaDescription"),
                  })}
                  checked={slaEnabled}
                  disabled={ro}
                  onChange={(v) => {
                    setSlaEnabled(v)
                    if (!v) {
                      setSlaValue("")
                      setSlaUnit("")
                    }
                    setIsDirty(true)
                  }}
                >
                  {slaEnabled && (
                    <div className="flex items-center gap-2">
                      <HuemulField
                        type="number"
                        label=""
                        name={`sla-value-${stepType}`}
                        value={slaValue}
                        min={1}
                        onChange={(v) => {
                          setSlaValue(String(v))
                          setIsDirty(true)
                        }}
                        placeholder={t("lifecycle.slaValuePlaceholder")}
                        disabled={ro}
                        className="w-20"
                        inputClassName="h-8 text-[12.5px]"
                      />
                      <HuemulField
                        type="select"
                        label=""
                        name={`sla-unit-${stepType}`}
                        value={slaUnit}
                        options={slaUnitOptions}
                        onChange={(v) => {
                          setSlaUnit(String(v))
                          setIsDirty(true)
                        }}
                        disabled={ro}
                        className="flex-1"
                      />
                    </div>
                  )}
                </SettingToggleRow>
              )}

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
                  } else if (noOwner) {
                    setAccessType("custom")
                    setOwnerCanExecute(false)
                  } else {
                    setAccessType("owner")
                    setOwnerCanExecute(true)
                  }
                  setIsDirty(true)
                }}
              />

              {!noOwner && (
                <SettingToggleRow
                  label={t("lifecycle.ownerCanExecuteLabel", { action: stepAction })}
                  description={t("lifecycle.ownerCanExecuteDesc")}
                  checked={ownerCanExecute}
                  disabled={ro || accessType === "all"}
                  onChange={(v) => {
                    setOwnerCanExecute(v)
                    if (useAllOrCustomOwner) {
                      setAccessType(deriveAccessType({ anyone: false, owner: v, roleCount: roleIds.length }))
                    } else if (v) {
                      setAccessType("owner")
                      setRoleIds([])
                    } else {
                      setAccessType("custom")
                    }
                    setIsDirty(true)
                  }}
                />
              )}
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
                                if (useAllOrCustomOwner) {
                                  setAccessType(
                                    deriveAccessType({ anyone: false, owner: ownerCanExecute, roleCount: newIds.length }),
                                  )
                                }
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
                    if (useAllOrCustomOwner) {
                      setAccessType(
                        deriveAccessType({ anyone: false, owner: ownerCanExecute, roleCount: newIds.length }),
                      )
                    }
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

            {/* Vigencia */}
            {hasValidity && (
              <div className="flex flex-col gap-1.5">
                <PanelFieldLabel disabled={ro}>{t("lifecycle.validity")}</PanelFieldLabel>
                <div className="flex items-center gap-2">
                  <HuemulField
                    type="date"
                    label=""
                    name="valid-from"
                    value={validFrom ?? ""}
                    placeholder={t("lifecycle.validFrom")}
                    onChange={(v) => {
                      setValidFrom(v ? String(v) : null)
                      setIsDirty(true)
                    }}
                    disabled={ro}
                    className="flex-1"
                  />
                  <span className="text-[#94a3b8]">–</span>
                  <HuemulField
                    type="date"
                    label=""
                    name="valid-to"
                    value={validTo ?? ""}
                    placeholder={t("lifecycle.validTo")}
                    onChange={(v) => {
                      setValidTo(v ? String(v) : null)
                      setIsDirty(true)
                    }}
                    disabled={ro}
                    className="flex-1"
                  />
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {hasSla && (
              <PanelSummaryRow label={t("lifecycle.summary.sla")}>
                {slaEnabled
                  ? `${slaValue} ${
                      slaUnitOptions.find((u) => u.value === slaUnit)?.label ?? slaUnit
                    }`
                  : t("lifecycle.summary.none")}
              </PanelSummaryRow>
            )}

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

            {hasValidity && (
              <PanelSummaryRow label={t("lifecycle.validity")}>
                {validFrom || validTo
                  ? `${validFrom ?? "—"} – ${validTo ?? "—"}`
                  : t("lifecycle.summary.none")}
              </PanelSummaryRow>
            )}
          </>
        )}

        {/* Publicación externa — solo pasos de tipo publish */}
        {stepType === "publish" && organizationId && step?.id && (
          <LifecyclePublishActionsSection
            organizationId={organizationId}
            stepId={step.id}
            readOnly={!isEditing}
          />
        )}
      </div>
    </div>
  )
}
