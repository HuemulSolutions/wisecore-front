// Dialog component for viewing user organizations
import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Building, Plus } from "lucide-react"
import { useUserOrganizations } from "@/hooks/useUsers"
import { type User } from "@/services/users"
import { getAllOrganizations } from "@/services/organizations"
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query"
import { assignUserToOrganization } from "@/services/users"
import { toast } from "sonner"

interface UserOrganizationsDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function UserOrganizationsDialog({ user, open, onOpenChange }: UserOrganizationsDialogProps) {
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>("")
  const queryClient = useQueryClient()

  const { data: organizationsResponse, isLoading, error } = useUserOrganizations(user?.id)
  const { data: allOrganizations } = useQuery({
    queryKey: ['organizations'],
    queryFn: getAllOrganizations,
    enabled: open,
  })

  const assignMutation = useMutation({
    mutationFn: (organizationId: string) => 
      assignUserToOrganization(organizationId, { user_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users', 'organizations', user?.id] })
      toast.success('User assigned to organization successfully')
      setSelectedOrganizationId("")
    },
    onError: (error) => {
      toast.error('Failed to assign user to organization: ' + error.message)
    },
  })

  if (!user) return null

  const organizations = organizationsResponse?.data || []
  const availableOrganizations = allOrganizations?.filter(
    (org: any) => !organizations.find(userOrg => userOrg.id === org.id)
  ) || []

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Organizations - {user.name} {user.last_name}
          </DialogTitle>
          <DialogDescription>
            Organizations that this user belongs to and their roles.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Assign organization section */}
          {availableOrganizations.length > 0 && (
            <div className="border rounded-lg p-4 bg-muted/20">
              <div className="text-sm font-medium mb-3">Assign to Organization</div>
              <div className="flex gap-2">
                <Select value={selectedOrganizationId} onValueChange={setSelectedOrganizationId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Select organization..." />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOrganizations.map((org: any) => (
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
          ) : organizations && organizations.length > 0 ? (
            <div className="space-y-3">
              {organizations.map((org) => (
                <div key={org.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition">
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{org.name}</div>
                    {org.description && (
                      <div className="text-xs text-muted-foreground">{org.description}</div>
                    )}
                  </div>
                  <Badge variant="outline" className="text-xs">
                    Member
                  </Badge>
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
      </DialogContent>
    </Dialog>
  )
}