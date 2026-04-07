import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
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
  const { t } = useTranslation(['roles', 'common'])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [search, setSearch] = useState('')
  
  // Only fetch permissions with status when the sheet is actually open
  const { data: rolePermissionsResponse, isLoading: rolePermissionsLoading } = useRolePermissions(role?.id || '', open, search)
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
      setSearch('')
    }
  }, [role, open])
  
  // Update permissions when rolePermissions data is loaded
  useEffect(() => {
    if (allPermissions.length > 0 && open && role) {
      // Filter only assigned permissions
      setPermissions(allPermissions.filter(p => p.assigned).map(p => p.id))
    }
  }, [allPermissions, open, role?.id])

  const handleSubmit = async (): Promise<void> => {
    if (!role) return

    const currentPermissions = allPermissions.filter(p => p.assigned).map(p => p.id)
    const add_permissions = permissions.filter(pId => !currentPermissions.includes(pId))
    const remove_permissions = currentPermissions.filter(pId => !permissions.includes(pId))

    await new Promise<void>((resolve, reject) => {
      updateRole.mutate({
        roleId: role.id,
        data: { name, description, add_permissions, remove_permissions },
      }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      })
    })
  }


  if (!role) return null

  return (
    <HuemulSheet
      open={open}
      onOpenChange={onOpenChange}
      title={t('roles:edit.title', { name: role.name })}
      description={t('roles:edit.description')}
      icon={Edit3}
      maxWidth="w-full sm:max-w-[90vw] lg:max-w-[800px]"
      showCancelButton={false}
      extraActions={[{
        label: t('common:cancel'),
        variant: "outline",
        position: "header",
        onClick: () => onOpenChange(false),
      }]}
      saveAction={{
        label: t('common:update'),
        onClick: handleSubmit,
        position: "header",
      }}
    >
      <div className="space-y-3 py-2">
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

        <PermissionSelector
          permissions={allPermissions}
          selectedPermissions={permissions}
          onPermissionsChange={setPermissions}
          isLoading={rolePermissionsLoading}
          compact={true}
          onSearchChange={setSearch}
        />
      </div>
    </HuemulSheet>
  )
}