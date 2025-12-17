import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Shield } from "lucide-react"
import { useRoles } from "@/hooks/useRbac"
import { useAccessLevels, useDocumentTypePermissions, useRoleDocumentTypeMutations } from "@/hooks/useRoleDocumentType"
import { type DocumentType } from "@/services/document-types"

interface RolePermissionsDialogProps {
  documentType: DocumentType | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function RolePermissionsDialog({ 
  documentType, 
  open, 
  onOpenChange 
}: RolePermissionsDialogProps) {
  const [searchRole, setSearchRole] = useState("")
  const [rolePermissions, setRolePermissions] = useState<Map<string, Set<string>>>(new Map())

  const { data: rolesData, isLoading: loadingRoles } = useRoles()
  const { data: accessLevelsData, isLoading: loadingAccessLevels } = useAccessLevels()
  const { data: existingPermissionsData, isLoading: loadingExistingPermissions } = useDocumentTypePermissions(documentType?.id || '')
  const { bulkGrantAccess, revokeAccess } = useRoleDocumentTypeMutations()

  const roles = rolesData?.data || []
  const accessLevels = accessLevelsData?.data || []

  // Filter roles based on search
  const filteredRoles = roles.filter((role) =>
    role.name.toLowerCase().includes(searchRole.toLowerCase())
  )

  // Reset and load existing permissions when dialog opens or document type changes
  useEffect(() => {
    if (open && documentType) {
      setSearchRole("")
      
      // Load existing permissions
      if (existingPermissionsData?.data && Array.isArray(existingPermissionsData.data)) {
        const existingMap = new Map<string, Set<string>>()
        existingPermissionsData.data.forEach(permission => {
          const existing = existingMap.get(permission.role_id) || new Set()
          // Handle single access_level from API response
          if (permission.access_level) {
            existing.add(permission.access_level)
          }
          // Also handle array access_levels if present
          if (permission.access_levels && Array.isArray(permission.access_levels)) {
            permission.access_levels.forEach(level => existing.add(level))
          }
          existingMap.set(permission.role_id, existing)
        })
        setRolePermissions(existingMap)
      } else {
        setRolePermissions(new Map())
      }
    }
  }, [open, documentType, existingPermissionsData])

  const handlePermissionChange = (roleId: string, permission: string, checked: boolean) => {
    setRolePermissions(prev => {
      const newMap = new Map(prev)
      const rolePerms = new Set(newMap.get(roleId) || [])
      
      if (checked) {
        rolePerms.add(permission)
      } else {
        rolePerms.delete(permission)
      }
      
      newMap.set(roleId, rolePerms)
      return newMap
    })
  }

  const isPermissionChecked = (roleId: string, permission: string): boolean => {
    const rolePerms = rolePermissions.get(roleId)
    return rolePerms ? rolePerms.has(permission) : false
  }

  const handleSubmit = () => {
    if (!documentType) return

    const currentPermissions = (existingPermissionsData?.data && Array.isArray(existingPermissionsData.data)) ? existingPermissionsData.data : []
    const rolesPermissions = Array.from(rolePermissions.entries())
      .filter(([_, permissions]) => permissions.size > 0)
      .map(([roleId, permissions]) => ({
        role_id: roleId,
        access_levels: Array.from(permissions)
      }))

    // Find roles to revoke (had permissions before but not now)
    const rolesToRevoke = currentPermissions
      .filter(current => !rolePermissions.has(current.role_id) || rolePermissions.get(current.role_id)!.size === 0)
      .map(current => ({ roleId: current.role_id, documentTypeId: documentType.id }))

    // Revoke access for roles that should no longer have access
    const revokePromises = rolesToRevoke.map(({ roleId, documentTypeId }) => 
      revokeAccess.mutateAsync({ roleId, documentTypeId })
    )

    // Grant new permissions using the correct bulk format
    Promise.all(revokePromises)
      .then(() => {
        if (rolesPermissions.length > 0) {
          const bulkPermissionsPayload = {
            document_type_id: documentType.id,
            roles_permissions: rolesPermissions
          }
          return bulkGrantAccess.mutateAsync(bulkPermissionsPayload)
        }
      })
      .then(() => {
        onOpenChange(false)
      })
      .catch(error => {
        console.error('Error updating permissions:', error)
      })

    if (rolesPermissions.length === 0 && rolesToRevoke.length === 0) {
      onOpenChange(false)
      return
    }
  }

  const isLoading = loadingRoles || loadingAccessLevels || loadingExistingPermissions
  const isSaving = bulkGrantAccess.isPending || revokeAccess.isPending

  if (!documentType) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] min-h-[450px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Role Permissions - {documentType.name}
          </DialogTitle>
          <DialogDescription>
            Configure access levels for each role for this asset type.
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
                placeholder="Search roles..."
                value={searchRole}
                onChange={(e) => setSearchRole(e.target.value)}
                className="pl-8"
              />
            </div>

            {/* Permissions Table */}
            <div className="flex-1 overflow-auto border rounded-lg">
              <Table>
                <TableHeader className="sticky top-0 bg-muted/50">
                  <TableRow>
                    <TableHead className="w-48">Role</TableHead>
                    {accessLevels.map((level) => (
                      <TableHead key={level} className="text-center capitalize">
                        {level}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRoles.map((role) => (
                    <TableRow key={role.id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: role.color || '#6B7280' }}
                          />
                          {role.name}
                        </div>
                      </TableCell>
                      {accessLevels.map((level) => (
                        <TableCell key={level} className="text-center">
                          <Checkbox
                            checked={isPermissionChecked(role.id, level)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(role.id, level, checked as boolean)
                            }
                            disabled={isSaving}
                          />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {filteredRoles.length === 0 && (
                <div className="text-center py-8">
                  <Shield className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium text-foreground mb-2">No roles found</h3>
                  <p className="text-muted-foreground">
                    {searchRole 
                      ? "Try adjusting your search criteria."
                      : "No roles are available."}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <DialogFooter className="border-t pt-4">
          <Button 
            type="button" 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit}
            disabled={isSaving || isLoading}
            className="hover:cursor-pointer"
          >
            {isSaving ? 'Saving...' : 'Save Permissions'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}