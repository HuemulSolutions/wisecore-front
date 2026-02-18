import { useState, useEffect } from "react"
import { ReusableDialog } from "@/components/ui/reusable-dialog"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { Search, Shield } from "lucide-react"
import { useDocumentTypeRolesAccessLevels, useRoleDocumentTypeMutations } from "@/hooks/useRoleDocumentType"
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

  // Fetch all data from single endpoint
  const { data: rolesAccessLevelsData, isLoading } = useDocumentTypeRolesAccessLevels(documentType?.id || '', open)
  const { bulkGrantAccess, revokeAccess } = useRoleDocumentTypeMutations()

  const accessLevels = rolesAccessLevelsData?.data?.access_levels || []
  const roles = rolesAccessLevelsData?.data?.roles || []

  // Filter roles based on search
  const filteredRoles = roles.filter((role) =>
    role.role_name.toLowerCase().includes(searchRole.toLowerCase())
  )

  // Reset and load existing permissions when dialog opens or data changes
  useEffect(() => {
    if (open && documentType && rolesAccessLevelsData?.data) {
      setSearchRole("")
      
      // Load existing permissions from roles data
      const existingMap = new Map<string, Set<string>>()
      rolesAccessLevelsData.data.roles.forEach(role => {
        const assigned = new Set<string>()
        role.access_levels.forEach(accessLevel => {
          if (accessLevel.assigned) {
            assigned.add(accessLevel.level)
          }
        })
        if (assigned.size > 0) {
          existingMap.set(role.role_id, assigned)
        }
      })
      setRolePermissions(existingMap)
    }
  }, [open, documentType, rolesAccessLevelsData])

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
    if (!documentType || !rolesAccessLevelsData?.data) return

    const currentRoles = rolesAccessLevelsData.data.roles
    const rolesPermissions = Array.from(rolePermissions.entries())
      .filter(([, permissions]) => permissions.size > 0)
      .map(([roleId, permissions]) => ({
        role_id: roleId,
        access_levels: Array.from(permissions)
      }))

    // Find roles to revoke (had permissions before but not now)
    const rolesToRevoke = currentRoles
      .filter(role => {
        const hasAssigned = role.access_levels.some(al => al.assigned)
        const hasNew = rolePermissions.has(role.role_id) && rolePermissions.get(role.role_id)!.size > 0
        return hasAssigned && !hasNew
      })
      .map(role => ({ roleId: role.role_id, documentTypeId: documentType.id }))

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

  const isSaving = bulkGrantAccess.isPending || revokeAccess.isPending

  if (!documentType) return null

  return (
    <ReusableDialog
      open={open}
      onOpenChange={onOpenChange}
      title={`Role Permissions - ${documentType.name}`}
      description="Configure access levels for each role for this asset type."
      icon={Shield}
      maxWidth="2xl"
      maxHeight="90vh"
      onSubmit={handleSubmit}
      submitLabel={isSaving ? 'Saving...' : 'Save Permissions'}
      cancelLabel="Cancel"
      isSubmitting={isSaving}
      isValid={true}
      showDefaultFooter={true}
    >
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
                    <TableRow key={role.role_id} className="hover:bg-muted/20">
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full bg-gray-400" 
                          />
                          {role.role_name}
                        </div>
                      </TableCell>
                      {accessLevels.map((level) => (
                        <TableCell key={level} className="text-center">
                          <Checkbox
                            checked={isPermissionChecked(role.role_id, level)}
                            onCheckedChange={(checked) => 
                              handlePermissionChange(role.role_id, level, checked as boolean)
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
      </ReusableDialog>
  )
}