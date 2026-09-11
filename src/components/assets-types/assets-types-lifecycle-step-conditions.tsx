"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"
import { AlertTriangle, Check, Plus, X } from "lucide-react"
import { HuemulField } from "@/huemul/components/huemul-field"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover"
import { Skeleton } from "@/components/ui/skeleton"
import { PanelCard, PanelDirtyBadge, PanelIconButton, PanelInfoHint, PanelPillButton } from "./assets-types-lifecycle-ui"
import { SectionFormFieldDependencyEditor } from "@/components/sections/section-form-field-dependency-editor"
import { sectionHasValidDependencies } from "@/components/sections/validate-form-field-dependencies"
import { useAllLifecycleSteps, useLifecycleMutations } from "@/hooks/useLifecycle"
import { useDocumentTypeDependencyFields } from "@/hooks/useDocumentTypeDependencyFields"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { handleApiError } from "@/lib/error-utils"
import type { FieldDependencyCondition } from "@/types/sections/core"
import type { LifecycleStep } from "@/types/lifecycle"

/**
 * Tarjeta de condición de UN step: chip + nombre del grupo + botón quitar + el
 * editor de condiciones reusado tal cual del dominio de secciones (mismo dato
 * que `assets-types-template-section-conditions.tsx`, un segundo punto de
 * entrada). El guardado es directo por step — con botón "Guardar" propio en la
 * tarjeta — y no pasa por el batch-save del footer del panel de etapa: es un
 * PATCH parcial (solo `depends_on`), así que no compite con el guardado de
 * SLA/acceso/roles de `EditStepContent`.
 */
function StepConditionCard({
  step,
  fields,
  presenceByFieldId,
  templateNames,
  templateCount,
  canManage,
  documentTypeId,
  onRemoved,
  onRegisterState,
}: {
  step: LifecycleStep
  fields: ReturnType<typeof useDocumentTypeDependencyFields>["fields"]
  presenceByFieldId: ReturnType<typeof useDocumentTypeDependencyFields>["presenceByFieldId"]
  templateNames: ReturnType<typeof useDocumentTypeDependencyFields>["templateNames"]
  templateCount: number
  canManage: boolean
  documentTypeId: string
  onRemoved: (stepId: string) => void
  /**
   * Registro imperativo de esta tarjeta hacia `LifecycleStepConditions` — mismo
   * contrato `{isDirty, discard}` que `onRegisterEditor` del resto del panel
   * (objeto, nunca una función suelta — mismo motivo que `onRegisterRefresh`
   * más abajo). Permite que el guard de descarte del panel de etapa cubra
   * también una condición a medio editar.
   */
  onRegisterState?: (stepId: string, api: { isDirty: boolean; discard: () => void } | null) => void
}) {
  const { t } = useTranslation(["asset-types", "common"])
  const { updateStep } = useLifecycleMutations(documentTypeId, step.type)

  const [conditions, setConditions] = React.useState<FieldDependencyCondition[]>(step.depends_on ?? [])
  const [isDirty, setIsDirty] = React.useState(false)
  const [isRemoving, setIsRemoving] = React.useState(false)

  // Reflejar lo que llegue del servidor (otro editor de esta misma condición, o el
  // refresh de la card) sin pisar una edición sin guardar — mismo criterio que
  // SectionConditionCard: se reacciona al CAMBIO del valor del servidor, no a
  // `isDirty` (si no, el propio `setIsDirty(false)` del guardado exitoso volvería a
  // correr el efecto con el step todavía viejo del caché).
  const serverSnapshot = JSON.stringify(step.depends_on ?? [])
  const lastServerSnapshot = React.useRef(serverSnapshot)
  const isDirtyRef = React.useRef(isDirty)
  isDirtyRef.current = isDirty
  React.useEffect(() => {
    if (serverSnapshot === lastServerSnapshot.current) return
    lastServerSnapshot.current = serverSnapshot
    if (isDirtyRef.current) return
    setConditions(JSON.parse(serverSnapshot) as FieldDependencyCondition[])
  }, [serverSnapshot])

  const handleChange = (nextConditions: FieldDependencyCondition[]) => {
    setConditions(nextConditions)
    setIsDirty(true)
  }

  // Descarta la edición en curso volviendo al último valor conocido del
  // servidor — no recompone a mano, mismo criterio que el resto del panel.
  const discard = React.useCallback(() => {
    setConditions(JSON.parse(lastServerSnapshot.current) as FieldDependencyCondition[])
    setIsDirty(false)
  }, [])

  React.useEffect(() => {
    onRegisterState?.(step.id, { isDirty, discard })
    return () => onRegisterState?.(step.id, null)
  }, [step.id, isDirty, discard, onRegisterState])

  // A diferencia del nivel de sección, acá SÍ hay validación del backend sobre
  // `field_id` (el step vive en el document_type, no arrastra la ambigüedad de
  // "sección anterior"), pero igual no tiene sentido habilitar el guardado con
  // una fila a medio completar: dejaría la etapa inaplicable en silencio hasta
  // que el usuario la termine de configurar.
  const isComplete =
    conditions.every((c) => c.field_id.trim()) && sectionHasValidDependencies(conditions, fields)
  const canSave = canManage && isDirty && isComplete && !updateStep.isPending && !isRemoving

  const handleSave = async () => {
    if (!canSave) return
    try {
      await updateStep.mutateAsync({
        stepId: step.id,
        data: { depends_on: conditions.filter((c) => c.field_id.trim()) },
      })
      setIsDirty(false)
      toast.success(t("lifecycle.conditions.saveSuccess"))
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("lifecycle.conditions.saveError") })
    }
  }

  const [confirmRemoveOpen, setConfirmRemoveOpen] = React.useState(false)

  const handleRemoveClick = () => {
    if (!canManage || isRemoving) return
    // Tarjeta agregada en esta sesión y nunca persistida: se quita en local,
    // sin PATCH ni confirmación — no hay nada guardado que perder.
    if (!step.depends_on?.length && conditions.length === 0) {
      onRemoved(step.id)
      return
    }
    setConfirmRemoveOpen(true)
  }

  const confirmRemove = async () => {
    setIsRemoving(true)
    try {
      await updateStep.mutateAsync({ stepId: step.id, data: { depends_on: [] } })
      setIsDirty(false)
      toast.success(t("lifecycle.conditions.removeSuccess"))
      onRemoved(step.id)
    } catch (error) {
      handleApiError(error, { fallbackMessage: t("lifecycle.conditions.saveError") })
      // Re-lanzar mantiene el `HuemulAlertDialog` abierto en vez de cerrarlo
      // como si hubiera terminado bien — mismo criterio que
      // ia context/danger-zone-sheet-guide.md.
      throw error
    } finally {
      setIsRemoving(false)
    }
  }

  const groupName = step.name?.trim() || t("lifecycle.newGroupName")

  return (
    <PanelCard className="p-3">
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-2">
          <span className="inline-flex h-5 shrink-0 items-center rounded-full bg-[#f3f0ff] px-2 text-[11px] font-medium text-[#6d5ae0]">
            {t("lifecycle.conditions.stepChip")}
          </span>
          <span className="truncate text-[13px] font-medium text-[#0f172a]" title={groupName}>
            {groupName}
          </span>
          {isDirty && <PanelDirtyBadge label={t("lifecycle.conditions.unsaved")} />}
        </div>
        {canManage && (
          <PanelIconButton
            icon={X}
            label={t("lifecycle.conditions.removeBlock", { name: groupName })}
            onClick={handleRemoveClick}
            disabled={isRemoving}
            tone="danger"
          />
        )}
      </div>
      <p className="pt-2 text-[11px] leading-snug text-[#94a3b8]">{t("lifecycle.conditions.stepHint")}</p>
      <div className="pt-2">
        <SectionFormFieldDependencyEditor
          ownFieldId=""
          instanceId={`lifecycle-step-${step.id}`}
          conditions={conditions}
          showWhenInactive={false}
          hideShowWhenInactive
          availableFields={fields}
          fieldWarningFor={(f) => {
            const present = presenceByFieldId.get(f.field_id)?.size ?? 0
            if (present >= templateCount) return undefined
            const missing = Array.from(templateNames.entries())
              .filter(([id]) => !presenceByFieldId.get(f.field_id)?.has(id))
              .map(([, name]) => name)
            return t("lifecycle.conditions.fieldPartial", { templates: missing.join(", ") })
          }}
          onChange={handleChange}
          disabled={!canManage || isRemoving || updateStep.isPending}
        />
      </div>
      {canManage && (
        <div className="flex justify-end pt-2">
          <PanelPillButton
            icon={Check}
            label={updateStep.isPending ? t("common:saving") : t("lifecycle.conditions.saveCondition")}
            onClick={() => void handleSave()}
            disabled={!canSave}
            tone="primary"
          />
        </div>
      )}

      <HuemulAlertDialog
        open={confirmRemoveOpen}
        onOpenChange={setConfirmRemoveOpen}
        title={t("lifecycle.conditions.removeConfirmTitle")}
        description={t("lifecycle.conditions.removeConfirmDescription", { name: groupName })}
        actionLabel={t("lifecycle.conditions.removeBlock", { name: groupName })}
        actionVariant="destructive"
        onAction={confirmRemove}
      />
    </PanelCard>
  )
}

/**
 * Bloque "Condiciones de etapa" dentro de una etapa agrupable (Elaboración,
 * Revisión, Aprobación) del panel de ciclo de vida: lista, por grupo de la
 * etapa, la condición que lo hace inaplicable a una ejecución concreta —
 * `depends_on` de `LifecycleStep`, mismo motor que ya existe para
 * `Section`/`TemplateSection`/`SectionForm`. Un punto de entrada centralizado
 * en vez de tener que editar cada grupo por separado.
 *
 * Persiste al instante por step (PATCH parcial), igual que
 * `TemplateSectionConditions`; no participa del batch-save del footer del
 * panel de etapa. Montado únicamente dentro de `EditStepContent`
 * (`assets-types-lifecycle-edit-step.tsx`), que solo se usa para etapas
 * agrupables — no hace falta filtrar por tipo acá.
 *
 * El picker de campo cruza TODAS las plantillas vinculadas al tipo de
 * activo (`useDocumentTypeDependencyFields`): un `field_id` solo existe
 * de verdad si la plantilla usada para crear el documento lo tiene, así que
 * un campo presente en solo algunas se ofrece igual pero con aviso — ver
 * `fieldWarningFor` arriba.
 */
export function LifecycleStepConditions({
  documentTypeId,
  stepType,
  enabled = true,
  onRegisterRefresh,
  onRegisterEditor,
  focusStepId = null,
}: {
  documentTypeId: string
  stepType: string
  enabled?: boolean
  /** Muestra solo este grupo (engranaje de columna en la matriz). `null` = todos los de la etapa. */
  focusStepId?: string | null
  /** Publica un OBJETO `{refresh}` hacia el header de la card contenedora —
   * mismo patrón que `onRegisterEditor` de `EditStepContent` (que publica
   * `{isDirty, save, discard}`, nunca una función suelta). Es intencional: pasar
   * una función a secas a un setter de `useState` hace que React la interprete
   * como forma funcional de actualización y la EJECUTE de inmediato en vez de
   * guardarla — así se causó el loop infinito de fetches original. Se registra
   * acá (y no en el mount site) porque las dos queries que hay que rehacer
   * (steps + plantillas vinculadas) solo se piden dentro de este componente. */
  onRegisterRefresh?: (api: { refresh: () => void } | null) => void
  /**
   * Agrega el `{isDirty, discard}` de TODAS las `StepConditionCard` sucias —
   * mismo contrato que el resto del panel, para que el guard de descarte de
   * `EditStepContent` cubra también una condición a medio editar.
   */
  onRegisterEditor?: (api: { isDirty: boolean; discard: () => void } | null) => void
}) {
  const { t } = useTranslation(["asset-types", "common"])
  const { canUpdate } = useUserPermissions()
  const canManage = canUpdate("asset_type")

  const {
    data: allStepsData,
    isLoading: isLoadingSteps,
    isError: isErrorSteps,
    refetch: refetchSteps,
  } = useAllLifecycleSteps(documentTypeId, enabled)
  const steps = React.useMemo(
    () =>
      (allStepsData?.data?.steps ?? [])
        .filter((s) => s.type === stepType)
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
    [allStepsData, stepType],
  )

  const {
    fields,
    presenceByFieldId,
    templateNames,
    templateCount,
    isLoading: isLoadingFields,
    isError: isErrorFields,
    refetch: refetchFields,
  } = useDocumentTypeDependencyFields(documentTypeId, enabled)

  // Identidad estable de por vida (deps `[]`): el efecto de registro de abajo
  // corre una sola vez al montar/desmontar, sin importar que `refetchSteps`/
  // `refetchFields` cambien de referencia en cada render — mismo patrón que
  // `saveRef`/`discardRef` en `EditStepContent`. Necesario para no reabrir el
  // loop infinito de fetches (ver comentario de `onRegisterRefresh` arriba).
  const refreshRef = React.useRef<() => void>(() => {})
  refreshRef.current = () => {
    void refetchSteps()
    refetchFields()
  }
  const refreshApi = React.useMemo(() => ({ refresh: () => refreshRef.current() }), [])

  React.useEffect(() => {
    onRegisterRefresh?.(refreshApi)
    return () => onRegisterRefresh?.(null)
  }, [refreshApi, onRegisterRefresh])

  // Tarjetas visibles: arrancan con los steps que ya tienen depends_on, más los
  // que el usuario fue agregando en esta sesión — mismo patrón que
  // TemplateSectionConditions (una tarjeta recién creada con 0 condiciones no
  // sobrevive a un refetch por su cuenta, así que hay que recordarla en local).
  const [addedIds, setAddedIds] = React.useState<Set<string>>(new Set())
  const visibleStepIds = React.useMemo(() => {
    const ids = new Set(addedIds)
    for (const s of steps) {
      if (s.depends_on && s.depends_on.length > 0) ids.add(s.id)
    }
    return ids
  }, [steps, addedIds])

  // Con un grupo enfocado (engranaje de columna en la matriz) el tab queda
  // acotado a ese step: agregarle una condición o quitársela solo lo afecta a él.
  const visibleSteps = steps.filter((s) => visibleStepIds.has(s.id) && (!focusStepId || s.id === focusStepId))
  const addableSteps = steps.filter((s) => !visibleStepIds.has(s.id) && (!focusStepId || s.id === focusStepId))

  const [pickerOpen, setPickerOpen] = React.useState(false)
  const [pickerValue, setPickerValue] = React.useState("")

  const handleAdd = () => {
    if (!pickerValue) return
    setAddedIds((prev) => new Set(prev).add(pickerValue))
    setPickerValue("")
    setPickerOpen(false)
  }

  const handleRemoved = React.useCallback((stepId: string) => {
    setAddedIds((prev) => {
      if (!prev.has(stepId)) return prev
      const next = new Set(prev)
      next.delete(stepId)
      return next
    })
  }, [])

  // Registro agregado de todas las tarjetas — Map en un ref (no state) para no
  // recrear identidad en cada registro individual; el `isDirty` publicado sí
  // es state porque necesita disparar el efecto de abajo hacia el padre.
  const cardStatesRef = React.useRef(new Map<string, { isDirty: boolean; discard: () => void }>())
  const [anyCardDirty, setAnyCardDirty] = React.useState(false)
  const handleRegisterCardState = React.useCallback(
    (stepId: string, api: { isDirty: boolean; discard: () => void } | null) => {
      if (api) cardStatesRef.current.set(stepId, api)
      else cardStatesRef.current.delete(stepId)
      setAnyCardDirty(Array.from(cardStatesRef.current.values()).some((s) => s.isDirty))
    },
    [],
  )
  const discardAllCards = React.useCallback(() => {
    cardStatesRef.current.forEach((api) => {
      if (api.isDirty) api.discard()
    })
  }, [])

  React.useEffect(() => {
    onRegisterEditor?.({ isDirty: anyCardDirty, discard: discardAllCards })
    return () => onRegisterEditor?.(null)
  }, [anyCardDirty, discardAllCards, onRegisterEditor])

  const isLoading = isLoadingSteps || isLoadingFields
  const isError = isErrorSteps || isErrorFields

  if (isLoading) {
    return (
      <div className="flex flex-col gap-2">
        <Skeleton className="h-16 w-full rounded-[10px]" />
        <Skeleton className="h-16 w-full rounded-[10px]" />
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center gap-2 px-1 py-4 text-center">
        <p className="text-[12px] text-[#94a3b8]">{t("lifecycle.conditions.loadError")}</p>
        <PanelPillButton label={t("common:tryAgain")} onClick={() => refreshRef.current()} />
      </div>
    )
  }

  if (steps.length === 0) {
    return <p className="px-1 py-4 text-center text-[12px] text-[#94a3b8]">{t("lifecycle.conditions.noSteps")}</p>
  }

  return (
    <div className="flex flex-col gap-3">
      {templateCount === 0 && (
        <div className="flex items-start gap-2 rounded-[8px] border border-[#fde68a] bg-[#fffbeb] px-3 py-2 text-[12px] leading-snug text-[#92400e]">
          <AlertTriangle className="mt-0.5 size-3.5 shrink-0" />
          {t("lifecycle.conditions.noTemplates")}
        </div>
      )}

      {visibleSteps.length === 0 && (
        <p className="px-1 py-2 text-[12px] text-[#94a3b8]">{t("lifecycle.conditions.noConditionsYet")}</p>
      )}
      {visibleSteps.length > 0 && (
        <PanelInfoHint>{t("lifecycle.conditions.progressGapHint")}</PanelInfoHint>
      )}
      <div className="flex flex-col gap-2">
        {visibleSteps.map((step) => (
          <StepConditionCard
            key={step.id}
            step={step}
            fields={fields}
            presenceByFieldId={presenceByFieldId}
            templateNames={templateNames}
            templateCount={templateCount}
            canManage={canManage}
            documentTypeId={documentTypeId}
            onRemoved={handleRemoved}
            onRegisterState={handleRegisterCardState}
          />
        ))}
      </div>

      {canManage && templateCount > 0 && (
        <Popover open={pickerOpen} onOpenChange={setPickerOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={addableSteps.length === 0}
              title={addableSteps.length === 0 ? t("lifecycle.conditions.noStepsToAdd") : undefined}
              className="inline-flex h-[30px] w-fit items-center gap-1.5 rounded-[8px] border border-dashed border-[#bfd3fb] px-3 text-[12.5px] font-medium text-[#1d4ed8] transition-colors hover:cursor-pointer hover:bg-[#f5f8ff] disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-transparent"
            >
              <Plus className="size-3.5" />
              {t("lifecycle.conditions.addCondition")}
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-72 p-3" align="start">
            <div className="flex flex-col gap-3">
              <span className="text-[12px] font-semibold text-[#334155]">
                {t("lifecycle.conditions.addConditionTitle")}
              </span>
              <HuemulField
                type="combobox"
                label={t("lifecycle.conditions.selectStep")}
                name="lifecycle-step-conditions-new-step"
                value={pickerValue}
                options={addableSteps.map((s) => ({
                  value: s.id,
                  label: s.name?.trim() || t("lifecycle.newGroupName"),
                }))}
                placeholder={t("lifecycle.conditions.selectStepPlaceholder")}
                onChange={(value) => setPickerValue(String(value ?? ""))}
              />
              <button
                type="button"
                disabled={!pickerValue}
                onClick={handleAdd}
                className="inline-flex h-8 items-center justify-center rounded-[8px] bg-[#2563eb] px-3 text-[12.5px] font-medium text-white transition-colors hover:cursor-pointer hover:bg-[#1d4ed8] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {t("lifecycle.conditions.addCondition")}
              </button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </div>
  )
}
