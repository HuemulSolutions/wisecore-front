"use client"

import { useTranslation } from "react-i18next"
import { HuemulField } from "@/huemul/components/huemul-field"
import { deriveAccessType } from "@/lib/lifecycle-access"
import { ChipList, PanelFieldLabel, PanelInfoHint, RemovableChip } from "./assets-types-lifecycle-ui"
import type { LifecycleStepDraftApi } from "./assets-types-lifecycle-step-draft"

/**
 * Tab «Roles y accesos»: solo la lista de roles asignados a este step —
 * «cualquiera»/«propietario» viven en la tarjeta de Reglas de acceso del tab
 * Configuración, porque ahí es donde el usuario decide QUIÉN ejecuta el paso
 * antes de bajar a la lista de roles puntuales.
 */
export function LifecycleStepRolesTab({ draft }: { draft: LifecycleStepDraftApi }) {
  const { t } = useTranslation(["asset-types", "common"])
  const { draft: data, updateDraft, allRoles, canManage, capabilities, step } = draft

  const ro = !canManage
  const allowsAnyone = data.accessType === "all"
  const assignedRoles = allRoles.filter((r) => data.roleIds.includes(r.id))
  const availableRoles = allRoles.filter((r) => !data.roleIds.includes(r.id))

  const setRoleIds = (roleIds: string[], roleNames?: Record<string, string>) => {
    const owner = capabilities.hasOwnerToggle ? data.ownerCanExecute : false
    updateDraft({
      roleIds,
      roleNames: roleNames ?? data.roleNames,
      accessType: deriveAccessType({ anyone: false, owner, roleCount: roleIds.length }),
    })
  }

  const inheritedForAll = capabilities.hasInheritedViewChips && step?.view_inherited_for_all_roles === true
  const inheritedRoles = capabilities.hasInheritedViewChips && !inheritedForAll ? step?.inherited_roles ?? [] : []

  if (allowsAnyone) {
    return <PanelInfoHint>{t("lifecycle.panel.rolesNotApplicableAnyone")}</PanelInfoHint>
  }

  return (
    <div className="flex flex-col gap-4 py-4">
      {capabilities.hasInheritedViewChips && <PanelInfoHint>{t("lifecycle.viewStepHint")}</PanelInfoHint>}
      {inheritedForAll && <PanelInfoHint>{t("lifecycle.viewInheritedAllRolesHint")}</PanelInfoHint>}

      {inheritedRoles.length > 0 && (
        <div className="flex flex-col gap-1.5">
          <PanelFieldLabel>{t("lifecycle.viewInheritedRolesLabel")}</PanelFieldLabel>
          <ChipList>
            {inheritedRoles.map((r) => (
              <RemovableChip
                key={r.role_id}
                label={allRoles.find((role) => role.id === r.role_id)?.name ?? r.role_id}
                title={t("lifecycle.matrix.viewInheritedFrom", {
                  step: r.source_step_name ?? t(`lifecycle.stepTypes.${r.source_step_type}`, { defaultValue: r.source_step_type }),
                })}
              />
            ))}
          </ChipList>
        </div>
      )}

      <p className="text-[12.5px] text-[#64748b]">
        {t("lifecycle.panel.rolesAssignedCount", { count: assignedRoles.length, total: allRoles.length })}
      </p>

      {assignedRoles.length > 0 && (
        <ChipList>
          {assignedRoles.map((r) => (
            <RemovableChip
              key={r.id}
              label={r.name}
              disabled={ro}
              removeLabel={t("lifecycle.matrix.removeRole")}
              onRemove={ro ? undefined : () => setRoleIds(data.roleIds.filter((id) => id !== r.id))}
            />
          ))}
        </ChipList>
      )}

      {!ro && (
        <div className="flex flex-col gap-1">
          <HuemulField
            type="combobox"
            label=""
            name="lifecycle-step-add-role"
            placeholder={t("lifecycle.panel.addRoleToStep")}
            value=""
            options={availableRoles.map((r) => ({ value: r.id, label: r.name }))}
            onChange={(roleId) => {
              if (!roleId) return
              const role = allRoles.find((r) => r.id === roleId)
              setRoleIds([...data.roleIds, String(roleId)], { ...data.roleNames, [String(roleId)]: role?.name ?? String(roleId) })
            }}
          />
          <p className="text-[11px] text-[#94a3b8]">{t("lifecycle.panel.addRoleLocalHint")}</p>
        </div>
      )}
    </div>
  )
}
