import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"

interface DeleteProviderDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  provider: any | null
  isDeleting: boolean
  onConfirm: () => void
}

export function DeleteProviderDialog({
  open,
  onOpenChange,
  provider,
  isDeleting,
  onConfirm
}: DeleteProviderDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={(open) => {
      if (!open && !isDeleting) {
        onOpenChange(open)
      }
    }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete Provider</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure you want to delete the <strong>{provider?.name}</strong> provider? 
            This will remove all configuration but keep it available for future setup.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <Button
            onClick={(e) => {
              e.preventDefault()
              onConfirm()
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
  )
}