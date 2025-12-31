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

interface EditRoleSheetProps {
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

export default function EditRoleSheet({ role, open, onOpenChange }: EditRoleSheetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())
  
  // Only fetch permissions with status when the sheet is actually open
  const { data: rolePermissionsResponse, isLoading: rolePermissionsLoading } = useRolePermissions(role?.id || '', open)
  const { updateRole } = useRoleMutations()

  const allPermissions = rolePermissionsResponse?.data || []

  // Reset form when role changes or dialog opens
  useEffect(() => {
    if (open && role) {
      // Reset form state
      setName(role.name || '')
      setDescription(role.description || '')
      setSearchTerm('')
      setCollapsedCategories(new Set())
      
      // Initialize permissions from role data initially - ensure permissions array exists
      // If permissions array is not available, start with empty array and rely on API call
      if (Array.isArray(role.permissions)) {
        setPermissions(role.permissions.map(p => p.id))
      } else {
        setPermissions([])
      }
    } else if (!open) {
      // Reset when closed
      setName('')
      setDescription('')
      setPermissions([])
      setSearchTerm('')
      setCollapsedCategories(new Set())
    }
  }, [role, open])
  
  // Update permissions when rolePermissions data is loaded
  useEffect(() => {
    if (allPermissions.length > 0 && open && role) {
      // Filter only assigned permissions
      setPermissions(allPermissions.filter(p => p.assigned).map(p => p.id))
    }
  }, [allPermissions, open, role?.id])

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
        name,
        description,
        add_permissions,
        remove_permissions,
      }
    }, {
      onSuccess: () => {
        onOpenChange(false)
      },
      onError: () => {
        // Keep sheet open on error so user can retry
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
      <SheetContent 
        side="right" 
        className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0"
        onPointerDownOutside={updateRole.isPending ? (e) => e.preventDefault() : undefined}
        onEscapeKeyDown={updateRole.isPending ? (e) => e.preventDefault() : undefined}
      >
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-3 sm:pt-4 pb-2 sm:pb-3 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-0.5">
                <SheetTitle className="flex items-center gap-2 text-sm sm:text-base font-semibold">
                  <Edit3 className="w-4 h-4 text-primary" />
                  Edit Permissions: {role?.name}
                </SheetTitle>
                <SheetDescription className="text-[10px] sm:text-xs text-gray-500 mt-0">
                  Update the permissions assigned to this role.
                </SheetDescription>
              </div>
              <div className="flex items-center h-full gap-1.5 ml-3">
                <Button
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="hover:cursor-pointer text-xs h-7"
                  size="sm"
                  disabled={updateRole.isPending}
                >
                  Cancel
                </Button>
                <Button
                  form="edit-role-form"
                  type="submit"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-xs h-7"
                  size="sm"
                  disabled={updateRole.isPending}
                >
                  {updateRole.isPending ? "Updating..." : "Update"}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-2 sm:py-3">
            <form id="edit-role-form" onSubmit={handleSubmit} className="space-y-3">
              {/* Role Details */}
              <div className="space-y-3 pb-3 border-b">
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-sm font-medium">
                    Role Name
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter role name"
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="description" className="text-sm font-medium">
                    Description
                  </Label>
                  <Input
                    id="description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Enter role description"
                  />
                </div>
              </div>

              {/* Header info */}
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Role Permissions</Label>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    {permissions.length} selected
                  </Badge>
                  <Badge className="text-[10px] px-1.5 py-0.5">
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
                <div className="p-3 space-y-3">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                    const Icon = getCategoryIcon(category)
                    const isCollapsed = collapsedCategories.has(category)
                    const selectedInCategory = categoryPermissions.filter(p => permissions.includes(p.id)).length
                    const allSelectedInCategory = selectedInCategory === categoryPermissions.length
                    const someSelectedInCategory = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length
                    
                    return (
                      <div key={category} className="space-y-2 border-b border-border/40 pb-2 last:border-b-0">
                        {/* Category Header */}
                        <div className="flex items-center gap-2 p-2 bg-muted/30 rounded-md border">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="p-1 h-auto hover:cursor-pointer hover:bg-background"
                            onClick={() => toggleCategory(category)}
                          >
                            {isCollapsed ? (
                              <ChevronRight className="w-3 h-3" />
                            ) : (
                              <ChevronDown className="w-3 h-3" />
                            )}
                          </Button>
                          
                          <Icon className="w-4 h-4 text-muted-foreground" />
                          
                          <span className="text-xs font-semibold capitalize flex-1">
                            {category.replace('_', ' ')}
                          </span>
                          
                          <Badge className="text-[10px] font-medium px-1.5 py-0.5">
                            {selectedInCategory}/{categoryPermissions.length}
                          </Badge>
                          
                          <div className="flex items-center gap-1">
                            <span className="text-[10px] text-muted-foreground">All</span>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              className="p-1 h-auto hover:cursor-pointer border"
                              onClick={() => handleCategorySelectAll(category, categoryPermissions)}
                            >
                              {allSelectedInCategory ? (
                                <CheckSquare className="w-3 h-3 text-primary" />
                              ) : someSelectedInCategory ? (
                                <div className="w-3 h-3 border border-primary bg-primary/20 rounded-sm flex items-center justify-center">
                                  <div className="w-1.5 h-0.5 bg-primary rounded-full" />
                                </div>
                              ) : (
                                <Square className="w-3 h-3" />
                              )}
                            </Button>
                          </div>
                        </div>
                        
                        {/* Category Permissions */}
                        {!isCollapsed && (
                          <div className="space-y-1 ml-4 pl-3 border-l border-muted">
                            {categoryPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50">
                                <Checkbox
                                  id={permission.id}
                                  checked={permissions.includes(permission.id)}
                                  onCheckedChange={() => handlePermissionToggle(permission.id)}
                                  className="mt-0.5 scale-90"
                                />
                                <div className="flex-1 min-w-0">
                                  <label
                                    htmlFor={permission.id}
                                    className="text-xs font-medium leading-tight hover:cursor-pointer block"
                                  >
                                    {permission.description}
                                  </label>
                                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-relaxed">
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
                    <div className="text-center py-6">
                      <Shield className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
                      <h3 className="text-sm font-medium text-foreground mb-1">No permissions found</h3>
                      <p className="text-xs text-muted-foreground">
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