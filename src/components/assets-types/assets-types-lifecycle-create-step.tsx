import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { X, Pencil, Ban, Save } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useLifecycleSteps, useLifecycleMutations, useLifecycleSlaUnits } from "@/hooks/useLifecycle"
import { useRoles } from "@/hooks/useRbac"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CreateStepContentProps {
  documentTypeId: string
  stepType: string
  hasSla?: boolean
  onEditingChange?: (isEditing: boolean) => void
}

// ─── Component ────────────────────────────────────────────────────────────────

export function CreateStepContent({
  documentTypeId,
  stepType,
  hasSla = false,
  onEditingChange,
}: CreateStepContentProps) {
  const { t } = useTranslation("asset-types")
  const { data, isLoading } = useLifecycleSteps(documentTypeId, stepType, true)
  const { data: rolesData } = useRoles(true, 1, 1000)
  const { updateStep } = useLifecycleMutations(documentTypeId, stepType)
  const { data: slaUnitsData } = useLifecycleSlaUnits()

  const step = data?.data?.steps?.[0] ?? null
  const allRoles = rolesData?.data ?? []
  const slaUnitOptions = (slaUnitsData?.data ?? []).map((u) => ({
    value: u.value,
    label: t(`lifecycle.slaUnits.${u.value}`, { defaultValue: u.label }),
  }))

  const [isEditing, setIsEditing] = useState(false)
  const [snapshot, setSnapshot] = useState<{
    accessType: "all" | "custom"
    validFrom: string | null
    validTo: string | null
    roleIds: string[]
    slaEnabled: boolean
    slaValue: string
    slaUnit: string
  } | null>(null)
  const [accessType, setAccessType] = useState<"all" | "custom">("all")
  const [validFrom, setValidFrom] = useState<string | null>(null)
  const [validTo, setValidTo] = useState<string | null>(null)
  const [roleIds, setRoleIds] = useState<string[]>([])
  const [slaEnabled, setSlaEnabled] = useState(false)
  const [slaValue, setSlaValue] = useState("")
  const [slaUnit, setSlaUnit] = useState("")

  const handleEdit = () => {
    setSnapshot({ accessType, validFrom, validTo, roleIds, slaEnabled, slaValue, slaUnit })
    setIsEditing(true)
    onEditingChange?.(true)
  }

  const handleCancel = () => {
    if (snapshot) {
      setAccessType(snapshot.accessType)
      setValidFrom(snapshot.validFrom)
      setValidTo(snapshot.validTo)
      setRoleIds(snapshot.roleIds)
      setSlaEnabled(snapshot.slaEnabled)
      setSlaValue(snapshot.slaValue)
      setSlaUnit(snapshot.slaUnit)
    }
    setIsEditing(false)
    setSnapshot(null)
    onEditingChange?.(false)
  }

  // Ref always holding the latest save fn (updated every render, no stale closure)
  const saveFnRef = useRef<(() => Promise<void>) | null>(null)
  saveFnRef.current = step
    ? async () => {
        await updateStep.mutateAsync({
          stepId: step.id,
          data: {
            access_type: accessType,
            valid_from: validFrom ? validFrom.split("T")[0] : null,
            valid_to: validTo ? validTo.split("T")[0] : null,
            ...(hasSla && {
              sla_value: slaEnabled ? Number(slaValue) || null : null,
              sla_unit: slaEnabled ? slaUnit || null : null,
            }),
            ...(accessType === "custom" && { role_ids: roleIds }),
          },
        })
        toast.success(t("lifecycle.savedSuccess"))
        setIsEditing(false)
        setSnapshot(null)
        onEditingChange?.(false)
      }
    : null

  useEffect(() => {
    if (step) {
      setAccessType(step.access_type === "custom" ? "custom" : "all")
      setValidFrom(step.valid_from ?? null)
      setValidTo(step.valid_to ?? null)
      setRoleIds(step.step_roles.map((r) => r.role_id))
      if (hasSla) {
        setSlaEnabled(step.sla_value != null)
        setSlaValue(step.sla_value != null ? String(step.sla_value) : "")
        setSlaUnit(step.sla_unit ?? "")
      }
    }
  }, [step, hasSla])

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
      <p className="text-sm text-muted-foreground py-4">
        {t("lifecycle.noConfig")}
      </p>
    )
  }

  const assignedRoles = allRoles.filter((r) => roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !roleIds.includes(r.id))

  return (
    <div className="flex flex-col gap-6">
      {/* Title + edit/cancel toggle */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <p className="text-base font-semibold text-foreground">
            {t(`lifecycle.stepTypes.${stepType}`, { defaultValue: step.name ?? t("lifecycle.creatorTitle") })}
          </p>
          <p className="text-sm text-muted-foreground">
            {t(`lifecycle.stepDescriptions.${stepType}`, {
              defaultValue: t("lifecycle.creatorDescription"),
            })}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {isEditing ? (
            <>
              <HuemulButton
                icon={Ban}
                label={t("lifecycle.cancel")}
                variant="ghost"
                onClick={handleCancel}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
              />
              <HuemulButton
                icon={Save}
                label={t("lifecycle.save")}
                variant="default"
                onClick={async () => await saveFnRef.current?.()}
                loading={updateStep.isPending}
              />
            </>
          ) : (
            <HuemulButton
              icon={Pencil}
              label={t("lifecycle.edit")}
              variant="ghost"
              onClick={handleEdit}
              className="text-muted-foreground"
            />
          )}
        </div>
      </div>

      {/* Access type options */}
      <div className="rounded-md border border-border bg-muted/30 p-5">
        <HuemulField
          type="radio"
          label={t("lifecycle.options")}
          name="create-access-type"
          value={accessType}
          options={[
            { value: "all", label: t("lifecycle.everyone") },
            { value: "custom", label: t("lifecycle.customOption") },
          ]}
          onChange={(v) => setAccessType(v as "all" | "custom")}
          disabled={!isEditing}
        />
      </div>

      {/* SLA (only for steps that support it) */}
      {hasSla && (
        <div className="flex flex-col gap-3">
          <HuemulField
            type="switch"
            label={t("lifecycle.slaLabel")}
            name={`sla-toggle-${stepType}`}
            value={slaEnabled}
            onChange={(v) => {
              setSlaEnabled(Boolean(v))
              if (!v) {
                setSlaValue("")
                setSlaUnit("")
              }
            }}
            disabled={!isEditing}
            labelFirst
          />
          {slaEnabled && (
            <div className="flex items-center gap-2 pl-1">
              <HuemulField
                type="number"
                label=""
                name={`sla-value-${stepType}`}
                value={slaValue}
                min={1}
                onChange={(v) => setSlaValue(String(v))}
                placeholder={t("lifecycle.slaValuePlaceholder")}
                disabled={!isEditing}
                className="w-20"
                inputClassName="h-8 text-sm"
              />
              <HuemulField
                type="select"
                label=""
                name={`sla-unit-${stepType}`}
                value={slaUnit}
                options={slaUnitOptions}
                onChange={(v) => setSlaUnit(String(v))}
                disabled={!isEditing}
                className="w-32"
              />
            </div>
          )}
        </div>
      )}

      {/* Custom role management */}
      {accessType === "custom" && (
        <HuemulField
          type="combobox"
          label={t("lifecycle.addRole")}
          name="add-role-create"
          placeholder={t("lifecycle.addRolePlaceholder")}
          value=""
          options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
          onChange={(roleId) => {
            if (!roleId) return
            setRoleIds((prev) => [...prev, roleId as string])
          }}
          disabled={!isEditing}
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
                  {isEditing && (
                    <button
                      type="button"
                      className="rounded-full hover:text-destructive hover:cursor-pointer transition-colors"
                      onClick={() =>
                        setRoleIds((prev) => prev.filter((id) => id !== r.id))
                      }
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
      )}

      {/* Validity date range */}
      <div className="flex items-center gap-4">
        <p className="text-sm font-medium shrink-0">{t("lifecycle.validity")}</p>
        <HuemulField
          type="date"
          label=""
          name="valid-from"
          value={validFrom ?? ""}
          placeholder={t("lifecycle.validFrom")}
          onChange={(v) => setValidFrom(v ? String(v) : null)}
          disabled={!isEditing}
        />
        <span className="text-muted-foreground">-</span>
        <HuemulField
          type="date"
          label=""
          name="valid-to"
          value={validTo ?? ""}
          placeholder={t("lifecycle.validTo")}
          onChange={(v) => setValidTo(v ? String(v) : null)}
          disabled={!isEditing}
        />
      </div>
    </div>
  )
}
