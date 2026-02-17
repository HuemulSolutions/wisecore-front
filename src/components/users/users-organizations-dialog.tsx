// Dialog component for viewing user organizations
import { useState } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { ReusableAlertDialog } from "@/components/ui/reusable-alert-dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Plus, Trash2 } from "lucide-react"
import { useUserOrganizations } from "@/hooks/useUsers"
import { type User, type UserOrganization } from "@/types/users"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { assignUserToOrganization, removeUserFromOrganization } from "@/services/users"
import { toast } from "sonner"

interface UserOrganizationsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UserOrganizationsDialog({ user, open, onOpenChange }: UserOrganizationsDialogProps) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const [orgToRemove, setOrgToRemove] = useState<{ id: string; name: string } | null>(null)
  const queryClient = useQueryClient()

  const { data: organizationsResponse, isLoading, error } = useUserOrganizations(user?.id)

  const assignMutation = useMutation({
    mutationFn: (organizationId: string) => 
      assignUserToOrganization(organizationId, { user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'organizations', user?.id] })
      toast.success('User assigned to organization successfully')
      setSelectedOrganizationId("")
    },
  })

  const removeMutation = useMutation({
    mutationFn: (organizationId: string) => 
      removeUserFromOrganization(organizationId, user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'organizations', user?.id] })
      toast.success('User removed from organization successfully')
      setOrgToRemove(null)
    },
  })

  if (!user) return null

  const allOrganizations = organizationsResponse?.data || []
  // Organizations where the user is a member
  const memberOrganizations = allOrganizations.filter((org: UserOrganization) => org.member)
  // Organizations where the user is NOT a member (available for assignment)
  const availableOrganizations = allOrganizations.filter((org: UserOrganization) => !org.member)

  return (
    <>
      <ReusableDialog
        open={open}
        onOpenChange={onOpenChange}
        title={`Organizations - ${user.name} ${user.last_name}`}
        description="Organizations that this user belongs to and their roles."
        icon={Building}
        maxWidth="md"
        maxHeight="90vh"
        showDefaultFooter={false}
      >
        <div className="space-y-4">
          {/* Assign organization section */}
          {availableOrganizations.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="text-sm font-medium mb-3">Assign to Organization</div>
              <div className="flex gap-2">
                <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                  <SelectTrigger className="flex-1 w-full">
                    <SelectValue placeholder="Select organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrganizations.map((org: UserOrganization) => (
                      <SelectItem key={org.id} value={org.id}>
                        {org.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => assignMutation.mutate(selectedOrganizationId)}
                  disabled={!selectedOrganizationId || assignMutation.isPending}
                  size="sm"
                  className="hover:cursor-pointer"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Assign
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <div className="text-sm text-muted-foreground">
                Failed to load organizations: {error.message}
              </div>
            </div>
          ) : memberOrganizations.length > 0 ? (
            <div className="space-y-3">
              {memberOrganizations.map((org: UserOrganization) => (
                <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{org.name}</div>
                    {org.description && (
                      <div className="text-xs text-muted-foreground">{org.description}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      Member
                    </Badge>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="hover:cursor-pointer h-6 px-2"
                      disabled={removeMutation.isPending}
                      onClick={() => setOrgToRemove({ id: org.id, name: org.name })}
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Building className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <div className="text-sm font-medium text-foreground mb-1">No organizations found</div>
              <div className="text-sm text-muted-foreground">
                This user is not a member of any organizations.
              </div>
            </div>
          )}
        </div>
      </ReusableDialog>

      <ReusableAlertDialog
        open={!!orgToRemove}
        onOpenChange={(open) => !open && setOrgToRemove(null)}
        title="Remove User from Organization"
        description={
          <>
            Are you sure you want to remove <strong>{user.name} {user.last_name}</strong> from{" "}
            <strong>{orgToRemove?.name}</strong>? This action cannot be undone.
          </>
        }
        onConfirm={() => orgToRemove && removeMutation.mutate(orgToRemove.id)}
        confirmLabel="Remove User"
        cancelLabel="Cancel"
        isProcessing={removeMutation.isPending}
        variant="destructive"
      />
    </>
  )
}
