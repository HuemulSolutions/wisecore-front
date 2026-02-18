import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Shield, User, Crown, UserPlus } from "lucide-react"
import { useOrganizationUsers, useSetOrganizationAdmin } from "@/hooks/useOrganizations"
import type { Organization } from "./organization-table"

interface SetOrganizationAdminDialogProps {
  organization: Organization | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export function SetOrganizationAdminDialog({
  organization,
  open,
  onOpenChange,
  onSuccess,
}: SetOrganizationAdminDialogProps) {
  const [selectedUserId, setSelectedUserId] = useState<string>("")

  const { data: usersResponse, isLoading, error } = useOrganizationUsers(
    open ? organization?.id : undefined
  )

  const setAdminMutation = useSetOrganizationAdmin()

  // Reset selection when dialog opens/closes or organization changes
  useEffect(() => {
    if (open) {
      setSelectedUserId("")
    }
  }, [open, organization?.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!organization?.id || !selectedUserId) return

    setAdminMutation.mutate(
      { organizationId: organization.id, userId: selectedUserId },
      {
        onSuccess: () => {
          onSuccess?.()
          onOpenChange(false)
        },
      }
    )
  }

  if (!organization) return null

  const users = usersResponse?.data || []
  
  // Separate users into admins and non-admins
  const currentAdmins = users.filter(user => user.is_org_admin)
  const availableUsers = users.filter(user => !user.is_org_admin)

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Set Organization Admin"
      description={`Manage administrators for "${organization.name}".`}
      icon={Shield}
      maxWidth="md"
      maxHeight="90vh"
      showDefaultFooter
      submitLabel="Set as Admin"
      cancelLabel="Cancel"
      isSubmitting={setAdminMutation.isPending}
      isValid={!!selectedUserId}
      formId="set-admin-form"
    >
      <form id="set-admin-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Loading state */}
        {isLoading ? (
          <div className="space-y-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-16 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        ) : error ? (
          <div className="text-sm text-destructive p-3 border border-destructive/20 rounded-lg bg-destructive/5">
            Failed to load users: {error.message}
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-6 border rounded-lg bg-muted/20">
            <User className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
            <div className="text-sm text-muted-foreground">
              No users found in this organization.
            </div>
          </div>
        ) : (
          <>
            {/* Current Admins Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Crown className="w-4 h-4 text-amber-500" />
                Current Admins ({currentAdmins.length})
              </div>
              
              {currentAdmins.length === 0 ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    No admins configured yet
                  </p>
                </div>
              ) : (
                <div className="border rounded-lg divide-y">
                  {currentAdmins.map((admin) => (
                    <div key={admin.id} className="flex items-center gap-3 p-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-medium shrink-0">
                        {admin.name.charAt(0)}{admin.last_name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-foreground truncate">
                          {admin.name} {admin.last_name}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {admin.email}
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 shrink-0">
                        Admin
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Add New Admin Section */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <UserPlus className="w-4 h-4 text-[#4464f7]" />
                Add New Admin
              </div>
              
              {availableUsers.length === 0 ? (
                <div className="border rounded-lg p-4 bg-muted/20">
                  <p className="text-sm text-muted-foreground text-center">
                    All users in this organization are already admins
                  </p>
                </div>
              ) : (
                <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a user to make admin..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name} {user.last_name} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            {/* Info message */}
            {selectedUserId && (
              <div className="text-xs text-muted-foreground p-3 border rounded-lg bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
                The selected user will become an administrator of this organization and will have full management permissions.
              </div>
            )}
          </>
        )}
      </form>
    </ReusableDialog>
  )
}
