import { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { Search, Users, RefreshCw, UserCheck } from "lucide-react"
import { useRoleWithAllUsers, useRoleMutations, rbacQueryKeys } from "@/hooks/useRbac"
import { type Role } from "@/services/rbac"

interface AssignRoleToUsersDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AssignRoleToUsersDialog({ 
  role, 
  open, 
  onOpenChange,
  onSuccess
}: AssignRoleToUsersDialogProps) {
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [, setHasInitialized] = useState(false)
  const queryClient = useQueryClient()

  // Fetch role with all users when sheet is open
  const { data: roleUsersResponse, isLoading, error, refetch } = useRoleWithAllUsers(role?.id || '', open && !!role)
  const { assignUsersToRole } = useRoleMutations()

  const users = roleUsersResponse?.data?.users || []

  // Filter users based on search
  const filteredUsers = users.filter((user) =>
    `${user.name} ${user.last_name} ${user.email}`.toLowerCase().includes(searchTerm.toLowerCase())
  )

  // Reset state when sheet closes or role changes
  useEffect(() => {
    if (!open || !role) {
      setSelectedUsers([])
      setSearchTerm("")
      setHasInitialized(false)
    }
  }, [open, role?.id])

  // Initialize selected users when data loads
  useEffect(() => {
    if (open && role && !isLoading && !error && users.length >= 0) {
      const assignedUserIds = users.filter(user => user.has_role).map(user => user.id)
      setSelectedUsers(assignedUserIds)
      setHasInitialized(true)
    }
  }, [open, role?.id, isLoading, error, JSON.stringify(users.map(u => ({ id: u.id, has_role: u.has_role })))])

  // Invalidate queries when sheet opens
  useEffect(() => {
    if (open && role) {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roleWithAllUsers(role.id) })
    }
  }, [open, role?.id, queryClient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (role) {
      assignUsersToRole.mutate({ 
        roleId: role.id, 
        userIds: selectedUsers 
      }, {
        onSuccess: () => {
          onSuccess?.()
          onOpenChange(false)
        },
        onError: () => {
          // Keep sheet open on error so user can retry
        }
      })
    }
  }

  const handleUserToggle = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    )
  }

  const handleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([])
    } else {
      setSelectedUsers(filteredUsers.map(user => user.id))
    }
  }

  const handleRetry = async () => {
    if (error && role) {
      await refetch()
    }
  }

  const isPending = assignUsersToRole.isPending
  const hasErrors = !!error
  const isDataLoading = isLoading

  if (!role) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[90vw] lg:max-w-[600px] p-0"
        onPointerDownOutside={isPending ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isPending ? (e) => e.preventDefault() : undefined}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <UserCheck className="w-5 h-5" />
                  Assign Users
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Assign users to the role <strong>{role.name}</strong>
                </SheetDescription>
              </div>
              <div className="flex items-center h-full gap-2 ml-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={isPending}
                >
                  Cancel
                </Button>
                <Button
                  form="assign-users-form"
                  type="submit"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={isPending || hasErrors || users.length === 0}
                >
                  {isPending ? 'Assigning...' : 'Assign Users'}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 sm:py-3">
            <form id="assign-users-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Available Users</span>
                  <Badge variant="outline" className="text-xs px-2 py-0.5">
                    {selectedUsers.length} selected
                  </Badge>
                </div>

                {/* Search Input */}
                {!isDataLoading && !hasErrors && users.length > 0 && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                )}

                {isDataLoading ? (
                  <div className="space-y-2">
                    {[...Array(6)].map((_, i) => (
                      <div key={i} className="flex items-center space-x-3 p-2 border rounded-md">
                        <Skeleton className="h-3 w-3 rounded" />
                        <div className="flex-1 space-y-1">
                          <Skeleton className="h-3 w-32" />
                          <Skeleton className="h-2 w-40" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : hasErrors ? (
                  <div className="flex flex-col items-center justify-center min-h-[300px] text-center rounded-lg border border-dashed bg-muted/50 p-8">
                    <p className="text-red-600 mb-4 font-medium">
                      {error?.message || 'Failed to load users'}
                    </p>
                    <p className="text-sm text-muted-foreground mb-6">
                      There was an error loading the users data. Please try again.
                    </p>
                    <Button 
                      onClick={handleRetry} 
                      variant="outline" 
                      className="hover:cursor-pointer"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                ) : users.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Users className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold mb-2">No users available</h3>
                    <p className="text-xs text-muted-foreground">
                      No users have been created yet.
                    </p>
                  </Card>
                ) : filteredUsers.length === 0 ? (
                  <Card className="p-6 text-center">
                    <Search className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                    <h3 className="text-sm font-semibold mb-2">No users found</h3>
                    <p className="text-xs text-muted-foreground">
                      Try adjusting your search criteria.
                    </p>
                  </Card>
                ) : (
                  <div className="border rounded-md p-3">
                    {/* Select All */}
                    <div className="flex items-center space-x-3 p-2 rounded-md border-b mb-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                        onCheckedChange={handleSelectAll}
                      />
                      <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                        Select All ({filteredUsers.length})
                      </label>
                    </div>

                    <div className="space-y-2">
                      {filteredUsers.map((user) => (
                        <div key={user.id} className="flex items-center space-x-3 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/30 transition-colors">
                          <Checkbox
                            id={user.id}
                            checked={selectedUsers.includes(user.id)}
                            onCheckedChange={() => handleUserToggle(user.id)}
                            className="mt-0.5"
                          />
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={user.id}
                              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 mb-0.5"
                            >
                              <span className="truncate">{user.name} {user.last_name}</span>
                              {user.is_root_admin && (
                                <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-4">
                                  Admin
                                </Badge>
                              )}
                            </label>
                            <p className="text-xs text-muted-foreground truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}