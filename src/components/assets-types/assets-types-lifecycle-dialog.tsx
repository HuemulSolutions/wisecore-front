import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Activity } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { useAllLifecycleSteps } from "@/hooks/useLifecycle"
import { isGroupableStepType } from "@/lib/lifecycle-access"
import { CreateStepContent } from "./assets-types-lifecycle-create-step"
import { EditStepContent } from "./assets-types-lifecycle-edit-step"
import { AssetTypeLifecycleMatrix } from "./assets-types-lifecycle-matrix"
import { LifecycleStepPanel } from "./assets-types-lifecycle-step-panel"
import type {
  StepContentProps,
  AssetTypeLifecycleDialogProps,
  LifecycleEditorApi,
  LifecycleSaveApiRef,
} from '@/types/assets'

export type { AssetTypeLifecycleDialogProps } from '@/types/assets'

// Routes to the appropriate sub-component based on stepType. Exportado para que
// el panel lateral de la matriz de permisos por rol (`LifecycleStepPanel`) lo
// reutilice tal cual, sin duplicar el routing por step type.

export function StepContent({
  documentTypeId,
  stepType,
  stepLabel,
  onRegisterEditor,
  organizationId,
  addGroupSignal,
}: StepContentProps) {
  // Etapas con grupos: manejan su propio scroll interno (scrollean las tarjetas).
  if (isGroupableStepType(stepType)) {
    return (
      <EditStepContent
        documentTypeId={documentTypeId}
        stepType={stepType}
        onRegisterEditor={onRegisterEditor}
        organizationId={organizationId}
        addGroupSignal={addGroupSignal}
      />
    )
  }

  // Etapas sin grupos —`view` (y `read`, alias legado), `create`, `publish`,
  // `archive`— comparten `CreateStepContent`: un único step por tipo con
  // permisos simples y guardado batch.
  //
  // No traen contenedor de scroll propio, así que se envuelven para que
  // scrolleen dentro del panel de altura fija en vez de depender del sheet.
  // Mismo patrón que `EditStepContent` (assets-types-lifecycle-edit-step.tsx:844-847):
  // el wrapper `flex h-full min-h-0 flex-col` es lo que le da a `ScrollArea` una
  // altura definida de la que `min-h-0 flex-1` pueda partir — un `ScrollArea` con
  // `h-full` sin ese wrapper directo quedaba resolviendo su altura contra el
  // contenedor del panel en vez de un flex padre propio.
  return (
    <div className="flex h-full min-h-0 flex-col">
      <ScrollArea className="min-h-0 flex-1" viewportClassName="pr-1">
        <CreateStepContent
          documentTypeId={documentTypeId}
          stepType={stepType}
          stepLabel={stepLabel}
          onRegisterEditor={onRegisterEditor}
        />
      </ScrollArea>
    </div>
  )
}

interface AssetTypeLifecyclePanelProps {
  documentTypeId: string
  organizationId?: string
  /** Solo dispara el fetch de steps/roles cuando el panel está visible. */
  enabled?: boolean
  /** Informa al contenedor si la etapa activa tiene cambios sin guardar. */
  onDirtyChange?: (state: { isDirty: boolean; stageLabel: string }) => void
  /** El contenedor publica aquí `save`/`isDirty`/`isSaving` para su footer. */
  saveApiRef?: LifecycleSaveApiRef
  /** Envuelve las acciones que descartarían cambios sin guardar. */
  guardedAction: (action: () => void) => void
  /**
   * Monta el botón «Guardar cambios» en el header del panel de etapa. Solo para
   * contenedores sin footer (`AssetTypeConfigSheet`); el sheet standalone de más
   * abajo lo deja en `false` porque su footer ya trae el botón.
   */
  showSaveButton?: boolean
}

/**
 * Matriz de permisos por rol + panel lateral de configuración. Se monta como
 * tab dentro del sheet de configuración (`AssetTypeConfigSheet`) y también
 * dentro del `AssetTypeLifecycleDialog` que usan las páginas de relaciones.
 *
 * La matriz (`AssetTypeLifecycleMatrix`) lista roles × columnas (un
 * `LifecycleStep` por columna); el selector de etapa —y el engranaje de cada
 * columna— abre el panel lateral (`LifecycleStepPanel`) con los grupos de esa
 * etapa, que reutiliza el router `StepContent` para el detalle (SLA, modo,
 * reglas de acceso).
 *
 * Los controles del panel están siempre editables: los cambios se acumulan en
 * el contenido de la etapa y se persisten con «Guardar cambios», que vive en el
 * header del panel de etapa (`showSaveButton`) o en el footer del sheet
 * contenedor vía la API publicada en `saveApiRef`.
 */
export function AssetTypeLifecyclePanel({
  documentTypeId,
  organizationId,
  enabled = true,
  onDirtyChange,
  saveApiRef,
  guardedAction,
  showSaveButton = false,
}: AssetTypeLifecyclePanelProps) {
  const { t } = useTranslation("asset-types")
  const { data } = useAllLifecycleSteps(documentTypeId, enabled)
  const allSteps = data?.data?.steps ?? []

  const [activeStageType, setActiveStageType] = useState<string | null>(null)
  const [editor, setEditor] = useState<LifecycleEditorApi | null>(null)
  const [isSaving, setIsSaving] = useState(false)

  const handleRegisterEditor = useCallback((api: LifecycleEditorApi | null) => {
    setEditor(api)
  }, [])

  const isDirty = editor?.isDirty ?? false
  const stageLabel = activeStageType
    ? t(`lifecycle.stepTypes.${activeStageType}`, { defaultValue: activeStageType })
    : ""
  const groupCount = activeStageType
    ? allSteps.filter((s) => s.type === activeStageType).length
    : 0

  const save = useCallback(async () => {
    if (!editor) return
    setIsSaving(true)
    try {
      await editor.save()
    } finally {
      setIsSaving(false)
    }
  }, [editor])

  const discard = useCallback(() => {
    editor?.discard()
  }, [editor])

  // Publica la API de guardado hacia el footer del contenedor.
  useEffect(() => {
    if (!saveApiRef) return
    saveApiRef.current = { save, discard, isDirty, isSaving }
    return () => {
      saveApiRef.current = null
    }
  }, [saveApiRef, save, discard, isDirty, isSaving])

  useEffect(() => {
    onDirtyChange?.({ isDirty, stageLabel })
  }, [isDirty, stageLabel, onDirtyChange])

  const handleSelectStage = (stepType: string) => {
    guardedAction(() =>
      setActiveStageType((prev) => (prev === stepType ? null : stepType))
    )
  }

  const handleClosePanel = () => {
    guardedAction(() => setActiveStageType(null))
  }

  return (
    <ResizablePanelGroup direction="horizontal" className="h-full min-h-0">
      <ResizablePanel defaultSize={65} minSize={35} className="flex min-w-0 flex-col">
        <AssetTypeLifecycleMatrix
          documentTypeId={documentTypeId}
          enabled={enabled}
          activeStageType={activeStageType}
          lockedStageType={isDirty ? activeStageType : null}
          onSelectStage={handleSelectStage}
        />
      </ResizablePanel>

      {activeStageType && (
        <>
          <ResizableHandle className="mx-3 bg-[#e9edf2]" />
          <ResizablePanel defaultSize={35} minSize={24} maxSize={55} className="flex min-h-0 flex-col">
            <LifecycleStepPanel
              key={activeStageType}
              documentTypeId={documentTypeId}
              stageType={activeStageType}
              groupCount={groupCount}
              onClose={handleClosePanel}
              onRegisterEditor={handleRegisterEditor}
              organizationId={organizationId}
              onSave={showSaveButton ? save : undefined}
              onDiscard={showSaveButton ? discard : undefined}
              isDirty={isDirty}
              isSaving={isSaving}
            />
          </ResizablePanel>
        </>
      )}
    </ResizablePanelGroup>
  )
}

export default function AssetTypeLifecycleDialog({
  assetType,
  open,
  onOpenChange,
  organizationId,
}: AssetTypeLifecycleDialogProps) {
  const { t } = useTranslation(["asset-types", "common"])

  const [lifecycleState, setLifecycleState] = useState<{
    isDirty: boolean
    stageLabel: string
  }>({ isDirty: false, stageLabel: "" })
  const saveApiRef = useRef<LifecycleSaveApiRef["current"]>(null)

  // Unsaved-changes guard
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const guardedAction = useCallback(
    (action: () => void) => {
      if (lifecycleState.isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [lifecycleState.isDirty]
  )

  const handleGuardedOpenChange = useCallback(
    (open: boolean) => {
      if (!open) {
        guardedAction(() => onOpenChange(false))
      } else {
        onOpenChange(true)
      }
    },
    [guardedAction, onOpenChange]
  )

  // Reset when dialog closes
  useEffect(() => {
    if (!open) {
      setLifecycleState({ isDirty: false, stageLabel: "" })
    }
  }, [open])

  return (
    <>
      <HuemulAlertDialog
        open={showUnsavedAlert}
        onOpenChange={setShowUnsavedAlert}
        title={t("asset-types:lifecycle.unsavedChanges.title")}
        description={t("asset-types:lifecycle.unsavedChanges.description")}
        actionLabel={t("asset-types:lifecycle.unsavedChanges.discard")}
        cancelLabel={t("asset-types:lifecycle.unsavedChanges.keepEditing")}
        actionVariant="destructive"
        onAction={async () => {
          // Primero se limpia el editor y después la acción: si la acción lo
          // desmonta, el `discard()` ya corrió; si no (p. ej. no cambia de
          // etapa), sin esto los cambios sobrevivían al «Descartar».
          saveApiRef.current?.discard()
          pendingActionRef.current?.()
          pendingActionRef.current = null
          setLifecycleState((prev) => ({ ...prev, isDirty: false }))
        }}
      />
      <HuemulSheet
        open={open}
        onOpenChange={handleGuardedOpenChange}
        title={t("asset-types:lifecycle.title")}
        description={assetType?.document_type_name ?? undefined}
        icon={Activity}
        iconVariant="tile"
        size="wide"
        bodyClassName="flex flex-col overflow-hidden py-0 pr-0 [scrollbar-gutter:auto]"
        cancelLabel={t("common:close")}
        footerLeft={
          lifecycleState.isDirty ? (
            <span className="text-[12px] text-[#64748b]">
              {t("asset-types:lifecycle.unsavedInStage", {
                stage: lifecycleState.stageLabel,
              })}
            </span>
          ) : undefined
        }
        saveAction={{
          label: t("asset-types:lifecycle.saveChanges"),
          onClick: () => saveApiRef.current?.save(),
          disabled: !lifecycleState.isDirty,
          closeOnSuccess: false,
        }}
      >
        {assetType && (
          <AssetTypeLifecyclePanel
            key={assetType.document_type_id}
            documentTypeId={assetType.document_type_id}
            organizationId={organizationId}
            enabled={open}
            onDirtyChange={setLifecycleState}
            saveApiRef={saveApiRef}
            guardedAction={guardedAction}
          />
        )}
      </HuemulSheet>
    </>
  )
}
