"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Loader2 } from "lucide-react"

import {
  useAssetTypeGeneralForm,
  AssetTypeGeneralFormFields,
} from "@/components/assets-types/assets-types-general-form"
import { AssetTypeTemplatesPanel } from "@/components/assets-types/assets-types-templates-panel"
import { AssetTypeLifecyclePanel } from "@/components/assets-types/assets-types-lifecycle-dialog"
import { PanelCard } from "@/components/assets-types/assets-types-lifecycle-ui"
import { TagsObjectPicker } from "@/components/tags"
import { cn } from "@/lib/utils"
import type { HuemulDetailSurfaceSaveBar, HuemulDetailSurfaceTab } from "@/types/huemul"
import type {
  AssetTypeConfigTab,
  LifecycleSaveApiRef,
  TemplatesSaveApiRef,
  UseAssetTypeConfigOptions,
} from "@/types/assets"

export type { UseAssetTypeConfigOptions } from "@/types/assets"

/**
 * Estado y contenido de la configuración de un tipo de activo (General, Ciclo
 * de vida, Plantillas), independiente de la superficie que lo muestre.
 *
 * Lo consumen las dos superficies con `HuemulDetailSurface`:
 * - `assets-types-config-sheet.tsx` — el sheet ancho, que sigue abriéndose
 *   desde el canvas del sheet de relaciones.
 * - `pages/asset-type-detail.tsx` — la página con URL propia.
 *
 * Devuelve el array `tabs` ya armado, el descriptor de guardado del tab activo
 * y el guard de cambios sin guardar. `activeTab` es controlado desde afuera: el
 * sheet lo guarda en `useState`, la página en la URL (`useUrlTab`).
 */
export function useAssetTypeConfig({
  documentTypeId,
  organizationId,
  enabled,
  activeTab,
  onTabChange,
  canUpdate,
  canManageTemplates,
  canManageLifecycle,
  canViewTags = false,
  canManageTags = false,
  variant = "sheet",
}: UseAssetTypeConfigOptions) {
  const { t } = useTranslation(["asset-types", "tags", "common"])
  const isPage = variant === "page"

  const availableTabs = React.useMemo<AssetTypeConfigTab[]>(() => {
    const tabs: AssetTypeConfigTab[] = []
    if (canUpdate || canViewTags) tabs.push("general")
    if (canManageLifecycle) tabs.push("lifecycle")
    if (canManageTemplates) tabs.push("templates")
    return tabs
  }, [canUpdate, canViewTags, canManageTemplates, canManageLifecycle])

  // Estado del sheet de step abierto en «Permisos por rol»: alimenta el guard
  // de descarte (cambio de tab / cierre de la superficie).
  const [lifecycleState, setLifecycleState] = React.useState<{ isDirty: boolean }>({ isDirty: false })
  const lifecycleSaveApiRef = React.useRef<LifecycleSaveApiRef["current"]>(null)
  // Estado de guardado del tab «Plantillas», hermano del de lifecycle.
  const [templatesState, setTemplatesState] = React.useState<{ isDirty: boolean }>({ isDirty: false })
  const templatesSaveApiRef = React.useRef<TemplatesSaveApiRef["current"]>(null)

  // Unsaved-changes guard (compartido entre cambio de tab y cierre/navegación)
  const [showUnsavedAlert, setShowUnsavedAlert] = React.useState(false)
  const pendingActionRef = React.useRef<(() => void) | null>(null)

  const form = useAssetTypeGeneralForm({
    documentTypeId: documentTypeId || undefined,
    type: "asset",
    enabled: enabled && canUpdate && !!documentTypeId,
  })

  // Al deshabilitarse (el sheet al cerrar) vuelve al primer tab disponible y
  // limpia el formulario para que la próxima apertura no arrastre estado de
  // otro tipo de activo. En la página `enabled` es siempre `true`: ahí el
  // desmontaje lo hace el router y este efecto no dispara.
  React.useEffect(() => {
    if (enabled) return
    setLifecycleState({ isDirty: false })
    setTemplatesState({ isDirty: false })
    form.reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled])

  const discardPending = React.useCallback(() => {
    // Primero se limpia el editor y después se ejecuta la acción: si la acción
    // lo desmonta, el `discard()` ya corrió; si NO lo desmonta (cambio de tab
    // con el panel vivo), sin esto los cambios sobrevivían al «Descartar».
    lifecycleSaveApiRef.current?.discard()
    templatesSaveApiRef.current?.discard()
    pendingActionRef.current?.()
    pendingActionRef.current = null
    setLifecycleState((prev) => ({ ...prev, isDirty: false }))
    setTemplatesState({ isDirty: false })
    form.discard()
  }, [form])

  // Guard del panel de lifecycle: solo mira los cambios sin guardar de su propia etapa.
  const lifecycleGuardedAction = React.useCallback(
    (action: () => void) => {
      if (lifecycleState.isDirty) {
        pendingActionRef.current = action
        setShowUnsavedAlert(true)
      } else {
        action()
      }
    },
    [lifecycleState.isDirty],
  )

  const isDirty = lifecycleState.isDirty || templatesState.isDirty || form.isDirty

  // Guard de la superficie: mira los cambios pendientes de cualquier tab.
  const guardedAction = React.useCallback(
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

  const handleTabChange = React.useCallback(
    (value: string) => {
      guardedAction(() => onTabChange(value as AssetTypeConfigTab))
    },
    [guardedAction, onTabChange],
  )

  // ── Contenido de cada tab ────────────────────────────────────────────────
  // Sin `useMemo`: el contenido depende de `form`, que cambia en cada render,
  // así que memoizar solo agregaría una lista de dependencias que nunca acierta
  // (el sheet original también construía este JSX inline en cada render).
  const tagsBlock = canViewTags && documentTypeId && (
    <div>
      <p className="text-sm font-medium leading-snug mb-1.5">{t("tags:assign.assignedLabel")}</p>
      <TagsObjectPicker
        objectType="document_type"
        objectIds={[documentTypeId]}
        variant="field"
        canView={enabled && activeTab === "general" && canViewTags}
        canAssign={canManageTags}
      />
    </div>
  )

  // El padding lateral lo aporta el tab (no el contenedor) porque en el sheet
  // la barra de tabs cancela el padding del body con `-mx-6`.
  const pad = isPage ? "px-4 md:px-6" : "px-6"
  const tabs: HuemulDetailSurfaceTab[] = []

  if (availableTabs.includes("general")) {
    tabs.push({
      value: "general",
      label: t("asset-types:config.tabs.general"),
      className: cn("flex-1 overflow-y-auto bg-[#fbfcfe] pt-4 pb-4 mt-0", pad),
      // Sin límite: el grid de dos columnas de `AssetTypeGeneralFormFields` ya
      // reparte el ancho en mitades (Identidad a la izquierda del centro,
      // Versionado a la derecha).
      contentWidth: "full",
      content: (
        <div>
          {!canUpdate ? (
            tagsBlock ? (
              <PanelCard className="p-4">{tagsBlock}</PanelCard>
            ) : null
          ) : form.isLoadingData ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <AssetTypeGeneralFormFields
              form={form}
              type="asset"
              variant="cards"
              identityExtra={tagsBlock || undefined}
            />
          )}
        </div>
      ),
    })
  }

  if (availableTabs.includes("lifecycle")) {
    tabs.push({
      value: "lifecycle",
      label: t("asset-types:config.tabs.lifecycle"),
      className: cn(
        "flex-1 min-h-0 overflow-hidden bg-[#fbfcfe] pt-2 pb-0 mt-0 data-[state=active]:flex data-[state=active]:flex-col",
        pad,
      ),
      // Sin límite: la matriz de permisos por rol necesita todo el ancho. Y su
      // contenido cuenta con ser hijo flex directo del TabsContent, así que un
      // wrapper de ancho acá además le rompería el layout.
      contentWidth: "full",
      content: (
        <AssetTypeLifecyclePanel
          key={documentTypeId}
          documentTypeId={documentTypeId}
          organizationId={organizationId}
          enabled={enabled && activeTab === "lifecycle"}
          onDirtyChange={setLifecycleState}
          saveApiRef={lifecycleSaveApiRef}
          guardedAction={lifecycleGuardedAction}
        />
      ),
    })
  }

  if (availableTabs.includes("templates")) {
    tabs.push({
      value: "templates",
      label: t("asset-types:config.tabs.templates"),
      className: cn("flex-1 overflow-y-auto bg-[#fbfcfe] pt-4 pb-4 mt-0", pad),
      // Sin límite: el panel reparte su lista en un grid de dos columnas
      // (vincular a la izquierda, vinculadas a la derecha), y su vista de
      // detalle necesita todo el ancho para la matriz de permisos.
      contentWidth: "full",
      content: (
        <AssetTypeTemplatesPanel
          key={documentTypeId}
          documentTypeId={documentTypeId}
          enabled={enabled && activeTab === "templates"}
          onDirtyChange={setTemplatesState}
          saveApiRef={templatesSaveApiRef}
        />
      ),
    })
  }

  // ── Descriptor de guardado del tab activo ────────────────────────────────
  // «Permisos por rol» no tiene zona de guardado propia: el panel de etapa se
  // abre como sheet anidado con su propio footer.
  let saveBar: HuemulDetailSurfaceSaveBar | undefined

  if (activeTab === "general" && canUpdate) {
    saveBar = {
      isDirty: form.isDirty,
      canSave: form.canSubmit && !form.isLoadingData,
      dirtyLabel: t("asset-types:form.unsavedChanges"),
      saveLabel: t("common:save"),
      discardLabel: t("asset-types:lifecycle.unsavedChanges.discard"),
      onSave: () => form.submit(),
      onDiscard: () => form.discard(),
    }
  } else if (activeTab === "templates" && canManageTemplates) {
    saveBar = {
      isDirty: templatesState.isDirty,
      canSave: templatesState.isDirty,
      dirtyLabel: t("asset-types:templates.unsavedChanges"),
      saveLabel: t("asset-types:lifecycle.saveChanges"),
      discardLabel: t("asset-types:lifecycle.unsavedChanges.discard"),
      onSave: () => templatesSaveApiRef.current?.save(),
      onDiscard: () => templatesSaveApiRef.current?.discard(),
    }
  }

  return {
    availableTabs,
    tabs,
    saveBar,
    isDirty,
    /** Envuelve una navegación/cierre en el guard de cambios sin guardar. */
    guardedAction,
    /** Para el `onTabChange` de `HuemulDetailSurface`: ya viene guardado. */
    handleTabChange,
    unsavedAlert: {
      open: showUnsavedAlert,
      setOpen: setShowUnsavedAlert,
      discard: discardPending,
    },
  }
}
