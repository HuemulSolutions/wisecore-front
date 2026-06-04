"use client"

import { useState } from "react"
import { useTranslation } from "react-i18next"
import { GitMerge, Edit2, Activity, Copy, Trash2 } from "lucide-react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { RelationshipsCanvas } from "@/components/document-type-relationships"
import { HuemulAlertDialog } from "@/huemul/components/huemul-alert-dialog"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import AssetTypeLifecycleDialog from "@/components/assets-types/assets-types-lifecycle-dialog"
import { useDocumentTypes } from "@/hooks/useDocumentTypes"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { useOrganization } from "@/contexts/organization-context"
import type { AssetTypeWithRoles } from "@/services/asset-types"
import type { CanvasNodeAction } from "@/types/document-type-relationships"

interface AssetTypeRelationshipsSheetProps {
  assetType: AssetTypeWithRoles | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

/** Build a minimal AssetTypeWithRoles from canvas node data (id + name + color). */
function toMinimalAssetType(
  id: string,
  name: string,
  color: string,
): AssetTypeWithRoles {
  return {
    document_type_id: id,
    document_type_name: name,
    document_type_color: color,
    document_type_created_date: "",
    document_count: 0,
    roles: [],
  }
}

export function AssetTypeRelationshipsSheet({
  assetType,
  open,
  onOpenChange,
}: AssetTypeRelationshipsSheetProps) {
  const { t } = useTranslation(["asset-types", "common"])
  const { selectedOrganizationId } = useOrganization()
  const { data: docTypesResponse } = useDocumentTypes()
  const documentTypes = docTypesResponse?.data ?? []
  const mutations = useAssetTypeMutations()

  // Dialog state for actions triggered from the node panel
  const [editingAssetType, setEditingAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [lifecycleAssetType, setLifecycleAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [cloningAssetType, setCloningAssetType] = useState<AssetTypeWithRoles | null>(null)
  const [deletingAssetType, setDeletingAssetType] = useState<AssetTypeWithRoles | null>(null)

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
    {
      key: "edit",
      label: t("asset-types:actions.editAssetType"),
      icon: Edit2,
      onClick: (nodeId) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setEditingAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
    },
    {
      key: "lifecycle",
      label: t("asset-types:actions.lifecycle"),
      icon: Activity,
      onClick: (nodeId) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setLifecycleAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
    },
    {
      key: "clone",
      label: t("asset-types:actions.cloneAssetType"),
      icon: Copy,
      onClick: (nodeId) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setCloningAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
    },
    {
      key: "delete",
      label: t("asset-types:actions.deleteAssetType"),
      icon: Trash2,
      onClick: (nodeId) => {
        const node = documentTypes.find((d) => d.id === nodeId)
        setDeletingAssetType(toMinimalAssetType(nodeId, node?.name ?? nodeId, node?.color ?? "#94a3b8"))
      },
      destructive: true,
      separator: true,
    },
  ]

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent
          side="right"
          className="sm:max-w-4xl w-full flex flex-col p-0 gap-0"
        >
          <SheetHeader className="px-6 py-4 border-b shrink-0">
            <SheetTitle className="flex items-center gap-2 text-sm font-semibold">
              <GitMerge className="h-4 w-4 text-muted-foreground" />
              {t("asset-types:actions.viewRelationships")}
              {assetType && (
                <span className="text-muted-foreground font-normal">
                  — {assetType.document_type_name}
                </span>
              )}
            </SheetTitle>
          </SheetHeader>

          <div className="flex-1 min-h-0 overflow-hidden">
            {open && assetType && selectedOrganizationId && (
              <RelationshipsCanvas
                key={assetType.document_type_id}
                organizationId={selectedOrganizationId}
                documentTypes={documentTypes}
                initialDocumentTypeId={assetType.document_type_id}
                nodeActions={nodeActions}
              />
            )}
          </div>
        </SheetContent>
      </Sheet>

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
