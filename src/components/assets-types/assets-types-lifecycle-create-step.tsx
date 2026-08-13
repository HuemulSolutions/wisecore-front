import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { HuemulField } from "@/huemul/components/huemul-field"
import { useLifecycleSteps, useLifecycleMutations, useLifecycleSlaUnits } from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { Skeleton } from "@/components/ui/skeleton"
import { LifecyclePublishActionsSection } from "./assets-types-lifecycle-publish-actions"
import {
  ChipList,
  PanelFieldLabel,
  RemovableChip,
  SettingToggleList,
  SettingToggleRow,
} from "./assets-types-lifecycle-ui"
import type { CreateStepContentProps } from '@/types/assets'

export type { CreateStepContentProps } from '@/types/assets'

// ─── Component ────────────────────────────────────────────────────────────────

/**
 * Etapas sin grupos (Creador, Publicación, Archivado, Lector): un único
 * `LifecycleStep` con permisos simples. Igual que `EditStepContent`, los
 * controles quedan siempre editables y el guardado se dispara desde el footer
 * del sheet a través de `onRegisterEditor`.
 */
export function CreateStepContent({
  documentTypeId,
  stepType,
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
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { updateStep } = useLifecycleMutations(documentTypeId, stepType)
  const { data: slaUnitsData } = useLifecycleSlaUnits()
  const stepAction = t(`lifecycle.stepActions.${stepType}`, { defaultValue: stepType })

  const step = data?.data?.steps?.[0] ?? null
  const allRoles = rolesData?.data ?? []
  const slaUnitOptions = (slaUnitsData?.data ?? []).map((u) => ({
    value: u.value,
    label: t(`lifecycle.slaUnits.${u.value}`, { defaultValue: u.label }),
  }))

  const [isDirty, setIsDirty] = useState(false)
  const [accessType, setAccessType] = useState<"all" | "owner" | "custom" | "custom_owner">("all")
  const [ownerCanExecute, setOwnerCanExecute] = useState(true)
  const [validFrom, setValidFrom] = useState<string | null>(null)
  const [validTo, setValidTo] = useState<string | null>(null)
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [slaEnabled, setSlaEnabled] = useState(false)
  const [slaValue, setSlaValue] = useState("")
  const [slaUnit, setSlaUnit] = useState("")

  // El estado local solo se hidrata la primera vez que llegan los datos del step:
  // después manda lo que el usuario tiene en pantalla, hasta que se guarde.
  const hydratedStepIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (!step || hydratedStepIdRef.current === step.id) return
    let at: "all" | "owner" | "custom" | "custom_owner"
    if (useAllOrCustomOwner) {
      at = step.access_type === "all" ? "all" : "custom_owner"
    } else {
      at = step.access_type === "custom" ? "custom" : (noOwner || step.access_type !== "owner") ? "all" : "owner"
    }
    setAccessType(at)
    setOwnerCanExecute(at === "all" || at === "owner" || at === "custom_owner")
    setValidFrom(step.valid_from ?? null)
    setValidTo(step.valid_to ?? null)
    setRoleIds(step.step_roles.map((r) => r.role_id))
    if (hasSla) {
      setSlaEnabled(step.sla_value != null)
      setSlaValue(step.sla_value != null ? String(step.sla_value) : "")
      setSlaUnit(step.sla_unit ?? "")
    }
    setIsDirty(false)
    hydratedStepIdRef.current = step.id
  }, [step, hasSla, noOwner, useAllOrCustomOwner])

  // ── Guardado batch ──────────────────────────────────────────────────────────
  const saveRef = useRef<() => Promise<void>>(async () => {})

  saveRef.current = async () => {
    if (!canManage || !step || !isDirty) return
    await updateStep.mutateAsync({
      stepId: step.id,
      data: {
        access_type: accessType,
        ...(hasValidity && {
          valid_from: validFrom ? validFrom.split("T")[0] : null,
          valid_to: validTo ? validTo.split("T")[0] : null,
        }),
        ...(hasSla && {
          sla_value: slaEnabled ? Number(slaValue) || null : null,
          sla_unit: slaEnabled ? slaUnit || null : null,
        }),
        ...((accessType === "custom" || accessType === "custom_owner") && { role_ids: roleIds }),
      },
    })
    setIsDirty(false)
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

  const ro = !canManage
  const assignedRoles = allRoles.filter((r) => roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !roleIds.includes(r.id))
  const showRolePicker = useAllOrCustomOwner
    ? accessType !== "all"
    : accessType === "custom" || accessType === "custom_owner"

  return (
    <div className="flex flex-col gap-3">
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
                setAccessType(roleIds.length > 0 ? (v ? "custom_owner" : "custom") : "owner")
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
                              newIds.length > 0
                                ? ownerCanExecute
                                  ? "custom_owner"
                                  : "custom"
                                : "owner",
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
              setRoleIds((prev) => [...prev, roleId as string])
              if (useAllOrCustomOwner) {
                setAccessType(ownerCanExecute ? "custom_owner" : "custom")
              }
              setIsDirty(true)
            }}
            disabled={ro}
          />
        </div>
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

      {/* Publicación externa — solo pasos de tipo publish */}
      {stepType === "publish" && organizationId && step?.id && (
        <LifecyclePublishActionsSection
          organizationId={organizationId}
          stepId={step.id}
        />
      )}
    </div>
  )
}
