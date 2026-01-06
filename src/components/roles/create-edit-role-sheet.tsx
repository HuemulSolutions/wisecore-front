import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Search, Shield, Users, Database, FileText, Settings, Brain, Lock } from "lucide-react"
import { usePermissions, useRoleMutations } from "@/hooks/useRbac"
import { type Role, type Permission } from "@/services/rbac"

interface CreateEditRoleSheetProps {
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

export default function CreateEditRoleSheet({ role, open, onOpenChange }: CreateEditRoleSheetProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[],
  })
  const [searchTerm, setSearchTerm] = useState('')
  
  // Only fetch permissions when the sheet is actually open
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions(open)
  const { createRole, updateRole } = useRoleMutations()

  const permissions = Array.isArray(permissionsResponse?.data) ? permissionsResponse.data : []

  // Reset form when role changes or dialog opens
  useEffect(() => {
    if (open) {
      if (role) {
        setFormData({
          name: role.name || '',
          description: role.description || '',
          permissions: role.permissions?.map(p => p.id) || [],
        })
      } else {
        setFormData({
          name: '',
          description: '',
          permissions: [],
        })
      }
      setSearchTerm('')
    }
  }, [role, open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (role) {
      // Calculate permissions to add and remove
      const currentPermissions = role.permissions?.map(p => p.id) || []
      const newPermissions = formData.permissions
      
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
        onSuccess: () => onOpenChange(false)
      })
    } else {
      // Create new role
      createRole.mutate({
        name: formData.name,
        description: formData.description,
        permissions: formData.permissions,
      }, {
        onSuccess: () => onOpenChange(false)
      })
    }
  }

  const handlePermissionToggle = (permissionId: string) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(id => id !== permissionId)
        : [...prev.permissions, permissionId]
    }))
  }

  // Filter and group permissions
  const filteredPermissions = permissions.filter(permission =>
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
  }, {} as Record<string, Permission[]>)

  const isLoading = createRole.isPending || updateRole.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Shield className="w-5 h-5" />
                  {role ? 'Edit Role' : 'Create New Role'}
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  {role 
                    ? 'Update the role information and permissions.' 
                    : 'Create a new role with specific permissions.'
                  }
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
                  form="role-form"
                  type="submit"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
                >
                  {isLoading ? 'Saving...' : role ? 'Update Role' : 'Create Role'}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <form id="role-form" onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Role Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Enter role description"
                  rows={3}
                  required
                />
              </div>
            </div>

            {/* Permissions Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label className="text-base font-medium">Permissions</Label>
                <Badge variant="outline">
                  {formData.permissions.length} selected
                </Badge>
              </div>
              
              {/* Search permissions */}
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search permissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>

              {permissionsLoading ? (
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
                <ScrollArea className="h-[250px] border rounded-md p-4">
                  <div className="space-y-6">
                  {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                    const Icon = getCategoryIcon(category)
                    return (
                      <div key={category} className="space-y-3">
                        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                          <Icon className="w-4 h-4" />
                          <span className="capitalize">{category.replace('_', ' ')}</span>
                          <Badge variant="secondary" className="text-xs">
                            {categoryPermissions.length}
                          </Badge>
                        </div>
                        <div className="space-y-2 pl-6">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="flex items-center space-x-2">
                              <Checkbox
                                id={permission.id}
                                checked={formData.permissions.includes(permission.id)}
                                onCheckedChange={() => handlePermissionToggle(permission.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <label
                                  htmlFor={permission.id}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                  {permission.name}
                                </label>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {permission.description}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
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