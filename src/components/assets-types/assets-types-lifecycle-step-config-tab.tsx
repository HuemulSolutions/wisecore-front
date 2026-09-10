"use client"

import { useTranslation } from "react-i18next"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulSegmentedControl } from "@/huemul/components/huemul-segmented-control"
import { HuemulSectionCard } from "@/huemul/components/huemul-section-card"
import { deriveAccessType } from "@/lib/lifecycle-access"
import { LifecycleReviewActionsSection } from "./assets-types-lifecycle-review-actions"
import { LifecycleElaborationConfigSection } from "./assets-types-lifecycle-elaboration-config"
import {
  AccessRulesEditor,
  PanelFieldLabel,
  PanelHeaderSwitch,
  PanelInfoHint,
  SettingToggleList,
  SettingToggleRow,
} from "./assets-types-lifecycle-ui"
import type { LifecycleStepDraftApi } from "./assets-types-lifecycle-step-draft"

/**
 * Tab «Configuración» del sheet mono-entidad de step. Tres tarjetas —
 * Identidad, Plazo (SLA), Reglas de acceso— gobernadas por
 * `lifecycleStepCapabilities` (`src/lib/lifecycle-access.ts`): una etapa
 * simple no muestra posición ni SLA; `approve` no muestra el selector de
 * modo (siempre manual); `create` no muestra «El propietario puede…» (no hay
 * propietario todavía en la creación, mismo criterio que la celda `n/a` de
 * la matriz).
 *
 * Las filas «Cualquiera puede…» / «El propietario puede…» conservan la forma
 * del diseño (toggle con label + descripción) pero la semántica real del
 * backend es `access_type`, no capacidades como "editar contenido" o
 * "firmar" — esas no existen en el modelo. Las cuatro reglas por jerarquía
 * (creador, jefe del creador, jefe del propietario, jefe de un paso
 * anterior) reusan `AccessRulesEditor` tal cual, porque ya resuelve la
 * repetibilidad de `step_actor_manager` con distinto step origen.
 */
export function LifecycleStepConfigTab({ draft }: { draft: LifecycleStepDraftApi }) {
  const { t } = useTranslation(["asset-types", "common"])
  const {
    step,
    stageType,
    capabilities,
    draft: data,
    updateDraft,
    canManage,
    organizationId,
    documentTypeId,
    slaUnitOptions,
    accessRuleTypeOptions,
    earlierStepOptions,
    positionOptions,
    positionBreaksRule,
  } = draft

  const ro = !canManage
  const stepAction = t(`lifecycle.stepActions.${stageType}`, { defaultValue: stageType })
  const isAutomatic = capabilities.hasModeSelector && data.mode === "automatic"
  const allowsAnyone = data.accessType === "all"
  const slaOptions = slaUnitOptions.map((u) => ({
    value: u.value,
    label: t(`lifecycle.slaUnits.${u.value}`, { defaultValue: u.label }),
  }))

  const setOwnerCanExecute = (owner: boolean) =>
    updateDraft({ ownerCanExecute: owner, accessType: deriveAccessType({ anyone: false, owner, roleCount: data.roleIds.length }) })

  return (
    <div className="flex flex-col gap-4 py-4">
      <HuemulSectionCard
        title={t("lifecycle.identitySection.title")}
        subtitle={t("lifecycle.identitySection.subtitle")}
        className="flex flex-col gap-3 p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {capabilities.editableName ? (
            <HuemulField
              type="text"
              label={t("lifecycle.groupNameLabel")}
              required
              name="lifecycle-step-name"
              value={data.name}
              onChange={(v) => updateDraft({ name: String(v) })}
              placeholder={t("lifecycle.groupNamePlaceholder")}
              disabled={ro}
            />
          ) : (
            <div className="flex flex-col gap-1.5">
              <PanelFieldLabel>{t("lifecycle.groupNameLabel")}</PanelFieldLabel>
              <p className="text-[13px] text-[#0f172a]">
                {step?.name?.trim() || t(`lifecycle.stepTypes.${stageType}`, { defaultValue: stageType })}
              </p>
            </div>
          )}

          {capabilities.hasPosition &&
            (positionOptions.length > 1 ? (
              <HuemulField
                type="select"
                label={t("lifecycle.position.label")}
                name="lifecycle-step-position"
                value={String(data.positionIndex)}
                options={positionOptions.map((o) => ({
                  value: String(o.index),
                  label: t("lifecycle.position.option", { index: o.index + 1, total: o.total }),
                }))}
                onChange={(v) => updateDraft({ positionIndex: Number(v) })}
                disabled={ro}
                helpText={t("lifecycle.position.hint")}
              />
            ) : (
              <div className="flex flex-col gap-1.5">
                <PanelFieldLabel disabled>{t("lifecycle.position.label")}</PanelFieldLabel>
                <p className="text-[12.5px] leading-snug text-[#94a3b8]">{t("lifecycle.position.singleGroup")}</p>
              </div>
            ))}
        </div>

        {capabilities.hasModeSelector && (
          <div className="flex flex-col gap-1.5 border-t border-[#eef1f5] pt-3">
            <PanelFieldLabel disabled={ro}>{t("lifecycle.modeLabel")}</PanelFieldLabel>
            <HuemulSegmentedControl
              value={data.mode}
              disabled={ro}
              ariaLabel={t("lifecycle.modeLabel")}
              options={[
                { value: "manual", label: t("lifecycle.modeManual") },
                { value: "automatic", label: t("lifecycle.modeAutomatic") },
              ]}
              onChange={(mode) => updateDraft({ mode: mode as "manual" | "automatic" })}
            />
          </div>
        )}

        {positionBreaksRule && <PanelInfoHint tone="warning">{t("lifecycle.position.breaksRule")}</PanelInfoHint>}
      </HuemulSectionCard>

      {isAutomatic ? (
        step ? (
          organizationId && <LifecycleReviewActionsSection organizationId={organizationId} stepId={step.id} readOnly={ro} />
        ) : (
          <PanelInfoHint>{t("lifecycle.automaticCreateHint")}</PanelInfoHint>
        )
      ) : (
        <>
          {capabilities.hasSla && (
            <HuemulSectionCard
              title={t("lifecycle.slaLabel")}
              subtitle={t(`lifecycle.slaDescriptions.${stageType}`, { defaultValue: t("lifecycle.slaDescription") })}
              headerRight={
                <PanelHeaderSwitch
                  checked={data.hasSla}
                  disabled={ro}
                  ariaLabel={t("lifecycle.slaLabel")}
                  onChange={(v) => updateDraft({ hasSla: v, slaValue: v ? data.slaValue : "", slaUnit: v ? data.slaUnit : "" })}
                />
              }
              className="flex flex-col gap-3 p-4"
            >
              {data.hasSla && (
                <div className="flex items-center gap-2">
                  <HuemulField
                    type="number"
                    label=""
                    name="lifecycle-step-sla-value"
                    value={data.slaValue}
                    min={1}
                    onChange={(v) => updateDraft({ slaValue: String(v) })}
                    placeholder={t("lifecycle.slaValuePlaceholder")}
                    disabled={ro}
                    className="w-24"
                  />
                  <HuemulField
                    type="select"
                    label=""
                    name="lifecycle-step-sla-unit"
                    value={data.slaUnit}
                    options={slaOptions}
                    onChange={(v) => updateDraft({ slaUnit: String(v) })}
                    disabled={ro}
                    className="flex-1"
                  />
                </div>
              )}
            </HuemulSectionCard>
          )}

          <HuemulSectionCard
            title={t("lifecycle.accessSection.title")}
            subtitle={t("lifecycle.accessSection.subtitle")}
            bodyClassName="p-0"
          >
            <SettingToggleList className="rounded-none border-0">
              <SettingToggleRow
                label={t("lifecycle.allowAnyoneLabel", { action: stepAction })}
                description={t("lifecycle.allowAnyoneDescShort")}
                checked={allowsAnyone}
                disabled={ro}
                onChange={(v) => {
                  if (v) updateDraft({ accessType: "all", ownerCanExecute: false, roleIds: [] })
                  else setOwnerCanExecute(capabilities.hasOwnerToggle ? true : false)
                }}
              />
              {capabilities.hasOwnerToggle && (
                <SettingToggleRow
                  label={t("lifecycle.ownerCanExecuteLabel", { action: stepAction })}
                  description={t("lifecycle.ownerCanExecuteDesc")}
                  checked={data.ownerCanExecute}
                  disabled={ro || allowsAnyone}
                  onChange={setOwnerCanExecute}
                />
              )}
            </SettingToggleList>

            {!allowsAnyone && (
              <div className="p-4">
                <AccessRulesEditor
                  accessRules={data.accessRules}
                  accessRuleTypeOptions={accessRuleTypeOptions}
                  earlierStepOptions={earlierStepOptions}
                  onChange={(accessRules) => updateDraft({ accessRules })}
                  disabled={ro}
                  t={t}
                />
              </div>
            )}
          </HuemulSectionCard>
        </>
      )}

      {capabilities.hasElaborationConfig && organizationId && (
        step ? (
          <LifecycleElaborationConfigSection
            organizationId={organizationId}
            documentTypeId={documentTypeId}
            stepId={step.id}
            readOnly={ro}
          />
        ) : (
          <PanelInfoHint>{t("lifecycle.elaborationConfig.createHint")}</PanelInfoHint>
        )
      )}
    </div>
  )
}
