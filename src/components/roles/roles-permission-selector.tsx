import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import { Search, Shield, Users, Database, FileText, Settings, Brain, Lock, ChevronDown, ChevronRight, CheckSquare, Square } from "lucide-react"
import { type Permission, type PermissionWithStatus } from "@/services/rbac"

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

interface PermissionSelectorProps {
  permissions: (Permission | PermissionWithStatus)[]
  selectedPermissions: string[]
  onPermissionsChange: (permissions: string[]) => void
  isLoading?: boolean
  compact?: boolean
}

export default function PermissionSelector({
  permissions,
  selectedPermissions,
  onPermissionsChange,
  isLoading = false,
  compact = false
}: PermissionSelectorProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(new Set())

  const handlePermissionToggle = (permissionId: string) => {
    const newPermissions = selectedPermissions.includes(permissionId)
      ? selectedPermissions.filter(id => id !== permissionId)
      : [...selectedPermissions, permissionId]
    onPermissionsChange(newPermissions)
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

  const handleCategorySelectAll = (_category: string, categoryPermissions: (Permission | PermissionWithStatus)[]) => {
    const categoryPermissionIds = categoryPermissions.map(p => p.id)
    const allSelected = categoryPermissionIds.every(id => selectedPermissions.includes(id))
    
    if (allSelected) {
      // Deselect all permissions in this category
      const newPermissions = selectedPermissions.filter(id => !categoryPermissionIds.includes(id))
      onPermissionsChange(newPermissions)
    } else {
      // Select all permissions in this category
      const newPermissions = [...selectedPermissions]
      categoryPermissionIds.forEach(id => {
        if (!newPermissions.includes(id)) {
          newPermissions.push(id)
        }
      })
      onPermissionsChange(newPermissions)
    }
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
  }, {} as Record<string, (Permission | PermissionWithStatus)[]>)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className={compact ? "text-sm font-medium" : "text-base font-medium"}>Role Permissions</Label>
        <Badge variant="outline">
          {selectedPermissions.length} selected
        </Badge>
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
        {isLoading ? (
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
            <div className={compact ? "p-3 space-y-3" : "p-4 space-y-6"}>
              {Object.entries(groupedPermissions).map(([category, categoryPermissions]) => {
                const Icon = getCategoryIcon(category)
                const isCollapsed = collapsedCategories.has(category)
                const selectedInCategory = categoryPermissions.filter(p => selectedPermissions.includes(p.id)).length
                const allSelectedInCategory = selectedInCategory === categoryPermissions.length
                const someSelectedInCategory = selectedInCategory > 0 && selectedInCategory < categoryPermissions.length
                
                return (
                  <div 
                    key={category} 
                    className={compact 
                      ? "space-y-2 border-b border-border/40 pb-2 last:border-b-0"
                      : "space-y-3 border-b border-border/40 pb-3 last:border-b-0"
                    }
                  >
                    {/* Category Header */}
                    <div className={compact 
                      ? "flex items-center gap-2 p-2 bg-muted/30 rounded-md border"
                      : "flex items-center gap-3 p-3 bg-muted/30 rounded-lg border"
                    }>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className={compact 
                          ? "p-1 h-auto hover:cursor-pointer hover:bg-background"
                          : "p-1.5 h-auto hover:cursor-pointer hover:bg-background"
                        }
                        onClick={() => toggleCategory(category)}
                      >
                        {isCollapsed ? (
                          <ChevronRight className={compact ? "w-3 h-3" : "w-4 h-4"} />
                        ) : (
                          <ChevronDown className={compact ? "w-3 h-3" : "w-4 h-4"} />
                        )}
                      </Button>
                      
                      <Icon className={compact ? "w-4 h-4 text-muted-foreground" : "w-5 h-5 text-muted-foreground"} />
                      
                      <span className={compact 
                        ? "text-xs font-semibold capitalize flex-1"
                        : "text-sm font-semibold capitalize flex-1"
                      }>
                        {category.replace('_', ' ')}
                      </span>
                      
                      <Badge className={compact 
                        ? "text-[10px] font-medium px-1.5 py-0.5"
                        : "text-xs font-medium"
                      }>
                        {selectedInCategory}/{categoryPermissions.length}
                      </Badge>
                      
                      <div className="flex items-center gap-1">
                        <span className={compact 
                          ? "text-[10px] text-muted-foreground"
                          : "text-xs text-muted-foreground mr-1"
                        }>
                          {compact ? "All" : "Select all"}
                        </span>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className={compact 
                            ? "p-1 h-auto hover:cursor-pointer border"
                            : "p-1.5 h-auto hover:cursor-pointer border-2"
                          }
                          onClick={() => handleCategorySelectAll(category, categoryPermissions)}
                        >
                          {allSelectedInCategory ? (
                            <CheckSquare className={compact ? "w-3 h-3 text-primary" : "w-4 h-4 text-primary"} />
                          ) : someSelectedInCategory ? (
                            <div className={compact 
                              ? "w-3 h-3 border border-primary bg-primary/20 rounded-sm flex items-center justify-center"
                              : "w-4 h-4 border-2 border-primary bg-primary/20 rounded-sm flex items-center justify-center"
                            }>
                              <div className={compact ? "w-1.5 h-0.5 bg-primary rounded-full" : "w-2 h-0.5 bg-primary rounded-full"} />
                            </div>
                          ) : (
                            <Square className={compact ? "w-3 h-3" : "w-4 h-4"} />
                          )}
                        </Button>
                      </div>
                    </div>
                    
                    {/* Category Permissions */}
                    {!isCollapsed && (
                      <div className={compact 
                        ? "space-y-1 ml-4 pl-3 border-l border-muted"
                        : "space-y-2 ml-6 pl-4 border-l-2 border-muted"
                      }>
                        {categoryPermissions.map((permission) => (
                          <div 
                            key={permission.id} 
                            className={compact 
                              ? "flex items-start space-x-2 p-2 rounded-md hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                              : "flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-transparent hover:border-border/50"
                            }
                          >
                            <Checkbox
                              id={permission.id}
                              checked={selectedPermissions.includes(permission.id)}
                              onCheckedChange={() => handlePermissionToggle(permission.id)}
                              className={compact ? "mt-0.5 scale-90" : "mt-0.5"}
                            />
                            <div className="flex-1 min-w-0">
                              <label
                                htmlFor={permission.id}
                                className={compact 
                                  ? "text-xs font-medium leading-tight hover:cursor-pointer block"
                                  : "text-sm font-medium leading-tight hover:cursor-pointer block"
                                }
                              >
                                {permission.description}
                              </label>
                              <p className={compact 
                                ? "text-[10px] text-muted-foreground mt-0.5 leading-relaxed"
                                : "text-xs text-muted-foreground mt-1.5 leading-relaxed"
                              }>
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
                  <Shield className={compact ? "w-8 h-8 mx-auto text-muted-foreground mb-2" : "w-12 h-12 mx-auto text-muted-foreground mb-4"} />
                  <h3 className={compact ? "text-sm font-medium text-foreground mb-1" : "text-lg font-medium text-foreground mb-2"}>
                    No permissions found
                  </h3>
                  <p className={compact ? "text-xs text-muted-foreground" : "text-muted-foreground"}>
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
    </div>
  )
}
