import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Activity } from "lucide-react"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useAllLifecycleSteps } from "@/hooks/useLifecycle"
import { AssetTypeLifecycleMatrix } from "./assets-types-lifecycle-matrix"
import { LifecycleStepSheet } from "./assets-types-lifecycle-step-sheet"
import type {
  AssetTypeLifecycleDialogProps,
  LifecycleSaveApi,
  LifecycleSaveApiRef,
  LifecycleStepSheetTarget,
} from '@/types/assets'

export type { AssetTypeLifecycleDialogProps } from '@/types/assets'

interface AssetTypeLifecyclePanelProps {
  documentTypeId: string
  organizationId?: string
  /** Solo dispara el fetch de steps/roles cuando el tab/panel está visible. */
  enabled?: boolean
  /** Informa al contenedor si el sheet de step tiene cambios sin guardar. */
  onDirtyChange?: (state: { isDirty: boolean }) => void
  /** El contenedor publica aquí `save`/`isDirty`/`isSaving` para su propio guard. */
  saveApiRef?: LifecycleSaveApiRef
  /** Envuelve las acciones que descartarían cambios sin guardar del sheet de step. */
  guardedAction: (action: () => void) => void
}

/**
 * Matriz de permisos por rol + sheet mono-entidad de configuración de step.
 * Se monta como tab dentro del sheet de configuración (`AssetTypeConfigSheet`
 * y `asset-type-detail.tsx`) y también dentro del `AssetTypeLifecycleDialog`
 * que usa `document-type-relationships.tsx`.
 *
 * La matriz (`AssetTypeLifecycleMatrix`) lista roles × columnas (un
 * `LifecycleStep` por columna); el engranaje de cada columna, el engranaje
 * del header de una etapa sin grupos, y el «＋» del header de una etapa
 * agrupable abren el sheet lateral (`LifecycleStepSheet`) ya enfocado en esa
 * entidad — nunca en una lista. La pastilla de etapa del toolbar de la
 * matriz solo filtra columnas, no abre nada.
 *
 * El guardado vive enteramente en `LifecycleStepSheet` (footer nativo del
 * `HuemulSheet`); este componente solo necesita saber si hay cambios sin
 * guardar para bloquear la columna que se está editando (`lockedStepId`) y
 * para que el guard de cambios sin guardar del contenedor sepa cuándo
 * confirmar antes de cambiar de tab o cerrar.
 */
export function AssetTypeLifecyclePanel({
  documentTypeId,
  organizationId,
  enabled = true,
  onDirtyChange,
  saveApiRef,
  guardedAction,
}: AssetTypeLifecyclePanelProps) {
  const { data } = useAllLifecycleSteps(documentTypeId, enabled)
  const allSteps = data?.data?.steps ?? []

  const [filterStageType, setFilterStageType] = useState<string | null>(null)
  const [sheetTarget, setSheetTarget] = useState<LifecycleStepSheetTarget | null>(null)
  const [editor, setEditor] = useState<LifecycleSaveApi | null>(null)

  const isDirty = editor?.isDirty ?? false

  const handleRegisterEditor = useCallback((api: LifecycleSaveApi | null) => setEditor(api), [])

  // Publica la API de guardado hacia el footer del contenedor (solo la usa
  // el dialog standalone — el tab de "Permisos por rol" no tiene footer propio).
  useEffect(() => {
    if (!saveApiRef) return
    saveApiRef.current = editor
    return () => {
      saveApiRef.current = null
    }
  }, [saveApiRef, editor])

  useEffect(() => {
    onDirtyChange?.({ isDirty })
  }, [isDirty, onDirtyChange])

  const handleConfigureStep = (step: { id: string }) => {
    guardedAction(() =>
      setSheetTarget((prev) => (prev?.mode === "edit" && prev.stepId === step.id ? null : { mode: "edit", stepId: step.id })),
    )
  }

  const handleConfigureStage = (stepType: string) => {
    guardedAction(() =>
      setSheetTarget((prev) => (prev?.mode === "stage" && prev.stageType === stepType ? null : { mode: "stage", stageType: stepType })),
    )
  }

  const handleCreateGroup = (stepType: string) => {
    guardedAction(() => setSheetTarget({ mode: "create", stageType: stepType }))
  }

  const handleRequestClose = () => {
    guardedAction(() => setSheetTarget(null))
  }

  // Step real detrás del sheet abierto — en modo "edit" es directo; en modo
  // "stage" hay que resolverlo (una etapa simple tiene un único step por
  // tipo); en modo "create" todavía no existe, así que no hay columna que
  // bloquear ni enfocar.
  const targetStepId =
    sheetTarget?.mode === "edit"
      ? sheetTarget.stepId
      : sheetTarget?.mode === "stage"
        ? allSteps.find((s) => s.type === sheetTarget.stageType)?.id ?? null
        : null

  return (
    <div className="flex h-full min-h-0 flex-col">
      <AssetTypeLifecycleMatrix
        documentTypeId={documentTypeId}
        enabled={enabled}
        filterStageType={filterStageType}
        onFilterStage={(type) => setFilterStageType((prev) => (prev === type ? null : type))}
        lockedStepId={isDirty ? targetStepId : null}
        focusedStepId={targetStepId}
        onConfigureStep={handleConfigureStep}
        onConfigureStage={handleConfigureStage}
        onCreateGroup={handleCreateGroup}
      />
      <LifecycleStepSheet
        documentTypeId={documentTypeId}
        organizationId={organizationId}
        target={sheetTarget}
        onTargetChange={setSheetTarget}
        onRequestClose={handleRequestClose}
        onRegisterEditor={handleRegisterEditor}
      />
    </div>
  )
}

export default function AssetTypeLifecycleDialog({
  assetType,
  open,
  onOpenChange,
  organizationId,
}: AssetTypeLifecycleDialogProps) {
  const { t } = useTranslation(["asset-types", "common"])

  const [isDirty, setIsDirty] = useState(false)
  const saveApiRef = useRef<LifecycleSaveApiRef["current"]>(null)

  // Unsaved-changes guard
  const [showUnsavedAlert, setShowUnsavedAlert] = useState(false)
  const pendingActionRef = useRef<(() => void) | null>(null)

  const guardedAction = useCallback(
    (action: () => void) => {
      if (isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [isDirty],
  )

  const handleGuardedOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        guardedAction(() => onOpenChange(false))
      } else {
        onOpenChange(true)
      }
    },
    [guardedAction, onOpenChange],
  )

  // Reset when dialog closes
  useEffect(() => {
    if (!open) setIsDirty(false)
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
          setIsDirty(false)
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
      >
        {assetType && (
          <AssetTypeLifecyclePanel
            key={assetType.document_type_id}
            documentTypeId={assetType.document_type_id}
            organizationId={organizationId}
            enabled={open}
            onDirtyChange={({ isDirty: nextDirty }) => setIsDirty(nextDirty)}
            saveApiRef={saveApiRef}
            guardedAction={guardedAction}
          />
        )}
      </HuemulSheet>
    </>
  )
}
