import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { UserCheck, Shield } from "lucide-react"
import { useRoles, useUserRoles, useRoleMutations } from "@/hooks/useRbac"
import { type User } from "@/services/users"

interface AssignRolesDialogProps {
  user: User | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function AssignRolesDialog({ user, open, onOpenChange }: AssignRolesDialogProps) {
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  
  const { data: rolesResponse, isLoading: rolesLoading } = useRoles()
  const { data: userRolesResponse, isLoading: userRolesLoading } = useUserRoles(user?.id || '')
  const { assignRoles } = useRoleMutations()

  const roles = rolesResponse?.data || []
  const userRoles = userRolesResponse?.data || []

  // Reset form when user changes or dialog opens
  useEffect(() => {
    if (open && user && userRoles.length >= 0) {
      setSelectedRoles(userRoles.map(role => role.id))
    }
  }, [user, open, userRoles])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (user) {
      assignRoles.mutate({ 
        userId: user.id, 
        roleIds: selectedRoles 
      }, {
        onSuccess: () => onOpenChange(false)
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

  const isLoading = assignRoles.isPending

  if (!user) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[600px] p-0">
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
                  disabled={isLoading}
                >
                  {isLoading ? 'Assigning...' : 'Assign Roles'}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <form id="assign-roles-form" onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Available Roles</span>
              <Badge variant="outline">
                {selectedRoles.length} selected
              </Badge>
            </div>

            {rolesLoading || userRolesLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="flex items-center space-x-3">
                    <Skeleton className="h-4 w-4" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-[300px] border rounded-md p-4">
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div key={role.id} className="flex items-start space-x-3">
                      <Checkbox
                        id={role.id}
                        checked={selectedRoles.includes(role.id)}
                        onCheckedChange={() => handleRoleToggle(role.id)}
                      />
                      <div className="flex-1 min-w-0">
                        <label
                          htmlFor={role.id}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex items-center gap-2"
                        >
                          <Shield className="w-4 h-4 text-primary" />
                          {role.name}
                        </label>
                        <p className="text-xs text-muted-foreground mt-1">
                          {role.description}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="default" className="text-xs">
                            {role.permission_num || role.permissions?.length || 0} permissions
                          </Badge>
                          {role.users_count !== undefined && (
                            <Badge variant="outline" className="text-xs">
                              {role.users_count} users
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}