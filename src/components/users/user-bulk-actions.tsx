import { Button } from "@/components/ui/button"
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog"
import { Trash2 } from "lucide-react"
import { type UseMutationResult } from "@tanstack/react-query"

interface UserBulkActionsProps {
  selectedUsers: Set<string>
  onClearSelection: () => void
  deleteUserMutation: UseMutationResult<any, any, string, unknown>
}

export default function UserBulkActions({
  selectedUsers,
  onClearSelection,
  deleteUserMutation
}: UserBulkActionsProps) {
  const handleBulkDelete = () => {
    selectedUsers.forEach(userId => {
      deleteUserMutation.mutate(userId)
    })
    onClearSelection()
  }

  return (
    <div className="mb-4 p-3 bg-muted/50 rounded-lg flex items-center justify-between">
      <span className="text-sm text-muted-foreground">
        {selectedUsers.size} user(s) selected
      </span>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="destructive" size="sm" className="hover:cursor-pointer">
            <Trash2 className="w-4 h-4 mr-2" />
            Delete Selected
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Users</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedUsers.size} selected user(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}