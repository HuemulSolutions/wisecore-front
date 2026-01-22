import React, { useState, useEffect } from "react"
import { useQueryClient } from "@tanstack/react-query"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Card } from "@/components/ui/card"
import { UserCheck, Shield, RefreshCw } from "lucide-react"
import { useUserAllRoles, useRoleMutations, rbacQueryKeys } from "@/hooks/useRbac"
import { userQueryKeys } from "@/hooks/useUsers"
import { type User } from "@/types/users"

interface AssignRolesSheetProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

export default function AssignRolesSheet({ user, open, onOpenChange, onSuccess }: AssignRolesSheetProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [, setHasInitialized] = useState(false)
  const queryClient = useQueryClient()
  
  // Fetch all roles with user assignment status when sheet is open
  const { data: userAllRolesResponse, isLoading: rolesLoading, error: rolesError, refetch: refetchRoles } = useUserAllRoles(user?.id || '', open && !!user)
  const { assignRoles } = useRoleMutations()

  const roles = userAllRolesResponse?.data || []

  // Reset state when sheet closes or user changes
  useEffect(() => {
    if (!open || !user) {
      setSelectedRoles([])
      setHasInitialized(false)
    }
  }, [open, user?.id])

  // Initialize selected roles when data loads or changes
  useEffect(() => {
    if (open && user && !rolesLoading && !rolesError && roles.length >= 0) {
      const assignedRoleIds = roles.filter(role => role.has_role).map(role => role.id)
      setSelectedRoles(assignedRoleIds)
      setHasInitialized(true)
    }
  }, [open, user?.id, rolesLoading, rolesError, JSON.stringify(roles.map(r => ({ id: r.id, has_role: r.has_role })))])

  // Invalidate queries when sheet opens
  useEffect(() => {
    if (open && user) {
      queryClient.invalidateQueries({ queryKey: rbacQueryKeys.userAllRoles(user.id) })
    }
  }, [open, user?.id, queryClient])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (user) {
      assignRoles.mutate({ 
        userId: user.id, 
        roleIds: selectedRoles 
      }, {
        onSuccess: () => {
          // Invalidate all users queries to refresh the users list (including paginated queries)
          queryClient.invalidateQueries({ queryKey: userQueryKeys.all })
          // Call additional success callback if provided
          onSuccess?.()
          // Close the sheet immediately
          onOpenChange(false)
        },
        onError: () => {
          // Keep sheet open on error so user can retry
        }
      })
    }
  }

  const handleRoleToggle = (roleId: string) => {
    setSelectedRoles(prev =>
      prev.includes(roleId)
        ? prev.filter(id => id !== roleId)
        : [...prev, roleId]
    )
  }

  const handleRetry = async () => {
    if (rolesError && user) {
      await refetchRoles()
    }
  }

  const isLoading = assignRoles.isPending
  const hasErrors = !!rolesError
  const isDataLoading = rolesLoading

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[90vw] lg:max-w-150 p-0"
        onPointerDownOutside={isLoading ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={isLoading ? (e) => e.preventDefault() : undefined}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <UserCheck className="w-5 h-5" />
                  Assign Roles
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Assign roles to <strong>{user.name} {user.last_name}</strong> ({user.email})
                </SheetDescription>
              </div>
              <div className="flex items-center h-full gap-2 ml-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  form="assign-roles-form"
                  type="submit"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={isLoading || hasErrors || roles.length === 0}
                >
                  {isLoading ? 'Assigning...' : 'Assign Roles'}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 sm:py-3">
            <form id="assign-roles-form" onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available Roles</span>
              <Badge variant="outline" className="text-xs px-2 py-0.5">
                {selectedRoles.length} selected
              </Badge>
            </div>

            {isDataLoading ? (
              <div className="space-y-2">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3 p-2 border rounded-md">
                    <Skeleton className="h-3 w-3 rounded" />
                    <div className="flex-1 space-y-1">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2 w-32" />
                    </div>
                    <div className="flex gap-1">
                      <Skeleton className="h-4 w-6" />
                      <Skeleton className="h-4 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            ) : hasErrors ? (
              <div className="flex flex-col items-center justify-center min-h-75 text-center rounded-lg border border-dashed bg-muted/50 p-8">
                <p className="text-red-600 mb-4 font-medium">
                  {rolesError?.message || 'Failed to load roles'}
                </p>
                <p className="text-sm text-muted-foreground mb-6">
                  There was an error loading the roles data. Please try again.
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
            ) : roles.length === 0 ? (
              <Card className="p-6 text-center">
                <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-3" />
                <h3 className="text-sm font-semibold mb-2">No roles available</h3>
                <p className="text-xs text-muted-foreground">
                  No roles have been created yet.
                </p>
              </Card>
            ) : (
              <div className="border rounded-md p-3">
                <div className="space-y-2">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-center space-x-3 p-2 rounded-md border border-transparent hover:border-border hover:bg-muted/30 transition-colors">
                      <Checkbox
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                        className="mt-0.5"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <label
                              htmlFor={role.id}
                              className="text-sm font-medium leading-none cursor-pointer flex items-center gap-2 mb-1"
                            >
                              <Shield className="w-3 h-3 text-primary shrink-0" />
                              <span className="truncate">{role.name}</span>
                            </label>
                            {role.description && (
                              <p className="text-xs text-muted-foreground leading-tight mb-1 line-clamp-2">
                                {role.description}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            {role.permission_num !== undefined && (
                              <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                                {role.permission_num}
                              </Badge>
                            )}
                            {role.users_count !== undefined && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4">
                                {role.users_count} users
                              </Badge>
                            )}
                          </div>
                        </div>
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