export interface ImportAssetFromFileDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  folderId?: string
  onAssetCreated?: (asset: { id: string; name: string; type: string }) => void
}
