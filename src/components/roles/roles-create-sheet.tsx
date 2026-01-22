import React, { useState, useEffect } from "react"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import { usePermissions, useRoleMutations } from "@/hooks/useRbac"
import PermissionSelector from "./roles-permission-selector"
import RoleFormFields from "./roles-form-fields"

interface CreateRoleSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function CreateRoleSheet({ open, onOpenChange }: CreateRoleSheetProps) {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  })
  const [permissions, setPermissions] = useState<string[]>([])
  
  // Only fetch permissions when the sheet is actually open
  const { data: permissionsResponse, isLoading: permissionsLoading } = usePermissions(open)
  const { createRole } = useRoleMutations()

  const availablePermissions = Array.isArray(permissionsResponse?.data) ? permissionsResponse.data : []

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setFormData({
        name: '',
        description: '',
      })
      setPermissions([])
    }
  }, [open])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    createRole.mutate({
      name: formData.name,
      description: formData.description,
      permissions: permissions,
    }, {
      onSuccess: () => onOpenChange(false)
    })
  }

  const isLoading = createRole.isPending

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-[90vw] lg:max-w-[800px] p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b border-gray-100">
            <div className="flex items-center justify-between">
              <div className="flex flex-col gap-1">
                <SheetTitle className="flex items-center gap-2 text-base sm:text-lg font-semibold">
                  <Plus className="w-5 h-5 text-primary" />
                  Create New Role
                </SheetTitle>
                <SheetDescription className="text-xs sm:text-sm text-gray-500 mt-0.5 sm:mt-1">
                  Create a new role with specific permissions to control user access.
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
                  form="create-role-form"
                  type="submit"
                  className="bg-[#4464f7] hover:bg-[#3451e6] hover:cursor-pointer text-sm h-8"
                  size="sm"
                  disabled={isLoading || !formData.name.trim() || !formData.description.trim()}
                >
                  {isLoading ? "Creating..." : "Create Role"}
                </Button>
              </div>
            </div>
          </SheetHeader>
          
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-3 sm:py-4">
            <form id="create-role-form" onSubmit={handleSubmit} className="space-y-6">
              <RoleFormFields
                name={formData.name}
                description={formData.description}
                onNameChange={(name) => setFormData(prev => ({ ...prev, name }))}
                onDescriptionChange={(description) => setFormData(prev => ({ ...prev, description }))}
              />

              <PermissionSelector
                permissions={availablePermissions}
                selectedPermissions={permissions}
                onPermissionsChange={setPermissions}
                isLoading={permissionsLoading}
              />
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}