import { useState } from "react"
import CreateDocumentType from "@/components/create_doc_type"
import RolePermissionsDialog from "@/components/role-permissions-dialog"
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { useAssetTypeMutations } from "@/hooks/useAssetTypes"
import { type AssetTypePageState } from "./types"
import { Loader2 } from "lucide-react"

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
      <AlertDialog 
        open={!!state.deletingAssetType} 
        onOpenChange={(open) => {
          if (!open && !isDeleting) {
            onCloseDialog('deletingAssetType')
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Asset Type</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the asset type "{state.deletingAssetType?.document_type_name}"? 
              This action cannot be undone and may affect existing assets of this type.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Cancel
            </AlertDialogCancel>
            <Button
              onClick={(e) => {
                e.preventDefault()
                handleDelete()
              }}
              className="bg-destructive hover:bg-destructive/90 hover:cursor-pointer"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
