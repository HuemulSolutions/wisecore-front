"use client"

import * as React from "react"
import { useTranslation } from "react-i18next"
import { Settings2 } from "lucide-react"

import { HuemulDetailSurface } from "@/huemul/components/huemul-detail-surface"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { useAssetTypeConfig } from "@/components/assets-types/assets-types-config-content"
import type { AssetTypeConfigSheetProps, AssetTypeConfigTab } from "@/types/assets"

export type { AssetTypeConfigSheetProps } from "@/types/assets"

/**
 * Sheet ancho con toda la configuración de un tipo de activo: datos generales,
 * plantillas vinculadas y ciclo de vida. Cada tab se monta solo si el usuario
 * tiene el permiso correspondiente.
 *
 * El estado y el contenido viven en `useAssetTypeConfig`, compartidos con la
 * página `pages/asset-type-detail.tsx`; este archivo solo elige la superficie.
 * Se conserva como sheet para el canvas de `assets-types-relationships-sheet`,
 * donde navegar a la página perdería el contexto del grafo.
 */
export function AssetTypeConfigSheet({
  assetType,
  open,
  onOpenChange,
  organizationId,
  canUpdate,
  canManageTemplates,
  canManageLifecycle,
  canViewTags = false,
  canManageTags = false,
}: AssetTypeConfigSheetProps) {
  const { t } = useTranslation(["asset-types", "common"])

  const documentTypeId = assetType?.document_type_id ?? ""

  const [activeTab, setActiveTab] = React.useState<AssetTypeConfigTab>("general")

  const config = useAssetTypeConfig({
    documentTypeId,
    organizationId,
    enabled: open,
    activeTab,
    onTabChange: setActiveTab,
    canUpdate,
    canManageTemplates,
    canManageLifecycle,
    canViewTags,
    canManageTags,
    variant: "sheet",
  })

  // Al cerrar, vuelve al primer tab disponible (el reset del resto del estado
  // lo hace el propio hook cuando `enabled` pasa a false).
  React.useEffect(() => {
    if (open) return
    setActiveTab(config.availableTabs[0] ?? "general")
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // El tab activo puede quedar fuera de los disponibles si cambian los permisos
  // entre aperturas: caer al primero evita un sheet sin contenido visible.
  const effectiveTab = config.availableTabs.includes(activeTab)
    ? activeTab
    : (config.availableTabs[0] ?? activeTab)

  const handleGuardedOpenChange = React.useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) {
        config.guardedAction(() => onOpenChange(false))
      } else {
        onOpenChange(true)
      }
    },
    [config, onOpenChange],
  )

  return (
    <>
      <HuemulAlertDialog
        open={config.unsavedAlert.open}
        onOpenChange={config.unsavedAlert.setOpen}
        title={t("asset-types:lifecycle.unsavedChanges.title")}
        description={t("asset-types:lifecycle.unsavedChanges.description")}
        actionLabel={t("asset-types:lifecycle.unsavedChanges.discard")}
        cancelLabel={t("asset-types:lifecycle.unsavedChanges.keepEditing")}
        actionVariant="destructive"
        onAction={async () => config.unsavedAlert.discard()}
      />

      <HuemulDetailSurface
        variant="sheet"
        open={open}
        onOpenChange={handleGuardedOpenChange}
        icon={Settings2}
        title={t("asset-types:config.title")}
        subtitle={
          assetType ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: assetType.document_type_color }}
              />
              <span className="truncate">{assetType.document_type_name}</span>
            </span>
          ) : undefined
        }
        size="wide"
        closeLabel={t("common:close")}
        tabs={assetType ? config.tabs : undefined}
        activeTab={effectiveTab}
        onTabChange={config.handleTabChange}
        saveBar={config.saveBar}
      />
    </>
  )
}
