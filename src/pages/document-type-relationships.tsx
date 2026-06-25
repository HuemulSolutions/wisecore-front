"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { GitMerge, Edit2, Activity, Copy, Trash2 } from "lucide-react"
import { useOrganization } from "@/contexts/organization-context"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import { useUserPermissions } from "@/hooks/useUserPermissions"
import { AssetTypePageEmptyState } from "@/components/assets-types"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { AssetTypeSidebar, RelationshipsCanvas } from "@/components/document-type-relationships"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import AssetTypeLifecycleDialog from "@/components/assets-types/assets-types-lifecycle-dialog"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import { PageSkeleton } from "@/components/ui/page-skeleton"
import { HuemulPageLayout } from "@/huemul/components/huemul-page-layout"
import { HuemulPagination } from "@/huemul/components/huemul-pagination"
import { HuemulField } from "@/huemul/components/huemul-field"
import type { AssetTypeWithRoles } from "@/services/asset-types"
import type { CanvasNodeAction } from "@/types/document-type-relationships"

const DEFAULT_PAGE_SIZE = 100

function toMinimalAssetType(id: string, name: string, color: string): AssetTypeWithRoles {
  return {
    document_type_id: id,
    document_type_name: name,
    document_type_color: color,
    document_type_created_date: "",
    document_count: 0,
    roles: [],
  }
}

export default function DocumentTypeRelationshipsPage() {
  const { t } = useTranslation(["document-type-relationships", "asset-types", "common"])
  const { selectedOrganizationId } = useOrganization()

  // Permissions
  const { isRootAdmin, hasPermission, hasAnyPermission, isLoading: isLoadingPermissions } = useUserPermissions()
  const canListDocumentTypes = isRootAdmin || hasAnyPermission(['asset_type:l', 'asset_type:r'])
  const canCreateDocumentType = isRootAdmin || hasPermission('asset_type:c')
  const canUpdateDocumentType = isRootAdmin || hasPermission('asset_type:u')
  const canDeleteDocumentType = isRootAdmin || hasPermission('asset_type:d')

  // Search input (typed) vs committed search (sent to API on Enter)
  const [searchInput, setSearchInput] = useState("")
  const [search, setSearch] = useState("")

  const { data: docTypesResponse, isLoading, isFetching, refetch } = useDocumentTypes({ search, enabled: canListDocumentTypes })
  const documentTypes = docTypesResponse?.data ?? []
  const mutations = useAssetTypeMutations()

  // Pagination state
  const [page, setPage] = useState(1)
  const pageSize = DEFAULT_PAGE_SIZE

  // Node action dialog state
  const [editingAssetType, setEditingAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [lifecycleAssetType, setLifecycleAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [cloningAssetType, setCloningAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [deletingAssetType, setDeletingAssetType] = useState<AssetTypeWithRoles | null>(null)

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSearch(searchInput)
    setPage(1)
  }

  const handleClone = async () => {
    if (!cloningAssetType) return
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800))
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        mutations.cloneAssetType.mutate(cloningAssetType.document_type_id, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        })
      }),
      minDelay,
    ])
  }

  const handleDelete = async () => {
    if (!deletingAssetType) return
    const minDelay = new Promise((resolve) => setTimeout(resolve, 800))
    await Promise.all([
      new Promise<void>((resolve, reject) => {
        mutations.deleteAssetType.mutate(deletingAssetType.document_type_id, {
          onSuccess: () => resolve(),
          onError: (err) => reject(err),
        })
      }),
      minDelay,
    ])
  }

  const nodeActions: CanvasNodeAction[] = [
    ...(canUpdateDocumentType ? [{
      key: "edit",
      label: t("asset-types:actions.editAssetType"),
      icon: Edit2,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setEditingAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
    }] : []),
    ...(canUpdateDocumentType ? [{
      key: "lifecycle",
      label: t("asset-types:actions.lifecycle"),
      icon: Activity,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setLifecycleAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
    }] : []),
    ...(canCreateDocumentType ? [{
      key: "clone",
      label: t("asset-types:actions.cloneAssetType"),
      icon: Copy,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setCloningAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
    }] : []),
    ...(canDeleteDocumentType ? [{
      key: "delete",
      label: t("asset-types:actions.deleteAssetType"),
      icon: Trash2,
      onClick: (nodeId: string) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setDeletingAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
      destructive: true,
      separator: true,
    }] : []),
  ]

  const totalItems = documentTypes.length
  const hasNext = page * pageSize < totalItems
  const hasPrevious = page > 1

  if (isLoadingPermissions) return <PageSkeleton />
  if (!canListDocumentTypes) return <AssetTypePageEmptyState type="access-denied" />

  if (isLoading && !docTypesResponse) return <PageSkeleton />

  return (
    <>
      <HuemulPageLayout
        header={
          <div className="flex items-center gap-3 px-6 py-4">
            <GitMerge className="h-5 w-5 text-muted-foreground" />
            <div>
              <h1 className="text-base font-semibold">{t("document-type-relationships:header.title")}</h1>
              <p className="text-xs text-muted-foreground">{t("document-type-relationships:header.subtitle")}</p>
            </div>
          </div>
        }
        columns={[
          {
            header: {
              content: (
                <div className="px-3 py-2 border-b bg-muted/20">
                  <form onSubmit={handleSearchSubmit}>
                    <HuemulField
                      type="text"
                      value={searchInput}
                      onChange={(v) => setSearchInput(v as string)}
                      placeholder={t("document-type-relationships:header.searchPlaceholder")}
                      className="gap-0"
                      inputClassName="h-8 text-xs"
                    />
                  </form>
                </div>
              ),
            },
            content: (
              <AssetTypeSidebar
                items={documentTypes}
                isLoading={isLoading}
                isFetching={isFetching}
                page={page}
                pageSize={pageSize}
                onRefresh={refetch}
              />
            ),
            defaultSize: 20,
            minSize: 15,
            maxSize: 35,
            className: "overflow-hidden",
            footer: {
              content: (
                <HuemulPagination
                  page={page}
                  pageSize={pageSize}
                  hasNext={hasNext}
                  hasPrevious={hasPrevious}
                  onPageChange={setPage}
                />
              ),
            },
          },
          {
            content: (
              <RelationshipsCanvas
                organizationId={selectedOrganizationId ?? ""}
                documentTypes={documentTypes}
                nodeActions={nodeActions}
              />
            ),
            defaultSize: 80,
            minSize: 50,
            className: "overflow-hidden",
          },
        ]}
      />

      {/* Edit dialog */}
      <CreateDocumentType
        type="asset"
        documentType={editingAssetType}
        open={!!editingAssetType}
        onOpenChange={(o) => { if (!o) setEditingAssetType(null) }}
        onDocumentTypeCreated={() => setEditingAssetType(null)}
      />

      {/* Lifecycle dialog */}
      <AssetTypeLifecycleDialog
        assetType={lifecycleAssetType}
        open={!!lifecycleAssetType}
        onOpenChange={(o) => { if (!o) setLifecycleAssetType(null) }}
        organizationId={selectedOrganizationId ?? ""}
      />

      {/* Clone confirmation */}
      <HuemulAlertDialog
        open={!!cloningAssetType}
        onOpenChange={(o) => { if (!o) setCloningAssetType(null) }}
        title={t("asset-types:clone.title")}
        description={t("asset-types:clone.description", { name: cloningAssetType?.document_type_name })}
        onAction={handleClone}
        actionLabel={t("asset-types:clone.confirm")}
        cancelLabel={t("common:cancel")}
      />

      {/* Delete confirmation */}
      <HuemulAlertDialog
        open={!!deletingAssetType}
        onOpenChange={(o) => { if (!o) setDeletingAssetType(null) }}
        title={t("asset-types:delete.title")}
        description={t("asset-types:delete.description", { name: deletingAssetType?.document_type_name })}
        onAction={handleDelete}
        actionLabel={t("common:delete")}
        cancelLabel={t("common:cancel")}
        actionVariant="destructive"
      />
    </>
  )
}
