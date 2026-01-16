import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Edit3 } from "lucide-react"
import { useRolePermissions, useRoleMutations } from "@/hooks/useRbac"
import { type Role } from "@/services/rbac"
import PermissionSelector from "./roles-permission-selector"
import RoleFormFields from "./roles-form-fields"

interface EditRoleSheetProps {
  role: Role | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function EditRoleSheet({ role, open, onOpenChange }: EditRoleSheetProps) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  
  // Only fetch permissions with status when the sheet is actually open
  const { data: rolePermissionsResponse, isLoading: rolePermissionsLoading } = useRolePermissions(role?.id || '', open)
  const { updateRole } = useRoleMutations()

  const allPermissions = Array.isArray(rolePermissionsResponse?.data?.permissions) ? rolePermissionsResponse.data.permissions : []

  // Reset form when role changes or dialog opens
  useEffect(() => {
    if (open && role) {
      // Reset form state
      setName(role.name || '')
      setDescription(role.description || '')
      
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
                <RoleFormFields
                  name={name}
                  description={description}
                  onNameChange={setName}
                  onDescriptionChange={setDescription}
                  nameLabel="Role Name"
                  descriptionLabel="Description"
                  includeTextarea={false}
                />
              </div>

              {/* Header info */}
              {/* <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Role Permissions</span>
                <div className="flex gap-1.5">
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0.5">
                    {permissions.length} selected
                  </Badge>
                  <Badge className="text-[10px] px-1.5 py-0.5">
                    {allPermissions.filter(p => p.assigned).length} current
                  </Badge>
                </div>
              </div> */}

              <PermissionSelector
                permissions={allPermissions}
                selectedPermissions={permissions}
                onPermissionsChange={setPermissions}
                isLoading={rolePermissionsLoading}
                compact={true}
              />
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}