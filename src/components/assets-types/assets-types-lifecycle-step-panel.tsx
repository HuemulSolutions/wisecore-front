"use client"

import { useState } from "react"
import { Plus, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { isGroupableStepType } from "@/lib/lifecycle-access"
import { StepContent } from "./assets-types-lifecycle-dialog"
import { PanelIconButton, PanelSaveBar, PanelSectionLabel } from "./assets-types-lifecycle-ui"
import type { LifecycleStepPanelProps } from "@/types/assets"

export type { LifecycleStepPanelProps } from "@/types/assets"

/**
 * Panel lateral de configuración de una etapa del flujo. Se abre desde el
 * selector de etapa o desde el engranaje de una columna
 * (`assets-types-lifecycle-matrix.tsx`) y reutiliza el router `StepContent`:
 * `EditStepContent` para etapas con grupos (Elaboración, Revisión, Aprobación) y
 * `CreateStepContent` para permisos simples.
 *
 * El header es el único lugar donde se titula la etapa (los contenidos ya no
 * repiten título) y desde aquí se dispara el alta de grupo.
 */
export function LifecycleStepPanel({
  documentTypeId,
  stageType,
  groupCount,
  onClose,
  onRegisterEditor,
  organizationId,
  onSave,
  onDiscard,
  isDirty = false,
  isSaving = false,
}: LifecycleStepPanelProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate("asset_type")

  const [addGroupSignal, setAddGroupSignal] = useState(0)

  const stageLabel = t(`lifecycle.stepTypes.${stageType}`, { defaultValue: stageType })
  const stageAction = t(`lifecycle.stepActions.${stageType}`, { defaultValue: stageType })
  const isGroupable = isGroupableStepType(stageType)

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#fbfcfe]">
      {/* Header — título único de la etapa + descripción en texto plano */}
      <div className="flex shrink-0 items-start justify-between gap-2 border-b border-[#e9edf2] pl-4 pr-4 py-3">
        <div className="flex min-w-0 flex-col gap-0.5">
          <p className="truncate text-[14px] leading-snug">
            <span className="mr-1.5 text-[11px] font-semibold uppercase tracking-wide text-[#94a3b8]">
              {t("lifecycle.panel.stageEyebrow")}
            </span>
            <span className="font-semibold text-[#0f172a]">{stageLabel}</span>
          </p>
          <p className="text-[12px] leading-snug text-[#64748b]">
            {isGroupable
              ? t("lifecycle.panel.stageDescriptionGroups", { action: stageAction })
              : t("lifecycle.panel.stageDescriptionSimple", { action: stageAction })}
          </p>
        </div>
        <PanelIconButton icon={X} label={t("common:close")} onClick={onClose} className="shrink-0" />
      </div>

      {/* Sección de grupos — solo etapas agrupables */}
      {isGroupable && (
        <div className="flex flex-wrap shrink-0 items-center justify-between gap-2 pl-4 pr-4 pt-3 pb-2">
          <PanelSectionLabel label={t("lifecycle.groups")} count={groupCount} />
          {canManage && (
            <button
              type="button"
              onClick={() => setAddGroupSignal((prev) => prev + 1)}
              className="inline-flex h-7.5 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-xl border border-[#bfd3fb] px-2.5 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff]"
            >
              <Plus className="size-3.5" />
              {t("lifecycle.addGroup")}
            </button>
          )}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-hidden pl-4 pr-4 pt-1 pb-3">
        <StepContent
          documentTypeId={documentTypeId}
          stepType={stageType}
          stepLabel={stageLabel}
          onRegisterEditor={onRegisterEditor}
          organizationId={organizationId}
          addGroupSignal={addGroupSignal}
        />
      </div>

      {/* Cuando el contenedor no tiene footer, el guardado del batch de la
          etapa vive acá: el panel existe solo mientras la etapa está abierta,
          que es cuando puede haber cambios pendientes. */}
      {onSave && canManage && (
        <div className="shrink-0 pl-4 pr-4 pb-3">
          <PanelSaveBar
            isDirty={isDirty}
            isSaving={isSaving}
            hintLabel={isGroupable ? t("lifecycle.groupsSaveTogetherHint") : undefined}
            saveLabel={isGroupable ? t("lifecycle.saveGroups") : t("lifecycle.saveChanges")}
            discardLabel={t("common:cancel")}
            onSave={() => onSave()}
            onDiscard={() => onDiscard?.()}
          />
        </div>
      )}
    </div>
  )
}
