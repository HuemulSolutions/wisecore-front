"use client"

import { useCallback, useEffect, useState } from "react"
import { Plus, RefreshCw, X } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { HuemulButton } from "@/huemul/components/huemul-button"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { isGroupableStepType } from "@/lib/lifecycle-access"
import { StepContent } from "./assets-types-lifecycle-dialog"
import { LifecycleStepConditions } from "./assets-types-lifecycle-step-conditions"
import { PanelBadge, PanelIconButton, PanelSaveBar, PanelSectionLabel, PanelToolbarStrip } from "./assets-types-lifecycle-ui"
import type { LifecycleEditorApi, LifecycleStepPanelProps } from "@/types/assets"

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
 *
 * Solo las etapas agrupables separan el contenido en dos tabs — «Configuración»
 * (grupos: nombre, modo, SLA, acceso, roles) y «Condiciones» (`depends_on` por
 * grupo, `LifecycleStepConditions`) — porque son las únicas que tienen ambas
 * cosas. Cada tab publica su propio editor (`{isDirty, save, discard}` para los
 * grupos; `{isDirty, discard}` para las condiciones, que persisten al instante) y
 * este componente los compone en uno solo hacia el contenedor: así el guard de
 * cambios sin guardar y el botón «Guardar cambios» cubren ambos tabs aunque el
 * usuario esté mirando solo uno. Los dos `TabsContent` quedan montados siempre
 * (`forceMount` + `hidden` por CSS en vez de por desmontaje de Radix) para no
 * perder el registro de una condición a medio editar al cambiar de tab.
 */
export function LifecycleStepPanel({
  documentTypeId,
  stageType,
  groupCount,
  conditionCount = 0,
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

  // ── Composición de los dos editores (solo etapas agrupables) ───────────────
  // `stepEditor` llega desde `StepContent` (grupos, batch-save); `conditionsEditor`
  // y `refreshConditions` desde `LifecycleStepConditions`, montada acá directo
  // (ya no dentro de `EditStepContent`). Mismo contrato de objeto —nunca una
  // función suelta— que documentan ambos componentes.
  const [stepEditor, setStepEditor] = useState<LifecycleEditorApi | null>(null)
  const [conditionsEditor, setConditionsEditor] = useState<{ isDirty: boolean; discard: () => void } | null>(null)
  const [refreshConditions, setRefreshConditions] = useState<{ refresh: () => void } | null>(null)

  const combinedIsDirty = (stepEditor?.isDirty ?? false) || (conditionsEditor?.isDirty ?? false)
  const combinedSave = useCallback(async () => {
    await stepEditor?.save()
  }, [stepEditor])
  const combinedDiscard = useCallback(() => {
    stepEditor?.discard()
    conditionsEditor?.discard()
  }, [stepEditor, conditionsEditor])

  useEffect(() => {
    if (!isGroupable) return
    onRegisterEditor?.({ isDirty: combinedIsDirty, save: combinedSave, discard: combinedDiscard })
    return () => onRegisterEditor?.(null)
  }, [isGroupable, combinedIsDirty, combinedSave, combinedDiscard, onRegisterEditor])

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

      {isGroupable ? (
        <Tabs defaultValue="config" className="flex min-h-0 flex-1 flex-col gap-0">
          <div className="shrink-0 border-b border-[#e9edf2] pl-4 pr-4">
            <TabsList className="h-auto bg-transparent p-0">
              <TabsTrigger
                value="config"
                className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t("lifecycle.panel.tabConfig")}
                <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
                  {groupCount}
                </Badge>
              </TabsTrigger>
              <TabsTrigger
                value="conditions"
                className="gap-1.5 rounded-none border-b-2 border-transparent bg-transparent px-3 py-2 data-[state=active]:border-b-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                {t("lifecycle.panel.tabConditions")}
                {conditionCount > 0 && (
                  <Badge variant="secondary" className="h-5 min-w-5 justify-center rounded-full px-1 text-[11px]">
                    {conditionCount}
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent
            value="config"
            forceMount
            className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
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
            <div className="min-h-0 flex-1 overflow-hidden pl-4 pr-4 pt-1 pb-3">
              <StepContent
                documentTypeId={documentTypeId}
                stepType={stageType}
                stepLabel={stageLabel}
                onRegisterEditor={setStepEditor}
                organizationId={organizationId}
                addGroupSignal={addGroupSignal}
              />
            </div>
          </TabsContent>

          <TabsContent
            value="conditions"
            forceMount
            className="m-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden"
          >
            <div className="flex min-h-0 flex-1 flex-col pl-4 pr-4 pt-3 pb-3">
              <PanelToolbarStrip
                label={t("lifecycle.conditions.title")}
                actions={
                  <>
                    <PanelBadge label={t("templates.instantSaveBadge")} />
                    <HuemulButton
                      variant="ghost"
                      size="icon"
                      className="size-7.5"
                      icon={RefreshCw}
                      tooltip={t("common:refresh")}
                      onClick={() => refreshConditions?.refresh()}
                    />
                  </>
                }
              />
              <p className="pt-1.5 pb-2 text-[12px] leading-snug text-[#64748b]">
                {t("lifecycle.conditions.subtitle")}
              </p>
              <ScrollArea className="min-h-0 flex-1" viewportClassName="pr-1">
                <LifecycleStepConditions
                  documentTypeId={documentTypeId}
                  stepType={stageType}
                  onRegisterRefresh={setRefreshConditions}
                  onRegisterEditor={setConditionsEditor}
                />
              </ScrollArea>
            </div>
          </TabsContent>
        </Tabs>
      ) : (
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
      )}

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
