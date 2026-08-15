import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { HuemulSheet } from "@/huemul/components/huemul-sheet"
import { Edit3 } from "lucide-react"
import { useRolePermissions, useRoleMutations, useRoles } from "@/hooks/useRbac"
import PermissionSelector from "./roles-permission-selector"
import RoleFormFields from "./roles-form-fields"
import type { EditRoleSheetProps } from '@/types/roles'
export type { EditRoleSheetProps } from '@/types/roles'

export default function EditRoleSheet({ role, open, onOpenChange, canUpdate }: EditRoleSheetProps) {
  const { t } = useTranslation(['roles', 'common'])
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [permissions, setPermissions] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [isPosition, setIsPosition] = useState(false)
  const [parentRoleId, setParentRoleId] = useState<string | null>(null)
  const [initialParentRoleId, setInitialParentRoleId] = useState<string | null>(null)

  // Only fetch permissions with status when the sheet is actually open y hay permiso de actualizar
  const { data: rolePermissionsResponse, isLoading: rolePermissionsLoading } = useRolePermissions(role?.id || '', open && canUpdate, search)
  const { data: rolesResponse } = useRoles(open && canUpdate, 1, 1000)
  const { updateRole } = useRoleMutations()

  const allPermissions = Array.isArray(rolePermissionsResponse?.data?.permissions) ? rolePermissionsResponse.data.permissions : []
  const positionRoleOptions = (rolesResponse?.data ?? []).filter((r) => r.is_position && r.id !== role?.id)

  // Reset form when role changes or dialog opens
  useEffect(() => {
    if (open && role) {
      // Reset form state
      setName(role.name || '')
      setDescription(role.description || '')
      setIsPosition(Boolean(role.is_position))
      setParentRoleId(role.parent_role_id ?? null)
      setInitialParentRoleId(role.parent_role_id ?? null)

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
      setIsPosition(false)
      setParentRoleId(null)
      setInitialParentRoleId(null)
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
    if (!role || !canUpdate) return

    const currentPermissions = allPermissions.filter(p => p.assigned).map(p => p.id)
    const add_permissions = permissions.filter(pId => !currentPermissions.includes(pId))
    const remove_permissions = currentPermissions.filter(pId => !permissions.includes(pId))
    const clearedParent = !isPosition || parentRoleId === null
    const shouldClearParent = clearedParent && initialParentRoleId !== null

    await new Promise<void>((resolve, reject) => {
      updateRole.mutate({
        roleId: role.id,
        data: {
          name,
          description,
          add_permissions,
          remove_permissions,
          is_position: isPosition,
          ...(shouldClearParent
            ? { clear_parent_role: true }
            : { parent_role_id: isPosition ? parentRoleId : null }),
        },
      }, {
        onSuccess: () => resolve(),
        onError: (error) => reject(error),
      })
    })
  }


  if (!role || !canUpdate) return null

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
            isPosition={isPosition}
            onIsPositionChange={setIsPosition}
            parentRoleId={parentRoleId}
            onParentRoleIdChange={setParentRoleId}
            positionRoleOptions={positionRoleOptions}
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