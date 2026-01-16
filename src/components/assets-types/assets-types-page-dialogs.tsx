import { useState } from "react"
import CreateDocumentType from "@/components/assets-types/assets-types-create"
import RolePermissionsDialog from "@/components/roles/roles-permissions-dialog"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { type AssetTypePageState } from "@/types/assets-types"

interface AssetTypePageDialogsProps {
  state: AssetTypePageState
  onCloseDialog: (dialog: keyof AssetTypePageState) => void
  onUpdateState: (updates: Partial<AssetTypePageState>) => void
  assetTypeMutations: ReturnType<typeof useAssetTypeMutations>
}

export default function AssetTypePageDialogs({ 
  state, 
  onCloseDialog, 
  onUpdateState, 
  assetTypeMutations 
}: AssetTypePageDialogsProps) {
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDelete = async () => {
    if (!state.deletingAssetType) return

    setIsDeleting(true)
    const minDelay = new Promise(resolve => setTimeout(resolve, 800))

    try {
      await Promise.all([
        new Promise<void>((resolve, reject) => {
          assetTypeMutations.deleteAssetType.mutate(state.deletingAssetType!.document_type_id, {
            onSuccess: () => resolve(),
            onError: (error) => reject(error)
          })
        }),
        minDelay
      ])
    } finally {
      setIsDeleting(false)
      onCloseDialog('deletingAssetType')
    }
  }

  return (
    <>
      {/* Create/Edit Dialog */}
      <CreateDocumentType
        type="asset"
        documentType={state.editingAssetType}
        open={!!state.editingAssetType || state.showCreateDialog}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('editingAssetType')
            onUpdateState({ showCreateDialog: false })
          }
        }}
        onDocumentTypeCreated={() => {
          onCloseDialog('editingAssetType')
          onUpdateState({ showCreateDialog: false })
        }}
      />

      {/* Delete Asset Type Dialog */}
      <ReusableAlertDialog
        open={!!state.deletingAssetType}
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            onCloseDialog('deletingAssetType')
          }
        }}
        title="Delete Asset Type"
        description={`Are you sure you want to delete the asset type "${state.deletingAssetType?.document_type_name}"? This action cannot be undone and may affect existing assets of this type.`}
        onConfirm={handleDelete}
        confirmLabel="Delete"
        cancelLabel="Cancel"
        isProcessing={isDeleting}
        variant="destructive"
      />

      {/* Role Permissions Dialog */}
      <RolePermissionsDialog
        documentType={state.rolePermissionsAssetType ? {
          id: state.rolePermissionsAssetType.document_type_id,
          name: state.rolePermissionsAssetType.document_type_name,
        } as any : null}
        open={!!state.rolePermissionsAssetType}
        onOpenChange={(open) => {
          if (!open) {
            onCloseDialog('rolePermissionsAssetType')
          }
        }}
      />
    </>
  )
}
