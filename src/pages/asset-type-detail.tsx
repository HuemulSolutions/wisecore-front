import { useCallback, useEffect, useState } from "react"
import { useParams } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { Settings2 } from "lucide-react"

import { AssetTypePageSkeleton, AssetTypePageEmptyState, useAssetTypeConfig } from "@/components/assets-types"
import { useOptionalEditingGuard } from "@/contexts/editing-guard-context"
import { useOrganization } from "@/contexts/organization-context"
import { useOrgNavigate } from "@/hooks/useOrgRouter"
import { usePageAccess } from "@/hooks/usePageAccess"
import { useUrlTab } from "@/hooks/useUrlTab"
import { assetTypeQueryKeys } from "@/hooks/useAssetTypes"
import { lifecycleQueryKeys } from "@/hooks/useLifecycle"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { HuemulDetailSurface } from "@/huemul/components/huemul-detail-surface"
import { getDocumentTypeById } from "@/services/document-types"
import type { AssetTypeConfigTab } from "@/types/assets"

const CONFIG_TABS: readonly AssetTypeConfigTab[] = ["general", "lifecycle", "templates"]

/**
 * Página de detalle de un tipo de activo: la misma configuración que muestra
 * `AssetTypeConfigSheet`, pero con URL propia (`/asset-types/:documentTypeId`)
 * para poder compartirla y sobrevivir a un refresh.
 *
 * El contenido y el estado salen de `useAssetTypeConfig`, y el chrome de
 * `HuemulDetailSurface variant="page"` — el sheet usa exactamente las mismas
 * dos piezas con `variant="sheet"`.
 */
export default function AssetTypeDetailPage() {
  const { documentTypeId } = useParams<{ documentTypeId: string }>()
  const { t } = useTranslation(["asset-types", "common"])
  const navigate = useOrgNavigate()
  const queryClient = useQueryClient()
  const { selectedOrganizationId } = useOrganization()
  const { setIsSectionEditing } = useOptionalEditingGuard()

  const { canAccessPage, can, isLoading: isLoadingPermissions } = usePageAccess("asset-types")
  const canUpdate = can("updateAssetType")
  const canManageTemplates = can("manageLinkedTemplates")
  const canManageLifecycle = can("manageLifecycle")
  const canViewTags = can("viewTags")
  const canManageTags = can("manageTags")

  // Los tabs disponibles dependen de permisos, así que el tab de la URL se
  // normaliza — pero solo una vez que los permisos resolvieron, para no
  // reescribirlo en el primer render.
  const availableTabs = CONFIG_TABS.filter((tab) => {
    if (tab === "general") return canUpdate || canViewTags
    if (tab === "lifecycle") return canManageLifecycle
    return canManageTemplates
  })

  const { tab, setTab } = useUrlTab({
    tabs: availableTabs,
    ready: !isLoadingPermissions,
    normalize: true,
  })

  const { data: documentTypeData, isFetching } = useQuery({
    // Misma query key que `assets-types-general-form` y el editor de etapas del
    // ciclo de vida: comparten cache, no se duplica el fetch.
    queryKey: ["document-type", documentTypeId],
    queryFn: () => getDocumentTypeById(documentTypeId ?? ""),
    enabled: !!documentTypeId,
  })
  const assetType = documentTypeData?.data

  const config = useAssetTypeConfig({
    documentTypeId: documentTypeId ?? "",
    organizationId: selectedOrganizationId ?? "",
    enabled: true,
    activeTab: tab,
    onTabChange: setTab,
    canUpdate,
    canManageTemplates,
    canManageLifecycle,
    canViewTags,
    canManageTags,
    variant: "page",
  })

  // Publica el estado sucio al guard global: cubre el nav lateral
  // (`GuardedNavLink`) y el cierre/refresh de la pestaña (`beforeunload`).
  // El repo usa `BrowserRouter`, así que `useBlocker` no está disponible.
  useEffect(() => {
    setIsSectionEditing(config.isDirty)
    return () => setIsSectionEditing(false)
  }, [config.isDirty, setIsSectionEditing])

  const handleBack = useCallback(() => {
    config.guardedAction(() => navigate("/asset-types"))
  }, [config, navigate])

  const [isRefreshing, setIsRefreshing] = useState(false)
  const handleRefresh = useCallback(async () => {
    if (!documentTypeId) return
    setIsRefreshing(true)
    try {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["document-type", documentTypeId] }),
        queryClient.invalidateQueries({
          queryKey: lifecycleQueryKeys.stepsByDocumentType(documentTypeId),
        }),
        queryClient.invalidateQueries({
          queryKey: assetTypeQueryKeys.templates(documentTypeId),
        }),
      ])
    } finally {
      setIsRefreshing(false)
    }
  }, [queryClient, documentTypeId])

  if (isLoadingPermissions) {
    return <AssetTypePageSkeleton />
  }

  // Sin acceso a la página, sin id en la ruta, o con acceso de lectura pero sin
  // ningún tab habilitado: no hay nada que mostrar acá.
  if (!canAccessPage || !documentTypeId || availableTabs.length === 0) {
    return <AssetTypePageEmptyState type="access-denied" />
  }

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
        variant="page"
        icon={Settings2}
        title={t("asset-types:config.title")}
        subtitle={
          assetType ? (
            <span className="inline-flex items-center gap-1.5">
              <span
                className="size-2 shrink-0 rounded-full"
                style={{ backgroundColor: assetType.color }}
              />
              <span className="truncate">{assetType.name}</span>
            </span>
          ) : undefined
        }
        backAction={{ label: t("asset-types:config.backToList"), onClick: handleBack }}
        onRefresh={handleRefresh}
        isRefreshing={isRefreshing || isFetching}
        tabs={config.tabs}
        activeTab={tab}
        onTabChange={config.handleTabChange}
        saveBar={config.saveBar}
      />
    </>
  )
}
