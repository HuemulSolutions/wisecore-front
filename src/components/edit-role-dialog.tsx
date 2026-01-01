import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Shield, Users, Database, FileText, Settings, Brain, Lock, Edit3, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react"
import { useRolePermissions, useRoleMutations } from "@/hooks/useRbac"
import { type Role, type PermissionWithStatus } from "@/services/rbac"

interface EditRoleDialogProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

// Permission categories for better organization
const getPermissionCategory = (permission: string) => {
  const [category] = permission.split(':')
  return category
}

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'user':
      return Users
    case 'organization':
      return Shield
    case 'assets':
    case 'folder':
      return Database
    case 'document_type':
    case 'template':
    case 'section':
    case 'docx_template':
      return FileText
    case 'llm':
    case 'llm_provider':
      return Brain
    case 'rbac':
      return Lock
    default:
      return Settings
  }
}

export default function EditRoleDialog({ role, open, onOpenChange }: EditRoleDialogProps) {
  const [permissions, setPermissions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  
  // Only fetch permissions with status when the dialog is actually open
  const { data: rolePermissionsResponse, isLoading: rolePermissionsLoading } = useRolePermissions(role?.id || '', open)
  const { updateRole } = useRoleMutations()

  const allPermissions = rolePermissionsResponse?.data || []

  // Reset form when role changes or dialog opens
  useEffect(() => {
    if (open && role) {
      // Reset form state
      setSearchTerm('')
      setCollapsedCategories(new Set())
      
      // Initialize permissions from role data initially - ensure permissions array exists
      // If permissions array is not available, start with empty array and rely on API call
      if (Array.isArray(role.permissions)) {
        setPermissions(role.permissions.map(p => p.id))
      } else {
        setPermissions([])
      }
    }
  }, [role, open])
  
  // Update permissions when rolePermissions data is loaded
  useEffect(() => {
    if (allPermissions.length > 0 && open && role) {
      // Filter only assigned permissions
      setPermissions(allPermissions.filter(p => p.assigned).map(p => p.id))
    }
  }, [allPermissions.length, open, role?.id])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!role) return

    // Calculate permissions to add and remove using current role permissions from API
    const currentPermissions = allPermissions.filter(p => p.assigned).map(p => p.id)
    const newPermissions = permissions
    
    const add_permissions = newPermissions.filter(pId => !currentPermissions.includes(pId))
    const remove_permissions = currentPermissions.filter(pId => !newPermissions.includes(pId))
    
    // Update existing role
    updateRole.mutate({ 
      roleId: role.id, 
      data: {
        add_permissions,
        remove_permissions,
      }
    }, {
      onSuccess: () => {
        onOpenChange(false)
      }
    })
  }

  const handlePermissionToggle = (permissionId: string) => {
    setPermissions(prev => 
      prev.includes(permissionId)
        ? prev.filter(id => id !== permissionId)
        : [...prev, permissionId]
    )
  }

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => {
      const newSet = new Set(prev)
      if (newSet.has(category)) {
        newSet.delete(category)
      } else {
        newSet.add(category)
      }
      return newSet
    })
  }

  const handleCategorySelectAll = (_category: string, categoryPermissions: PermissionWithStatus[]) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id)
    const allSelected = categoryPermissionIds.every(id => permissions.includes(id))
    
    if (allSelected) {
      // Deselect all permissions in this category
      setPermissions(prev => prev.filter(id => !categoryPermissionIds.includes(id)))
    } else {
      // Select all permissions in this category
      setPermissions(prev => {
        const newPermissions = [...prev]
        categoryPermissionIds.forEach(id => {
          if (!newPermissions.includes(id)) {
            newPermissions.push(id)
          }
        })
        return newPermissions
      })
    }
  }

  // Filter and group permissions
  const filteredPermissions = allPermissions.filter(permission =>
    permission.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    permission.description.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const groupedPermissions = filteredPermissions.reduce((groups, permission) => {
    const category = getPermissionCategory(permission.name)
    if (!groups[category]) {
      groups[category] = []
    }
    groups[category].push(permission)
    return groups
  }, {} as Record<string, PermissionWithStatus[]>)


  if (!role) return null

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Edit3 className="w-5 h-5 text-primary" />
                  Edit Permissions: {role?.name}
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Update the permissions assigned to this role.
                </SheetDescription>
              </div>
              <div className="flex items-center h-full gap-2 ml-4">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={updateRole.isPending}
                >
                  Cancel
                </Button>
                <Button
                  form="edit-role-form"
                  type="submit"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={updateRole.isPending}
                >
                  {updateRole.isPending ? "Updating..." : "Update Permissions"}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <form id="edit-role-form" onSubmit={handleSubmit} className="space-y-6">
              {/* Header info */}
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Role Permissions</Label>
                <div className="flex gap-2">
                  <Badge variant="outline">
                    {permissions.length} selected
                  </Badge>
                  <Badge>
                    {allPermissions.filter(p => p.assigned).length} current
                  </Badge>
                </div>
              </div>
          
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search permissions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-h-0">
            {rolePermissionsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-6 w-32" />
                    <div className="space-y-2 pl-4">
                      {[...Array(4)].map((_, j) => (
                        <Skeleton key={j} className="h-8 w-full" />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <ScrollArea className="h-full border rounded-lg">
                <div className="p-4 space-y-6">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                    const Icon = getCategoryIcon(category)
                    const isCollapsed = collapsedCategories.has(category)
                    const selectedInCategory = categoryPermissions.filter(p => permissions.includes(p.id)).length
                    const allSelectedInCategory = selectedInCategory === categoryPermissions.length
                    const someSelectedInCategory = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length
                    
                    return (
                      <div key={category} className="space-y-3 border-b border-border/40 pb-3 last:border-b-0">
                        {/* Category Header */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="p-1.5 h-auto hover:cursor-pointer hover:bg-background"
                            onClick={() => toggleCategory(category)}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-4 h-4" />
                            ) : (
                              <ChevronDown className="w-4 h-4" />
                            )}
                          </Button>
                          
                          <Icon className="w-5 h-5 text-muted-foreground" />
                          
                          <span className="text-sm font-semibold capitalize flex-1">
                            {category.replace('_', ' ')}
                          </span>
                          
                          <Badge className="text-xs font-medium">
                            {selectedInCategory}/{categoryPermissions.length}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-xs text-muted-foreground mr-1">Select all</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="p-1.5 h-auto hover:cursor-pointer border-2"
                              onClick={() => handleCategorySelectAll(category, categoryPermissions)}
                            >
                              {allSelectedInCategory ? (
                                <CheckSquare className="w-4 h-4 text-primary" />
                              ) : someSelectedInCategory ? (
                                <div className="w-4 h-4 border-2 border-primary bg-primary/20 rounded-sm flex items-center justify-center">
                                  <div className="w-2 h-0.5 bg-primary rounded-full" />
                                </div>
                              ) : (
                                <Square className="w-4 h-4" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Category Permissions */}
                        {!isCollapsed && (
                          <div className="space-y-2 ml-6 pl-4 border-l-2 border-muted">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                <Checkbox
                                  id={permission.id}
                                  checked={permissions.includes(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                  className="mt-0.5"
                                />
                                <div className="flex-1 min-w-0">
                                  <label
                                    htmlFor={permission.id}
                                    className="text-sm font-medium leading-tight hover:cursor-pointer block"
                                  >
                                    {permission.description}
                                  </label>
                                  <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                                    {permission.name}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )
                  })}

                  {filteredPermissions.length === 0 && (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                      <h3 className="text-lg font-medium text-foreground mb-2">No permissions found</h3>
                      <p className="text-muted-foreground">
                        {searchTerm 
                          ? "Try adjusting your search criteria."
                          : "No permissions are available."}
                      </p>
                    </div>
                  )}
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