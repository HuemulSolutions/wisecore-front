import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Shield } from "lucide-react"
import { type User } from "@/types/users"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

interface RootAdminDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (userId: string, isRootAdmin: boolean) => void
  isLoading?: boolean
}

export default function RootAdminDialog({
  user,
  open,
  onOpenChange,
  onConfirm,
  isLoading = false
}: RootAdminDialogProps) {
  const [isRootAdmin, setIsRootAdmin] = useState(false)

  // Reset when dialog opens/closes or user changes
  useEffect(() => {
    if (user && open) {
      setIsRootAdmin(user.is_root_admin || false)
    }
  }, [user, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (user) {
      onConfirm(user.id, isRootAdmin)
    }
  }

  if (!user) return null

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Manage Root Admin Status"
      description={`Configure root admin permissions for ${user.name} ${user.last_name}`}
      icon={Shield}
      maxWidth="md"
      formId="root-admin-form"
      submitLabel="Update Status"
      isSubmitting={isLoading}
      showDefaultFooter
    >
      <form id="root-admin-form" onSubmit={handleSubmit} className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-sm">
            Root administrators have full access to all system features and can manage all organizations and users.
          </AlertDescription>
        </Alert>

        <div className="flex items-center justify-between space-x-4 p-4 border rounded-lg">
          <div className="flex-1 space-y-1">
            <Label htmlFor="root-admin-switch" className="text-sm font-medium">
              Root Administrator
            </Label>
            <p className="text-xs text-muted-foreground">
              Grant or revoke root admin privileges
            </p>
          </div>
          <Switch
            id="root-admin-switch"
            checked={isRootAdmin}
            onCheckedChange={setIsRootAdmin}
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2 text-xs text-muted-foreground">
          <p className="font-medium">Current Status:</p>
          <div className="flex items-center gap-2">
            <Shield className="h-3 w-3" />
            <span>
              {user.is_root_admin ? "Currently a Root Administrator" : "Currently a Regular User"}
            </span>
          </div>
        </div>
      </form>
    </ReusableDialog>
  )
}
