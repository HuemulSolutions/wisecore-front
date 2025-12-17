import { useState, useEffect } from "react"
import { useMutation } from "@tanstack/react-query"
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Users, Shield, UserCheck } from "lucide-react"
import { useUsers } from "@/hooks/useUsers"
import { assignRoleToUser } from "@/services/rbac"
import { toast } from "sonner"
import { type Role } from "@/services/rbac"

interface AssignRoleToUsersDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssignRoleToUsersDialog({ 
  role, 
  open, 
  onOpenChange 
}: AssignRoleToUsersDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set())

  const { data: usersResponse, isLoading } = useUsers()
  const users = usersResponse?.data || []

  // Filter users based on search
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const assignRoleMutation = useMutation({
    mutationFn: async (userIds: string[]) => {
      if (!role) throw new Error("Role not found")
      
      // Assign the role to each selected user
      await Promise.all(
        userIds.map(userId => assignRoleToUser(userId, [role.id]))
      )
    },
    onSuccess: () => {
      toast.success(`Role "${role?.name}" assigned to ${selectedUsers.size} user(s)`)
      onOpenChange(false)
    },
    onError: (error) => {
      toast.error(`Failed to assign role: ${error instanceof Error ? error.message : 'Unknown error'}`)
    },
  })

  // Reset state when dialog opens or role changes
  useEffect(() => {
    if (open) {
      setSelectedUsers(new Set())
      setSearchTerm("")
    }
  }, [open, role])

  const handleUserSelection = (userId: string) => {
    setSelectedUsers(prev => {
      const newSet = new Set(prev)
      if (newSet.has(userId)) {
        newSet.delete(userId)
      } else {
        newSet.add(userId)
      }
      return newSet
    })
  }

  const handleSelectAll = () => {
    if (selectedUsers.size === filteredUsers.length) {
      setSelectedUsers(new Set())
    } else {
      setSelectedUsers(new Set(filteredUsers.map(user => user.id)))
    }
  }

  const handleAssignRole = () => {
    if (!role || selectedUsers.size === 0) return
    
    assignRoleMutation.mutate(Array.from(selectedUsers))
  }

  if (!role) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2">
            <UserCheck className="w-5 h-5 text-primary" />
            Assign Role: {role.name}
          </DialogTitle>
          <DialogDescription>
            Select users to assign the "{role.name}" role to.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4 flex-1">
            <Skeleton className="h-10 w-full" />
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col space-y-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Select All */}
            {filteredUsers.length > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted/30 rounded-lg">
                <Checkbox
                  checked={selectedUsers.size === filteredUsers.length && filteredUsers.length > 0}
                  onCheckedChange={handleSelectAll}
                  disabled={assignRoleMutation.isPending}
                />
                <span className="text-sm font-medium">
                  Select all ({filteredUsers.length} users)
                </span>
                {selectedUsers.size > 0 && (
                  <span className="text-sm text-muted-foreground ml-auto">
                    {selectedUsers.size} selected
                  </span>
                )}
              </div>
            )}

            {/* Users List */}
            <div className="flex-1 overflow-auto space-y-2">
              {filteredUsers.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center space-x-3 p-3 hover:bg-muted/20 rounded-lg transition cursor-pointer"
                  onClick={() => handleUserSelection(user.id)}
                >
                  <Checkbox
                    checked={selectedUsers.has(user.id)}
                    onCheckedChange={() => handleUserSelection(user.id)}
                    disabled={assignRoleMutation.isPending}
                  />
                  <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {user.name} {user.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                  {user.is_root_admin && (
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Shield className="w-3 h-3" />
                      Admin
                    </div>
                  )}
                </div>
              ))}

              {filteredUsers.length === 0 && (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No users found</h3>
                  <p className="text-muted-foreground">
                    {searchTerm 
                      ? "Try adjusting your search criteria."
                      : "No users are available."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="mt-8 gap-3">
          <DialogClose asChild>
            <Button 
              type="button" 
              variant="outline"
              disabled={assignRoleMutation.isPending}
            >
              Cancel
            </Button>
          </DialogClose>
          <Button 
            onClick={handleAssignRole}
            disabled={assignRoleMutation.isPending || selectedUsers.size === 0 || isLoading}
            className="hover:cursor-pointer"
          >
            {assignRoleMutation.isPending 
              ? 'Assigning...' 
              : `Assign Role to ${selectedUsers.size} User${selectedUsers.size !== 1 ? 's' : ''}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}